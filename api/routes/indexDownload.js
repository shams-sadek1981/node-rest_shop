const express = require('express');
const router = express.Router();


router.use('/evaluation', require('./evaluationRoutes'));

module.exports = router;