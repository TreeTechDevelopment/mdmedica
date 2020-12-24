const jwt = require('jsonwebtoken')

const createJWTEmailConfirmation = user => {
    const token = jwt.sign(user, process.env.JWT_KEY_EMAIL, { expiresIn: '1d' });
    return token
}

const createJWT = user => {
    const token = jwt.sign(user, process.env.JWT_KEY, { expiresIn: '30d' });
    return token
}

const validToken = async (token) => {
    try{
        const res = await jwt.verify(token, process.env.JWT_KEY)
        return { ...res }
    }catch(e){
        return { err: e }
    }
    
}

const validTokenEmail = async (token) => {
    try{
        const res = await jwt.verify(token, process.env.JWT_KEY_EMAIL)
        return { ...res }
    }catch(e){
        return { err: e }
    }
}

module.exports = {
    createJWTEmailConfirmation,
    validToken,
    createJWT,
    validTokenEmail
}