const express = require('express');
const router = express.Router();

const csvCtl=require('../controllers/csvCtl');

router.get('/read', csvCtl.readFile)
router.get('/write', csvCtl.writeFile)
router.get('/read-write', csvCtl.readAndWrite)
router.get('/write-task-log', csvCtl.writeTaskLog)
router.get('/write-task-est', csvCtl.writeTaskEst)
router.get('/generate-csv', csvCtl.generateCsv)

module.exports = router;