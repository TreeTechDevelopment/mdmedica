const express = require('express');

const router = express.Router();

const { getAllLabs } = require('../controllers/labs')

router.get('/all-labs', getAllLabs)

module.exports = router;