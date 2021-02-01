const express = require('express');

const router = express.Router();

const { getAllLabs, getLab, postReview } = require('../controllers/labs')
const { cookiesAuthMiddleware } = require('../helpers/auth')

router.get('/all-labs', getAllLabs)
router.get('/laboratorio/:id', getLab)

router.post('/laboratorio/:id', cookiesAuthMiddleware, postReview)

module.exports = router;