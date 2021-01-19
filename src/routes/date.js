const express = require('express');

const router = express.Router();

const { postDate, getDate, getDatesHistory, getDatesFilter, getDatesPatients, aproveDate, postRecipe } = require('../controllers/date')
const { cookiesAuthMiddleware } = require('../helpers/auth') 

router.get('/cita/history', cookiesAuthMiddleware, getDatesHistory)
router.get('/cita/patients', cookiesAuthMiddleware, getDatesPatients)
router.get('/cita/filter', cookiesAuthMiddleware, getDatesFilter)
router.get('/cita/:id', cookiesAuthMiddleware, getDate)

router.post('/cita', postDate)
router.post('/cita/recipe', cookiesAuthMiddleware, postRecipe)

router.put('/cita/status/:id', cookiesAuthMiddleware, aproveDate)

module.exports = router;