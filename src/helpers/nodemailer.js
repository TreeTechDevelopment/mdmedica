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
    }
  
    await transporter.sendMail({
      from: {
        name: 'MD MEDICA',
        address: 'contacto@treetechdevelopment.com'
      }, 
      to: user.email, 
      subject: "Verificación de Email", 
      template: 'confirmation',
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
  }

  await transporter.sendMail({
    from: {
      name: 'MD MEDICA',
      address: 'contacto@treetechdevelopment.com'
    }, 
    to: user.email, 
    subject: "Cambiar Contraseña", 
    template: 'password',
    context,
    text: `Hola, ${context.name}. \nPara cambiar tu contraseña accede a https://mdmedica.herokuapp.com/recuperar?token=${context.token}`
  });
}

const sendEmailDate = async (data, exp) => {

  const token = createJWTEmailConfirmation({ cita: data.dateID, tipo: data.type }, exp)

  const context = {
    title: 'AGENDAR CITA',
    name: data.name,
    date: data.date,
    text: data.text,
    token
  }

  await transporter.sendMail({
    from: {
      name: 'MD MEDICA',
      address: 'contacto@treetechdevelopment.com'
    }, 
    to: data.email, 
    subject: "Cita", 
    template: 'date',
    context,
    text: `Hola, ${context.name}. \nSe ha agendado una cita para el ${ context.date }, ${ context.text }. \nEspera el correo de confirmación de la cita.`
  });
}

const sendEmailStatusDate = async (data) => {

  const context = {
    title: 'CITA',
    name: data.name,
    text: data.text
  }

  await transporter.sendMail({
    from: {
      name: 'MD MEDICA',
      address: 'contacto@treetechdevelopment.com'
    }, 
    to: data.email, 
    subject: "Cita", 
    template: 'dateConfirmation',
    context,
    text: `Hola, ${context.name}. \n${context.text}`
  });
}

const sendEmailNewUser = async (data) => {

  const token = createJWTEmailConfirmation({ id: data.id, email: data.email })

  const context = {
    title: 'USUARIO',
    token
  }

  await transporter.sendMail({
    from: {
      name: 'MD MEDICA',
      address: 'contacto@treetechdevelopment.com'
    }, 
    to: data.email, 
    subject: "Confirmación", 
    template: 'user',
    context,
    text: `Bienvenido a MD MÉDICA. \nPara ingresar a tu cuenta debes crear una contraseña accediendo al siguiente enlace. \nhttps://mdmedica.herokuapp.com/admin/password?token=${token}`
  });
}
  
module.exports ={
  sendEmailConfirmation,
  sendEmailForgotPassword,
  sendEmailDate,
  sendEmailStatusDate,
  sendEmailNewUser
}