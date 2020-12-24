const express = require('express');

const router = express.Router();

const { postDate } = require('../controllers/date')

router.post('/cita', postDate)

module.exports = router;