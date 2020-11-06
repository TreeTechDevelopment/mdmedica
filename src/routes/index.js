const express = require('express')
const app = express()

const routesClient = require('./client')
const routesDoctor = require('./doctors')

app.use(routesClient)
app.use(routesDoctor)

module.exports = app;