const nodemailer = require("nodemailer");
const hbs = require('nodemailer-express-handlebars');
const path = require('path')
const fs = require('fs')

const { createJWTEmailConfirmation } = require('./jwt')

const transporter = nodemailer.createTransport({
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
});

transporter.use('compile', hbs({
  viewEngine: {
    extName: ".handlebars",
    partialsDir: path.resolve(__dirname, '../templates/'),
    defaultLayout: false,
  },
  viewPath: path.resolve(__dirname, '../templates/')
}));

const sendEmailConfirmation = async (user) => {

    const token = createJWTEmailConfirmation({ id: user.id })

    const context = {
      title: 'CONFIRMACIÓN DE CORREO',
      text: 'Da click aquí para confirmar tu correo',
      name: user.name, 
      token,
      path: 'registro'
    }
  
    await transporter.sendMail({
      from: {
        name: 'MD MEDICA',
        address: 'contacto@treetechdevelopment.com'
      }, 
      to: user.email, 
      subject: "Verificación de Email", 
      template: 'email',
      context,
      text: `Hola, ${context.name}. \nBienvenido a MD Médica \nPara completar la verificación accede a https://mdmedica.herokuapp.com/registro?token=${context.token}`
    });
}

const sendEmailForgotPassword = async (user) => {

  const token = createJWTEmailConfirmation({ id: user.id })

  const context = {
    title: 'RECUPERAR CONTRASEÑA',
    text: 'Da click aquí para cambiar tu contraseña',
    name: user.name, 
    token,
    path: 'recuperar'
  }

  await transporter.sendMail({
    from: {
      name: 'MD MEDICA',
      address: 'contacto@treetechdevelopment.com'
    }, 
    to: user.email, 
    subject: "Cambiar Contraseña", 
    template: 'email',
    context,
    text: `Hola, ${context.name}. \n Bienvenido a MD Médica \n Para cambiar tu contraseña accede a https://mdmedica.herokuapp.com/recuperar?token=${context.token}`
  });
}
  
module.exports ={
  sendEmailConfirmation,
  sendEmailForgotPassword
}