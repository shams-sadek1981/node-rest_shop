const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { checkJwt } = require('../functions');

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

const { 
    createNewTask,
    taskList,
    updateTask,
    deleteTask,
    taskSearch,
    summaryUser,
    summaryProject,
    taskSearchRunning,
    allTaskUpdate,
    reportTaskStatus,
    uploadCsv
} = require('../controllers/task/taskCtl')

const { 
    createSubtask,
    deleteSubTask,
    updateSubTask,
    nextSeq,
    userReport,
    userReportSummary,
    projectReportSummary,
    subTaskReportSummary,
    taskTypeReportSummary
} = require('../controllers/task/subTaskCtl')


//-- subtask
router.post('/subtask/create/:id', checkJwt, createSubtask)
router.delete('/subtask/delete/:id', checkJwt, deleteSubTask)
router.put('/subtask/update/:id', checkJwt, updateSubTask)
router.get('/subtask/next-seq', checkJwt, nextSeq) // next-seq or custom task no


// Report
router.get('/subtask/report-user', checkJwt, userReport ) // next-seq or custom task no
router.get('/subtask/report-user-summary', checkJwt, userReportSummary ) // next-seq or custom task no
router.get('/subtask/report-project-summary', checkJwt, projectReportSummary )
router.get('/subtask/report-subtask-summary', checkJwt, subTaskReportSummary )
router.get('/subtask/report-task-type-summary', checkJwt, taskTypeReportSummary )


//-- task
router.get('/all-task-update', checkJwt, allTaskUpdate)
router.post('/create', checkJwt, createNewTask)
router.put('/update/:id', checkJwt, updateTask)
router.delete('/delete/:id', checkJwt, deleteTask)

// Search Upcoming Task
router.get('/search-running', checkJwt, taskSearchRunning)

router.get('/summary-user', checkJwt, summaryUser)
router.get('/summary-project', checkJwt, summaryProject)
router.get('/task/report-task-status', checkJwt, reportTaskStatus)

// Upload .csv file
router.post('/upload-csv', checkJwt, upload.single('taskCsv'), uploadCsv)


module.exports = router;