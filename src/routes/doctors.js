const express = require('express');

const router = express.Router();

const { getAllMedicos, getMedico, postReview } = require('../controllers/doctors')

router.get('/all-medicos', getAllMedicos)
router.get('/medico/:id', getMedico)

router.post('/medico/:id', postReview)

module.exports = router;