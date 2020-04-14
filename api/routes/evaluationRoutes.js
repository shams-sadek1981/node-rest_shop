const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { checkJwt } = require('../functions');



const { 
    getAllMarks,
    generatePersonalCsv
} = require('../controllers/evaluation/evaluationCtl')


//-- task
router.get('/get-all-marks', checkJwt, getAllMarks)
router.get('/generate-personal-csv', checkJwt, generatePersonalCsv)
// router.post('/create', checkJwt, createNewTask)
// router.put('/update/:id', checkJwt, updateTask)
// router.delete('/delete/:id', checkJwt, deleteTask)

module.exports = router;