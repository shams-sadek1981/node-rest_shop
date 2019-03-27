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
    createSubtask,
    deleteSubTask,
    updateSubTask
} = require('../controllers/upcomingTaskCtl')


//-- subtask
router.post('/subtask/create/:id', checkJwt, createSubtask)
router.delete('/subtask/delete/:id', checkJwt, deleteSubTask)
router.put('/subtask/update/:id', checkJwt, updateSubTask)

router.post('/create', checkJwt, createNewTask)
router.put('/update/:id', checkJwt, updateTask)
router.get('/list', checkJwt, taskList)
router.delete('/delete/:id', checkJwt, deleteTask)
router.get('/search', checkJwt, taskSearch)

//-- Delete user

// router.get('/list', checkJwt, getUserList)

// router.put('/update/:id', checkJwt, updateUser)

module.exports = router;