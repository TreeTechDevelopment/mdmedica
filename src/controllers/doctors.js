const db = require('../db/db')

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
        const { id } = req.params
        if(!id){ return res.sendStatus(400) }

        let doctor = await db.query('SELECT * FROM medicos WHERE id = ?', [id])
        if(doctor.length === 0){ return res.sendStatus(400) }

        let reviews = await db.query('SELECT texto, nombre, apellido, estrellas, reviews.id FROM reviews INNER JOIN clientes ON reviews.medico = ?', [id])

        res.json({ doctor: doctor[0], reviews })
            
    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

module.exports={
    getAllMedicos,
    getMedico
}