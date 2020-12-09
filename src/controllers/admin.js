
const db = require('../db/db')

const getInfo = async (req, res) => {
    try{
        if(JSON.stringify(req.query) === "{}"){ return res.sendStatus(400) }

        const { disccountInfo } = req.query

        if(disccountInfo === "true"){
            let text = await db.query('SELECT * FROM textos WHERE id = 1')
            return res.json({ ...text[0] })
        }

        return res.sendStatus(400)
            
    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

module.exports={
    getInfo
}