const express = require('express');
const router = express.Router();

const csvCtl=require('../controllers/csvCtl');

// router.get('/read', csvCtl.readFile)
// router.get('/write', csvCtl.writeFile)

/**
 * -------------------------------------------------------------------------------------------------
 * Generate Employee Evaluation Report. Please follow the STEP
 * -------------------------------------------------------------------------------------------------
 */
// Step-1 Insert all user data in Database from .csv file
router.get('/write-task-log', csvCtl.writeTaskLog)

// Step-2 Insert data in Database from .csv file
router.get('/write-task-est', csvCtl.writeTaskEst)

// Step-3 Insert data in Database from .csv file
router.get('/generate-csv', csvCtl.generateCsv)

//-- Import upcoming task data from .csv file
router.get('/import-upcoming-task', csvCtl.importUpcomingTask)

// May-2019 temp
router.get('/write-task-may-est', csvCtl.writeTaskMayEst)

router.get('/read-write', csvCtl.readAndWrite)

module.exports = router;