const db = require('../db/db')

const saveIllness = async (illness, clientID, type) => {
    for(let i = 0; i < illness.length; i++){
        await db.query('INSERT INTO enfermedadesCliente (texto, cliente, tipo) VALUES (?,?,?)', [illness[i].value, clientID, type])
    }
}

module.exports = {
    saveIllness
}