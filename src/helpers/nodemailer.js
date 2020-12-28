const nodemailer = require("nodemailer");
const hbs = require('nodemailer-express-handlebars');
const path = require('path')

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
        name: 'MD MÉDICA',
        address: 'contacto@treetechdevelopment.com'
      }, 
      to: user.email, 
      subject: "Verificación de Email", 
      subject: "Cambiar Contraseña", 
      template: 'email',
      context
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
      name: 'MD MÉDICA',
      address: 'contacto@treetechdevelopment.com'
    }, 
    to: user.email, 
    subject: "Cambiar Contraseña", 
    template: 'email',
    context
  });
}
  
module.exports ={
  sendEmailConfirmation,
  sendEmailForgotPassword
}