const express = require('express');
const router = express.Router();


router.use('/products', require('./products'));
router.use('/orders', require('./orders'));
router.use('/users', require('./user'));

module.exports = router;

