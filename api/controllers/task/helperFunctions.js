const express = require('express');
const mongoose = require('mongoose');
const UpcomingTask = require('../../models/upcomingTask');

//-- Est. Hour Calculation from subtask
exports.sumEstHourAndTotalSubTask = (queryObj={}) => {

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


//-- Build Query
exports.queryBuilder = (userName='all', projectName='all') => {

    let match = {}
    if (userName != 'all') {
        match = { "subTasks.assignedUser": userName }
    }

    if (projectName != 'all') {
        match = {
            ...match,
            projectName
        }
    }

    return match
}