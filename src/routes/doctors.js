const express = require('express');

const router = express.Router();

const { getAllMedicos, getMedico, postReview } = require('../controllers/doctors')
const { cookiesAuthMiddleware } = require('../helpers/auth') 

router.get('/all-medicos', getAllMedicos)
router.get('/medico/:id', getMedico)

router.post('/medico/:id', cookiesAuthMiddleware, postReview)

module.exports = router;