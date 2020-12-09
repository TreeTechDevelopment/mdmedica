const express = require('express');

const router = express.Router();

const { getInfo } = require('../controllers/admin')

router.get('/api', getInfo)

module.exports = router;