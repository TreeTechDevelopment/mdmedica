const db = require('../db/db')

const { validToken } = require('../helpers/jwt')

const getAllLabs = async (req, res) => {
    try{
        const { getDoctors } = req.query

        const labs = await db.query('SELECT * FROM laboratorios')
        const services = await db.query('SELECT * FROM servicios')

        let doctors = []
        let schedules = []
        if(getDoctors){ 
            doctors = await db.query('SELECT * FROM medicos WHERE tipo = ?', ['QUIMICO']) 
            schedules = await db.query('SELECT * FROM horarios INNER JOIN medicos ON medicos.id = horarios.medico WHERE medicos.tipo = ?', ['QUIMICO'])
        }

        res.json({ labs, services, doctors, schedules })
    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const getLab = async (req, res) => {
    try{

        if(JSON.stringify(req.query) === "{}" && !req.query.reviews){ return res.sendStatus(400) } 
        const { id } = req.params
        if(!id){ return res.sendStatus(400) }

        let service = await db.query('SELECT * FROM servicios WHERE id = ?', [id])
        if(service.length === 0){ return res.sendStatus(400) }

        let lab = await db.query('SELECT imagen, nombre, id FROM laboratorios WHERE id = ?', [service[0].tipo])
        if(lab.length === 0){ return res.sendStatus(400) }

        let response = { info: {...service[0], laboratorio: lab[0].nombre, estrellas: lab[0].estrellas} }

        res.json(response)
            
    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const postReview = async (req, res) => {
    try{
        const { id } = req.params
        const { token } = req
        const review = req.body

        const { err, id: user } = await validToken(token)

        if(err){ return res.sendStatus(401) }

        if(isNaN(Number(id)) || !review.stars){ return res.sendStatus(400) }

        const userDB = await db.query('SELECT id FROM clientes WHERE id = ?', [user])

        if(userDB.length === 0){ return res.sendStatus(400) }

        await db.query('INSERT INTO reviews (texto, servicio, cliente, estrellas) VALUES (?,?,?,?)', [review.review, id, user, review.stars])

        res.sendStatus(200)
            
    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

module.exports={
    getAllLabs,
    getLab,
    postReview
}