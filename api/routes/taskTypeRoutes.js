const express = require('express');
const router = express.Router();
const { checkJwt } = require('../functions');

const { 
    createNewTaskType,
    getAll
} = require('../controllers/taskType/taskTypeCtl')


//-- /task-type/
router.get('/', checkJwt, getAll)
router.post('/create', checkJwt, createNewTaskType)

module.exports = router;