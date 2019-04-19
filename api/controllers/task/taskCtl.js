const express = require('express');
const mongoose = require('mongoose');
const UpcomingTask = require('../../models/upcomingTask');

const { queryBuilder, singleUserEst, totalEst, totalTask } = require('./helperFunctions')


/**
 * ------------------------------------------------------------------------------------
 * Search Task
 * ------------------------------------------------------------------------------------
 */
exports.taskSearch = async (req, res) => {

    const userName = await req.query.name
    const projectName = await req.query.project
    const searchText = await req.query.text
    const status = await req.query.status
    const pageSize = await JSON.parse(req.query.pageSize)
    
    //-- Pagination settings
    const pageNo = await req.query.page
    // const pageSize = 3 //-- initialize the pageSize / pageSize / perPage data
    const skip = pageNo * pageSize - pageSize
    
    //-- Set Query Object
    const queryObj = await queryBuilder(userName, projectName, searchText, status)

    // return res.json(
    //     queryObj
    // )

    //-- Count total tasks
    const totalTasks = await totalTask(queryObj)

    
    //-- by user & project
    const { userEstHour, userTotalSubTask } = await singleUserEst(queryObj)


    //-- all user
    const { totalEstHour, totalSubTask } = await totalEst(queryObj)


    UpcomingTask.aggregate([
        {
            "$unwind": {
                'path': '$subTasks',
                "preserveNullAndEmptyArrays": true,
                "includeArrayIndex": "arrayIndex"
            }
        },
        { $sort: { "subTasks.name": 1 } },
        {
            $match: queryObj
        },
        {
            $group: {
                _id: {
                    _id: "$_id",
                    taskName: "$taskName",
                    projectName: "$projectName",
                    taskType: "$taskType",
                    description: "$description",
                    status: "$status",
                    running: "$running",
                    rate: "$rate",
                },
                subTasks: { $push: "$subTasks" },
                estHour: {
                    $sum: "$subTasks.estHour"
                }
            }
        },
        { $sort: { "_id.running": -1, "_id.rate": -1, "_id.taskName": 1 } }

    ])
    .skip(skip).limit(pageSize)
    .then(data => {

        //-- Transform Data
        const result = data.map(item => {
            return {
                ...item._id,
                subTasks: item.subTasks,
                estHour: item.estHour,
            }
        })

        //-- Return Result
        res.status(200).json({
            pagination: {
                total: totalTasks,
                current: JSON.parse(pageNo),
                pageSize
            },
            totalEstHour,
            totalSubTask,
            userName,
            userEstHour,
            userTotalSubTask,
            result
        })

    }).catch(err => {
        res.status(404).json({
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
        description: req.body.description,
        taskType: req.body.taskType,
        projectName: req.body.projectName,
    })

    upcomingTask.save()
        .then(result => {

            const formatedData = {
                _id: result._id,
                rate: result.rate,
                taskName: result.taskName,
                description: result.description,
                projectName: result.projectName,
                taskType: result.taskType,
                createdAt: result.createdAt
            }

            res.status(200).json({
                ...formatedData
            })
        })
        .catch(err => {

            res.status(403).json({
                err
            })

            // if (err.code == 11000) {
            //     return res.status(409).json({
            //         message: 'Already exists this Taskname'
            //     })
            // } else {

            // }
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


/**
 * ----------------------------------------------------------------------------------------------------
 * user Summary Report
 * ----------------------------------------------------------------------------------------------------
 */
exports.summaryUser = (req, res) => {

    UpcomingTask.aggregate([
        {
            "$unwind": {
                'path': '$subTasks',
                "preserveNullAndEmptyArrays": true,
                "includeArrayIndex": "arrayIndex"
            }
        },
        {
            $match: {
                status: false
            }
        },
        {
            $group: {
                _id: {
                    assignedUser: "$subTasks.assignedUser"
                },
                estHour: {
                    $sum: "$subTasks.estHour"
                }
            }
        },
        {
            $match: {
                "_id.assignedUser": { $ne: null }
            }
        },
        { $sort: { "_id.assignedUser": 1 } }

    ])
    .then(data => {

        //-- Transform Data
        const result = data.map(item => {
            return {
                ...item._id,
                estHour: item.estHour,
            }
        })


        res.json({
            result
        })
    })
}


/**
 * ----------------------------------------------------------------------------------------------------
 * Project Summary Report
 * ----------------------------------------------------------------------------------------------------
 */
exports.summaryProject = (req, res) => {

    UpcomingTask.aggregate([
        {
            "$unwind": {
                'path': '$subTasks',
                "preserveNullAndEmptyArrays": true,
                "includeArrayIndex": "arrayIndex"
            }
        },
        {
            $match: {
                status: false
            }
        },
        {
            $group: {
                _id: {
                    projectName: "$projectName"
                },
                estHour: {
                    $sum: "$subTasks.estHour"
                }
            }
        },
        { $sort: { "_id.projectName": 1 } }
    ])
    .then(data => {
        //-- Transform Data
        const result = data.map(item => {
            return {
                ...item._id,
                estHour: item.estHour,
            }
        })

        res.json({
            result
        })
    })
}