const mysql = require('mysql')
const { promisify } = require('util')

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
})

pool.getConnection((err, connection) => {
    if(err){ return console.log(err) }

    connection.release()
    console.log('DATABASE CONNECTED')
})

pool.query = promisify(pool.query)

module.exports = pool