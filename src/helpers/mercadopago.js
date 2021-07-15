const mercadopago = require('mercadopago');

mercadopago.configure({
    access_token: 'APP_USR-1188434953654106-011920-b0e1179ce63d10b9742ba252a8dd5e73-235075426'
});

const createPreferencID = (date, dateType, token) => {

    console.log(date)

    let preference = {
        items: [],
        back_urls:{
            success: `https://mdmedica.xyz/cita/pago?dateID=${date[0].id}&status=success&token=${token}`
        },
        payer:{
            name: date[0].nombre,
            email: date[0].email
        }
    };

    date.forEach( dateItem => {
        let item = {}
        if(dateType === "medico"){
            item.title = `Cita con el ${dateItem.cargo} ${dateItem.mednombre}`
            item.unit_price = dateItem.precio
            item.quantity = 1
        }else{
            item.title = `Cita para el laboratiorio ${dateItem.servnombre}`
            item.unit_price = dateItem.precio
            item.quantity = 1
        }

        preference.items.push(item)
    })

    if(date.some(dateItem => !!dateItem.direccion)){
        preference.items.push({
            title: 'Servicio a domicilio',
            unit_price: 100,
            quantity: 1
        })
    }

    return new Promise((resolve, reject) => {
        mercadopago.preferences.create(preference)
        .then(function(response){
            resolve(response.body.id)
        }).catch(function(error){
            reject(error)
        });
    })
}

const getTotal =  (dateItems) => {

    let total = 0

    for(const dateItem of dateItems){
        total += dateItem.precio
    }

    if(dateItems.some(dateItem => !!dateItem.direccion)) total += 100

    return total
}

module.exports = {
    createPreferencID,
    getTotal
}