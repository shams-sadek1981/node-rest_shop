const express = require('express');
const mongoose = require('mongoose');
const UpcomingTask = require('../../models/upcomingTask');

//-- Est. Hour Calculation from subtask
const sumEstHourAndTotalSubTask = (queryObj = {}) => {

    return UpcomingTask.aggregate([
        { "$unwind": "$subTasks" },
        {
            $match: queryObj
        },
        {
            "$group": {
                // _id: { taskName: "$taskName" },
                _id: null,
                // subTasks: { $push: "$subTasks" },
                estHour: { $sum: "$subTasks.estHour" },
                totalTask: { $sum: 1 }
            }
        },
        { $sort: { name: 1 } }
    ]).then(data => data)

}
exports.sumEstHourAndTotalSubTask = sumEstHourAndTotalSubTask

//-- Build Query
exports.queryBuilder = (projectName = 'all', searchText, status = false) => {

    let match = {
        $and: []
    }

    if (projectName != 'all') {
        match.$and = [
            ...match.$and,
            { projectName: projectName }
        ]
    }
    
    if (searchText != "") {
        match = {
            $and: [
                ...match.$and,
                {
                    $or: [
                        { projectName: { $regex: searchText, $options: "si" } },
                        { projectType: { $regex: searchText, $options: "si" } },
                        { version: { $regex: searchText, $options: "si" } }
                    ]
                }
            ]
        }
    }

    status = JSON.parse(status)

    //-- set status

    if (match.$and.length > 0) {
        match = {
            ...match,
            status
        }
    } else {
        match = {
            status
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

    const { status } = queryObj

    queryObj = {
        status
    }

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
        status: JSON.parse(queryObj.status)
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