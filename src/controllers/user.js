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

        /* await db.query('INSERT INTO usuarios (email, contrasena, medico, tipo) VALUES (?, ?, ?, ?)', [email, hashPassword(password), 4, 'ASISTENTE'])

        return res.json({ userType: 'ASISTENTE' }) */

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

        if(!token){ return res.sendStatus(401) }

        const { err, medico, laboratorio } = await validToken(token)

        if(err || (!medico && !laboratorio)){ return res.sendStatus(401) }

        let user = null
        if(medico){ user = await db.query('SELECT nombre, cargo, descripcion, imagen, facebook, instagram, telefono FROM medicos WHERE id = ?', [medico]) }

        console.log(user)

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
        const { name, type, description, facebook, instagram, phone } = req.body
    
        if(!name || type === "" || description === ""){ return res.sendStatus(400) }

        const { err, medico, laboratorio } = await validToken(token)

        if(err || (!medico && !laboratorio)){ return res.sendStatus(401) }
    
        if(image){
            let resImage = await uploadToCloudinary(image.buffer.toString('base64'), `medico_${medico}`)
    
            await db.query('UPDATE medicos SET nombre = ?, cargo = ?, descripcion = ?, facebook = ?, instagram = ?, imagen = ?, telefono = ? WHERE id = ?', [name, type, description, facebook, instagram, resImage.url, phone, medico])
        }else{
            await db.query('UPDATE medicos SET nombre = ?, cargo = ?, descripcion = ?, facebook = ?, instagram = ?, telefono = ? WHERE id = ?', [name, type, description, facebook, instagram, phone, medico])
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

        const { err, medico, laboratorio } = await validToken(token)

        if(err || (!medico && !laboratorio)){ return res.sendStatus(401) }

        await db.query('DELETE FROM horarios WHERE medico = ?',[medico])
    
        await setScheduleDay(monday, 1, medico, laboratorio)
        await setScheduleDay(tuesday, 2, medico, laboratorio)
        await setScheduleDay(wednesday, 3, medico, laboratorio)
        await setScheduleDay(thursday, 4, medico, laboratorio)
        await setScheduleDay(friday, 5, medico, laboratorio)
        await setScheduleDay(saturday, 6, medico, laboratorio)
        await setScheduleDay(sunday, 0, medico, laboratorio)
    
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

        const { err, medico, laboratorio } = await validToken(token)

        if(err || (!medico && !laboratorio)){ return res.sendStatus(401) }

        let monday = []
        let tuesday = []
        let wednesday = []
        let thursday = []
        let friday = []
        let saturday = []
        let sunday = []

        if(medico){
            monday = await db.query('SELECT * FROM horarios WHERE medico = ? AND dia = 1', [medico])
            tuesday = await db.query('SELECT * FROM horarios WHERE medico = ? AND dia = 2', [medico])
            wednesday = await db.query('SELECT * FROM horarios WHERE medico = ? AND dia = 3', [medico])
            thursday = await db.query('SELECT * FROM horarios WHERE medico = ? AND dia = 4', [medico])
            friday = await db.query('SELECT * FROM horarios WHERE medico = ? AND dia = 5', [medico])
            saturday = await db.query('SELECT * FROM horarios WHERE medico = ? AND dia = 6', [medico])
            sunday = await db.query('SELECT * FROM horarios WHERE medico = ? AND dia = 0', [medico])
        }else{
            monday = await db.query('SELECT * FROM horarios WHERE laboratorio = ? AND dia = 1', [laboratorio])
            tuesday = await db.query('SELECT * FROM horarios WHERE laboratorio = ? AND dia = 2', [laboratorio])
            wednesday = await db.query('SELECT * FROM horarios WHERE laboratorio = ? AND dia = 3', [laboratorio])
            thursday = await db.query('SELECT * FROM horarios WHERE laboratorio = ? AND dia = 4', [laboratorio])
            friday = await db.query('SELECT * FROM horarios WHERE laboratorio = ? AND dia = 5', [laboratorio])
            saturday = await db.query('SELECT * FROM horarios WHERE laboratorio = ? AND dia = 6', [laboratorio])
            sunday = await db.query('SELECT * FROM horarios WHERE laboratorio = ? AND dia = 0', [laboratorio])
        }
    
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
        const { deletedImgs } = req.body
        
        const dImgs = JSON.parse(deletedImgs)

        const { err, tipo } = await validToken(token)

        if(err || !tipo || tipo !== "ADMIN"){ return res.sendStatus(401) }

        for(let i = 0; i < files.length; i++){
            let resImage = await uploadToCloudinary(files[i].buffer.toString('base64'), `carrusel_${i + Date.now()}`)
            await db.query('INSERT INTO imagenes (url) VALUES (?)', [resImage.url])
        }

        for(let i = 0; i < dImgs.length; i++){
            await removeCloudinary(dImgs[i].url)
            await db.query('DELETE FROM imagenes WHERE id = ?', [dImgs[i].id])
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

        const user = await db.query('SELECT medico FROM usuarios WHERE id = ?', [id])

        console.log(user)

        await db.query('DELETE FROM usuarios WHERE id = ?', [Number(id)])
        await db.query('DELETE FROM medicos WHERE id = ?', [user[0].medico])

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
        const { email, userType, speciality, doctorType, labType, asisType } = req.body

        if(!email || !userType || !speciality || (userType.value === "MEDICO" && !doctorType) || 
        (userType.value === "LAB" && !labType) || (userType.value === "ASISTENTE" && !asisType)){ return res.sendStatus(400) }

        const { err, tipo } = await validToken(token)

        if(err || !tipo || tipo !== "ADMIN"){ return res.sendStatus(401) }

        let id = null
        let doctorID = null

        if(userType.value === "MEDICO"){
            const newDoctor = await db.query('INSERT INTO medicos (cargo, tipo) VALUES (?, ?)', [speciality, doctorType.value])
            const newUser = await db.query('INSERT INTO usuarios (email,  medico, tipo) VALUES (?, ?, ?)', [email, newDoctor.insertId, 'MEDICO'])
            doctorID = newDoctor.insertId
            id = newUser.insertId
        }else if(userType.value === "LAB"){
            const newUser = await db.query('INSERT INTO usuarios (email, laboratorio, tipo) VALUES (?, ?, ?)', [email, labType.value, 'LAB'])
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
        .sendStatus(200)
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

        if(err || !id || !email){ return res.sendStatus(400) }

        const passHashed = hashPassword(password)

        await db.query('UPDATE usuarios SET contrasena = ? WHERE id = ? AND email = ?', [passHashed, id, email])
        await db.query('INSERT INTO jwtBlockList (token) VALUES (?)', [token])

        res.sendStatus(200)
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
    createPassword
}