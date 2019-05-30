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

            //-- Transform Data
            const result = data.map(item => {

                //-- calculation of completed hour
                const completedHour = item.subTasks.filter(item1 => {
                    if (item1.completedAt != null) {
                        return item1
                    }
                }).reduce( (acc, cur) => acc + cur.estHour, 0)

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

            if ( spittedTasks.length > 0 ) {

                const bulkTasks = spittedTasks.map( task => {
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
                            .then( result => result)
                            .catch( err => err )
            } else {
                return false
            }
        })
        .catch( err => err )
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