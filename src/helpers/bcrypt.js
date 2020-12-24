const bcrypt = require('bcrypt')

const hashPassword = password => {
    const res = bcrypt.hashSync(password, 10);
    return res
}

const comparePassword = (password, passwordDB) => {
    return bcrypt.compareSync(password,passwordDB )
}

module.exports = {
    hashPassword,
    comparePassword
}