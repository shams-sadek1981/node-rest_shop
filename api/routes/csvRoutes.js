const express = require('express');
const router = express.Router();

const { checkJwt } = require('../functions');

const csvCtl=require('../controllers/csvCtl');

const {
    uploadEvaluationCsv
} =require('../controllers/csvCtl');

/**
 * ------------------------------------------------------
 * Upload file by using multer
 * ------------------------------------------------------
 */
const multer = require('multer')
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function(req, file, cb) {
        cb(null, new Date().toISOString() + file.originalname)
    }
})
const upload = multer({ storage: storage})



router.get('/read', csvCtl.readFile)
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
router.get('/import-three-month-data', csvCtl.importThreeMonth)

// May-2019 temp
router.get('/write-task-may-est', csvCtl.writeTaskMayEst)

router.get('/read-write', csvCtl.readAndWrite)

// Upload evaluation.csv file /csv/upload-csv
router.post('/upload-evaluation-csv', checkJwt, upload.single('evaluationCsv'), uploadEvaluationCsv)

module.exports = router;