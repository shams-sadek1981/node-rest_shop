const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { checkJwt } = require('../functions');



const { 
    getAllMarks,
    generateAllEmpPdf,
    generatePersonalPdfZip,
    downloadPdfFile,
    downloadPdfUsersZip
} = require('../controllers/evaluation/evaluationCtl')


//-- task
router.get('/get-all-marks', checkJwt, getAllMarks)

router.get('/generate-all-emp-pdf', checkJwt, generateAllEmpPdf)
router.get('/generate-personal-pdf-zip', checkJwt, generatePersonalPdfZip)

router.get('/download-pdf-file', checkJwt, downloadPdfFile)
router.get('/download-pdf-users-zip', checkJwt, downloadPdfUsersZip)

// router.post('/create', checkJwt, createNewTask)
// router.put('/update/:id', checkJwt, updateTask)
// router.delete('/delete/:id', checkJwt, deleteTask)

module.exports = router;