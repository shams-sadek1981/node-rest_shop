const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { checkJwt } = require('../functions');



const { 
    getAllMarks
} = require('../controllers/evaluation/evaluationCtl')


//-- task
router.get('/get-all-marks', checkJwt, getAllMarks)
// router.post('/create', checkJwt, createNewTask)
// router.put('/update/:id', checkJwt, updateTask)
// router.delete('/delete/:id', checkJwt, deleteTask)

module.exports = router;