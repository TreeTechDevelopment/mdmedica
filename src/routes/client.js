const express = require('express');

const router = express.Router();

const { handleClient } = require('../controllers/client')

router.get('/', handleClient)
router.get('/medicos', handleClient)
router.get('/medicos/:id', handleClient)
router.get('/laboratorios', handleClient)
router.get('/laboratorios/:id', handleClient)
router.get('/cita', handleClient)

module.exports = router;