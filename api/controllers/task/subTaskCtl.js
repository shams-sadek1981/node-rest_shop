const express = require('express');
const mongoose = require('mongoose');
const moment = require('moment');
const UpcomingTask = require('../../models/upcomingTask');
// const TaskNo = require('../../models/taskNo');
const TaskNo = require('../../models/taskNo');
const { queryBuilder, singleUserEst, totalEst, totalTask } = require('./helperFunctions')

//-- Report User Report
exports.userReport = (req, res) => {

    const startDate = new Date(req.query.startDate)
    const endDate = new Date(req.query.endDate)
    const userName = req.query.userName

    const queryObj = {
        "subTasks.completedAt": {
            "$gte": startDate,
            "$lte": endDate
        },
        "subTasks.assignedUser": userName
    }

    //-- Count total tasks
    // const totalTasks = await totalTask(queryObj)

    // return res.json({
    //     totalTAsks
    // })

    UpcomingTask.aggregate([
        {
            "$unwind": {
                'path': '$subTasks',
                "preserveNullAndEmptyArrays": true,
                "includeArrayIndex": "arrayIndex"
            }
        },
        { $sort: { "subTasks.completedAt": 1, "subTasks.name": 1 } },
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
                    completedAt: "$completedAt",
                },
                subTasks: { $push: "$subTasks" },
                estHour: {
                    $sum: "$subTasks.estHour"
                }
            }
        },
        { $sort: { "_id.completedAt": 1, "_id.taskName": 1 } }

    ]).then(data => {

        let result = []
        let totalEst = 0
        data.forEach( task => {

            task.subTasks.forEach( subTask => {
                totalEst += parseInt(subTask.estHour)

                result.push({
                    taskId: task._id._id,
                    taskName: task._id.taskName,
                    projectName: task._id.projectName,
                    taskType: task._id.taskType,
                    subTaskId: subTask._id,
                    subTask: subTask.name,
                    assignedUser: subTask.assignedUser,
                    estHour: subTask.estHour,
                    completedAt: moment(subTask.completedAt).format('DD-MMM-YYYY')
                })
            })
        })

        res.json({
            totalEst,
            result
        })
    }).catch(err => res.json(err))
}

//-- Report User Report Summary
exports.userReportSummary = (req, res) => {

    const startDate = new Date(req.query.startDate)
    const endDate = new Date(req.query.endDate)

    const queryObj = {
        "subTasks.completedAt": {
            "$gte": startDate,
            "$lte": endDate
        }
    }

    UpcomingTask.aggregate([
        {
            "$unwind": {
                'path': '$subTasks',
                "preserveNullAndEmptyArrays": true,
                "includeArrayIndex": "arrayIndex"
            }
        },
        // { $sort: { "subTasks.assignedUser": 1 } },
        {
            $match: queryObj
        },
        {
            $group: {
                _id: {
                    userName: "$subTasks.assignedUser",
                },
                estHour: {
                    $sum: "$subTasks.estHour"
                }
            }
        },
        { $sort: { "_id.userName": 1 } }

    ]).then(data => {

        let result = []
        let totalEst = 0
        data.forEach( item => {

                totalEst += parseInt(item.estHour)

                result.push({
                    userName: item._id.userName,
                    estHour: item.estHour
                })
        })

        res.json({
            totalEst,
            result
        })
    }).catch(err => res.json(err))
}


//-- Report Project Report Summary
exports.projectReportSummary = (req, res) => {

    const startDate = new Date(req.query.startDate)
    const endDate = new Date(req.query.endDate)

    const queryObj = {
        "subTasks.completedAt": {
            "$gte": startDate,
            "$lte": endDate
        }
    }

    UpcomingTask.aggregate([
        {
            "$unwind": {
                'path': '$subTasks',
                "preserveNullAndEmptyArrays": true,
                "includeArrayIndex": "arrayIndex"
            }
        },
        {
            $match: queryObj
        },
        {
            $group: {
                _id: {
                    projectName: "$projectName",
                },
                estHour: {
                    $sum: "$subTasks.estHour"
                }
            }
        },
        { $sort: { "_id.projectName": 1 } }

    ]).then(data => {

        let result = []
        let totalEst = 0
        data.forEach( item => {

                totalEst += parseInt(item.estHour)

                result.push({
                    projectName: item._id.projectName,
                    estHour: item.estHour
                })
        })

        res.json({
            totalEst,
            result
        })
    }).catch(err => res.json(err))
}


//-- Report Task Type Report Summary
exports.taskTypeReportSummary = (req, res) => {

    const startDate = new Date(req.query.startDate)
    const endDate = new Date(req.query.endDate)

    const queryObj = {
        "subTasks.completedAt": {
            "$gte": startDate,
            "$lte": endDate
        }
    }

    UpcomingTask.aggregate([
        {
            "$unwind": {
                'path': '$subTasks',
                "preserveNullAndEmptyArrays": true,
                "includeArrayIndex": "arrayIndex"
            }
        },
        {
            $match: queryObj
        },
        {
            $group: {
                _id: {
                    taskType: "$taskType",
                },
                estHour: {
                    $sum: "$subTasks.estHour"
                }
            }
        },
        { $sort: { "_id.taskType": 1 } }

    ]).then(data => {

        let result = []
        let totalEst = 0
        data.forEach( item => {

                totalEst += parseInt(item.estHour)

                result.push({
                    taskType: item._id.taskType,
                    estHour: item.estHour
                })
        })

        res.json({
            totalEst,
            result
        })
    }).catch(err => res.json(err))
}



/**
 * --------------------------------------------------------------------------------
 * Next Seq
 * --------------------------------------------------------------------------------
 */
exports.nextSeq = (req, res) => {

    TaskNo.findOneAndUpdate(
        { f_year: 2019 },
        {
            $inc: { seq: 1 },
        },
        { new: true, upsert: true }
    ).then(data => {
        res.json(data)
    }).catch(err => res.json(err))

}


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
                subTasks: {
                    $each: [{
                        name: req.body.name,
                        assignedUser: req.body.assignedUser,
                        estHour: req.body.estHour,
                        status: req.body.status,
                        startDate: req.body.startDate,
                        dueDate: req.body.dueDate,
                        completedAt: req.body.completedAt
                    }]
                }
            }
        },
        { new: true }
    ).then(result => {
        res.status(200).json({
            result: result.subTasks.pop()
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
                subTasks: { _id: req.params.id }
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

    let status = true
    if (req.body.completedAt == null) {
        status = false
    }

    console.log("Completed At: ", req.body.completedAt)

    UpcomingTask.findOneAndUpdate(
        { "subTasks._id": req.params.id },
        {
            $set: {
                "subTasks.$": {
                    name: req.body.name,
                    assignedUser: req.body.assignedUser,
                    estHour: req.body.estHour,
                    status: status,
                    startDate: req.body.startDate,
                    dueDate: req.body.dueDate,
                    completedAt: req.body.completedAt
                }
            }
        },
        { new: true }
    ).then(result => {

        const newResult = {
            _id: result._id,
            name: result.name,
            assignedUser: result.assignedUser,
            estHour: result.estHour,
            createdAt: result.createdAt,
            subTasks: result.subTasks,
            startDate: result.startDate,
            dueDate: result.dueDate,
            completedAt: result.completedAt
        }

        res.status(200).json({
            result: 'newResult'
        })
    })
        .catch(err => {
            res.status(409).json({
                err
            })
        })
}