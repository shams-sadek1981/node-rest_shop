const express = require('express');
const router = express.Router();

const csvCtl=require('../controllers/csvCtl');

router.get('/read', csvCtl.readFile)
router.get('/write', csvCtl.writeFile)
router.get('/read-write', csvCtl.readAndWrite)
router.get('/generate-est-hour', csvCtl.generateEstHour)
router.get('/generate-name-summary', csvCtl.generateNameSummary)

module.exports = router;