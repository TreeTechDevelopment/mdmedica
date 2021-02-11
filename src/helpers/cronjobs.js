const CronJob = require('cron').CronJob;
const db = require('../db/db')

const { sendEmailReminder } = require('./nodemailer')
const { twoDigits } = require('./common')

const cronJobReminder = async (query) => {
    const dates = await db.query(query)
    for(let i = 0; i < dates.length; i++){
        const newDate = new Date(dates[i].fecha)
        const date = `${twoDigits(newDate.getDay())}/${twoDigits(newDate.getMonth()+1)}/${newDate.getFullYear()} a las ${twoDigits(newDate.getHours())}:${twoDigits(newDate.getMinutes())}`
        let text = ''
        if(dates[i].tipo){
            const services = await db.query('SELECT nombre FROM servicioCitas INNER JOIN servicios ON servicioCitas.servicio = servicios.id WHERE servicioCitas.cita = ?', [dates[i].id])
            text = `para los laboratorios ${services.map(item => item.nombre).join(', ')}`
        }else{
            const doctor = await db.query('SELECT nombre, cargo, medicos.id FROM servicioCitas INNER JOIN medicos ON servicioCitas.medico = medicos.id WHERE servicioCitas.cita = ?', [dates[i].id])
            text = `con el ${doctor[0].cargo} ${doctor[0].nombre}`
            const assistant = await db.query('SELECT email FROM usuarios WHERE medico = ? AND tipo = ?', [doctor[0].id, 'ASISTENTE'])            
            sendEmailReminder({ name: dates[i].nombre, date, text, email: assistant[0].email })
        }
        sendEmailReminder({ name: dates[i].nombre, date, text, email: dates[i].email })
    }
}

const job = new CronJob('0 0 0 * * *', async () => {
    await db.query('DELETE FROM jwtBlockList WHERE fecha < now() - interval 1 day')
});

const rememberDate1Day = new CronJob('0 0 0 * * *', async () => { 
    await cronJobReminder('SELECT id, email, nombre, fecha, tipo FROM citas WHERE fecha > NOW() + INTERVAL 14 DAY AND fecha < NOW() + INTERVAL 15 DAY') 
    await cronJobReminder('SELECT id, email, nombre, fecha, tipo FROM citas WHERE fecha > NOW() + INTERVAL 6 DAY AND fecha < NOW() + INTERVAL 7 DAY') 
    await cronJobReminder('SELECT id, email, nombre, fecha, tipo FROM citas WHERE fecha > NOW() + INTERVAL 2 DAY AND fecha < NOW() + INTERVAL 3 DAY') 
    await cronJobReminder('SELECT id, email, nombre, fecha, tipo FROM citas WHERE fecha > NOW() + INTERVAL 1 DAY AND fecha < NOW() + INTERVAL 2 DAY') 
    console.log('done')
});

const rememberDate1Hour = new CronJob('0 0 * * * *', async () => { 
    await cronJobReminder('SELECT id, email, nombre, fecha, tipo FROM citas WHERE fecha = NOW() + INTERVAL 1 HOUR') 
});

job.start();
rememberDate1Day.start();
rememberDate1Hour.start();