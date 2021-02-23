const db = require('../db/db')

const { createJWT, validToken, validTokenEmail } = require('../helpers/jwt')
const { comparePassword, hashPassword } = require('../helpers/bcrypt')
const { uploadToCloudinary, removeCloudinary } = require('../helpers/cloudinary')
const { setScheduleDay } = require('../helpers/user')
const { sendEmailNewUser } = require('../helpers/nodemailer')

const validUserToken = async (req, res) => {
    try{

        const { token } = req
        const { type } = req.query

        if(!token){ return res.sendStatus(401) }

        const { err, tipo } = await validToken(token)

        if(err){ return res.sendStatus(401) }

        if(type !== tipo){ return res.sendStatus(401) }

        res.sendStatus(200)
    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const login = async (req, res) => {
    try{

        const { email, password } = req.body

        if(!email && !password){ return res.sendStatus(400) }

        const userDB = await db.query('SELECT * FROM usuarios WHERE email = ?', [email])
        
        if(userDB.length === 0){ return res.sendStatus(400) }

        if(!comparePassword(password, userDB[0].contrasena)){ return res.sendStatus(400) }
        delete userDB[0].contrasena

        const token = createJWT(JSON.parse(JSON.stringify(userDB[0])))
        
        res.cookie('payload', token.split('.')[0] + '.' + token.split('.')[1], { sameSite: true, maxAge: 1000 * 60 * 30 }) // secure: true for deployment
        .cookie('signature', token.split('.')[2], { sameSite: true, httpOnly: true })
        .json({ userType: userDB[0].tipo })

    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const getInfoUser = async (req, res) => {
    try{

        const { token } = req
        const { getDoctor } = req.query

        if(!token){ return res.sendStatus(401) }

        const { err, medico, tipo, id } = await validToken(token)

        if(err || (!medico && !tipo)){ return res.sendStatus(401) }

        let user = null

        const userDB = await db.query('SELECT nombre, cargo, imagen, tipo FROM usuarios WHERE id = ?', [id])

        if(userDB[0].tipo !== "ASISTENTE" || getDoctor){ user = await db.query('SELECT nombre, cargo, descripcion, imagen, facebook, instagram, telefono, precio, precioDomicilio FROM medicos WHERE id = ?', [medico]) }
        else{ user = userDB }

        res.cookie('payload', token.split('.')[0] + '.' + token.split('.')[1], { sameSite: true, maxAge: 1000 * 60 * 30 })
        .json({ user: user[0] })
    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const editUser = async (req, res) => {
    try{
        const image = req.file
        const { token } = req
        const { name, type, description, facebook, instagram, phone, price, priceHome } = req.body
        const { setDoctor } = req.query

    
        if(!name || type === ""){ return res.sendStatus(400) }

        const { err, medico, tipo, id } = await validToken(token)

        if(err || (!medico && !tipo)){ return res.sendStatus(401) }

        const user = await db.query('SELECT tipo FROM usuarios WHERE id = ?', [id])

        if(user[0].tipo !== "ASISTENTE" || setDoctor){
            if(image){
                let resImage = await uploadToCloudinary(image.buffer.toString('base64'), `medico_${medico}`) 
                await db.query('UPDATE medicos SET nombre = ?, cargo = ?, descripcion = ?, facebook = ?, instagram = ?, imagen = ?, telefono = ?, precio = ?, precioDomicilio = ? WHERE id = ?', [name, type, description, facebook, instagram, resImage.url, phone, price, priceHome, medico])
            }else{
                await db.query('UPDATE medicos SET nombre = ?, cargo = ?, descripcion = ?, facebook = ?, instagram = ?, telefono = ?, precio = ?, precioDomicilio = ? WHERE id = ?', [name, type, description, facebook, instagram, phone, price, priceHome, medico])
            }
        }else{
            if(image){
                let resImage = await uploadToCloudinary(image.buffer.toString('base64'), `medico_${medico}`) 
                await db.query('UPDATE usuarios SET nombre = ?, cargo = ?, imagen = ? WHERE id = ?', [name, type, resImage.url, id])
            }else{
                await db.query('UPDATE usuarios SET nombre = ?, cargo = ? WHERE id = ?', [name, type, id])
            }
        }
    
        res.cookie('payload', token.split('.')[0] + '.' + token.split('.')[1], { sameSite: true, maxAge: 1000 * 60 * 30 })
        .sendStatus(200)
    
    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const saveSchedule = async (req, res) => {
    try{
        const { token } = req
        const { monday, tuesday, wednesday, thursday, friday, saturday, sunday } = req.body
    
        if(!monday || !tuesday || !wednesday || !thursday || !friday || !saturday || !sunday){ return res.sendStatus(400) }

        const { err, medico } = await validToken(token)

        if(err || !medico){ return res.sendStatus(401) }

        await db.query('DELETE FROM horarios WHERE medico = ?',[medico])
    
        await setScheduleDay(monday, 1, medico)
        await setScheduleDay(tuesday, 2, medico)
        await setScheduleDay(wednesday, 3, medico)
        await setScheduleDay(thursday, 4, medico)
        await setScheduleDay(friday, 5, medico)
        await setScheduleDay(saturday, 6, medico)
        await setScheduleDay(sunday, 0, medico)
    
        res.cookie('payload', token.split('.')[0] + '.' + token.split('.')[1], { sameSite: true, maxAge: 1000 * 60 * 30 })
        .sendStatus(200)
    
    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const getSchedule = async (req, res) => {
    try{
        const { token } = req

        const { err, medico, tipo } = await validToken(token)

        if(err || !medico ){ return res.sendStatus(401) }

        let monday = []
        let tuesday = []
        let wednesday = []
        let thursday = []
        let friday = []
        let saturday = []
        let sunday = []

        monday = await db.query('SELECT * FROM horarios WHERE medico = ? AND dia = 1', [medico])
        tuesday = await db.query('SELECT * FROM horarios WHERE medico = ? AND dia = 2', [medico])
        wednesday = await db.query('SELECT * FROM horarios WHERE medico = ? AND dia = 3', [medico])
        thursday = await db.query('SELECT * FROM horarios WHERE medico = ? AND dia = 4', [medico])
        friday = await db.query('SELECT * FROM horarios WHERE medico = ? AND dia = 5', [medico])
        saturday = await db.query('SELECT * FROM horarios WHERE medico = ? AND dia = 6', [medico])
        sunday = await db.query('SELECT * FROM horarios WHERE medico = ? AND dia = 0', [medico])
    
        res.cookie('payload', token.split('.')[0] + '.' + token.split('.')[1], { sameSite: true, maxAge: 1000 * 60 * 30 })
        .json({ monday, tuesday, wednesday, thursday, friday, saturday, sunday })
    
    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const updateImages = async (req, res) => {
    try{
        const { token, files } = req
        const { deletedImgs, updateType } = req.body

        const { err, tipo } = await validToken(token)

        if(err || !tipo || tipo !== "ADMIN"){ return res.sendStatus(401) }

        if(updateType === "SERVICIO"){
            await db.query('DELETE FROM imagenes WHERE tipo = ?', ['SERVICIO'])
            let resImage = await uploadToCloudinary(files[0].buffer.toString('base64'), `servicios_${Date.now()}`)
            await db.query('INSERT INTO imagenes (url, tipo) VALUES (?, ?)', [resImage.url, 'SERVICIO'])
        }else{
            const dImgs = JSON.parse(deletedImgs)

            for(let i = 0; i < files.length; i++){
                let resImage = await uploadToCloudinary(files[i].buffer.toString('base64'), `carrusel_${i + Date.now()}`)
                await db.query('INSERT INTO imagenes (url) VALUES (?)', [resImage.url])
            }
    
            for(let i = 0; i < dImgs.length; i++){
                await removeCloudinary(dImgs[i].url)
                await db.query('DELETE FROM imagenes WHERE id = ?', [dImgs[i].id])
            }
        }

        res.cookie('payload', token.split('.')[0] + '.' + token.split('.')[1], { sameSite: true, maxAge: 1000 * 60 * 30 })
        .sendStatus(200)
    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const updateText = async (req, res) => {
    try{
        const { token } = req
        const { text1, text2, text3, ID } = req.body
        
        if(!text1 || !text2 || !text3 || !ID){ return res.sendStatus(400) }

        const { err, tipo } = await validToken(token)

        if(err || !tipo || tipo !== "ADMIN"){ return res.sendStatus(401) }

        await db.query('UPDATE textos SET texto1 = ?, texto2 = ?, texto3 = ? WHERE id = ?', [text1, text2, text3, ID])

        res.cookie('payload', token.split('.')[0] + '.' + token.split('.')[1], { sameSite: true, maxAge: 1000 * 60 * 30 })
        .sendStatus(200)
    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const getReviews = async (req, res) => {
    try{
        const { token } = req
        const { start } = req.query
        
        if(isNaN(Number(start))){ return res.sendStatus(400) }

        const { err, tipo } = await validToken(token)

        if(err || !tipo || tipo !== "ADMIN"){ return res.sendStatus(401) }

        const reviews = await db.query('SELECT texto, clientes.nombre, reviews.estrellas, reviews.id, medico, servicio, servicios.nombre AS servnombre, medicos.nombre AS mednombre FROM reviews INNER JOIN clientes ON reviews.cliente = clientes.id LEFT JOIN medicos ON reviews.medico = medicos.id LEFT JOIN servicios ON reviews.servicio = servicios.id WHERE aprobado = 0 LIMIT ?, ?', [Number(start), Number(start) + 20])

        res.cookie('payload', token.split('.')[0] + '.' + token.split('.')[1], { sameSite: true, maxAge: 1000 * 60 * 30 })
        .json({ reviews })
    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const updateReview = async (req, res) => {
    try{
        const { token } = req
        const { id, accept } = req.body
        
        if(isNaN(Number(id)) || typeof accept !== "boolean"){ return res.sendStatus(400) }

        const { err, tipo } = await validToken(token)

        if(err || !tipo || tipo !== "ADMIN"){ return res.sendStatus(401) }

        if(accept){ await db.query('UPDATE reviews SET aprobado = 1 WHERE id = ?', [id]) }
        else{ await db.query('DELETE FROM reviews WHERE id = ?', [id]) }

        res.cookie('payload', token.split('.')[0] + '.' + token.split('.')[1], { sameSite: true, maxAge: 1000 * 60 * 30 })
        .sendStatus(200)
    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const getUsers = async (req, res) => {
    try{
        const { token } = req
        const { type } = req.query

        if(!type){ return res.sendStatus(400) }

        const { err, tipo } = await validToken(token)

        if(err || !tipo || tipo !== "ADMIN"){ return res.sendStatus(401) }

        const users = await db.query('SELECT medicos.cargo, medicos.nombre, email, usuarios.tipo, usuarios.id, medicos.imagen, usuarios.nombre AS usanombre, usuarios.cargo AS usacargo, usuarios.imagen AS usaimagen FROM usuarios LEFT JOIN medicos ON usuarios.medico = medicos.id WHERE usuarios.tipo = ? ', [type])

        res.cookie('payload', token.split('.')[0] + '.' + token.split('.')[1], { sameSite: true, maxAge: 1000 * 60 * 30 })
        .json({ users })
    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const getUser = async (req, res) => {
    try{
        const { token } = req
        const { id } = req.params

        if(isNaN(Number(id))){ return res.sendStatus(400) }

        const { err, tipo } = await validToken(token)

        if(err || !tipo || tipo !== "ADMIN"){ return res.sendStatus(401) }

        const user = await db.query('SELECT medicos.cargo, medicos.nombre, email, usuarios.tipo, usuarios.id, medicos.imagen, usuarios.nombre AS usanombre, usuarios.cargo AS usacargo, usuarios.imagen AS usaimagen FROM usuarios LEFT JOIN medicos ON usuarios.medico = medicos.id WHERE usuarios.id = ?', [Number(id)])

        console.log(user)

        res.cookie('payload', token.split('.')[0] + '.' + token.split('.')[1], { sameSite: true, maxAge: 1000 * 60 * 30 })
        .json({ user: user[0] })
    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const deleteUser = async (req, res) => {
    try{
        const { token } = req
        const { id } = req.params

        if(isNaN(Number(id))){ return res.sendStatus(400) }

        const { err, tipo } = await validToken(token)

        if(err || !tipo || tipo !== "ADMIN"){ return res.sendStatus(401) }

        const user = await db.query('SELECT medico, tipo FROM usuarios WHERE id = ?', [Number(id)])

        await db.query('DELETE FROM usuarios WHERE id = ?', [Number(id)])
        if(user[0].tipo !== "ASISTENTE"){ await db.query('UPDATE medicos SET activo = 0 WHERE id = ?', [user[0].medico]) }

        res.cookie('payload', token.split('.')[0] + '.' + token.split('.')[1], { sameSite: true, maxAge: 1000 * 60 * 30 })
        .sendStatus(200)
    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const createUser = async (req, res) => {
    try{
        const { token } = req
        const { email, userType, speciality, doctorType,  asisType } = req.body

        if(!email || !userType || !speciality || (userType.value === "MEDICO" && !doctorType) || (userType.value === "ASISTENTE" && !asisType)){ return res.sendStatus(400) }

        const { err, tipo } = await validToken(token)

        if(err || !tipo || tipo !== "ADMIN"){ return res.sendStatus(401) }

        const userExist = await db.query('SELECT id FROM usuarios WHERE email = ?', [email])

        if(userExist.length !== 0){ return res.json({ ok: false, message: 'Ya existe un usuario con este email.' }) }

        let id = null
        let doctorID = null

        if(userType.value !== "ASISTENTE"){
            const newDoctor = await db.query('INSERT INTO medicos (cargo, tipo) VALUES (?, ?)', [speciality, doctorType.value])
            const newUser = await db.query('INSERT INTO usuarios (email, medico, tipo) VALUES (?, ?, ?)', [email, newDoctor.insertId, userType.value])
            doctorID = newDoctor.insertId
            id = newUser.insertId
        }else{
            const newUser = await db.query('INSERT INTO usuarios (email, medico, tipo) VALUES (?, ?, ?)', [email, asisType.value, 'ASISTENTE'])
            id = newUser.insertId
        }

        try{
            await sendEmailNewUser({ email, id })
        }catch(e){
            console.log(e)
            await db.query('DELETE FROM usuarios WHERE id = ?', [id]) 
            if(userType.value === "MEDICO"){ await db.query('DELETE FROM medicos WHERE id = ?', [doctorID]) }
            return res.sendStatus(500)
        }

        res.cookie('payload', token.split('.')[0] + '.' + token.split('.')[1], { sameSite: true, maxAge: 1000 * 60 * 30 })
        .json({ ok: true })
    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const createPassword = async (req, res) => {
    try{
        const { password } = req.body

        if(!password){ return res.sendStatus(400) }

        const token = req.headers.authorization.slice(6)

        const { err, id, email } = await validTokenEmail(token)

        if(err || !id || !email){ return res.sendStatus(401) }

        const passHashed = hashPassword(password)

        await db.query('UPDATE usuarios SET contrasena = ? WHERE id = ? AND email = ?', [passHashed, id, email])
        await db.query('INSERT INTO jwtBlockList (token) VALUES (?)', [token])

        res.sendStatus(200)
    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const getClient = async (req, res) => {
    try{
        const { id } = req.query
        const { token } = req

        if(isNaN(Number(id))){ return res.sendStatus(400) }

        const { err, tipo } = await validToken(token)

        if(err || !tipo){ return res.sendStatus(401) }

        const user =  await db.query('SELECT * FROM clientes WHERE id = ?', [id])

        const EP = await db.query('SELECT texto FROM enfermedadesCliente WHERE cliente = ? AND tipo = ?', [id, 'EP'])
        const PF = await db.query('SELECT texto FROM enfermedadesCliente WHERE cliente = ? AND tipo = ?', [id, 'PF'])
        const H = await db.query('SELECT texto FROM enfermedadesCliente WHERE cliente = ? AND tipo = ?', [id, 'H'])

        if(EP.length !== 0){ user[0].enfermedades = EP }
        if(PF.length !== 0){ user[0].enfermedadesFam = PF }
        if(H.length !== 0){ user[0].habitos = H }

        res.cookie('payload', token.split('.')[0] + '.' + token.split('.')[1], { sameSite: true, maxAge: 1000 * 60 * 30 })
        .json({ user: user[0] })

    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const getClientResults = async (req, res) => {
    try{
        const { id, serv_id } = req.query
        const { token } = req

        if(isNaN(Number(id)) || isNaN(Number(serv_id))){ return res.sendStatus(400) }

        const { err, tipo } = await validToken(token)

        if(err || !tipo){ return res.sendStatus(401) }

        const params = await db.query('SELECT id, nombre, unidades FROM parametros WHERE servicio = ?', [Number(serv_id)])
        let results = []
        for(let i = 0; i < params.length; i++){
            const resDB = await db.query('SELECT * FROM resultados WHERE cliente = ? AND param = ? ORDER BY fecha ASC', [Number(id), params[i].id])
            results.push({ results: resDB, param: params[i].id })
        }

        res.cookie('payload', token.split('.')[0] + '.' + token.split('.')[1], { sameSite: true, maxAge: 1000 * 60 * 30 })
        .json({ params, results })

    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}


module.exports = {
    login,
    validUserToken,
    getInfoUser,
    editUser,
    saveSchedule,
    getSchedule,
    updateImages,
    updateText,
    getReviews,
    updateReview,
    getUsers,
    getUser,
    deleteUser,
    createUser,
    createPassword,
    getClient,
    getClientResults
}