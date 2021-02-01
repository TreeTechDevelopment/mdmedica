const mercadopago = require('mercadopago');

mercadopago.configure({
    access_token: 'TEST-6627389014499609-012221-6e81b878d97f402a989986042136904c-705396309'
});

const createPreferencID = (date, dateType, token) => {

    let preference = {
        items: [],
        back_urls:{
            success: `http://localhost:3000/cita/pago?dateID=${date[0].id}&status=success&token=${token}`
        },
        payer:{
            name: date[0].nombre,
            email: date[0].email
        }
    };

    date.forEach( dateItem => {
        let item = {}
        
        if(dateType === "medico"){
            if(dateItem.direccion){ 
                item.title = `Cita a domicilio con el ${dateItem.cargo} ${dateItem.mednombre}`
                item.unit_price = dateItem.precioDomicilio
            }
            else{ 
                item.title = `Cita con el ${dateItem.cargo} ${dateItem.mednombre}` 
                item.unit_price = dateItem.precio
            }
            item.quantity = 1
        }else{
            if(dateItem.direccion){ 
                item.title = `Cita a domicilio para el laboratiorio ${dateItem.servnombre}` 
                item.unit_price = dateItem.precioDomicilio
            }
            else{ 
                item.title = `Cita para el laboratiorio ${dateItem.servnombre}` 
                item.unit_price = dateItem.precio
            }
            item.quantity = 1
        }

        preference.items.push(item)
    })

    return new Promise((resolve, reject) => {
        mercadopago.preferences.create(preference)
        .then(function(response){
            resolve(response.body.id)
        }).catch(function(error){
            reject(err)
        });
    })
}

module.exports = {
    createPreferencID
}