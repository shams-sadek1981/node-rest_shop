const express = require('express');
const router = express.Router();


router.use('/products', require('./products'));
router.use('/orders', require('./orders'));
router.use('/users', require('./user'));
router.use('/csv', require('./csvRoutes'));
// router.use('/google-api', require('./googleApiRoutes'));

module.exports = router;

