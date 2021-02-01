const db = require('../db/db')

const { validToken } = require('../helpers/jwt')

const getAllLabs = async (req, res) => {
    try{
        let labs = await db.query('SELECT * FROM laboratorios')
        let services = await db.query('SELECT * FROM servicios')

        res.json({ labs, services })
    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const getLab = async (req, res) => {
    try{

        if(JSON.stringify(req.query) === "{}" && !req.query.reviews){ return res.sendStatus(400) } 

        const getReviews = req.query.reviews
        const getSchedule = req.query.schedule
        const { id } = req.params
        if(!id){ return res.sendStatus(400) }

        let service = await db.query('SELECT * FROM servicios WHERE id = ?', [id])
        if(service.length === 0){ return res.sendStatus(400) }

        let lab = await db.query('SELECT imagen, nombre, id, estrellas FROM laboratorios WHERE id = ?', [service[0].tipo])
        if(lab.length === 0){ return res.sendStatus(400) }

        let response = { info: {...service[0], laboratorio: lab[0].nombre, estrellas: lab[0].estrellas} }

        if(getReviews === "true"){
            let reviews = await db.query('SELECT texto, nombre, estrellas, reviews.id FROM reviews INNER JOIN clientes ON reviews.servicio = ? WHERE aprobado = 1', [lab[0].id])
            response.reviews = reviews
        }
        if(getSchedule === "true"){
            response.monday = await db.query('SELECT * FROM horarios WHERE laboratorio = ? AND dia = 1', [id])
            response.tuesday = await db.query('SELECT * FROM horarios WHERE laboratorio = ? AND dia = 2', [id])
            response.wednesday = await db.query('SELECT * FROM horarios WHERE laboratorio = ? AND dia = 3', [id])
            response.thursday = await db.query('SELECT * FROM horarios WHERE laboratorio = ? AND dia = 4', [id])
            response.friday = await db.query('SELECT * FROM horarios WHERE laboratorio = ? AND dia = 5', [id])
            response.saturday = await db.query('SELECT * FROM horarios WHERE laboratorio = ? AND dia = 6', [id])
            response.sunday = await db.query('SELECT * FROM horarios WHERE laboratorio = ? AND dia = 0', [id])
        }

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