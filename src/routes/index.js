const express = require('express')
const app = express()

const routesClient = require('./client')
const routesDoctor = require('./doctors')
const routesLabs = require('./labs')
const routesAdmin = require('./admin')
const routesDate = require('./date')
const routesUser = require('./user')

app.use(routesClient)
app.use(routesDoctor)
app.use(routesLabs)
app.use(routesAdmin)
app.use(routesDate)
app.use(routesUser)

module.exports = app;