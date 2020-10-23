const express = require('express')
const app = express()

const routersClient = require('./client')

app.use(routersClient)

module.exports = app;