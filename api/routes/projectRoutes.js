const express = require('express');
const router = express.Router();
const { checkJwt } = require('../functions');

const { 
    createNewProject,
    getAll,
    getProject,
    updateProject,
    deleteProject,
    getProjectList
} = require('../controllers/project/projectCtl')


//-- /project/
router.get('/list', checkJwt, getProjectList)
router.get('/', checkJwt, getAll)
router.get('/:id', checkJwt, getProject)
router.post('/create', checkJwt, createNewProject)
router.put('/:id', checkJwt, updateProject)
router.delete('/:id', checkJwt, deleteProject)


module.exports = router;