const express = require('express');
const router = express.Router();
const moment = require('moment');
const { checkJwt } = require('../functions');
const mongoose = require('mongoose');
const PublicHoliday = require('../models/publicHoliday');
const checkAuth = require('../middleware/check-auth');

const {
    getHolidays,
    createHoliday,
    deleteHoliday
} =  require('../controllers/publicHoliday/publicHolidayCtl')

router.get('/', checkJwt, getHolidays)
router.post('/', checkJwt, createHoliday)
router.delete('/:id', checkJwt, deleteHoliday)

module.exports = router;