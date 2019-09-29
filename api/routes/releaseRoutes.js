const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { checkJwt } = require('../functions');
const {
    createNew,
    search,
    releaseDelete,
    releaseUpdate,
    searchUpcomingTask,
    releaseStatusUpdate
} = require('../controllers/release/releaseCtl')


router.post('/', checkJwt, createNew)
router.get('/', checkJwt, search)
router.get('/upcoming-task', checkJwt, searchUpcomingTask)
router.delete('/:id', checkJwt, releaseDelete)
router.put('/:id', checkJwt, releaseUpdate)
router.put('/status/:id', checkJwt, releaseStatusUpdate)

module.exports = router;