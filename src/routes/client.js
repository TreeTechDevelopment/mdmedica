const express = require('express');
const multer = require('multer');

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

const router = express.Router();

const { createUser, verifyUser, login, forgotPassword, validUserToken, changePassword, getUser, editUser, logout, handleClient } = require('../controllers/client')
const { cookiesAuthMiddleware } = require('../helpers/auth')

router.get('/', handleClient)
router.get('/medicos', handleClient)
router.get('/medicos/:id', handleClient)
router.get('/laboratorios', handleClient)
router.get('/laboratorios/:id', handleClient)
router.get('/cita', handleClient)
router.get('/registro', handleClient)
router.get('/usuario', handleClient)
router.get('/recuperar', handleClient)
router.get('/admin', handleClient)

router.get('/client', cookiesAuthMiddleware, getUser)
router.get('/client/verify', verifyUser)
router.get('/client/valid', validUserToken)
router.get('/client/logout', logout)

router.post('/client', createUser)
router.post('/client/password', forgotPassword)
router.post('/login', login)

router.put('/client/password', changePassword)
router.put('/client/:id', cookiesAuthMiddleware, upload.single('image'), editUser)

module.exports = router;