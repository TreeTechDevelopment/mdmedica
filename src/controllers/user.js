const db = require('../db/db')

const { createJWT, validToken } = require('../helpers/jwt')
const { comparePassword, hashPassword } = require('../helpers/bcrypt')

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

module.exports = {
    login,
    validUserToken
}