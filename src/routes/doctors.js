const express = require('express');

const router = express.Router();

const { getAllMedicos } = require('../controllers/doctors')

router.get('/all-medicos', getAllMedicos)

module.exports = router;