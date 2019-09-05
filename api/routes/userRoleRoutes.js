const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');

const { checkJwt } = require('../functions');

const {
    roleList,
    roleCreate,
    roleDelete,
    roleUpdate,
    getRole,
    assignPermission
} = require('../controllers/userRole/userRoleCtl')


router.get('/', checkJwt, roleList)
router.get('/:roleId', checkJwt, getRole)
router.post('/', checkJwt, roleCreate)
router.delete('/:roleId', checkJwt, roleDelete)
router.put('/:roleId', checkJwt, roleUpdate)


module.exports = router;