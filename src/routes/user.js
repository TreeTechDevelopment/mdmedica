const express = require('express');
const multer = require('multer');

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

const router = express.Router();

const { createUser, verifyUser, login, forgotPassword, validUserToken, changePassword, getUser, editUser, logout } = require('../controllers/user')
const { cookiesAuthMiddleware } = require('../helpers/auth')

router.get('/user', cookiesAuthMiddleware, getUser)
router.get('/user/verify', verifyUser)
router.get('/user/valid', validUserToken)
router.get('/user/logout', logout)

router.post('/user', createUser)
router.post('/user/password', forgotPassword)
router.post('/login', login)

router.put('/user/password', changePassword)
router.put('/user/:id', cookiesAuthMiddleware, upload.single('image'), editUser)

module.exports = router;