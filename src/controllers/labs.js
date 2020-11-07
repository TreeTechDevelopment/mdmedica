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

module.exports={
    getAllLabs
}