const express = require('express');
const mongoose = require('mongoose');
const UpcomingTask = require('../../models/upcomingTask');
const PublicHoliday = require('../../models/publicHoliday');
const ObjectId = mongoose.Types.ObjectId;
const fn = require('../../functions.js')

const fs = require('fs')
const { promisify } = require('util')
const unlinkAsync = promisify(fs.unlink)


// check http or url exists
function urlify(text) {
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function(url) {
        return url;
    })
}


//-- Est. Hour Calculation from subtask
const sumEstHourAndTotalSubTask = (queryObj = {}) => {

    const { completedAt } = queryObj.$and

    return UpcomingTask.aggregate([
        { "$unwind": "$subTasks" },
        {
            $match: {
                $and: [
                    queryObj,
                    { "subTasks.completedAt": completedAt }
                ]
            }
        },
        {
            "$group": {
                _id: null,
                estHour: { $sum: "$subTasks.estHour" },
                totalTask: { $sum: 1 }
            }
        },
        { $sort: { name: 1 } }
    ]).then(data => data)

}
exports.sumEstHourAndTotalSubTask = sumEstHourAndTotalSubTask



//-- Build Query
exports.queryBuilder = (userName = 'all', projectName = 'all', searchText = "", running = false, completedAt = null) => {

    // status = JSON.parse(status)
    let match = {
        $and: [
        ]
    }

    //-- CompletedAt == null
    if (completedAt == null) {
        match.$and = [
            ...match.$and,
            { completedAt: { $eq: null } },
            { running: running }
        ]
    } else {
        match.$and = [
            ...match.$and,
            { completedAt: { $ne: null } }
        ]
    }


    if (userName != 'all') {
        match.$and = [
            ...match.$and,
            // { "subTasks.status": status },
            { "subTasks.assignedUser": userName }
        ]
    }

    if (projectName != 'all') {

        if (!Array.isArray(projectName)) projectName = [projectName]

        match.$and = [
            ...match.$and,
            { projectName: { $in: projectName } }
        ]
    }

    if (searchText != "") {
        match = {
            $and: [
                ...match.$and,
                {
                    $or: [
                        { taskName: { $regex: searchText, $options: "si" } },
                        { assignedBy: { $regex: searchText, $options: "si" } },
                        { release: { $regex: searchText, $options: "si" } },
                        { sprint: { $regex: searchText, $options: "si" } },
                        {
                            $and: [
                                { "subTasks.name": { $regex: searchText, $options: "si" } },
                            ]
                        },
                    ]
                }
            ]
        }
    }

    return match
}


//-- Single user
const singleUserEst = async (queryObj) => {

    let userEstHour = 0
    let userTotalSubTask = 0

    const userResult = await sumEstHourAndTotalSubTask(queryObj)

    if (userResult.length > 0) {
        userEstHour = userResult[0].estHour
        userTotalSubTask = userResult[0].totalTask
    }

    return {
        userEstHour,
        userTotalSubTask
    }
}
exports.singleUserEst = singleUserEst

//-- Total Est
exports.totalEst = async (queryObj) => {

    // const { status } = queryObj

    // queryObj = {
    //     status
    // }

    let totalEstHour = 0
    let totalSubTask = 0
    const totalResult = await sumEstHourAndTotalSubTask(queryObj)


    if (totalResult.length > 0) {
        totalEstHour = totalResult[0].estHour
        totalSubTask = totalResult[0].totalTask
    }

    return {
        totalEstHour,
        totalSubTask
    }
}


//-- Count Total Tasks
exports.totalTask = (queryObj) => {

    const query = {
        ...queryObj,
        // status: JSON.parse(queryObj.status)
    }

    return UpcomingTask.aggregate([
        // {
        //     "$unwind": {
        //         'path': '$subTasks',
        //         "preserveNullAndEmptyArrays": true,
        //         "includeArrayIndex": "arrayIndex"
        //     }
        // },
        {
            $match: query
        },
        {
            "$group": {
                _id: null,
                totalTasks: { $sum: 1 }
            }
        },
    ]).then(data => {
        if (data.length > 0) {
            return data[0].totalTasks
        } else {
            return 0
        }
    })
}



//-- SubTask Percent -------
exports.updateSubTaskPercent = (id) => {

    const totalEstHour = new Promise((resolve, reject) => {
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
                    _id: ObjectId(id)
                }
            },
            {
                $group: {
                    _id: null,
                    estHour: {
                        $sum: "$subTasks.estHour"
                    }
                }
            }
        ])
            .then(data => {
                resolve(data[0].estHour)
            })
            .catch(err => {
                resolve(0)
            })
    })

    const totalCompletedHour = new Promise((resolve, reject) => {
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
                    _id: ObjectId(id),
                    "subTasks.completedAt": { $ne: null }
                }
            },
            {
                $group: {
                    _id: null,
                    estHour: {
                        $sum: "$subTasks.estHour"
                    }
                }
            }
        ])
            .then(data => {
                resolve(data[0].estHour)
            })
            .catch(err => {
                resolve(0)
            })
    })


    Promise.all([totalEstHour, totalCompletedHour]).then(values => {

        const estHour = values[0] || 0
        const completedHour = values[1] || 0

        const percent = Math.floor(completedHour * 100 / estHour) || 0

        UpcomingTask.findOneAndUpdate({ _id: id }, {
            percent
        }, { new: true })
            .then(data => {
                // console.log(data)
                return data
            }).catch(err => err)

    });

}