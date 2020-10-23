const express = require('express');

const router = express.Router();

const { handleClient } = require('../controllers/client')

router.get('/', handleClient)

module.exports = router;