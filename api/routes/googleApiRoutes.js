const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const googleApiCtl = require('../controllers/googleApiCtl');


router.get('/', googleApiCtl.getAll)

module.exports = router;