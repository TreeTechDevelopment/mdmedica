const express = require('express');
const multer = require('multer');

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

const router = express.Router();

const { createUser, verifyUser, login, forgotPassword, validUserToken, changePassword, getUser, editUser, logout, handleClient, getInfo } = require('../controllers/client')
const { cookiesAuthMiddleware } = require('../helpers/auth')

router.get('/', handleClient)
router.get('/medicos', handleClient)
router.get('/servicios', handleClient)
router.get('/medicos/:id', handleClient)
router.get('/laboratorios', handleClient)
router.get('/laboratorios/:id', handleClient) 
router.get('/cita', handleClient)
router.get('/cita/pago', handleClient)
router.get('/registro', handleClient)
router.get('/usuario', handleClient)
router.get('/recuperar', handleClient)
router.get('/admin', handleClient)
router.get('/admin/resenas', handleClient)
router.get('/admin/password', handleClient)
router.get('/admin/usuarios', handleClient)
router.get('/admin/usuarios/:id', handleClient)
router.get('/admin/login', handleClient)
router.get('/admin/medico', handleClient)
router.get('/admin/medico/horario', handleClient)
router.get('/admin/medico/editar', handleClient)
router.get('/admin/medico/pacientes', handleClient)
router.get('/admin/medico/pacientes/:id', handleClient)
router.get('/admin/medico/aprobar', handleClient)
router.get('/admin/medico/cita/:id', handleClient)
router.get('/admin/lab', handleClient)
router.get('/admin/lab/horario', handleClient)
router.get('/admin/lab/editar', handleClient)
router.get('/admin/lab/pacientes', handleClient)
router.get('/admin/lab/pacientes/:id', handleClient)
router.get('/admin/lab/aprobar', handleClient)
router.get('/admin/lab/cita/:id', handleClient)
router.get('/admin/asistente', handleClient)
router.get('/admin/asistente/horario', handleClient)
router.get('/admin/asistente/editar', handleClient)
router.get('/admin/asistente/pacientes', handleClient)
router.get('/admin/asistente/pacientes/:id', handleClient)
router.get('/admin/asistente/aprobar', handleClient)
router.get('/admin/asistente/cita/:id', handleClient) 

router.get('/info', getInfo)
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