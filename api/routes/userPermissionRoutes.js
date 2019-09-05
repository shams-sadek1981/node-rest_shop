const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');

const { checkJwt } = require('../functions');

const {
    permissionCreate,
    permissionList,
    permissionDelete,
    permissionUpdate
} = require('../controllers/userRole/userPermissionCtl')


router.get('/', checkJwt, permissionList)
router.post('/', checkJwt, permissionCreate)
router.delete('/:permissionId', checkJwt, permissionDelete)
router.patch('/:permissionId', checkJwt, permissionUpdate)


module.exports = router;