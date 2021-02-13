
const path = require('path')

const db = require('../db/db')

const { sendEmailConfirmation, sendEmailForgotPassword } = require('../helpers/nodemailer')
const { validToken, createJWT, validTokenEmail } = require('../helpers/jwt')
const { hashPassword, comparePassword } = require('../helpers/bcrypt')
const { uploadToCloudinary } = require('../helpers/cloudinary')
const { saveIllness } = require('../helpers/client')

const handleClient = (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../build/index.html'))
}

const createUser = async (req, res) => {
    try{

        const { name, age, address, phone, email, illness, relativeIllness, emergencyContact, allergies, bloodType, password, rh, habits, sex } = req.body

        if(!name || !age || !address || !phone || !email ||  !illness ||  !relativeIllness || !emergencyContact || !allergies || !bloodType || !password || !rh || !habits || !sex){
            return res.sendStatus(400)
        }

        const users = await db.query('SELECT email FROM clientes WHERE email = ?', [email])

        if(users.length !== 0){ return res.json({ ok: false, message: 'YA EXISTE UNA CUENTA CON ESTE EMAIL.' }) }

        const passHashed = hashPassword(password)

        const resDB = await db.query('INSERT INTO clientes (nombre, edad, direccion, telefono, email, contacto, alergias, sangre, contrasena, rh, sexo) VALUES (?,?,?,?,?,?,?,?,?,?,?)', 
                        [name, age, address, phone, email, emergencyContact, allergies, bloodType, passHashed, rh, sex]) 

        await saveIllness(illness, resDB.insertId, 'EP')
        await saveIllness(relativeIllness, resDB.insertId, 'PF')
        await saveIllness(habits, resDB.insertId, 'H')

        try{
            await sendEmailConfirmation({ id: resDB.insertId, email, name })
        }catch(e){
            console.log(e)
            await db.query('DELETE FROM enfermedadesCliente WHERE cliente = ?', [resDB.insertId]) 
            await db.query('DELETE FROM clientes WHERE id = ?', [resDB.insertId]) 
            return res.sendStatus(500)
        }

        res.json({ ok: true })
    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const verifyUser = async (req, res) => {
    try{

        const token = req.headers.authorization.slice(6)

        if(!token){ return res.sendStatus(400) }

        const { err, id } = await validTokenEmail(token)

        if(err){ return res.json({ ok: false }) }

        const resDB = await db.query('SELECT id, email, nombre, direccion, telefono, contacto, alergias, sangre, edad, rh FROM clientes WHERE id = ?', [id])

        if(resDB.length === 0){ return res.sendStatus(400) }

        await db.query('UPDATE clientes SET confirmado=1 WHERE id = ?', [resDB[0].id])

        res.json({ ok: true })
    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const validUserToken = async (req, res) => {
    try{

        const token = req.headers.authorization.slice(6)

        if(!token){ return res.sendStatus(400) }

        const { err, id, email } = await validTokenEmail(token)

        if(err){ return res.sendStatus(400) }

        let tokenDB = await db.query('SELECT token FROM jwtBlockList WHERE token = ?', [token])
        if(tokenDB.length !== 0){ return res.sendStatus(400) }

        let emailUser = ''

        if(!email){ 
            const user = await db.query('SELECT email FROM clientes WHERE id = ?', [id]) 
            emailUser = user[0].email
        }

        res.json({ email: email || emailUser })
    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const login = async (req, res) => {
    try{

        const { email, password } = req.body

        if(!email && !password){ return res.sendStatus(400) }

        const userDB = await db.query('SELECT * FROM clientes WHERE email = ? AND confirmado=1', [email])
        
        if(userDB.length === 0){ return res.sendStatus(400) }

        if(!comparePassword(password, userDB[0].contrasena)){ return res.sendStatus(400) }
        delete userDB[0].contrasena

        const token = createJWT(JSON.parse(JSON.stringify(userDB[0])))

        res.cookie('payload', token.split('.')[0] + '.' + token.split('.')[1], { sameSite: true, maxAge: 1000 * 60 * 30 }) // secure: true for deployment
        .cookie('signature', token.split('.')[2], { sameSite: true, httpOnly: true })
        .sendStatus(200)

    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const forgotPassword = async (req, res) => {
    try{

        const { email } = req.body

        if(!email){ return res.sendStatus(400) }

        const userDB = await db.query('SELECT email, id, nombre FROM clientes WHERE email = ?', [email])

        if(userDB.length === 0){ return res.json({ ok: false, message: 'No existe una cuenta con este email.' }) }

        try{
            await sendEmailForgotPassword({ id: userDB[0].id, email, name: userDB[0].nombre })
        }catch(e){ 
            console.log(e)
            return res.sendStatus(500) 
        }

        res.json({ ok: true, message: 'Se ha enviado correctamente el correo a tu email' })

    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const changePassword = async (req, res) => {
    try{

        const { password } = req.body

        if(!password){ return res.sendStatus(400) }

        const token = req.headers.authorization.slice(6)

        const { err, id } = await validTokenEmail(token)

        if(err){ return res.sendStatus(400) }

        const passHashed = hashPassword(password)

        await db.query('UPDATE clientes SET contrasena = ? WHERE id = ?', [passHashed, id])
        await db.query('INSERT INTO jwtBlockList (token) VALUES (?)', [token])

        res.sendStatus(200)

    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const getUser = async (req, res) => {
    try{

        const { token } = req

        if(!token){ return res.sendStatus(401) }

        let user = await validToken(token)

        if(user.err){ return res.sendStatus(401) }

        const EP = await db.query('SELECT texto FROM enfermedadesCliente WHERE cliente = ? AND tipo = ?', [user.id, 'EP'])
        const PF = await db.query('SELECT texto FROM enfermedadesCliente WHERE cliente = ? AND tipo = ?', [user.id, 'PF'])
        const H = await db.query('SELECT texto FROM enfermedadesCliente WHERE cliente = ? AND tipo = ?', [user.id, 'H'])

        delete user.confirmado
        delete user.exp
        delete user.iat
        if(EP.length !== 0){ user.enfermedades = EP }
        if(PF.length !== 0){ user.enfermedadesFam = PF }
        if(H.length !== 0){ user.habitos = H }

        res.cookie('payload', token.split('.')[0] + '.' + token.split('.')[1], { sameSite: true, maxAge: 1000 * 60 * 30 })
        .json({ user })

    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const editUser = async (req, res) => {
    try{
        const image = req.file
        const { token } = req
        const { name, age, phone, address, contact } = req.body

        if(!name || !age || !phone || !address || !contact || name === "" || age === "" || phone === "" || address === "" || contact === ""){ return res.sendStatus(400) }

        const { err, id } = await validToken(token)

        if(!token || err){ return res.sendStatus(401) }

        if(image){
            let resImage = await uploadToCloudinary(image.buffer.toString('base64'), id)

            await db.query('UPDATE clientes SET nombre = ?, edad = ?, direccion = ?, telefono = ?, contacto = ?, imagen = ? WHERE id = ?', [name, age, address, phone, contact, resImage.url, id])
        }else{
            await db.query('UPDATE clientes SET nombre = ?, edad = ?, direccion = ?, telefono = ?, contacto = ? WHERE id = ?', [name, age, address, phone, contact, id])
        }

        res.cookie('payload', token.split('.')[0] + '.' + token.split('.')[1], { sameSite: true, maxAge: 1000 * 60 * 30 })
        .sendStatus(200)

    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const logout = async (req, res) => {
    try{

        res.cookie('payload', '', {maxAge: 0})
        .cookie('signature', '', {maxAge: 0})
        .sendStatus(200)

    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const getInfo = async (req, res) => {
    try{
        if(JSON.stringify(req.query) === "{}"){ return res.sendStatus(400) }

        const { disccountInfo, images } = req.query

        if(disccountInfo === "true"){
            let text = await db.query('SELECT * FROM textos WHERE id = 1')
            return res.json({ ...text[0] })
        }else if(images === "true"){
            let images = await db.query('SELECT * FROM imagenes')
            return res.json({ images })
        }

        return res.sendStatus(400)
            
    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

module.exports={
    createUser,
    verifyUser,
    login,
    forgotPassword,
    validUserToken,
    changePassword,
    getUser,
    editUser,
    logout,
    handleClient,
    getInfo
}