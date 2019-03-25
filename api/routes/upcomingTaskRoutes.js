const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { checkJwt } = require('../functions');
const { createNewTask, taskList, updateTask, deleteTask } = require('../controllers/upcomingTaskCtl')


router.post('/create', checkJwt, createNewTask)
router.put('/update/:id', checkJwt, updateTask)
router.get('/list', checkJwt, taskList)
router.delete('/delete/:id', checkJwt, deleteTask)

//-- Delete user

// router.get('/list', checkJwt, getUserList)

// router.put('/update/:id', checkJwt, updateUser)

module.exports = router;