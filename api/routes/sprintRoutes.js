const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { checkJwt } = require('../functions');
const {
    createNew,
    search,
    sprintDelete,
    sprintUpdate,
    searchUpcomingTask,
    sprintStatus,
    sprintStatusUpdate
} = require('../controllers/sprint/sprintCtl')


router.post('/', checkJwt, createNew)
router.get('/', checkJwt, search)
router.get('/upcoming-task', checkJwt, searchUpcomingTask)
router.delete('/:id', checkJwt, sprintDelete)
router.put('/:id', checkJwt, sprintUpdate)
router.put('/status/:id', checkJwt, sprintStatus)
router.put('/status-update/:sprintName', checkJwt, sprintStatusUpdate)

module.exports = router;