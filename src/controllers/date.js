const db = require('../db/db')

const { validToken } = require('../helpers/jwt')
const { sendEmailDate, sendEmailStatusDate } = require('../helpers/nodemailer')
const { getMonthName, twoDigits } = require('../helpers/common')

const postDate = async (req, res) => {
    try{
        const { date, type, name, age, illness, phone, email, address, 
            homeService, doctor, labs, clientID } = req.body 

        if(!name || !date || !age || (!illness && type === "medico") || !phone || !email || typeof (homeService) === "undefined"|| (type !== "medico" && type !== "laboratorio") ||
        (type === "medico" && !doctor) || (type === "laboratorio" && !labs && labs.length === 0) || (homeService && !address)){
            return res.sendStatus(400)
        }

        if(doctor){
            const dateDB = await db.query('SELECT servicioCitas.id FROM servicioCitas INNER JOIN citas ON servicioCitas.cita = citas.id WHERE citas.fecha = ? AND medico = ?', [new Date(date).toLocaleString(), doctor.id])

            if(dateDB.length !== 0){ return res.json({ ok: false }) }
        }else{
            let dateDBExist = false
            for(let i = 0; i < labs.length; i++){
                const dateDB = await db.query('SELECT servicioCitas.id FROM servicioCitas INNER JOIN citas ON servicioCitas.cita = citas.id WHERE citas.fecha = ? AND servicio = ?', [new Date(date).toLocaleString(), labs[i].id])
                if(dateDB.length !== 0){ dateDBExist = true }
            }
            if(dateDBExist){ return res.json({ ok: false }) }
        }

        let query = [{ row: 'fecha', value: new Date(date).toLocaleString() },{ row: 'edad', value: age },{ row: 'nombre', value: name },{ row: 'padecimiento', value: illness },
                    { row: 'telefono', value: phone },{ row: 'email', value: email },{ row: 'tipo', value: type === "medico" ? false : true }]
        
        if(homeService === true){ query.push({ row: 'direccion', value: address }) }
        if(clientID){ query.push({ row: 'cliente', value: clientID }) }

        const resDB = await db.query(`INSERT INTO citas (${query.map( item => item.row ).join(',')}) VALUES (${query.map( item => '?').join(',')})`, query.map( item => item.value))
        
        if(type === "medico"){
            await db.query('INSERT INTO servicioCitas (medico, cita) VALUES (?,?)', [doctor.id, resDB.insertId])
        }else{
            labs.forEach( async (lab) => {
                await db.query('INSERT INTO servicioCitas (servicio, cita) VALUES (?,?)', [lab.id, resDB.insertId])
            })
        }

        try{
            const newDate = new Date(date)
            let text = ""
            let dateEmail = `${newDate.getDate()} de ${getMonthName(newDate.getMonth())} de ${newDate.getFullYear()} a las ${twoDigits(newDate.getHours())}:${twoDigits(newDate.getMinutes())}`
            if(type === "medico"){ text = `con el médico ${doctor.name}.` }
            else{ text = `para los laboratorios ${labs.map(lab => lab.name).join(', ')}.` }

            await sendEmailDate({ date: dateEmail, email, name, text })
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

        if(!token){ return res.sendStatus(401) }
        if(!id || isNaN(Number(id))){  return res.sendStatus(400) }

        const { err, medico, id: user, laboratorio } = await validToken(token)

        if(err || (!medico && !id && !laboratorio)){ return res.sendStatus(401) }

        let date = []
        let recipe = []
        
        if(medico){
            date = await db.query("SELECT servicioCitas.id, fecha, citas.nombre, citas.edad, padecimiento, citas.telefono, citas.email, citas.cliente, citas.direccion, clientes.imagen, clientes.alergias, clientes.contacto, clientes.enfermedades, clientes.enfermedadesFam, clientes.sangre FROM servicioCitas INNER JOIN citas ON servicioCitas.cita = citas.id LEFT JOIN clientes ON citas.cliente = clientes.id WHERE servicioCitas.id = ? AND servicioCitas.medico = ? AND servicioCitas.aprobado = 1", [id, medico])
            recipe = await db.query("SELECT receta FROM recetas WHERE cita = ? ", [id])
        }else if(laboratorio){
            date = await db.query("SELECT servicioCitas.id, fecha, citas.nombre, citas.edad, padecimiento, citas.telefono, citas.email, citas.cliente, citas.direccion, clientes.imagen, clientes.alergias, clientes.contacto, clientes.enfermedades, clientes.enfermedadesFam, clientes.sangre, clientes.direccion AS clienteDireccion, servicios.nombre AS servnombre FROM servicioCitas INNER JOIN citas ON servicioCitas.cita = citas.id INNER JOIN servicios ON servicioCitas.servicio = servicios.id LEFT JOIN clientes ON citas.cliente = clientes.id WHERE servicioCitas.cita = ? AND servicios.tipo = ? AND servicioCitas.aprobado = 1", [id, laboratorio])
        }else{
            date = await db.query("SELECT servicioCitas.id, fecha, citas.nombre, citas.edad, padecimiento, citas.telefono, citas.email, citas.cliente, citas.direccion, clientes.imagen, clientes.alergias, clientes.contacto, clientes.enfermedades, clientes.enfermedadesFam, clientes.sangre FROM servicioCitas INNER JOIN citas ON servicioCitas.cita = citas.id LEFT JOIN clientes ON citas.cliente = clientes.id WHERE servicioCitas.id = ? AND citas.cliente = ? AND servicioCitas.aprobado = 1", [id, user])
            recipe = await db.query("SELECT receta FROM recetas WHERE cita = ? ", [id])
        }

        console.log(date)

        res.cookie('payload', token.split('.')[0] + '.' + token.split('.')[1], { sameSite: true, maxAge: 1000 * 60 * 30 })
        .json({ date, recipe })

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

        const { err, medico, laboratorio, id: user } = await validToken(token)

        if(err || (!medico && !laboratorio && !user)){ return res.sendStatus(401) }

        let dates = []

        if(unaproved){ 
            if(medico){
                dates = await db.query("SELECT servicioCitas.id, imagen, citas.nombre, fecha, citas.email FROM servicioCitas INNER JOIN citas ON servicioCitas.cita = citas.id LEFT JOIN clientes ON citas.cliente = clientes.id WHERE servicioCitas.medico = ? AND servicioCitas.aprobado = 0 ORDER BY citas.fecha DESC LIMIT ?, ?", [medico, Number(start), Number(start)+20])
            }else{
                dates = await db.query("SELECT servicioCitas.id, imagen, cita, citas.nombre, fecha, citas.email, servicios.nombre AS servnombre FROM servicioCitas INNER JOIN citas ON servicioCitas.cita = citas.id INNER JOIN servicios ON servicioCitas.servicio = servicios.id LEFT JOIN clientes ON citas.cliente = clientes.id WHERE servicios.tipo = ? AND servicioCitas.aprobado = 0 ORDER BY citas.fecha DESC LIMIT ?, ?", [laboratorio, Number(start), Number(start)+20])
            }
        }else if(medico || laboratorio){
            if(medico){ dates = await db.query("SELECT servicioCitas.id, imagen, citas.nombre, fecha FROM servicioCitas INNER JOIN citas ON servicioCitas.cita = citas.id LEFT JOIN clientes ON citas.cliente = clientes.id WHERE servicioCitas.medico = ? AND servicioCitas.aprobado = 1 ORDER BY citas.fecha DESC LIMIT ?, ?", [medico, Number(start), Number(start)+20]) }
            else{ dates = await db.query("SELECT servicioCitas.id, imagen, cita, citas.nombre, fecha, citas.email, servicios.nombre AS servnombre FROM servicioCitas INNER JOIN citas ON servicioCitas.cita = citas.id INNER JOIN servicios ON servicioCitas.servicio = servicios.id LEFT JOIN clientes ON citas.cliente = clientes.id WHERE servicios.tipo = ? AND servicioCitas.aprobado = 1 ORDER BY citas.fecha DESC LIMIT ?, ?", [laboratorio, Number(start), Number(start)+20]) }
        }else{
            dates = await db.query("SELECT servicioCitas.id, citas.padecimiento, fecha, aprobado, medicos.nombre, medicos.cargo, medico, servicio, servicios.nombre AS servnombre, citas.direccion FROM servicioCitas INNER JOIN citas ON servicioCitas.cita = citas.id LEFT JOIN medicos ON servicioCitas.medico = medicos.id LEFT JOIN servicios ON servicioCitas.servicio = servicios.id WHERE citas.cliente = ? ORDER BY citas.fecha DESC LIMIT ?, ?", [user, Number(start), Number(start)+20])
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
        const { start } = req.query

        if(!token){ return res.sendStatus(401) }
        if(!start || isNaN(Number(start))){  return res.sendStatus(400) }

        const { err, medico } = await validToken(token)

        if(err){ return res.sendStatus(401) }

        const dates = await db.query("SELECT servicioCitas.id, imagen, citas.nombre, fecha, citas.cliente FROM servicioCitas INNER JOIN citas ON servicioCitas.cita = citas.id INNER JOIN clientes ON citas.cliente = clientes.id WHERE servicioCitas.medico = ? AND servicioCitas.aprobado = 1 ORDER BY clientes.nombre, citas.fecha DESC LIMIT ?, ?", [medico, Number(start), Number(start)+20])

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

        const { err, medico, laboratorio } = await validToken(token)

        if(err || (!medico && !laboratorio)){ return res.sendStatus(401) }
        if((!date && !patient) || (!patient && isNaN(Number(date)))){ return res.sendStatus(400) }

        let dates = []

        if(date){
            const newDate = new Date(Number(date))
            const dateFrom = `${newDate.getFullYear()}-${newDate.getMonth()+1}-${newDate.getDate()} 00:00:00`
            const dateTo = `${newDate.getFullYear()}-${newDate.getMonth()+1}-${newDate.getDate()} 23:59:59`

            if(medico){
                dates = await db.query("SELECT servicioCitas.id, imagen, citas.nombre, fecha, citas.edad, citas.direccion, citas.padecimiento, citas.telefono, citas.email, clientes.enfermedadesFam, clientes.enfermedades, clientes.sangre, clientes.contacto, clientes.alergias, clientes.direccion AS clienteDireccion FROM servicioCitas INNER JOIN citas ON servicioCitas.cita = citas.id LEFT JOIN clientes ON citas.cliente = clientes.id WHERE servicioCitas.medico = ? AND citas.fecha BETWEEN ? AND ? AND servicioCitas.aprobado = 1", [medico, dateFrom, dateTo])
            }else{
                dates = await db.query("SELECT servicioCitas.id, imagen, citas.nombre, fecha, citas.edad, citas.direccion, cita, servicios.nombre AS servnombre, citas.telefono, citas.email, clientes.enfermedadesFam, clientes.enfermedades, clientes.sangre, clientes.contacto, clientes.alergias, clientes.direccion AS clienteDireccion FROM servicioCitas INNER JOIN citas ON servicioCitas.cita = citas.id INNER JOIN servicios ON servicioCitas.servicio = servicios.id LEFT JOIN clientes ON citas.cliente = clientes.id WHERE servicios.tipo = ? AND citas.fecha BETWEEN ? AND ? AND servicioCitas.aprobado = 1", [laboratorio, dateFrom, dateTo])
            }

        }else{
            if(medico){
                dates = await db.query("SELECT servicioCitas.id, imagen, citas.nombre, fecha, citas.cliente FROM servicioCitas INNER JOIN citas ON servicioCitas.cita = citas.id LEFT JOIN clientes ON citas.cliente = clientes.id WHERE servicioCitas.medico = ? AND clientes.nombre LIKE ? AND servicioCitas.aprobado = 1", [medico, `%${patient}%`])
            }else{
                dates = await db.query("SELECT servicioCitas.id, imagen, citas.nombre, fecha, citas.cliente, servicios.nombre AS servnombre FROM servicioCitas INNER JOIN citas ON servicioCitas.cita = citas.id INNER JOIN servicios ON servicioCitas.servicio = servicios.id LEFT JOIN clientes ON citas.cliente = clientes.id WHERE servicios.tipo = ? AND clientes.nombre LIKE ? AND servicioCitas.aprobado = 1", [laboratorio, `%${patient}%`])
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

        const { err, medico, laboratorio } = await validToken(token)

        if(err || (!medico && !laboratorio)){ return res.sendStatus(401) }

        let doctor = null

        if(medico){ doctor = await db.query("SELECT nombre, cargo FROM medicos WHERE id = ?", [medico]) }

        const newDate = new Date(fecha)
        const dateEmail = `${newDate.getDate()} de ${getMonthName(newDate.getMonth())} de ${newDate.getFullYear()} a las ${twoDigits(newDate.getHours())}:${twoDigits(newDate.getMinutes())}`

        if(aprove){
            const text = medico ? `Se ha confirmado tu cita el ${dateEmail}, con el ${doctor[0].cargo} ${doctor[0].nombre}.` : 
                        `Se ha confirmado tu cita el ${dateEmail}, para los siguientes laboratorios: ${servnombre}.`
            if(medico){ await db.query("UPDATE servicioCitas SET aprobado = 1 WHERE servicioCitas.medico = ? AND id = ?", [medico, id]) }
            else{ await db.query("UPDATE servicioCitas SET aprobado = 1 WHERE servicioCitas.cita = ?", [cita]) }

            try{ await sendEmailStatusDate({ email, name: nombre, text }) }
            catch(e){
                console.log(e)
                if(medico){ await db.query("UPDATE servicioCitas SET aprobado = 0 WHERE servicioCitas.medico = ? AND id = ?", [medico, id]) }
                else{ await db.query("UPDATE servicioCitas SET aprobado = 0 WHERE servicioCitas.cita = ?", [cita]) }
                return res.sendStatus(500)
            }
        }else{
            const text = medico ? `Se ha rechazado tu cita el ${dateEmail}, con el ${doctor[0].cargo} ${doctor[0].nombre} .` :
                        `Se ha rechazado tu cita el ${dateEmail}, para los siguientes laboratorios: ${servnombre}.` 
            try{ 
                await sendEmailStatusDate({ email, name: nombre, text }) 
                if(medico){ await db.query("DELETE FROM servicioCitas WHERE servicioCitas.medico = ? AND id = ?", [medico, id]) }
                else{ await db.query("DELETE FROM servicioCitas WHERE servicioCitas.cita = ?", [cita]) }
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

        if(!token){ return res.sendStatus(401) }

        const { err, medico } = await validToken(token)

        if(err && !medico){ return res.sendStatus(401) }

        for(const recipe of inputs){
            await db.query("INSERT INTO recetas (receta, cita) VALUES (?, ?)", [recipe, Number(id)])
        }

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
    postRecipe
}