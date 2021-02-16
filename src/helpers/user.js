const db = require('../db/db')

const { twoDigits } = require('./common')

const setScheduleDay = async (dayArray, day, medico) => {
    for(const period of dayArray){
        const newDateStart = new Date(period.start)
        const newDateEnd = new Date(period.end)

        console.log("=======================")
        console.log(dayArray)
        console.log(period)
        console.log(newDateStart.toString())
        console.log(newDateEnd.toString())
        console.log("=======================")

        const startHour = `${twoDigits(newDateStart.getHours())}:${twoDigits(newDateStart.getMinutes())}`
        const endHour = `${twoDigits(newDateEnd.getHours())}:${twoDigits(newDateEnd.getMinutes())}`

        await db.query('INSERT INTO horarios (medico, dia, inicio, final) VALUES (?, ?, ?, ?)', [medico, day, startHour, endHour])
    }
}

module.exports= {
    setScheduleDay
}