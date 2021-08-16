const express = require('express');

const router = express.Router();

const { postDate, getDate, getDatesHistory, getDatesFilter, getDatesPatients, aproveDate, postRecipe, postResults, getServices, getParamsService } = require('../controllers/date')
const { cookiesAuthMiddleware } = require('../helpers/auth') 

router.get('/cita/history', cookiesAuthMiddleware, getDatesHistory)
router.get('/cita/patients', cookiesAuthMiddleware, getDatesPatients)
router.get('/cita/filter', cookiesAuthMiddleware, getDatesFilter)
router.get('/cita/services', cookiesAuthMiddleware, getServices)
router.get('/cita/:id', cookiesAuthMiddleware, getDate)

router.post('/cita', postDate)
router.post('/cita/recipe', cookiesAuthMiddleware, postRecipe)
router.post('/cita/results', cookiesAuthMiddleware, postResults)
router.post('/cita/params', cookiesAuthMiddleware, getParamsService)

router.put('/cita/status/:id', cookiesAuthMiddleware, aproveDate)

module.exports = router;