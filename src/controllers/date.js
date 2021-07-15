const db = require('../db/db')

const { validToken } = require('../helpers/jwt')
const { sendEmailDate, sendEmailStatusDate } = require('../helpers/nodemailer')
const { getMonthName, twoDigits } = require('../helpers/common')
const { checkDateHour, checkDateNoDuplicate, getQuery, checkDateTime, getParams } = require('../helpers/date')

const postDate = async (req, res) => {
    try{
        const { date, type, name, age, illness, phone, email, address, sex,
            homeService, doctor, labs, clientID } = req.body 

        if(!name || !date || !age || (!illness && type === "medico") || !phone || !email || typeof (homeService) === "undefined"|| (type !== "medico" && type !== "laboratorio") ||
        !doctor || (type === "laboratorio" && !labs && labs.length === 0) || (homeService && !address)){
            return res.sendStatus(400)
        }

        const okDateTime = await checkDateTime(date)
        if(!okDateTime){ return res.json({ ok: false, message: 'No se pueden hacer citas con menos de 24 horas de anticipación.' }) }

        const { okDateHour, message } = await checkDateHour(date, doctor, labs)
        if(!okDateHour){ return res.json({ ok: false, message }) }

        const okDateNoDuplicate = await checkDateNoDuplicate(date, doctor, labs)
        if(!okDateNoDuplicate){ return res.json({ ok: false }) }

        const query = getQuery(date, age, name, illness, phone, email, type, address, clientID, homeService, sex)

        const resDB = await db.query(`INSERT INTO citas (${query.map( item => item.row ).join(',')}) VALUES (${query.map( item => '?').join(',')})`, query.map( item => item.value))
        
        if(type === "medico"){
            await db.query('INSERT INTO servicioCitas (medico, cita) VALUES (?,?)', [doctor.id, resDB.insertId])
        }else{
            for(let i = 0; i < labs.length; i++){
                await db.query('INSERT INTO servicioCitas (servicio, cita, medico) VALUES (?,?,?)', [labs[i].id, resDB.insertId, doctor.id])
            }
        }

        try{
            const newDate = new Date(date)
            let text = ""
            let dateEmail = `${newDate.getDate()} de ${getMonthName(newDate.getMonth())} de ${newDate.getFullYear()} a las ${twoDigits(newDate.getHours())}:${twoDigits(newDate.getMinutes())}`
            if(type === "medico"){ text = `con el médico ${doctor.name}` }
            else{ text = `para los laboratorios ${labs.map(lab => lab.name).join(', ')}` }

            const exp = (newDate.getTime() - Date.now())/1000

            await sendEmailDate({ date: dateEmail, email, name, text, dateID: resDB.insertId, type }, Math.round(exp))
        }catch(e){
            console.log(e)
            await db.query('DELETE FROM servicioCitas WHERE cita = ?', [resDB.insertId]) 
            await db.query('DELETE FROM servicioCitas WHERE servicio = ?', [resDB.insertId])
            await db.query('DELETE FROM citas WHERE id = ?', [resDB.insertId]) 
            return res.sendStatus(500)
        }

        res.json({ ok: true })

    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const getDate = async (req, res) => {
    try{

        const { token } = req
        const { id } = req.params
        const { serv_id } = req.query

        if(!token){ return res.sendStatus(401) }
        if(!id || isNaN(Number(id))){  return res.sendStatus(400) }

        const { err, medico, id: user, tipo } = await validToken(token)

        if(err || (!medico && !id && !tipo)){ return res.sendStatus(401) }

        let date = []
        let recipe = []
        let params = []
        let results = []

        if(!isNaN(Number(serv_id))){
            date = await db.query(`SELECT servicioCitas.servicio, servicioCitas.id, fecha, citas.nombre, citas.edad, padecimiento, citas.sexo, citas.telefono, citas.email, citas.cliente, citas.direccion, clientes.imagen, 
                                    clientes.alergias, clientes.contacto, clientes.rh, clientes.sangre, citas.pagado, clientes.direccion AS clienteDireccion, servicios.nombre AS servnombre, 
                                    servicios.id AS servId, servicios.tipo AS servtipo, medicos.nombre AS doctor FROM servicioCitas 
                                    INNER JOIN citas ON servicioCitas.cita = citas.id INNER JOIN servicios ON servicioCitas.servicio = servicios.id 
                                    LEFT JOIN clientes ON citas.cliente = clientes.id INNER JOIN medicos ON servicioCitas.medico = medicos.id 
                                    WHERE servicioCitas.cita = ? AND servicioCitas.aprobado = 1 AND servicioCitas.servicio = ?`, [id, Number(serv_id)])
            params = await getParams(date)
            results = await db.query('SELECT * FROM resultados WHERE cita = ?', [id])
        }else{
            date = await db.query(`SELECT servicios.nombre AS servnombre, servicioCitas.servicio, servicioCitas.id, fecha, citas.nombre, citas.edad, padecimiento, citas.telefono, citas.email, citas.cliente, citas.direccion, clientes.imagen, 
                                    clientes.alergias, clientes.contacto, clientes.sangre, citas.pagado, clientes.rh, medicos.nombre AS doctor FROM servicioCitas 
                                    INNER JOIN citas ON servicioCitas.cita = citas.id LEFT JOIN clientes ON citas.cliente = clientes.id INNER JOIN medicos ON servicioCitas.medico = medicos.id
                                    LEFT JOIN servicios ON servicioCitas.servicio = servicios.id
                                    WHERE servicioCitas.cita = ? AND servicioCitas.medico = ? AND servicioCitas.aprobado = 1`, [id, medico])
            if(tipo === "LAB"){
                params = await getParams(date)
                results = await db.query('SELECT * FROM resultados WHERE cita = ?', [id])
            }else{
                recipe = await db.query("SELECT receta FROM recetas WHERE cita = ? ", [id])
            }
        }

        if(medico){
            const EP = await db.query('SELECT texto FROM enfermedadesCliente WHERE cliente = ? AND tipo = ?', [date[0].cliente, 'EP'])
            const PF = await db.query('SELECT texto FROM enfermedadesCliente WHERE cliente = ? AND tipo = ?', [date[0].cliente, 'PF'])
            const H = await db.query('SELECT texto FROM enfermedadesCliente WHERE cliente = ? AND tipo = ?', [date[0].cliente, 'H'])
            date[0].enfermedades = EP
            date[0].enfermedadesFam = PF
            date[0].habitos = H
        }

        res.cookie('payload', token.split('.')[0] + '.' + token.split('.')[1], { sameSite: true, maxAge: 1000 * 60 * 30 })
        .json({ date, recipe, params, results })

    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const getDatesHistory = async (req, res) => {
    try{
        const { token } = req
        const { start, unaproved } = req.query

        if(!token){ return res.sendStatus(401) }
        if(!start || isNaN(Number(start))){  return res.sendStatus(400) }

        const { err, medico,  id: user, tipo } = await validToken(token)

        if(err || (!medico && !tipo && !user)){ return res.sendStatus(401) }

        let dates = []

        if(unaproved){ 
            if(tipo !== "LAB"){
                dates = await db.query(`SELECT servicioCitas.id, imagen, citas.nombre, fecha, citas.email, citas.pagado FROM servicioCitas 
                                        INNER JOIN citas ON servicioCitas.cita = citas.id LEFT JOIN clientes ON citas.cliente = clientes.id 
                                        WHERE servicioCitas.medico = ? AND servicioCitas.aprobado = 0 ORDER BY citas.fecha DESC LIMIT ?, ?`, [medico, Number(start), Number(start)+20])
            }else{
                dates = await db.query(`SELECT servicioCitas.id, imagen, cita, citas.nombre, fecha, citas.email, servicios.nombre AS servnombre, citas.pagado FROM servicioCitas 
                                        INNER JOIN citas ON servicioCitas.cita = citas.id INNER JOIN servicios ON servicioCitas.servicio = servicios.id 
                                        LEFT JOIN clientes ON citas.cliente = clientes.id 
                                        WHERE servicioCitas.medico = ? AND servicioCitas.aprobado = 0 ORDER BY citas.fecha DESC LIMIT ?, ?`, [medico,  Number(start), Number(start)+20])
            }
        }else if(tipo){
            if(tipo !== "LAB"){ 
                dates = await db.query(`SELECT servicioCitas.id, imagen, cita, citas.nombre, fecha, citas.pagado FROM servicioCitas 
                                        INNER JOIN citas ON servicioCitas.cita = citas.id LEFT JOIN clientes ON citas.cliente = clientes.id 
                                        WHERE servicioCitas.medico = ? AND servicioCitas.aprobado = 1 ORDER BY citas.fecha DESC LIMIT ?, ?`, [medico, Number(start), Number(start)+20]) 
            }else{ 
                dates = await db.query(`SELECT servicioCitas.id, imagen, cita, citas.nombre, fecha, citas.email, servicios.nombre AS servnombre, citas.pagado FROM servicioCitas 
                                        INNER JOIN citas ON servicioCitas.cita = citas.id INNER JOIN servicios ON servicioCitas.servicio = servicios.id 
                                        LEFT JOIN clientes ON citas.cliente = clientes.id 
                                        WHERE servicioCitas.medico = ? AND servicioCitas.aprobado = 1 AND citas.tipo = 1 ORDER BY citas.fecha DESC LIMIT ?, ?`, [medico, Number(start), Number(start)+20]) 
            }
        }else{
            dates = await db.query(`SELECT servicioCitas.id, citas.padecimiento, fecha, aprobado, medicos.nombre, medicos.cargo, medico, servicio, 
                                    servicios.nombre AS servnombre, citas.pagado, citas.direccion, medicos.tipo FROM servicioCitas 
                                    INNER JOIN citas ON servicioCitas.cita = citas.id LEFT JOIN medicos ON servicioCitas.medico = medicos.id 
                                    LEFT JOIN servicios ON servicioCitas.servicio = servicios.id 
                                    WHERE citas.cliente = ? ORDER BY citas.fecha DESC LIMIT ?, ?`, [user, Number(start), Number(start)+20])
        }

        res.cookie('payload', token.split('.')[0] + '.' + token.split('.')[1], { sameSite: true, maxAge: 1000 * 60 * 30 })
        .json({ dates })

    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const getDatesPatients = async (req, res) => {
    try{

        const { token } = req
        const { start, user } = req.query

        if(!token){ return res.sendStatus(401) }
        if(!start || isNaN(Number(start)) ){  return res.sendStatus(400) }

        const { err, medico } = await validToken(token)

        if(err){ return res.sendStatus(401) }

        let dates = []

        if(!isNaN(Number(user))){
            dates = await db.query(`SELECT citas.id, citas.cliente, fecha, servicios.nombre AS servnombre, servicios.id AS servId FROM servicioCitas 
                                    INNER JOIN citas ON servicioCitas.cita = citas.id INNER JOIN servicios ON servicioCitas.servicio = servicios.id 
                                    WHERE citas.cliente = ? AND servicioCitas.aprobado = 1 AND citas.tipo = 1 ORDER BY citas.fecha DESC LIMIT ?, ?`, [Number(user), Number(start), Number(start)+20])
        }else{
            dates = await db.query(`SELECT servicioCitas.id, imagen, citas.nombre, fecha, citas.cliente FROM servicioCitas 
                                INNER JOIN citas ON servicioCitas.cita = citas.id INNER JOIN clientes ON citas.cliente = clientes.id 
                                WHERE servicioCitas.medico = ? AND servicioCitas.aprobado = 1 ORDER BY clientes.nombre, citas.fecha DESC LIMIT ?, ?`, [medico, Number(start), Number(start)+20])
        }

        res.cookie('payload', token.split('.')[0] + '.' + token.split('.')[1], { sameSite: true, maxAge: 1000 * 60 * 30 })
        .json({ dates })

    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const getDatesFilter = async (req, res) => {
    try{

        const { token } = req
        const { date, patient } = req.query

        if(!token){ return res.sendStatus(401) }

        const { err, medico, tipo } = await validToken(token)

        if(err || (!medico && !tipo)){ return res.sendStatus(401) }
        if((!date && !patient) || (!patient && isNaN(Number(date)))){ return res.sendStatus(400) }

        let dates = []

        if(date){
            const newDate = new Date(Number(date))
            const dateFrom = `${newDate.getFullYear()}-${newDate.getMonth()+1}-${newDate.getDate()} 00:00:00`
            const dateTo = `${newDate.getFullYear()}-${newDate.getMonth()+1}-${newDate.getDate()} 23:59:59`

            if(tipo === "LAB"){
                dates = await db.query(`SELECT servicioCitas.id, imagen, citas.nombre, fecha, citas.edad, citas.direccion, cita, servicios.nombre AS servnombre, citas.telefono, 
                                        citas.email, clientes.rh, clientes.sangre, clientes.contacto, citas.pagado, clientes.alergias, clientes.direccion AS clienteDireccion FROM servicioCitas 
                                        INNER JOIN citas ON servicioCitas.cita = citas.id INNER JOIN servicios ON servicioCitas.servicio = servicios.id 
                                        LEFT JOIN clientes ON citas.cliente = clientes.id 
                                        WHERE servicioCitas.medico = ? AND citas.fecha BETWEEN ? AND ? AND servicioCitas.aprobado = 1`, [medico, dateFrom, dateTo])
            }else{
                dates = await db.query(`SELECT servicioCitas.id, imagen, citas.nombre, fecha, citas.edad, citas.direccion, citas.padecimiento, citas.telefono, citas.email, clientes.rh, 
                                        clientes.sangre, clientes.contacto, clientes.alergias, clientes.direccion AS clienteDireccion, citas.pagado FROM servicioCitas 
                                        INNER JOIN citas ON servicioCitas.cita = citas.id LEFT JOIN clientes ON citas.cliente = clientes.id 
                                        WHERE servicioCitas.medico = ? AND citas.fecha BETWEEN ? AND ? AND servicioCitas.aprobado = 1`, [medico, dateFrom, dateTo])
            }

        }else{
            if(tipo === "LAB"){
                dates = await db.query(`SELECT servicioCitas.id, imagen, citas.nombre, fecha, citas.cliente, servicios.nombre AS servnombre, citas.pagado FROM servicioCitas 
                                        INNER JOIN citas ON servicioCitas.cita = citas.id INNER JOIN servicios ON servicioCitas.servicio = servicios.id 
                                        LEFT JOIN clientes ON citas.cliente = clientes.id 
                                        WHERE servicioCitas.medico = ? AND clientes.nombre LIKE ? AND servicioCitas.aprobado = 1`, [medico, `%${patient}%`])
            }else{
                dates = await db.query(`SELECT servicioCitas.id, imagen, citas.nombre, fecha, citas.cliente, citas.pagado FROM servicioCitas 
                                        INNER JOIN citas ON servicioCitas.cita = citas.id LEFT JOIN clientes ON citas.cliente = clientes.id 
                                        WHERE servicioCitas.medico = ? AND clientes.nombre LIKE ? AND servicioCitas.aprobado = 1`, [medico, `%${patient}%`])
            }
        }

        res.cookie('payload', token.split('.')[0] + '.' + token.split('.')[1], { sameSite: true, maxAge: 1000 * 60 * 30 })
        .json({ dates, query: date || patient })

    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const aproveDate = async (req, res) => {
    try{

        const { token } = req
        const { id } = req.params
        const { aprove, email, fecha, nombre, cita, servnombre } = req.body

        if(!token){ return res.sendStatus(401) }
        if(!id){  return res.sendStatus(400) }

        const { err, medico, tipo } = await validToken(token)

        if(err || (!medico && !tipo)){ return res.sendStatus(401) }

        let doctor = null

        if(tipo !== "LAB"){ doctor = await db.query("SELECT nombre, cargo FROM medicos WHERE id = ?", [medico]) }

        const newDate = new Date(fecha)
        const dateEmail = `${newDate.getDate()} de ${getMonthName(newDate.getMonth())} de ${newDate.getFullYear()} a las ${twoDigits(newDate.getHours())}:${twoDigits(newDate.getMinutes())}`

        if(aprove){
            const text = tipo !== "LAB" ? `Se ha confirmado tu cita el ${dateEmail}, con el ${doctor[0].cargo} ${doctor[0].nombre}.` : 
                        `Se ha confirmado tu cita el ${dateEmail}, para los siguientes laboratorios: ${servnombre}.`

            await db.query("UPDATE servicioCitas SET aprobado = 1 WHERE id = ?", [id])

            try{ await sendEmailStatusDate({ email, name: nombre, text }) }
            catch(e){
                console.log(e)
                await db.query("UPDATE servicioCitas SET aprobado = 0 WHERE servicioCitas.medico = ? AND cita = ?", [medico, cita])
                return res.sendStatus(500)
            }
        }else{
            const text = tipo !== "LAB" ? `Se ha rechazado tu cita el ${dateEmail}, con el ${doctor[0].cargo} ${doctor[0].nombre} .` :
                        `Se ha rechazado tu cita el ${dateEmail}, para los siguientes laboratorios: ${servnombre}.` 
            try{ 
                await sendEmailStatusDate({ email, name: nombre, text }) 
                await db.query("DELETE FROM servicioCitas WHERE id = ?", [id])
            }
            catch(e){
                console.log(e)
                return res.sendStatus(500)
            }
        }

        res.cookie('payload', token.split('.')[0] + '.' + token.split('.')[1], { sameSite: true, maxAge: 1000 * 60 * 30 })
        .sendStatus(200)

    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const postRecipe = async (req, res) => {
    try{

        const { token } = req
        const { inputs, id } = req.body

        if(!token || isNaN(Number(id))){ return res.sendStatus(401) }

        const { err, medico } = await validToken(token)

        if(err && !medico){ return res.sendStatus(401) }

        for(const recipe of inputs){
            await db.query("INSERT INTO recetas (receta, cita) VALUES (?, ?)", [recipe, Number(id)])
        }

        await db.query('UPDATE citas SET pagado = 1 WHERE id = ?', [Number(id)])

        res.cookie('payload', token.split('.')[0] + '.' + token.split('.')[1], { sameSite: true, maxAge: 1000 * 60 * 30 })
        .sendStatus(200)

    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const postResults = async (req, res) => {
    try{

        const { token } = req
        const { results, refs, id,  methods } = req.body

        if(!token || isNaN(Number(id)) || !results || !refs || !methods){ return res.sendStatus(401) }

        const { err, tipo, medico } = await validToken(token)

        if(err && !tipo){ return res.sendStatus(401) }

        const date = await db.query('SELECT cliente FROM citas WHERE id = ?', [Number(id)])

        if(date[0].cliente){
            await db.query('DELETE FROM resultados WHERE cita = ?', [Number(id)])
            for(let i = 0; i < results.length; i++){
                for(let j = 0; j < results[i].results.length; j++){
                    const ref = await db.query('SELECT minRef, maxRef, param FROM referencias WHERE param = ?', [refs[i].refs[j].id])
                    if(ref[0].minRef == refs[i].refs[j].min && ref[0].maxRef == refs[i].refs[j].max){
                        await db.query('INSERT INTO resultados (cliente, param, cita, resultado, medico, metodos) VALUES (?, ?, ?, ?, ?, ?)', [date[0].cliente, refs[i].refs[j].id, Number(id), results[i].results[j], medico, methods[i].map(item => item.value).join(', ')])
                    }else{
                        await db.query('INSERT INTO resultados (cliente, param, cita, resultado, medico, metodos, minRef, maxRef) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [date[0].cliente, refs[i].refs[j].id, Number(id), results[i].results[j], medico, methods[i].map(item => item.value).join(', '), Number(refs[i].refs[j].min), Number(refs[i].refs[j].max)])
                    }
                }
            }
        }

        await db.query('UPDATE citas SET pagado = 1 WHERE id = ?', [Number(id)])

        res.cookie('payload', token.split('.')[0] + '.' + token.split('.')[1], { sameSite: true, maxAge: 1000 * 60 * 30 })
        .sendStatus(200)

    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

module.exports={
    postDate,
    getDate,
    getDatesHistory,
    getDatesFilter,
    getDatesPatients,
    aproveDate,
    postRecipe,
    postResults
}