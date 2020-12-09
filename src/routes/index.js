const express = require('express')
const app = express()

const routesClient = require('./client')
const routesDoctor = require('./doctors')
const routesLabs = require('./labs')
const routesAdmin = require('./admin')

app.use(routesClient)
app.use(routesDoctor)
app.use(routesLabs)
app.use(routesAdmin)

module.exports = app;