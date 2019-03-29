const express = require('express');

const mongoose = require('mongoose');
const UpcomingTask = require('../models/upcomingTask');


/**
 * ------------------------------------------------------------------------------------------------
 *  Create Sub Task
 * ------------------------------------------------------------------------------------------------
 */
exports.createSubtask = (req, res) => {

    UpcomingTask.findOneAndUpdate(
        { _id: req.params.id },
        {
            $push: {
                subTask: {
                    $each: [{
                        name: req.body.name,
                        assignedUser: req.body.assignedUser,
                        estHour: req.body.estHour
                    }]
                }
            }
        },
        { new: true }
    ).then(result => {
        res.status(200).json({
            result: result.subTask.pop()
        })
    })
        .catch(err => {
            res.status(409).json({
                err
            })
        })
}


/**
 * ------------------------------------------------------------------------------------------------
 *  Delete Sub Task
 * ------------------------------------------------------------------------------------------------
 */
exports.deleteSubTask = (req, res) => {

    UpcomingTask.update(
        { _id: req.body.id },
        {
            $pull: {
                subTask: { _id: req.params.id }
            }
        },
        { new: true }
    ).then(result => {
        res.status(200).json({
            result
        })
    })
        .catch(err => {
            res.status(409).json({
                err
            })
        })
}

/**
 * ------------------------------------------------------------------------------------------------
 *  Update Sub Task
 * ------------------------------------------------------------------------------------------------
 */
exports.updateSubTask = (req, res) => {

    UpcomingTask.findOneAndUpdate(
        { "subTask._id": req.params.id },
        {
            $set: {
                subTask: {
                    _id: req.params.id,
                    name: req.body.name,
                    assignedUser: req.body.assignedUser,
                    estHour: req.body.estHour
                }
            }
        },
        { new: true }
    ).then(result => {
        res.status(200).json({
            result
        })
    })
        .catch(err => {
            res.status(409).json({
                err
            })
        })
}



/**
 * ------------------------------------------------------------------------------------------------
 *  Create New Task
 * ------------------------------------------------------------------------------------------------
 */
exports.createNewTask = (req, res) => {

    const upcomingTask = new UpcomingTask({
        taskName: req.body.taskName,
        subTask: req.body.subTask,
        description: req.body.description,
        taskType: req.body.taskType,
        projectName: req.body.projectName,
        assignedUser: req.body.assignedUser,
        estHour: req.body.estHour,
        srs: req.body.srs,
        mockup: req.body.mockup,
        design: req.body.design,
        frontend: req.body.frontend
    })

    upcomingTask.save()
        .then(result => {
            res.status(200).json({
                result
            })
        })
        .catch(err => {

            if (err.code == 11000) {
                return res.status(409).json({
                    message: 'Already exists this Taskname'
                })
            } else {
                res.status(403).json({
                    err
                })
            }
        })
}



exports.taskSearch = (req, res) => {

    let matchUser = { assignedUser: req.query.name }
    let matchProject = { projectName: req.query.project }

    let match = {}

    if (matchProject.projectName) {
        if (matchProject.projectName != 'all') {
            match = {
                ...match,
                ...matchProject
            }
        }
    }

    if (matchUser.assignedUser) {
        if (matchUser.assignedUser != 'all') {

            match = {
                ...match,
                ...matchUser
            }
        }
    }

    UpcomingTask.aggregate([
        {
            $match: match
        },
        {
            $group: {
                _id: null,
                totalEst: { $sum: "$estHour" }
            }
        }
    ]).exec()
        .then(estHour => {

            //-- get Total Est Hour
            const totalEstHour = estHour[0].totalEst

            //-- get all task
            UpcomingTask.find(match)
                .exec()
                .then(allData => {
                    res.status(200).json({
                        count: allData.length,
                        totalEstHour,
                        result: allData
                    })
                })
                .catch(err => {
                    res.status(409).json({
                        message: 'No Data Found',
                        err
                    })
                })
        })
        .catch(err => {
            res.status(409).json({
                message: 'No Data Found',
                err
            })
        })
}

/**
 * ------------------------------------------------------------------------------------------------
 *  All List
 * ------------------------------------------------------------------------------------------------
 */
exports.taskList = (req, res) => {

    UpcomingTask.aggregate([
        {
            $group: {
                _id: null,
                totalEst: { $sum: "$estHour" }
            }
        }
    ])
        .exec()
        .then(estHour => {

            //-- get Total Est Hour
            const totalEstHour = estHour[0].totalEst

            //-- get all task
            UpcomingTask.find({})
                .exec()
                .then(allData => {
                    res.status(200).json({
                        count: allData.length,
                        totalEstHour,
                        result: allData
                    })
                })
        })
}


//-- Update user
exports.updateTask = (req, res) => {

    UpcomingTask.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true })
        .exec()
        .then(doc => {
            res.status(200).json(doc)
        })
        .catch(err => {

            let message = 'Invalid Task id'

            if (err.code == 11000) {
                message = 'Task already exists'
            }

            res.status(403).json({
                message,
                err
            })
        })
}

//-- Delete Task by ID
exports.deleteTask = (req, res, next) => {

    UpcomingTask.deleteOne({ _id: req.params.id })
        .exec()
        .then(docs => {
            res.status(200).json({
                message: 'Successfully deleted',
                docs
            })
        })
        .catch(err => {
            res.status(500).json({ error: err })
        })
}