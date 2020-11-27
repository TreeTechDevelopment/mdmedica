const express = require('express');

const router = express.Router();

const { getAllLabs, getLab, postReview } = require('../controllers/labs')

router.get('/all-labs', getAllLabs)
router.get('/laboratorio/:id', getLab)

router.post('/laboratorio/:id', postReview)

module.exports = router;