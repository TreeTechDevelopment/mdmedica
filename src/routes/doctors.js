const express = require('express');

const router = express.Router();

const { getAllMedicos, getMedico } = require('../controllers/doctors')

router.get('/all-medicos', getAllMedicos)
router.get('/medico/:id', getMedico)

module.exports = router;