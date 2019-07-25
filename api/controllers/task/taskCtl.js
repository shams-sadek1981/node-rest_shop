const express = require('express');
const mongoose = require('mongoose');
const moment = require('moment');
const UpcomingTask = require('../../models/upcomingTask');
const { _ } = require('lodash')

const { queryBuilder, singleUserEst, totalEst, totalTask } = require('./helperFunctions')


/**
 * -----------------------------------------------------------------------------
 * Report Task By Project (24-Jul-2019)
 * -----------------------------------------------------------------------------
 */
exports.reportTaskStatus = (req, res) => {

    const startDate = new Date(req.query.startDate)
    const endDate = new Date(req.query.endDate)
    const project = req.query.project

    const queryObj = {
        "completedAt": {
            "$gte": startDate,
            "$lte": endDate
        },
        projectName: project
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
                    taskName: "$taskName",
                    completedAt: "$completedAt",
                    taskType: "$taskType",
                },
                estHour: {
                    $sum: "$subTasks.estHour"
                },
                startDate: {
                    $min: "$subTasks.startDate"
                },
                endDate: {
                    $max: "$subTasks.completedAt"
                },
                subTasks: {
                    $addToSet: {
                        user: "$subTasks.assignedUser",
                        estHour: "$subTasks.estHour",
                        subTask: "$subTasks.name",
                    }
                }
            }
        },
        
        { $sort: { "estHour": -1 } }

    ]).then(data => {

        // return res.json({
        //     data: data
        // })

        let result = []
        let totalEst = 0
        data.forEach(item => {

            totalEst += parseFloat(item.estHour)

            result.push({
                taskName: item._id.taskName,
                completedAt: moment(item._id.completedAt).format("DD-MMM-YYYY"),
                taskType: item._id.taskType,
                estHour: item.estHour,
                startDate: moment(item.startDate).format("DD-MMM-YYYY"),
                endDate: moment(item.endDate).format("DD-MMM-YYYY"),
                subTasks: item.subTasks,
            })
        })

        res.json({
            totalTask: data.length,
            totalEst: totalEst.toFixed(2),
            result
        })
    }).catch(err => res.json(err))

}

//-- This script or function use only for bulk update upcoming task. -----
exports.allTaskUpdate = (req, res) => {

    UpcomingTask.find({})
        .exec()
        .then(doc => {

            doc.forEach(task => {

                let totalEstHour = 0
                let completedHour = 0

                if (task.subTasks.length > 0) {
                    task.subTasks.forEach(subTask => {
                        totalEstHour += subTask.estHour
                        if (subTask.completedAt != null) {
                            completedHour += subTask.estHour
                        }
                    })
                }

                const percent = Math.floor(completedHour * 100 / totalEstHour)

                UpcomingTask.update({ _id: task._id }, { percent })
                    .then(data => {
                        console.log(data)
                    })
            })
        })

    res.json({
        message: 'Success'
    })

    // UpcomingTask.updateMany(
    //     {},
    //     {
    //         $addToSet: {
    //             percent: 
    //         }
    //     },
    //     {
    //         multi: true
    //     }
    // )
    // .then( data => {
    //     res.json(data)
    // })
    // .catch( err => res.json(err))

}

exports.taskSearchRunning = async (req, res) => {

    const userName = await req.query.name
    const projectName = await req.query.project
    const searchText = await req.query.text
    const pageSize = await JSON.parse(req.query.pageSize)
    const running = await JSON.parse(req.query.running)
    const completedAt = await JSON.parse(req.query.completedAt)

    //-- Pagination settings
    const pageNo = await JSON.parse(req.query.page)
    const skip = pageNo * pageSize - pageSize

    //-- Set Query Object
    const queryObj = await queryBuilder(userName, projectName, searchText, running, completedAt)

    // return res.json(queryObj)

    //-- Count total tasks
    const totalTasks = await totalTask(queryObj)


    //-- by user & project
    const { userEstHour, userTotalSubTask } = await singleUserEst(queryObj)


    //-- all user
    const { totalEstHour, totalSubTask } = await totalEst(queryObj)

    UpcomingTask.find(queryObj)
        .sort({ completedAt: -1, percent: -1, rate: -1, "subTasks.name": 1 })
        .skip(skip).limit(pageSize)
        // sort: { "_id.completedAt": -1, "_id.rate": -1, "_id.taskName": 1 } }
        .then(data => {

            //-- Transform Data
            result = data.map(item => {

                let estHour = 0
                let completedHour = 0
                let maxCompletedAt = null
                let startAt = null
                // let percent = 0

                if (item.subTasks.length > 0) {

                    item.subTasks.forEach(subTask => {
                        //-- calculation of completed hour
                        if (subTask.completedAt != null) {
                            completedHour += subTask.estHour


                            /**
                             * ------------------------------
                             * set subTask maxCompletedAt
                             * ------------------------------
                             */
                            if (subTask.completedAt) {
                                if (maxCompletedAt == null) {
                                    maxCompletedAt = subTask.completedAt
                                } else {
                                    if (subTask.completedAt > maxCompletedAt) {
                                        maxCompletedAt = subTask.completedAt
                                    }
                                }
                            }
                        }

                            /**
                             * ---------------------------
                             * Set startAt
                             * ---------------------------
                             */
                            if (subTask.startDate) {
                                if (startAt == null) {
                                    startAt = subTask.startDate
                                } else {
                                    if (subTask.startDate < startAt) {
                                        startAt = subTask.startDate
                                    }
                                }
                            }

                        // totalEstHour += subTask.estHour
                        estHour += subTask.estHour
                    })

                    dueHour = estHour - completedHour
                    // percent = Math.floor(completedHour * 100 / estHour)
                }


                return {
                    _id: item._id,
                    status: item.status,
                    running: item.running,
                    rate: item.rate,
                    taskName: item.taskName,
                    description: item.description,
                    taskType: item.taskType,
                    projectName: item.projectName,
                    completedAt: item.completedAt,
                    maxCompletedAt: maxCompletedAt,
                    startAt,
                    assignedBy: item.assignedBy,
                    estHour,
                    completedHour,
                    percent: item.percent || 0,
                    dueHour,
                    subTasks: item.subTasks,
                }
            })

            //-- sort by percent
            // const newResult = _.orderBy(result, ['percent', 'rate', 'taskName'],['desc', 'desc', 'asc']); // Use Lodash to sort array by 'name'

            return res.json({
                pagination: {
                    total: totalTasks,
                    current: pageNo,
                    pageSize
                },
                userName,
                totalEstHour,
                totalSubTask,
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
 * ------------------------------------------------------------------------------------
 * Search Task
 * ------------------------------------------------------------------------------------
 */
exports.taskSearch = async (req, res) => {

    const userName = await req.query.name
    const projectName = await req.query.project
    const searchText = await req.query.text
    const pageSize = await JSON.parse(req.query.pageSize)
    const running = await JSON.parse(req.query.running)
    const completedAt = await JSON.parse(req.query.completedAt)

    //-- Pagination settings
    const pageNo = await JSON.parse(req.query.page)
    // const pageSize = 3 //-- initialize the pageSize / pageSize / perPage data
    const skip = pageNo * pageSize - pageSize


    //-- Set Query Object
    const queryObj = await queryBuilder(userName, projectName, searchText, running, completedAt)


    // return res.json(
    //     queryObj
    // )

    // UpcomingTask.find({
    //     completedAt: { $eq: null}
    // }).then(data => res.json(data))


    //-- Count total tasks
    const totalTasks = await totalTask(queryObj)


    //-- by user & project
    const { userEstHour, userTotalSubTask } = await singleUserEst(queryObj)


    //-- all user
    const { totalEstHour, totalSubTask } = await totalEst(queryObj)


    // return res.json({
    //     totalEstHour
    // })

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
                    assignedBy: "$assignedBy",
                    completedAt: "$completedAt",
                    // status: "$status",
                    running: "$running",
                    rate: "$rate",
                },
                subTasks: { $push: "$subTasks" },
                estHour: {
                    $sum: "$subTasks.estHour"
                }
            }
        },
        { $sort: { "_id.completedAt": -1, "_id.rate": -1, "_id.taskName": 1 } }

    ])
        .skip(skip).limit(pageSize)
        .then(data => {

            //-------- Transform Data --------
            const result = data.map(item => {

                //-- calculation of completed hour
                const completedHour = item.subTasks.filter(item1 => {
                    if (item1.completedAt != null) {
                        return item1
                    }
                }).reduce((acc, cur) => acc + cur.estHour, 0)

                const percent = Math.floor(completedHour * 100 / item.estHour)

                return {
                    ...item._id,
                    subTasks: item.subTasks,
                    estHour: item.estHour,
                    completedHour,
                    dueHour: item.estHour - completedHour,
                    percent: percent || 0
                }
            })

            //-- Return Result
            res.status(200).json({
                pagination: {
                    total: totalTasks,
                    current: pageNo,
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
        assignedBy: req.body.assignedBy
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
                createdAt: result.createdAt,
                assignedBy: result.assignedBy,
            }

            res.status(200).json({
                ...formatedData
            })
        })
        .catch(err => {
            res.status(403).json({
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


//-- Task Bulk Insert from description (Edit Mode)
createBulkTask = (id) => {
    return UpcomingTask.findById(id)
        .exec()
        .then(data => {

            const spittedTasks = data.description.split(/\r\n|\n|\r/);

            if (spittedTasks.length > 0) {

                const bulkTasks = spittedTasks.map(task => {
                    return {
                        taskName: task,
                        description: task,
                        taskType: data.taskType,
                        projectName: data.projectName,
                        assignedBy: data.assignedBy
                    }
                })

                //-- Delete main task
                UpcomingTask.deleteOne({ _id: id }).exec()

                //-- Insert Many
                return UpcomingTask.insertMany(bulkTasks)
                    .exec()
                    .then(result => result)
                    .catch(err => err)
            } else {
                return false
            }
        })
        .catch(err => err)
}

//-- Update user
exports.updateTask = (req, res) => {

    UpcomingTask.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true })
        .exec()
        .then(doc => {

            if (req.body.bulkInsert) {
                createBulkTask(req.params.id)
            }

            res.status(200).json(doc)
        })
        .catch(err => {
            res.status(403).json({
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
                $and: [
                    { completedAt: { $eq: null } },
                    { "subTasks.completedAt": { $eq: null } }
                ]
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
                $and: [
                    { completedAt: { $eq: null } },
                    { "subTasks.completedAt": { $eq: null } }
                ]
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