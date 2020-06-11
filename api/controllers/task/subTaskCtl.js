const express = require('express');
const mongoose = require('mongoose');
const moment = require('moment');
// const moment = require('moment-timezone');
require('moment-weekday-calc');
const ObjectId = mongoose.Types.ObjectId;
const _ = require('lodash');

const UpcomingTask = require('../../models/upcomingTask');
// const TaskNo = require('../../models/taskNo');
const TaskNo = require('../../models/taskNo');
const { queryBuilder, singleUserEst, totalEst, totalTask, updateSubTaskPercent, getPublicHolidays, timeConvert } = require('./helperFunctions')


//-- helper function project group by
const projectGroupBy = (userName, startDate, endDate) => {

    return new Promise((resolve, reject) => {

        const queryObj = {
            "subTasks.completedAt": {
                "$gte": startDate,
                "$lt": endDate
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
            {
                $match: queryObj
            },
            {
                $group: {
                    _id: {
                        projectName: "$projectName",
                    },
                    // subTasks: { $push: "$subTasks" },
                    myCount: { $sum: 1 },
                    estHour: {
                        $sum: "$subTasks.estHour"
                    },
                    timeLog: {
                        $sum: "$subTasks.timeLog"
                    }
                }
            },
            { $sort: { "_id.projectName": 1 } }

        ]).then(data => {

            let result = []
            let totalEst = 0
            let totalTimeLog = 0
            data.forEach(task => {

                totalEst += parseFloat(task.estHour)
                totalTimeLog += parseFloat(task.timeLog)

                result.push({
                    projectName: task._id.projectName,
                    estHour: task.estHour,
                    timeLog: task.timeLog,
                    myCount: task.myCount,
                })
            })

            resolve({
                totalEst: totalEst.toFixed(2),
                totalTimeLog: totalTimeLog.toFixed(2),
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
                "$lt": endDate
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
                    // subTasks: { $push: "$subTasks" },
                    myCount: { $sum: 1 },
                    estHour: {
                        $sum: "$subTasks.estHour"
                    },
                    timeLog: {
                        $sum: "$subTasks.timeLog"
                    },
                }
            },
            { $sort: { "_id.taskType": 1 } }

        ]).then(data => {

            let result = []
            let totalEst = 0
            let totalTimeLog = 0

            data.forEach(task => {

                totalEst += parseFloat(task.estHour)
                totalTimeLog += parseFloat(task.timeLog)

                result.push({
                    taskType: task._id.taskType,
                    estHour: task.estHour,
                    timeLog: task.timeLog,
                    myCount: task.myCount,
                })
            })

            resolve({
                totalEst: totalEst.toFixed(2),
                totalTimeLog: totalTimeLog.toFixed(2),
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
                "$lt": endDate
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
                    // subTasks: { $push: "$subTasks" },
                    myCount: { $sum: 1 },
                    estHour: {
                        $sum: "$subTasks.estHour"
                    },
                    timeLog: {
                        $sum: "$subTasks.timeLog"
                    },
                }
            },
            { $sort: { "_id.subTask": 1 } }

        ]).then(data => {

            let result = []
            let totalEst = 0
            let totalTimeLog = 0

            data.forEach(task => {

                totalEst += parseFloat(task.estHour)
                totalTimeLog += parseFloat(task.timeLog)

                result.push({
                    subTask: task._id.subTask,
                    estHour: task.estHour,
                    timeLog: task.timeLog,
                    myCount: task.myCount,
                })
            })

            resolve({
                totalEst: totalEst.toFixed(2),
                totalTimeLog: totalTimeLog.toFixed(2),
                result
            })

        }).catch(err => reject(err))
    })
}


/**
 * -------------------------------------------------------------------------------------
 * Report User Report
 * -------------------------------------------------------------------------------------
 */
exports.userReport = async (req, res) => {



    const startDate = new Date(req.query.startDate)
    const endDate = new Date(moment(new Date(req.query.endDate)).add(1, 'days'))
    const userName = req.query.userName

    const publicHolidays = await getPublicHolidays(startDate, endDate)
    const sD = moment(req.query.startDate)
    const eD = moment(req.query.endDate).add(1, 'days')
    const totalDays = eD.diff(sD, 'days')


    const totalWorkingDays = await moment().weekdayCalc({
        rangeStart: startDate,
        rangeEnd: endDate,
        weekdays: [1, 2, 3, 4, 5], //weekdays Mon to Fri
        // exclusions: ['9 Jun 2019', '8 Jun 2019', '7 Jun 2019', '6 Jun 2019', '5 Jun 2019', '4 Jun 2019', '3 Jun 2019', '2 Jun 2019']  //public holidays
        exclusions: publicHolidays  //public holidays
    })

    // const nDate = new Date().toLocaleString('en-US', {
    //     timeZone: 'Asia/Dhaka'
    // });

    // res.json({
    //     message: 'sdfs',
    //     endDate
    // })    

    // var a = moment("2013-11-18 11:55").tz("Asia/Taipei");
    // var b = moment("2013-11-18 11:55").tz("America/Toronto");

    const queryObj = {
        "subTasks.completedAt": {
            "$gte": startDate,
            "$lt": endDate
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
                },
                timeLog: {
                    $sum: "$subTasks.timeLog"
                }
            }
        },
        { $sort: { "_id.completedAt": 1, "_id.taskName": 1 } }

    ]).then(data => {

        // return res.json(data)

        let result = []
        let totalEst = 0
        
        let totalEstWithTimeLog = 0
        let totalTaskWithTimeLog = 0

        let totalTimeLog = 0
        let totalTask = 0


        data.forEach(task => {

            task.subTasks.forEach(subTask => {
                totalEst += parseFloat(subTask.estHour)
                
                // this condition only for timeLog. It has to set zero for all data in update query script
                // totalTimeLog += (typeof subTask.timeLog != 'object')  ? parseFloat(subTask.timeLog) : 0
                totalTimeLog += parseFloat(subTask.timeLog)
                if (subTask.timeLog > 0) {
                    totalEstWithTimeLog += parseFloat(subTask.estHour)
                    totalTaskWithTimeLog ++
                }

                totalTask += parseFloat(1)

                result.push({
                    taskId: task._id._id,
                    taskName: task._id.taskName,
                    projectName: task._id.projectName,
                    taskType: task._id.taskType,
                    subTaskId: subTask._id,
                    subTask: subTask.name,
                    subTaskDescription: subTask.description,
                    assignedUser: subTask.assignedUser,
                    estHour: subTask.estHour,

                    // this condition only for timeLog. It has to set zero for all data in update query script
                    // timeLog: (typeof subTask.timeLog != 'object') ? subTask.timeLog : 0,
                    timeLog: subTask.timeLog,

                    totalTask,
                    completedAt: moment(subTask.completedAt).format('DD-MMM-YYYY')
                })
            })
        })

        /**
         * Group Reports
         * 1. Project
         * 2. Task Type
         * 3. Subtask
         */
        const projectGroup = projectGroupBy(userName, startDate, endDate)
        const taskTypeGroup = taskTypeGroupBy(userName, startDate, endDate)
        const subTaskGroup = subTaskGroupBy(userName, startDate, endDate)


        // Get efficiency
        let efficiency = 0
        if (totalTimeLog != 0 ) {
            efficiency = parseFloat(totalEstWithTimeLog * 100 / totalTimeLog).toFixed(2)
        }
        
        Promise.all([projectGroup, taskTypeGroup, subTaskGroup])
            .then(p => {
                res.json({
                    startDate: moment(startDate).format("DD-MMM-YYYY"),
                    endDate: moment(endDate).add(-1, 'days').format("DD-MMM-YYYY"),
                    totalEst: totalEst.toFixed(2),
                    efficiencyInfo : {
                        efficiency,
                        totalEstWithTimeLog,
                        totalTaskWithTimeLog,
                        totalTimeLog: totalTimeLog.toFixed(2)
                    },
                    totalTask,
                    totalDays,
                    avgTaskHour: (totalEst / totalTask).toFixed(2), // Avg working hour by task
                    publicHolidays,
                    totalWorkingDays,
                    avgHourPerDay: (totalEst / totalWorkingDays).toFixed(2),
                    avgTaskPerDay: (totalTask / totalWorkingDays).toFixed(2),
                    result,
                    projectData: p[0],
                    taskTypeData: p[1],
                    subTaskData: p[2],
                })
            }).catch(err => res.json(err))

    }).catch(err => res.json(err))
}


/**
 * -----------------------------------------------------------------------------------------
 * Report User Report Summary
 * -----------------------------------------------------------------------------------------
 */
exports.userReportSummary = async (req, res) => {

    const startDate = new Date(req.query.startDate)
    const endDate = new Date(moment(new Date(req.query.endDate)).add(1, 'days'))

    const project = req.query.project

    const publicHolidays = await getPublicHolidays(startDate, endDate)

    // return res.json({
    //     project
    // })

    let queryObj = {
        "subTasks.completedAt": {
            "$gte": startDate,
            "$lt": endDate
        }
    }

    /**
     * if get project name
     */
    if (project) {
        if (Array.isArray(project)) {
            queryObj = {
                ...queryObj,
                projectName: {
                    $in: project
                }
            }
        } else {
            queryObj = {
                ...queryObj,
                projectName: project
            }
        }
    }

    // return res.json({
    //     queryObj
    // })

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
                myCount: { $sum: 1 },
                estHour: {
                    $sum: "$subTasks.estHour"
                },
                timeLog: {
                    $sum: "$subTasks.timeLog"
                }
            }
        },
        { $sort: { "estHour": -1, "_id.userName": 1 } }

    ]).then(data => {

        let result = []
        let totalEst = 0
        let totalTask = 0
        data.forEach(item => {

            totalEst += parseFloat(item.estHour)
            totalTask += parseFloat(item.myCount)

            // get efficiency by percent
            let efficiency = 0
            if (item.timeLog) {
                efficiency = parseFloat( item.estHour * 100 / item.timeLog)
            }

            result.push({
                userName: item._id.userName,
                estHour: item.estHour,
                timeLog: item.timeLog,
                efficiency: efficiency.toFixed(2),
                myCount: item.myCount,
                officeHour: totalWorkingDays * 8
            })
        })

        res.json({
            startDate: moment(startDate).format('DD-MMM-YYYY'),
            endDate: moment(req.query.endDate).format('DD-MMM-YYYY'),
            project,
            totalEst: totalEst.toFixed(2),
            totalTask,
            result
        })
    }).catch(err => res.json(err))
}


//-- Report Project Summary
exports.projectReportSummary = (req, res) => {

    const startDate = new Date(req.query.startDate)
    const endDate = new Date(moment(new Date(req.query.endDate)).add(1, 'days'))

    const queryObj = {
        "subTasks.completedAt": {
            "$gte": startDate,
            "$lt": endDate
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
                assignedUser: { $addToSet: "$subTasks.assignedUser" },
                myCount: { $sum: 1 },
                estHour: {
                    $sum: "$subTasks.estHour"
                }
            }
        },
        { $sort: { estHour: -1, "_id.projectName": 1 } }

    ]).then(data => {

        let result = []
        let totalEst = 0
        let totalTask = 0
        data.forEach(item => {

            totalEst += parseFloat(item.estHour)
            totalTask += parseFloat(item.myCount)

            result.push({
                projectName: item._id.projectName,
                totalUser: item.assignedUser.length,
                assignedUser: item.assignedUser,
                estHour: item.estHour,
                myCount: item.myCount
            })
        })

        res.json({
            startDate: moment(startDate).format('DD-MMM-YYYY'),
            endDate: moment(req.query.endDate).format('DD-MMM-YYYY'),
            totalEst: totalEst.toFixed(2),
            totalTask,
            result
        })
    }).catch(err => res.json(err))
}


//-- Report SubTask Summary
exports.subTaskReportSummary = (req, res) => {

    const startDate = new Date(req.query.startDate)
    const endDate = new Date(moment(new Date(req.query.endDate)).add(1, 'days'))
    const project = req.query.project

    let queryObj = {
        "subTasks.completedAt": {
            "$gte": startDate,
            "$lt": endDate
        }
    }

    /**
      * if get project name
      */
    if (project) {
        if (Array.isArray(project)) {
            queryObj = {
                ...queryObj,
                projectName: {
                    $in: project
                }
            }
        } else {
            queryObj = {
                ...queryObj,
                projectName: project
            }
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
                myCount: { $sum: 1 },
                estHour: {
                    $sum: "$subTasks.estHour"
                }
            }
        },
        { $sort: { estHour: -1, "_id.subTask": 1 } }

    ]).then(data => {

        let result = []
        let totalEst = 0
        let totalTask = 0
        data.forEach(item => {

            totalEst += parseFloat(item.estHour)
            totalTask += parseFloat(item.myCount)

            result.push({
                subTask: item._id.subTask,
                estHour: item.estHour,
                myCount: item.myCount
            })
        })

        res.json({
            startDate: moment(startDate).format('DD-MMM-YYYY'),
            endDate: moment(req.query.endDate).format('DD-MMM-YYYY'),
            project,
            totalEst: totalEst.toFixed(2),
            totalTask,
            result
        })
    }).catch(err => res.json(err))
}


//-- Report Task Type Report Summary
exports.taskTypeReportSummary = (req, res) => {

    const startDate = new Date(req.query.startDate)
    const endDate = new Date(moment(new Date(req.query.endDate)).add(1, 'days'))
    const project = req.query.project

    let queryObj = {
        "subTasks.completedAt": {
            "$gte": startDate,
            "$lt": endDate
        }
    }

    /**
     * if get project name
     */
    if (project) {
        if (Array.isArray(project)) {
            queryObj = {
                ...queryObj,
                projectName: {
                    $in: project
                }
            }
        } else {
            queryObj = {
                ...queryObj,
                projectName: project
            }
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
                myCount: { $sum: 1 },
                estHour: {
                    $sum: "$subTasks.estHour"
                }
            }
        },
        { $sort: { estHour: -1, "_id.taskType": 1 } }

    ]).then(data => {

        let result = []
        let totalEst = 0
        let totalTask = 0
        data.forEach(item => {

            totalEst += parseFloat(item.estHour)
            totalTask += parseFloat(item.myCount)

            result.push({
                taskType: item._id.taskType,
                estHour: item.estHour,
                myCount: item.myCount
            })
        })

        res.json({
            startDate: moment(startDate).format('DD-MMM-YYYY'),
            endDate: moment(req.query.endDate).format('DD-MMM-YYYY'),
            project,
            totalEst: totalEst.toFixed(2),
            totalTask,
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

    let prepareObject = {
        $push: {
            subTasks: {
                $each: [{
                    name: req.body.name,
                    description: req.body.description,
                    assignedUser: req.body.assignedUser,
                    createdBy: req.body.createdBy,
                    estHour: req.body.estHour,
                    timeLog: req.body.timeLog,
                    status: req.body.status,
                    startDate: req.body.startDate,
                    dueDate: req.body.dueDate,
                    completedAt: req.body.completedAt,
                    refLink: req.body.refLink
                }]
            }
        }
    }

    //update task running status if found completedAt
    if ('completedAt' in req.body) {
        prepareObject.running = true
    }

    // return res.json({
    //     prepareObject
    // })

    UpcomingTask.findOneAndUpdate(
        { _id: req.params.id },
        prepareObject,
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


    let prepareObject = {
        $set: {
            "subTasks.$": {
                name: req.body.name,
                description: req.body.description,
                assignedUser: req.body.assignedUser,
                estHour: req.body.estHour,
                timeLog: req.body.timeLog,
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
    }

    
    // update task running status if found completedAt
    if ('completedAt' in req.body) {
        prepareObject.running = true
    }

    UpcomingTask.findOneAndUpdate(
        { "subTasks._id": req.params.id },
        prepareObject,
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