const db = require('../db/db')

const postDate = async (req, res) => {
    try{
        const { date, type, name, age, illness, phone, email, address, 
            homeService, doctor, labs, clientID } = req.body 
        
        console.log(req.body)

        if(!name || !date || !age || !illness || !phone || !email || typeof (homeService) === "undefined"|| (type !== "medico" && type !== "laboratorio") ||
        (type === "medico" && !doctor) || (type === "laboratorio" && !labs && labs.length === 0) || (homeService && !address)){
            return res.sendStatus(400)
        }

        let query = [{ row: 'fecha', value: new Date(date).toLocaleString() },{ row: 'edad', value: age },{ row: 'nombre', value: name },{ row: 'padecimiento', value: illness },
                    { row: 'telefono', value: phone },{ row: 'email', value: email },{ row: 'tipo', value: type === "medico" ? false : true }]
        
        if(homeService === true){ query.push({ row: 'direccion', value: address }) }
        if(clientID){ query.push({ row: 'cliente', value: clientID }) }

        const resDB = await db.query(`INSERT INTO citas (${query.map( item => item.row ).join(',')}) VALUES (${query.map( item => '?').join(',')})`, query.map( item => item.value))
        
        if(type === "medico"){
            await db.query('INSERT INTO servicioCitas (medico, cita) VALUES (?,?)', [doctor, resDB.insertId])
        }else{
            labs.forEach( async (lab) => {
                await db.query('INSERT INTO servicioCitas (servicio, cita) VALUES (?,?)', [lab, resDB.insertId])
            })
        }

        res.sendStatus(200)

    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
}

module.exports={
    postDate
}