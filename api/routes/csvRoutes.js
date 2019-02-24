const express = require('express');
const router = express.Router();

const csvCtl=require('../controllers/csvCtl');

router.get('/read', csvCtl.readFile)
router.get('/write', csvCtl.writeFile)
router.get('/read-write', csvCtl.readAndWrite)

module.exports = router;