const db = require('../db/db')

const { twoDigits } = require('./common')

const setScheduleDay = async (dayArray, day, medico, laboratorio) => {
    for(const period of dayArray){
        const newDateStart = new Date(period.start)
        const newDateEnd = new Date(period.end)

        const startHour = `${twoDigits(newDateStart.getHours())}:${twoDigits(newDateStart.getMinutes())}`
        const endHour = `${twoDigits(newDateEnd.getHours())}:${twoDigits(newDateEnd.getMinutes())}`

        if(medico){
            await db.query('INSERT INTO horarios (medico, dia, inicio, final) VALUES (?, ?, ?, ?)', [medico, day, startHour, endHour])
        }else{
            await db.query('INSERT INTO horarios (laboratorio, dia, inicio, final) VALUES (?, ?, ?, ?)', [laboratorio, day, startHour, endHour])
        }
    }
}

module.exports= {
    setScheduleDay
}