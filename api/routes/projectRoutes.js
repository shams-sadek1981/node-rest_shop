const express = require('express');
const router = express.Router();
const { checkJwt } = require('../functions');

const { 
    createNewProject,
    getAll
} = require('../controllers/project/projectCtl')


//-- /project/
router.get('/', checkJwt, getAll)
router.post('/create', checkJwt, createNewProject)


module.exports = router;