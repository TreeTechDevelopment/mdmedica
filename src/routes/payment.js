const express = require('express');

const router = express.Router();

const { getInfo, payDate } = require('../controllers/payment')

router.get('/payment', getInfo)

router.post('/payment', payDate)

module.exports = router;