const db = require('../db/db')

const { validTokenEmail } = require('../helpers/jwt')
const { createPreferencID } = require('../helpers/mercadopago')

const getInfo = async (req, res) => {
    try{
        const { token } = req.query

        if(!token){ return res.sendStatus(400) }

        const { err, cita, tipo } = await validTokenEmail(token)

        if(err || !cita || !tipo){ return res.sendStatus(401) }

        let resDB = null
        let preferenceID = null

        if(tipo === "medico"){
            resDB = await db.query('SELECT citas.email, medicos.nombre AS mednombre, medicos.cargo, citas.nombre, medicos.precio, citas.direccion, medicos.precioDomicilio, citas.id FROM servicioCitas INNER JOIN citas ON servicioCitas.cita = citas.id INNER JOIN medicos ON servicioCitas.medico = medicos.id WHERE citas.id = ? AND pagado = 0', [cita])
        }else{
            resDB = await db.query('SELECT citas.email, servicios.nombre AS servnombre, citas.nombre, citas.direccion, servicios.precio, servicios.precioDomicilio, citas.id FROM servicioCitas INNER JOIN citas ON servicioCitas.cita = citas.id INNER JOIN servicios ON servicioCitas.servicio = servicios.id WHERE citas.id = ? AND pagado = 0', [cita])
        }

        if(resDB.length !== 0){ preferenceID = await createPreferencID(resDB, tipo, token) }

        res.json({ date: resDB, type: tipo, preferenceID })

    }catch(e){
        console.log(e)
        return res.sendStatus(500)
    }
}

const payDate = async (req, res) => {
    try{
        const { token } = req.query
        const { dateID } = req.body

        if(!token || isNaN(Number(dateID))){ return res.sendStatus(400) }

        const { err, cita, tipo } = await validTokenEmail(token)

        if(err || !cita || !tipo){ return res.sendStatus(401) }

        if(cita !== Number(dateID)){ return res.sendStatus(401) }

        await db.query('UPDATE citas SET pagado = 1 WHERE id = ?', [Number(dateID)])

        res.sendStatus(200)

    }catch(e){
        console.log(e)
        return res.sendStatus(500)
    }
}

module.exports={
    getInfo,
    payDate
}