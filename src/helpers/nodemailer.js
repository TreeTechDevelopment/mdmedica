const nodemailer = require("nodemailer");
const { createJWTEmailConfirmation } = require('./jwt')

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_SERVER_NAME,
    port: 465,
    secure: true, 
    auth: {
      user: process.env.SMTP_USER, 
      pass: process.env.SMTP_PASSWORD, 
    }
});

const sendEmailConfirmation = async (user) => {

    const token = createJWTEmailConfirmation({ id: user.id })
  
    let info = await transporter.sendMail({
      from: 'contacto@treetechdevelopment.com', 
      to: user.email, 
      subject: "Verificación de Email", 
      html: `<a href="https://mdmedica.herokuapp.com/registro?token=${token}">VERIFICAR CUENTA</a>`, 
    });
  
    console.log(info);
}

const sendEmailForgotPassword = async (user) => {

  const token = createJWTEmailConfirmation({ id: user.id })

  let info = await transporter.sendMail({
    from: 'contacto@treetechdevelopment.com', 
    to: user.email, 
    subject: "Cambiar Contraseña", 
    html: `<a href="https://mdmedica.herokuapp.com/recuperar?token=${token}">CAMBIAR CONTRASEÑA</a>`, 
  });

  console.log(info);
}
  
module.exports ={
  sendEmailConfirmation,
  sendEmailForgotPassword
}