const db = require('../db/db')

const { sendEmailConfirmation, sendEmailForgotPassword } = require('../helpers/nodemailer')
const { validToken, createJWT, validTokenEmail } = require('../helpers/jwt')
const { hashPassword, comparePassword } = require('../helpers/bcrypt')
const { uploadToCloudinary } = require('../helpers/cloudinary')

const createUser = async (req, res) => {
    try{

        const { name, age, address, phone, email, illness, relativeIllness, emergencyContact, allergies, bloodType, password } = req.body

        if(!name || !age || !address || !phone || !email ||  !illness ||  !relativeIllness || !emergencyContact || !allergies || !bloodType || !password){
            return res.sendStatus(400)
        }

        const users = await db.query('SELECT email FROM clientes WHERE email = ?', [email])

        if(users.length !== 0){ return res.json({ ok: false, message: 'YA EXISTE UNA CUENTA CON ESTE EMAIL.' }) }

        const passHashed = hashPassword(password)

        const resDB = await db.query('INSERT INTO clientes (nombre, edad, direccion, telefono, email, enfermedades, enfermedadesFam, contacto, alergias, sangre, contrasena) VALUES (?,?,?,?,?,?,?,?,?,?,?)', 
                        [name, age, address, phone, email, illness, relativeIllness, emergencyContact, allergies, bloodType, passHashed]) 

        try{
            await sendEmailConfirmation({ id: resDB.insertId, email })
        }catch(e){
            console.log(e)
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

        console.log(token)

        if(!token){ return res.sendStatus(400) }

        const { err, id } = await validTokenEmail(token)

        console.log(err)

        if(err){ return res.json({ ok: false }) }

        const resDB = await db.query('SELECT id, email, nombre, direccion, telefono, enfermedades, enfermedadesFam, contacto, alergias, sangre, edad FROM clientes WHERE id = ?', [id])

        console.log(resDB)

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

        const { err } = await validTokenEmail(token)

        console.log(err)

        if(err){ return res.sendStatus(400) }

        let tokenDB = await db.query('SELECT token FROM jwtBlockList WHERE token = ?', [token])

        if(tokenDB.length !== 0){ return res.sendStatus(400) }

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

        const userDB = await db.query('SELECT email, id FROM clientes WHERE email = ?', [email])

        if(userDB.length === 0){ return res.json({ ok: false, message: 'NO EXISTE UNA CUENTA CON ESTE EMAIL.' }) }

        try{
            await sendEmailForgotPassword({ id: userDB[0].id, email })
        }catch(e){
            console.log(e)
            return res.sendStatus(500)
        }

        res.json({ ok: true, message: 'SE HA ENVIADO CORRECTAMENTE EL ENLACE A TU CORREO' })

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

        const user = await validToken(token)

        if(user.err){ return res.sendStatus(401) }

        delete user.confirmado
        delete user.exp
        delete user.iat

        res.cookie('payload', token.split('.')[0] + '.' + token.split('.')[1], { sameSite: true, maxAge: 1000 * 60 * 30 })
        .json({ user })

    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const editUser = async (req, res) => {
    try{

        const { id } = req.params
        const { token } = req
        const { name, age, phone, address, contact } = req.body

        if(!name || !age || !phone || !address || !contact || name === "" || age === "" || phone === "" || address === "" || contact === ""){ return res.sendStatus(400) }

        if(!token){ return res.sendStatus(401) }

        let resImage = await uploadToCloudinary(req.file.buffer.toString('base64'), id)

        await db.query('UPDATE clientes SET nombre = ?, edad = ?, direccion = ?, telefono = ?, contacto = ?, imagen = ? WHERE id = ?', [name, age, address, phone, contact, resImage.url, id])

        const userDB = await db.query('SELECT * FROM clientes WHERE id = ?', [id])

        delete userDB[0].contrasena

        const newToken = createJWT(JSON.parse(JSON.stringify(userDB[0])))

        res.cookie('payload', newToken.split('.')[0] + '.' + newToken.split('.')[1], { sameSite: true, maxAge: 1000 * 60 * 30 })
        .cookie('signature', newToken.split('.')[2], { sameSite: true, httpOnly: true })
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

module.exports={
    createUser,
    verifyUser,
    login,
    forgotPassword,
    validUserToken,
    changePassword,
    getUser,
    editUser,
    logout
}