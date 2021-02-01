const db = require('../db/db')

const checkDateHour = async (date, doctor, labs) => {
    const newDate = new Date(date)
    let okDate = false
    let message = ''
    if(doctor){
        const schedule = await db.query('SELECT inicio, final FROM horarios WHERE medico = ? AND dia = ?', [doctor.id, newDate.getDay()])
        okDate = dateInPeriod(schedule, newDate)
        message = 'La hora seleccionada no está dentro del horario de atención de este médico.'
    }else{
        for(let i = 0; i < labs.length; i++){
            const schedule = await db.query('SELECT inicio, final FROM horarios INNER JOIN laboratorios ON horarios.laboratorio = laboratorios.id INNER JOIN servicios ON laboratorios.id = servicios.tipo WHERE servicios.id = ? AND dia = ?', [labs[i].id, newDate.getDay()])
            okDate = dateInPeriod(schedule, newDate)
        }
        message = 'La hora seleccionada no está dentro del horario de atención de este servicio.'
    }
    return { okDateHour: okDate, message }
}

const dateInPeriod = (schedule, date) => {
    let okDate = false
    for(const period of schedule){
        const hourStart = Number(period.inicio.split(':')[0])
        const minuteStart = Number(period.inicio.split(':')[1])
        const hourEnd = Number(period.final.split(':')[0])
        const minuteEnd = Number(period.final.split(':')[1])

        const dateHours = date.getHours()
        const dateMinuttes = date.getMinutes()

        if(!((dateHours === hourEnd && dateMinuttes === minuteEnd) || dateHours > hourEnd || (dateHours === hourEnd && dateMinuttes > minuteEnd) ||
        (dateHours === hourStart && dateMinuttes < minuteStart) || dateHours < hourStart)){ okDate = true }
    }
    return okDate
}

const checkDateNoDuplicate = async (date, doctor, labs) => {
    let okDate = true
    if(doctor){
        const dateDB = await db.query('SELECT servicioCitas.id FROM servicioCitas INNER JOIN citas ON servicioCitas.cita = citas.id WHERE citas.fecha = ? AND medico = ?', [new Date(date).toLocaleString(), doctor.id])
        if(dateDB.length !== 0){ okDate = false }
    }else{
        for(let i = 0; i < labs.length; i++){
            const dateDB = await db.query('SELECT servicioCitas.id FROM servicioCitas INNER JOIN citas ON servicioCitas.cita = citas.id WHERE citas.fecha = ? AND servicio = ?', [new Date(date).toLocaleString(), labs[i].id])
            if(dateDB.length !== 0){ okDate = false }
        }
    }
    return okDate
}

const getQuery = (date, age, name, illness, phone, email, type, address, clientID, homeService) => {
    let query = [{ row: 'fecha', value: new Date(date).toLocaleString() },{ row: 'edad', value: age },{ row: 'nombre', value: name },{ row: 'padecimiento', value: illness },
    { row: 'telefono', value: phone },{ row: 'email', value: email },{ row: 'tipo', value: type === "medico" ? false : true }]

    if(homeService === true){ query.push({ row: 'direccion', value: address }) }
    if(clientID){ query.push({ row: 'cliente', value: clientID }) }

    return query
}

const checkDateTime = (date) => {
    let newDate = new Date(date)
    let actualDate = new Date()

    if((newDate - actualDate) / (1000 * 60 * 60) < 24 ){ return false }

    return true

}

module.exports= {
    checkDateHour,
    checkDateNoDuplicate,
    getQuery,
    checkDateTime
}