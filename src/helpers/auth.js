const cookiesAuthMiddleware = (req, res, next) => {
    if(!req.cookies.payload || !req.cookies.signature){ return res.sendStatus(401) }

    req.token = req.cookies.payload + '.' + req.cookies.signature
    next()
}

module.exports = {
    cookiesAuthMiddleware
}