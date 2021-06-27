const excelToJson = require('convert-excel-to-json');
const path = require('path');
const db = require('../db/db')

const result = excelToJson({
    sourceFile: path.join(__dirname, 'Servicios.xlsx')
});

const saveLabInDb = async (labName) => {
    const lab = db.query('SELECT * FROM laboratorios WHERE nombre = ?', [labName])
    if(lab.length !== 0){
        const labDb = await db.query('INSERT INTO laboratorios (nombre, descripcion, imagen) VALUES (?,?,?)', [labName, '', ''])
        return labDb.insertId
    }
    return lab[0].id
}

const saveServicioInDb = async (servicio) => {
    const serv = db.query('SELECT * FROM servicios WHERE nombre = ?', [servicio.nombre])
    if(serv.length !== 0){
        await db.query('INSERT INTO servicios (nombre, descripcion, precio, precioDomicilio, tipo) VALUES (?,?,?,?,?)', [servicio,nombre, '', servicio.precio, servicio.precio, servicio.tipo])
        return;
    }
    await db.query('UPDATE servicios SET precio = ?, precioDomicilio = ? WHERE nombre = ?', [servicio.precio, servicio.precio, servicio.nombre])
}


async function main(){

    let labId;

    for(const row of result.Hoja1){
        if(row.A) labId = await saveLabInDb(row.A)
        if(row.B){
            if(!labId) throw new Error('labId is undefined');
            await saveServicioInDb({ nombre: row.B, tipo: labId, precio: row.C })
        }
    }
}

module.exports = main
