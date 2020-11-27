const db = require('../db/db')

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
        const { id } = req.params
        if(!id){ return res.sendStatus(400) }

        let service = await db.query('SELECT * FROM servicios WHERE id = ?', [id])
        if(service.length === 0){ return res.sendStatus(400) }

        let lab = await db.query('SELECT imagen, nombre, id FROM laboratorios WHERE id = ?', [service[0].tipo])
        if(lab.length === 0){ return res.sendStatus(400) }

        let reviews = await db.query('SELECT texto, nombre, apellido, estrellas, reviews.id FROM reviews INNER JOIN clientes ON reviews.servicio = ? WHERE aprobado = 1', [lab[0].id])

        res.json({ info: {...service[0], imagen: lab[0].imagen, laboratorio: lab[0].nombre}, reviews })
            
    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const postReview = async (req, res) => {
    try{
        const { id } = req.params
        const review = req.body

        if(!id && !review.review && review.review === "" && !review.stars && !review.user){ return res.sendStatus(400) }

        await db.query('INSERT INTO reviews (texto, servicio, cliente, estrellas) VALUES (?,?,?,?)', [review.review, id, review.user, review.stars])

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