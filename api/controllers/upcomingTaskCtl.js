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
                        estHour: req.body.estHour,
                        status: req.body.status
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
                "subTask.$": {
                    name: req.body.name,
                    assignedUser: req.body.assignedUser,
                    estHour: req.body.estHour,
                    status: req.body.status
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


/**
 * ----------------------------------------------------------------------------------------------------
 * Search Task
 * ----------------------------------------------------------------------------------------------------
 */

const sumEstHourAndTotalSubTask = (userName = 'all', projectName = 'all') => {

    let match = {}
    if (userName != 'all') {
        match = { "subTask.assignedUser": userName }
    }

    if (projectName != 'all') {
        match = {
            ...match,
            projectName
        }
    }

    return UpcomingTask.aggregate([
        { "$unwind": "$subTask" },
        {
            $match: match
        },
        {
            "$group": {
                // _id: { taskName: "$taskName" },
                _id: null,
                // subTasks: { $push: "$subTask" },
                estHour: { $sum: "$subTask.estHour" },
                totalTask: { $sum: 1 }
            }
        }
    ]).then(data => data[0])

}


//-- Build Query
const queryBulder = (userName, projectName) => {
    let queryObj = {}

    if (userName != 'all') {
        queryObj = {
            ...queryObj,
            subTask: {
                $elemMatch: {
                    assignedUser: userName
                }
            }
        }
    }

    if (projectName != 'all') {
        queryObj = {
            ...queryObj,
            projectName
        }
    }

    return queryObj
}

exports.taskSearch = async (req, res) => {

    const userName = req.query.name
    const projectName = req.query.project

    //-- by user
    const userResult = await sumEstHourAndTotalSubTask(userName, projectName)
    const userEstHour = userResult.estHour
    const userTotalSubTask = userResult.totalTask

    //-- all user
    const totalResult = await sumEstHourAndTotalSubTask()
    const totalEstHour = totalResult.estHour
    const totalSubTask = totalResult.totalTask

    const queryObj = queryBulder(userName, projectName)

    UpcomingTask.find({
        ...queryObj
    }).then(data => {

        res.status(200).json({
            totalTask: data.length,
            totalEstHour,
            totalSubTask,
            userName,
            userEstHour,
            userTotalSubTask,
            result: data
        })
    }).catch(err => {
        res.status(404).json({
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