const express = require('express');
const router = express.Router();

const csvCtl=require('../controllers/csvCtl');

router.get('/read', csvCtl.readFile)
router.get('/write', csvCtl.writeFile)
router.get('/read-write', csvCtl.readAndWrite)
router.get('/write-task-log', csvCtl.writeTaskLog)
router.get('/write-user-task', csvCtl.writeUserTask)
router.get('/read-task-log', csvCtl.readTaskLog)

module.exports = router;