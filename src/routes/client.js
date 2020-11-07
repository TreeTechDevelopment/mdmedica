const express = require('express');

const router = express.Router();

const { handleClient } = require('../controllers/client')

router.get('/', handleClient)
router.get('/medicos', handleClient)
router.get('/laboratorios', handleClient)

module.exports = router;