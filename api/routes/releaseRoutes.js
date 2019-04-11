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
    releaseUpdate
} = require('../controllers/release/releaseCtl')


router.post('/', checkJwt, createNew)
router.get('/', checkJwt, search)
router.delete('/:id', checkJwt, releaseDelete)
router.put('/:id', checkJwt, releaseUpdate)

module.exports = router;