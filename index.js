if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express')
const path = require('path')

const app = express()

const routes = require('./src/routes/index')

const PORT = process.env.PORT || 5000

app.use(express.static(path.resolve( __dirname, 'build' )))
app.use(routes)

app.listen(PORT, () => {
    console.log(`SERVER ON PORT ${PORT}`) 
})