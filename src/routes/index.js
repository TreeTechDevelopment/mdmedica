const express = require('express')
const app = express()

const routesClient = require('./client')
const routesDoctor = require('./doctors')
const routesLabs = require('./labs')

app.use(routesClient)
app.use(routesDoctor)
app.use(routesLabs)

module.exports = app;