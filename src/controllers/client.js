
const path = require('path')

const handleClient = (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../build/index.html'))
}

module.exports={
    handleClient
}