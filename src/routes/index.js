const express = require('express')
const app = express()

const routesClient = require('./client')
const routesDoctor = require('./doctors')
const routesLabs = require('./labs')
const routesDate = require('./date')
const routesUser = require('./user')
const routesPayment = require('./payment')

app.use(routesClient)
app.use(routesDoctor)
app.use(routesLabs)
app.use(routesDate)
app.use(routesUser)
app.use(routesPayment)

module.exports = app;