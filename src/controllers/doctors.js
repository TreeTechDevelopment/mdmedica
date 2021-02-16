const db = require('../db/db')

const { validToken } = require('../helpers/jwt')

const getAllMedicos = async (req, res) => {
    try{
        const { schedule } = req.query

        let schedules = []
        let doctors = await db.query('SELECT * FROM medicos WHERE activo = 1') 

        if(schedule){ schedules = await db.query('SELECT * FROM horarios INNER JOIN medicos ON medicos.id = horarios.medico WHERE medicos.tipo != ?', ['QUIMICO']) }

        res.json({ doctors, schedule: schedules })
    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const getMedico = async (req, res) => {
    try{
        
        if(JSON.stringify(req.query) === "{}" && !req.query.reviews){ return res.sendStatus(400) }

        const getReviews = req.query.reviews
        const getSchedule = req.query.schedule
        const { id } = req.params
        if(!id){ return res.sendStatus(400) }

        let doctor = await db.query('SELECT * FROM medicos WHERE id = ? AND activo = 1', [id])
        if(doctor.length === 0){ return res.sendStatus(400) }

        let response = { info: doctor[0] }

        if(getReviews === "true"){
            let reviews = await db.query('SELECT texto, nombre, estrellas, reviews.id FROM reviews INNER JOIN clientes ON reviews.cliente = clientes.id WHERE reviews.medico = ? AND aprobado = 1', [id])
            response.reviews = reviews
        }
        if(getSchedule === "true"){
            response.monday = await db.query('SELECT * FROM horarios WHERE medico = ? AND dia = 1', [id])
            response.tuesday = await db.query('SELECT * FROM horarios WHERE medico = ? AND dia = 2', [id])
            response.wednesday = await db.query('SELECT * FROM horarios WHERE medico = ? AND dia = 3', [id])
            response.thursday = await db.query('SELECT * FROM horarios WHERE medico = ? AND dia = 4', [id])
            response.friday = await db.query('SELECT * FROM horarios WHERE medico = ? AND dia = 5', [id])
            response.saturday = await db.query('SELECT * FROM horarios WHERE medico = ? AND dia = 6', [id])
            response.sunday = await db.query('SELECT * FROM horarios WHERE medico = ? AND dia = 0', [id])
        }
        
        res.json(response)
            
    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

const postReview = async (req, res) => {
    try{
        const { token } = req
        const { id } = req.params
        const review = req.body

        const { err, id: user } = await validToken(token)

        if(err){ return res.sendStatus(401) }

        if(isNaN(Number(id)) || !review.stars){ return res.sendStatus(400) }

        const userDB = await db.query('SELECT id FROM clientes WHERE id = ?', [user])

        if(userDB.length === 0){ return res.sendStatus(400) }

        await db.query('INSERT INTO reviews (texto, medico, cliente, estrellas) VALUES (?,?,?,?)', [review.review, id, user, review.stars])

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