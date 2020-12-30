const express = require('express');

const router = express.Router();

const { login, validUserToken } = require('../controllers/user')
const { cookiesAuthMiddleware } = require('../helpers/auth')

router.get('/admin/valid', cookiesAuthMiddleware, validUserToken)

router.post('/admin/login', login)

module.exports = router;