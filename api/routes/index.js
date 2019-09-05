const express = require('express');
const router = express.Router();


router.use('/csv', require('./csvRoutes'));
router.use('/products', require('./products'));
router.use('/orders', require('./orders'));
router.use('/users', require('./userRoutes'));
router.use('/upcoming-task', require('./taskRoutes'));
router.use('/release', require('./releaseRoutes'));
router.use('/project', require('./projectRoutes'));
router.use('/task-type', require('./taskTypeRoutes'));
router.use('/public-holiday', require('./publicHolidayRoutes'));
router.use('/user-role', require('./userRoleRoutes'));
router.use('/user-permission', require('./userPermissionRoutes'));
// router.use('/google-api', require('./googleApiRoutes'));

module.exports = router;