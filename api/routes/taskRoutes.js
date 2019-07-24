const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { checkJwt } = require('../functions');
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
    reportTaskStatus
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
router.get('/subtask/report-user', checkJwt, userReport ) // next-seq or custom task no
router.get('/subtask/report-user-summary', checkJwt, userReportSummary ) // next-seq or custom task no
router.get('/subtask/report-project-summary', checkJwt, projectReportSummary )
router.get('/subtask/report-subtask-summary', checkJwt, subTaskReportSummary )
router.get('/subtask/report-task-type-summary', checkJwt, taskTypeReportSummary )


router.get('/all-task-update', checkJwt, allTaskUpdate)
router.post('/create', checkJwt, createNewTask)
router.put('/update/:id', checkJwt, updateTask)
// router.get('/list', checkJwt, taskList)
router.delete('/delete/:id', checkJwt, deleteTask)
// router.get('/search', checkJwt, taskSearch)
router.get('/search-running', checkJwt, taskSearchRunning)
router.get('/summary-user', checkJwt, summaryUser)
router.get('/summary-project', checkJwt, summaryProject)
router.get('/task/report-task-status', checkJwt, reportTaskStatus)

//-- Delete user

// router.get('/list', checkJwt, getUserList)

// router.put('/update/:id', checkJwt, updateUser)

module.exports = router;