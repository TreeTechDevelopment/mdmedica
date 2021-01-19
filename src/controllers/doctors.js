const db = require('../db/db')

const { validToken } = require('../helpers/jwt')

const getAllMedicos = async (req, res) => {
    try{
        let doctors = await db.query('SELECT * FROM medicos')

        res.json({ doctors })
    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const getMedico = async (req, res) => {
    try{
        
        if(JSON.stringify(req.query) === "{}" && !req.query.reviews){ return res.sendStatus(400) }

        const getReviews = req.query.reviews
        const { id } = req.params
        if(!id){ return res.sendStatus(400) }

        let doctor = await db.query('SELECT * FROM medicos WHERE id = ?', [id])
        if(doctor.length === 0){ return res.sendStatus(400) }

        let response = { info: doctor[0] }

        if(getReviews === "true"){
            let reviews = await db.query('SELECT texto, nombre, estrellas, reviews.id FROM reviews INNER JOIN clientes ON reviews.cliente = clientes.id WHERE reviews.medico = ? AND aprobado = 1', [id])
            response.reviews = reviews
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
        const review = req.body

        if(!id && !review.review && review.review === "" && !review.stars && !review.user){ return res.sendStatus(400) }

        await db.query('INSERT INTO reviews (texto, medico, cliente, estrellas) VALUES (?,?,?,?)', [review.review, id, review.user, review.stars])

        res.sendStatus(200)
            
    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

module.exports={
    getAllMedicos,
    getMedico,
    postReview
}