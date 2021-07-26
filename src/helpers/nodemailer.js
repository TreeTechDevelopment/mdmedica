const nodemailer = require("nodemailer");
const hbs = require('nodemailer-express-handlebars');
const path = require('path')

const { createJWTEmailConfirmation } = require('./jwt')

const smtpEndpoint = "smtp.office365.com";
const port = 587;

console.log(process.env.OUTLOOK_EMAIL)

const transporter = nodemailer.createTransport({
  host: smtpEndpoint,
  secure: false, // true for 465, false for other ports
  port,
  tls: {ciphers: 'SSLv3'},
  auth: {
    user: process.env.OUTLOOK_EMAIL,
    pass: process.env.OUTLOOK_PASS
  }
});

/* const transporter = nodemailer.createTransport({
    host: process.env.SMTP_SERVER_NAME,
    port: 465,
    secure: true, 
    auth: {
      user: process.env.SMTP_USER, 
      pass: process.env.SMTP_PASSWORD, 
    },
    tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
    },
    dkim: {
      domainName: process.env.DKIM_DOMAIN,
      keySelector: process.env.DKIM_SELECTOR,
      //privateKey: fs.readFileSync(path.resolve(__dirname, '../certificates/dkim_private.pem'))
      privateKey: `-----BEGIN RSA PRIVATE KEY-----\n${process.env.DKIM_PRIVATE}\n-----END RSA PRIVATE KEY-----`
    }
}); */

transporter.verify((e, success) => {
  if(e) return console.log(e);
  console.log("SERVER IS READY FOR SENDING EMAILS")

})

transporter.use('compile', hbs({
  viewEngine: {
    extName: ".handlebars",
    partialsDir: path.resolve(__dirname, '../templates/'),
    defaultLayout: false,
  },
  viewPath: path.resolve(__dirname, '../templates/')
}));


const sendEmailConfirmation = async (user) => {
    let sent = false
    let tries = 0
    do{
        try{
          const token = createJWTEmailConfirmation({ id: user.id })

          const context = {
            title: 'CONFIRMACIÓN DE CORREO',
            text: 'Da click en el siguiente botón para confirmar tu correo',
            name: user.name, 
            token,
          }

          await transporter.sendMail({
            from: {
              name: 'MD MEDICA',
              address: process.env.OUTLOOK_EMAIL
            }, 
            to: user.email, 
            subject: "Verificación de Email", 
            template: 'confirmation',
            context,
            text: `Hola, ${context.name}. \nBienvenido a MD Médica \nPara completar la verificación accede a https://mdmedica.xyz/registro?token=${context.token}`
          });
          sent = true
        }catch(e){
            console.log(e)
            await new Promise((resolve) => setTimeout(resolve, 2000));
            tries++
        }
    }while(!sent && tries < 3)

    
}

const sendEmailForgotPassword = async (user) => {

  let sent = false
  let tries = 0
  do{
      try{
          const token = createJWTEmailConfirmation({ id: user.id })

          const context = {
            title: 'RECUPERAR CONTRASEÑA',
            text: 'Da click en sl siguiente botón para cambiar tu contraseña',
            name: user.name, 
            token,
          }
        
          await transporter.sendMail({
            from: {
              name: 'MD MEDICA',
              address: process.env.OUTLOOK_EMAIL
            }, 
            to: user.email, 
            subject: "Cambiar Contraseña", 
            template: 'password',
            context,
            text: `Hola, ${context.name}. \nPara cambiar tu contraseña accede a https://mdmedica.xyz/recuperar?token=${context.token}`
          });
          sent = true
      }catch(e){
          console.log(e)
          await new Promise((resolve) => setTimeout(resolve, 2000));
          tries++
      }
  }while(!sent && tries < 3)
}

const sendEmailDate = async (data) => {

  let sent = false
  let tries = 0
  do{
      try{
          const context = {
            title: 'AGENDAR CITA',
            name: data.name,
            date: data.date,
            text: data.text,
          }
        
          await transporter.sendMail({
            from: {
              name: 'MD MEDICA',
              address: process.env.OUTLOOK_EMAIL
            }, 
            to: data.email, 
            subject: "Cita", 
            template: 'date',
            context,
            text: `Hola, ${context.name}. \nSe ha agendado una cita para el ${ context.date }, ${ context.text }. \nEspera el correo de confirmación de la cita.`
          });
          sent = true
      }catch(e){
          console.log(e)
          await new Promise((resolve) => setTimeout(resolve, 2000));
          tries++
      }
  }while(!sent && tries < 3)

  
}

const sendEmailStatusDate = async (data, exp) => {

  let sent = false
  let tries = 0
  do{
      try{
          const token = createJWTEmailConfirmation({ cita: data.dateID, tipo: data.type }, exp)
          const context = {
            title: 'CITA',
            name: data.name,
            text: data.text,
              token
          }
        
          await transporter.sendMail({
            from: {
              name: 'MD MEDICA',
              address: process.env.OUTLOOK_EMAIL
            }, 
            to: data.email, 
            subject: "Cita", 
            template: 'dateConfirmation',
            context,
            text: `Hola, ${context.name}. \n${context.text}`
          });
          sent = true
      }catch(e){
          console.log(e)
          await new Promise((resolve) => setTimeout(resolve, 2000));
          tries++
      }
  }while(!sent && tries < 3)

}

const sendEmailStatusDateRejected = async (data, exp) => {

    let sent = false
    let tries = 0
    do{
        try{
            const context = {
                title: 'CITA',
                name: data.name,
                text: data.text,
            }

            await transporter.sendMail({
                from: {
                    name: 'MD MEDICA',
                    address: process.env.OUTLOOK_EMAIL
                },
                to: data.email,
                subject: "Cita",
                template: 'dateReject',
                context,
                text: `Hola, ${context.name}. \n${context.text}`
            });
            sent = true
        }catch(e){
            console.log(e)
            await new Promise((resolve) => setTimeout(resolve, 2000));
            tries++
        }
    }while(!sent && tries < 3)

}

const sendEmailNewUser = async (data) => {

  let sent = false
  let tries = 0
  do{
      try{
          const token = createJWTEmailConfirmation({ id: data.id, email: data.email })

          const context = {
            title: 'USUARIO',
            token
          }
        
          await transporter.sendMail({
            from: {
              name: 'MD MEDICA',
              address: process.env.OUTLOOK_EMAIL
            }, 
            to: data.email, 
            subject: "Confirmación", 
            template: 'user',
            context,
            text: `Bienvenido a MD MÉDICA. \nPara ingresar a tu cuenta debes crear una contraseña accediendo al siguiente enlace. \nhttps://mdmedica.xyz/admin/password?token=${token}`
          });
          //sendEmail(data.email, "Confirmación")
          sent = true
      }catch(e){
          console.log(e)
          await new Promise((resolve) => setTimeout(resolve, 2000));
          tries++
      }
  }while(!sent && tries < 3)

  
}

const sendEmailReminder = async (data) => {

  let sent = false
  let tries = 0
  do{
      try{
          const context = {
            title: 'RECORDATORIO',
            name: data.name,
            date: data.date,
            text: data.text
          }
        
          await transporter.sendMail({
            from: {
              name: 'MD MEDICA',
              address: process.env.OUTLOOK_EMAIL
            }, 
            to: data.email, 
            subject: "Recordatorio", 
            template: 'reminder',
            context,
            text: `Hola, ${ context.name } \nRecuerda que tienes una cita ${ context.text }, para el ${ context.date }.`
          });
          sent = true
      }catch(e){
          console.log(e)
          await new Promise((resolve) => setTimeout(resolve, 2000));
          tries++
      }
  }while(!sent && tries < 3)

  
}
  
module.exports ={
  sendEmailConfirmation,
  sendEmailForgotPassword,
  sendEmailDate,
  sendEmailStatusDate,
  sendEmailNewUser,
  sendEmailReminder,
    sendEmailStatusDateRejected
}