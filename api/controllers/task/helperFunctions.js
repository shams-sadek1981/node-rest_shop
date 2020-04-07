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
    return text.replace(urlRegex, function (url) {
        return url;
    })
}

// sort by
function Comparator(a, b) {
    if (a[3] < b[3]) return -1;
    if (a[3] > b[3]) return 1;
    return 0;
}


/**
 * 
 * --------------------------------------------------------------------------------------
 * Import CSV file for upcoming task
 * --------------------------------------------------------------------------------------
 */
const importCsvFile = (filePath) => {

    const readDir = 'uploads/';
    let result = [];
    // fn.readCsvFile(readDir + 'upcomingTask.csv').then(readData => {
    // fn.readCsvFile(readDir + fileName).then(readData => {
    return new Promise((resolve, reject) => {

        fn.readCsvFile(filePath).then(readData => {

            readData.shift()//-- Remove Header

            // Sort by task name
            readData = readData.sort(Comparator);

            //-- create raw object
            const rawObject = readData.map(log => {

                const taskName = log[3]

                return {
                    projectName: log[0],
                    taskType: log[1],
                    assignedBy: log[2],
                    createdBy: log[2],
                    taskName: taskName.trim().toProperCase(),
                    subTask: log[4],
                    subtaskDescription: log[5],
                    estHour: log[6],
                    startDate: log[7],
                    endDate: log[8],
                    completedAt: log[9],
                    assignedUser: log[10],
                    sprint: log[11],
                }
            })

            // //-- sort by taskName
            // rawObject.sort((a, b) => {
            //     return a.taskName > b.taskName
            // })


            //-- group by taskName
            let taskName = ''
            let newArrayObject = []
            let newObject = {
                subTasks: []
            }

            rawObject.forEach(item => {

                if (taskName == item.taskName) {
                    newObject.subTasks.push({
                        name: item.subTask,
                        estHour: item.estHour,
                        startDate: item.startDate,
                        endDate: item.endDate,
                        completedAt: item.completedAt,
                        assignedUser: item.assignedUser,
                        description: item.subtaskDescription
                    })
                } else {
                    newObject = {
                        projectName: item.projectName,
                        taskType: item.taskType,
                        assignedBy: item.assignedBy,
                        taskName: item.taskName,
                        completedAt: item.completedAt,
                        sprint: item.sprint,
                        createdBy: item.createdBy,
                        subTasks: [{
                            name: item.subTask,
                            description: item.subtaskDescription,
                            // refLink: urlify(item.subtaskDescription),
                            estHour: item.estHour,
                            startDate: item.startDate,
                            endDate: item.endDate,
                            completedAt: item.completedAt,
                            assignedUser: item.assignedUser
                        }]
                    }

                    newArrayObject.push(newObject)
                }

                taskName = item.taskName
            })

            //-- set percent
            result = newArrayObject.map(item => {
                let totalEstHour = 0
                let completedHour = 0

                item.subTasks.forEach(subTask => {
                    totalEstHour += parseFloat(subTask.estHour)

                    if (subTask.completedAt) {
                        console.log('Completed At: ', subTask.completedAt)
                        completedHour += parseFloat(subTask.estHour)
                    }
                })


                // console.log('Completed Hour: ', completedHour)
                // console.log('Total. Hour: ', totalEstHour)

                return {
                    projectName: item.projectName,
                    taskType: item.taskType,
                    assignedBy: item.assignedBy,
                    taskName: item.taskName,
                    completedAt: item.completedAt,
                    sprint: item.sprint,
                    createdBy: item.createdBy,
                    percent: Math.floor(completedHour * 100 / totalEstHour) || 0,
                    subTasks: item.subTasks
                }
            })


            //-- Insert All
            UpcomingTask.insertMany(result)
                .then(data => {
                    resolve(data)

                    unlinkAsync(filePath)

                }).catch(err => reject(err))
        })

    })
}
exports.importCsvFile = importCsvFile



// get public holiday
const getPublicHolidays = (startDate, endDate) => {

    // const startDate = new Date(startDate);
    // const endDate = new Date(endDate);

    return PublicHoliday.find({
        holiday: {
            $gte: startDate,
            $lte: endDate
        }
    })
        .exec()
        .then(doc => {

            let result = []
            doc.map(item => {
                result.push(item.holiday)
                // result.push( moment(item.holiday).format("D MMM YYYY"))
            })

            return result;
        })
        .catch(err => err);
}
exports.getPublicHolidays = getPublicHolidays


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


/**
 * Number To Time Convert
 * 
 */
const timeConvert = (num) => {
    var hours = (num / 60);
    var rhours = Math.floor(hours);
    var minutes = (hours - rhours) * 60;
    var rminutes = Math.round(minutes);
    return num + " minutes = " + rhours + " hour(s) and " + rminutes + " minute(s).";
}
exports.timeConvert = timeConvert



/**
 * Build Query
 * 
 * 
 */
exports.queryBuilder = (userName = 'all', projectName = 'all', searchText = "", running = false, completedAt = null, releaseStatus = 'all') => {

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


    /**
     * set Release Status
     */
    if (releaseStatus != 'all') {

        if (releaseStatus == 'release') {
            match.$and = [
                ...match.$and,
                { release: { $ne: null } }
            ]
        } else {
            match.$and = [
                ...match.$and,
                { release: { $eq: null } }
            ]
        }

    }

    /**
     * set User name
     */
    if (userName != 'all') {
        match.$and = [
            ...match.$and,
            // { "subTasks.status": status },
            { "subTasks.assignedUser": userName }
        ]
    }

    /**
     * set Project name
     * 
     */
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