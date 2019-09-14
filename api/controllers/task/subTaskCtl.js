const express = require('express');
const mongoose = require('mongoose');
const moment = require('moment');
require('moment-weekday-calc');
const ObjectId = mongoose.Types.ObjectId;
const _ = require('lodash');

const UpcomingTask = require('../../models/upcomingTask');
// const TaskNo = require('../../models/taskNo');
const TaskNo = require('../../models/taskNo');
const { queryBuilder, singleUserEst, totalEst, totalTask, updateSubTaskPercent, getPublicHolidays } = require('./helperFunctions')


//-- helper function project group by
const projectGroupBy = (userName, startDate, endDate) => {

    return new Promise((resolve, reject) => {

        const queryObj = {
            "subTasks.completedAt": {
                "$gte": startDate,
                "$lte": endDate
            },
            "subTasks.assignedUser": userName
        }

        UpcomingTask.aggregate([
            {
                "$unwind": {
                    'path': '$subTasks',
                    "preserveNullAndEmptyArrays": true,
                    "includeArrayIndex": "arrayIndex"
                }
            },
            // { $sort: { "subTasks.completedAt": 1, "subTasks.name": 1 } },
            {
                $match: queryObj
            },
            {
                $group: {
                    _id: {
                        projectName: "$projectName",
                    },
                    subTasks: { $push: "$subTasks" },
                    estHour: {
                        $sum: "$subTasks.estHour"
                    }
                }
            },
            { $sort: { "_id.projectName": 1 } }

        ]).then(data => {

            let result = []
            let totalEst = 0
            data.forEach(task => {

                totalEst += parseFloat(task.estHour)

                result.push({
                    projectName: task._id.projectName,
                    estHour: task.estHour,
                })
            })

            resolve({
                totalEst: totalEst.toFixed(2),
                result
            })

        }).catch(err => reject(err))
    })
}

//-- helper function task type group by
const taskTypeGroupBy = (userName, startDate, endDate) => {

    return new Promise((resolve, reject) => {

        const queryObj = {
            "subTasks.completedAt": {
                "$gte": startDate,
                "$lte": endDate
            },
            "subTasks.assignedUser": userName
        }

        UpcomingTask.aggregate([
            {
                "$unwind": {
                    'path': '$subTasks',
                    "preserveNullAndEmptyArrays": true,
                    "includeArrayIndex": "arrayIndex"
                }
            },
            // { $sort: { "subTasks.completedAt": 1, "subTasks.name": 1 } },
            {
                $match: queryObj
            },
            {
                $group: {
                    _id: {
                        taskType: "$taskType",
                    },
                    subTasks: { $push: "$subTasks" },
                    estHour: {
                        $sum: "$subTasks.estHour"
                    }
                }
            },
            { $sort: { "_id.taskType": 1 } }

        ]).then(data => {

            let result = []
            let totalEst = 0
            data.forEach(task => {

                totalEst += parseFloat(task.estHour)

                result.push({
                    taskType: task._id.taskType,
                    estHour: task.estHour,
                })
            })

            resolve({
                totalEst: totalEst.toFixed(2),
                result
            })

        }).catch(err => reject(err))
    })
}

//-- helper function subTaskGroupBy
const subTaskGroupBy = (userName, startDate, endDate) => {

    return new Promise((resolve, reject) => {

        const queryObj = {
            "subTasks.completedAt": {
                "$gte": startDate,
                "$lte": endDate
            },
            "subTasks.assignedUser": userName
        }

        UpcomingTask.aggregate([
            {
                "$unwind": {
                    'path': '$subTasks',
                    "preserveNullAndEmptyArrays": true,
                    "includeArrayIndex": "arrayIndex"
                }
            },
            // { $sort: { "subTasks.completedAt": 1, "subTasks.name": 1 } },
            {
                $match: queryObj
            },
            {
                $group: {
                    _id: {
                        subTask: "$subTasks.name",
                    },
                    subTasks: { $push: "$subTasks" },
                    estHour: {
                        $sum: "$subTasks.estHour"
                    }
                }
            },
            { $sort: { "_id.subTask": 1 } }

        ]).then(data => {

            let result = []
            let totalEst = 0
            data.forEach(task => {

                totalEst += parseFloat(task.estHour)

                result.push({
                    subTask: task._id.subTask,
                    estHour: task.estHour,
                })
            })

            resolve({
                totalEst: totalEst.toFixed(2),
                result
            })

        }).catch(err => reject(err))
    })
}


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
        // { $sort: { "subTasks.completedAt": 1, "subTasks.name": 1 } },
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
                    completedAt: "$subTasks.completedAt",
                    // month: { $month: "$completedAt" },
                    // day: { $dayOfYear: "$completedAt" },
                    // year: { $year: "$completedAt" },
                },
                subTasks: { $push: "$subTasks" },
                estHour: {
                    $sum: "$subTasks.estHour"
                }
            }
        },
        { $sort: { "_id.completedAt": 1, "_id.taskName": 1 } }
        // { $sort: {
        //     '_id.year': 1,
        //     '_id.month': 1,
        //     '_id.day': 1
        // }}

    ]).then(data => {

        // return res.json(data)

        let result = []
        let totalEst = 0
        data.forEach(task => {

            task.subTasks.forEach(subTask => {
                totalEst += parseFloat(subTask.estHour)

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


        const projectGroup = projectGroupBy(userName, startDate, endDate)
        const taskTypeGroup = taskTypeGroupBy(userName, startDate, endDate)
        const subTaskGroup = subTaskGroupBy(userName, startDate, endDate)

        projectGroup.then(projectData => {

            taskTypeGroup.then(taskTypeData => {

                subTaskGroup.then(subTaskData => {
                    res.json({
                        totalEst: totalEst.toFixed(2),
                        result,
                        projectData,
                        taskTypeData,
                        subTaskData
                    })
                })
            })
        })

        // res.json( projectGroup)
        // const projectGroup = _.groupBy(result, 'projectName')

        // res.json({
        //     totalEst,
        //     result,
        //     projectGroup
        // })
    }).catch(err => res.json(err))
}


/**
 * -----------------------------------------------------------------------------------------
 * Report User Report Summary
 * -----------------------------------------------------------------------------------------
 */
exports.userReportSummary = async (req, res) => {

    const startDate = new Date(req.query.startDate)
    const endDate = new Date(req.query.endDate)

    const publicHolidays = await getPublicHolidays(startDate, endDate)

    // return res.json({
    //     publicHolidays
    // })

    const queryObj = {
        "subTasks.completedAt": {
            "$gte": startDate,
            "$lte": endDate
        }
    }

    const totalWorkingDays = moment().weekdayCalc({
        rangeStart: startDate,
        rangeEnd: endDate,
        weekdays: [1, 2, 3, 4, 5], //weekdays Mon to Fri
        // exclusions: ['9 Jun 2019', '8 Jun 2019', '7 Jun 2019', '6 Jun 2019', '5 Jun 2019', '4 Jun 2019', '3 Jun 2019', '2 Jun 2019']  //public holidays
        exclusions: publicHolidays  //public holidays
    })

    // return res.json({
    //     totalWorkingDays
    // })


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
        { $sort: { "estHour": -1, "_id.userName": 1 } }

    ]).then(data => {

        let result = []
        let totalEst = 0
        data.forEach(item => {

            totalEst += parseFloat(item.estHour)

            result.push({
                userName: item._id.userName,
                estHour: item.estHour,
                officeHour: totalWorkingDays * 8,
                timeLog: 140
            })
        })

        res.json({
            totalEst: totalEst.toFixed(2),
            result
        })
    }).catch(err => res.json(err))
}


//-- Report Project Summary
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
        { $sort: { estHour: -1, "_id.projectName": 1 } }

    ]).then(data => {

        let result = []
        let totalEst = 0
        data.forEach(item => {

            totalEst += parseFloat(item.estHour)

            result.push({
                projectName: item._id.projectName,
                estHour: item.estHour
            })
        })

        res.json({
            totalEst: totalEst.toFixed(2),
            result
        })
    }).catch(err => res.json(err))
}


//-- Report SubTask Summary
exports.subTaskReportSummary = (req, res) => {

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
                    "subTask": "$subTasks.name",
                },
                estHour: {
                    $sum: "$subTasks.estHour"
                }
            }
        },
        { $sort: { estHour: -1, "_id.subTask": 1 } }

    ]).then(data => {

        let result = []
        let totalEst = 0
        data.forEach(item => {

            totalEst += parseFloat(item.estHour)

            result.push({
                subTask: item._id.subTask,
                estHour: item.estHour
            })
        })

        res.json({
            totalEst: totalEst.toFixed(2),
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
        { $sort: { estHour: -1, "_id.taskType": 1 } }

    ]).then(data => {

        let result = []
        let totalEst = 0
        data.forEach(item => {

            totalEst += parseFloat(item.estHour)

            result.push({
                taskType: item._id.taskType,
                estHour: item.estHour
            })
        })

        res.json({
            totalEst: totalEst.toFixed(2),
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
                        createdBy: req.body.createdBy,
                        estHour: req.body.estHour,
                        status: req.body.status,
                        startDate: req.body.startDate,
                        dueDate: req.body.dueDate,
                        completedAt: req.body.completedAt,
                        refLink: req.body.refLink
                    }]
                }
            }
        },
        { new: true }
    ).then(result => {

        //-- update subtask percent
        updateSubTaskPercent(req.params.id)

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

        //-- update subtask percent
        updateSubTaskPercent(req.body.id)

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
                    completedAt: req.body.completedAt,
                    createdBy: req.body.createdBy,
                    createdAt: req.body.createdAt,
                    updatedBy: req.body.updatedBy,
                    updatedAt: new Date(),
                    refLink: req.body.refLink
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
            completedAt: result.completedAt,
            refLink: result.refLink
        }

        //-- update subtask percent
        updateSubTaskPercent(result._id)

        res.status(200).json({
            result: newResult
        })
    })
        .catch(err => {
            res.status(409).json({
                message: 'ID mismatch',
                err
            })
        })
}