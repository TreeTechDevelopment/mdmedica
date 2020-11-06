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

module.exports={
    getAllMedicos
}