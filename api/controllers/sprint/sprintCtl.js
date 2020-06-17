const express = require('express');
const mongoose = require('mongoose');
const Sprint = require('../../models/sprint');
const User = require('../../models/user');
const UpcomingTask = require('../../models/upcomingTask');
const moment = require('moment')

const { queryBuilder, getUsersBySprint } = require('./helperFunctions')


/**
 * ------------------------------------------------------------------------------------
 * Sprint Search by date range
 * ------------------------------------------------------------------------------------
 */
const sprintSearch = () => {

    const startDate = new Date(req.query.startDate)
    const endDate = new Date(moment(new Date(req.query.endDate)).add(1, 'days'))
    const project = req.query.project

    let queryObj = {
        "startDate": {
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
                projects: {
                    $in: project
                }
            }
        } else {
            queryObj = {
                ...queryObj,
                projects: project
            }
        }
    }


    Sprint.find(queryObj)
        .then(data => {
            res.json({
                data
            })
        }).catch(err => res.status(400).json(err))

}


/**
 * Processing Sprint Data
 */
const processingSprint = (sprintData, assignedUser = null) => {

    const sprints = sprintData.map(doc => doc.name)

    let queryObj = {
        sprint: {
            $in: sprints
        }
    }

    if (assignedUser != null) {
        queryObj = {
            $and: [
                queryObj,
                {
                    "subTasks.assignedUser": assignedUser
                }
            ]
        }
    }


    return new Promise((resolve, reject) => {

        UpcomingTask.find(queryObj)
            .sort({"subTasks.assignedUser": 1})
            // .sort({ _id: -1 })
            .then(data => {

                // data format
                const result = data.map(item => {

                    let estHour = 0
                    let timeLog = 0
                    
                    const newSubTasks = item.subTasks.map(subTask => {
                        estHour += parseFloat(subTask.estHour)
                        timeLog += subTask.timeLog ? parseFloat(subTask.timeLog) : 0

                        let efficiency = 0
                        if (subTask.timeLog > 0) {
                            if (subTask.completedAt) {
                                efficiency = parseFloat(subTask.estHour) * 100 / parseFloat(subTask.timeLog)
                            }
                        }

                        return {
                            _id: subTask._id,
                            status: subTask.status,
                            createdAt: subTask.createdAt,
                            name: subTask.name,
                            description: subTask.description,
                            assignedUser: subTask.assignedUser,
                            estHour: subTask.estHour,
                            startDate: subTask.startDate,
                            dueDate: subTask.dueDate,
                            completedAt: subTask.completedAt,
                            timeLog: subTask.timeLog || 0,
                            efficiency
                        }
                    })

                    return {
                        ...item._doc,
                        estHour,
                        timeLog,
                        subTasks: newSubTasks
                    }
                })


                const sprintCalculation = sprintCalcWithEfficiency(result)

                resolve({
                    ...sprintCalculation,
                    result
                })

                return {

                }

            }).catch(err => reject(err))

    })



}


/**
 * ------------------------------------------------------------------------------------
 * Sprint Report
 * ------------------------------------------------------------------------------------
 */
exports.sprintReport = (req, res) => {


    const startDate = new Date(req.query.startDate)
    const endDate = new Date(moment(new Date(req.query.endDate)).add(1, 'days'))
    const project = req.query.project
    const assignedUser = req.query.assignedUser

    let queryObj = {
        "startDate": {
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
                projects: {
                    $in: project
                }
            }
        } else {
            queryObj = {
                ...queryObj,
                projects: project
            }
        }
    }


    Sprint.find(queryObj)
        .then(sprintData => {

            processingSprint(sprintData, assignedUser)
                .then(summary => res.json({ sprintData, summary }))
                .catch(err => res.status(400).json(err))

        }).catch(err => res.status(400).json(err))

}


/**
 * ------------------------------------------------------------------------------------
 * Search upcoming task for Sprint Result
 * ------------------------------------------------------------------------------------
 */
exports.searchUpcomingTask = (req, res) => {

    const sprintName = decodeURIComponent(req.query.sprintName)

    // search by sprint name
    let queryObj = {
        sprint: sprintName
    }

    // Search by assigned user
    if (req.query.assignedUser) {
        queryObj = {
            $and: [
                queryObj,
                {
                    "subTasks.assignedUser": req.query.assignedUser
                }
            ]
        }
    }

    UpcomingTask.find(queryObj)
        // .sort({ rate: -1 })
        .sort({ _id: -1 })
        .then(data => {

            // data format
            const result = data.map(item => {

                let estHour = 0
                let timeLog = 0

                const newSubTasks = item.subTasks.map(subTask => {
                    estHour += subTask.estHour
                    timeLog += parseFloat(subTask.timeLog)

                    let efficiency = 0
                    if (subTask.timeLog > 0) {
                        if (subTask.completedAt) {
                            efficiency = parseFloat(subTask.estHour) * 100 / parseFloat(subTask.timeLog)
                        }
                    }

                    return {
                        _id: subTask._id,
                        status: subTask.status,
                        createdAt: subTask.createdAt,
                        name: subTask.name,
                        description: subTask.description,
                        assignedUser: subTask.assignedUser,
                        estHour: subTask.estHour,
                        startDate: subTask.startDate,
                        dueDate: subTask.dueDate,
                        completedAt: subTask.completedAt,
                        timeLog: subTask.timeLog,
                        efficiency
                    }

                })


                return {
                    ...item._doc,
                    estHour,
                    timeLog,
                    subTasks: newSubTasks
                }
            })


            // Sprint Calculation
            UpcomingTask.find({ sprint: sprintName })
                .exec()
                .then(sprintResult => {

                    const sprintCalculation = sprintCalc(sprintResult)

                    res.json({
                        sprintName,
                        ...sprintCalculation,
                        result
                    })
                }).catch(err => res.json(err))

        }).catch(err => {
            res.status(404).json({
                err
            })
        })
}



/**
 * ------------------------------------------------------------------------------------
 * Search
 * ------------------------------------------------------------------------------------
 */
exports.search = async (req, res) => {

    // return res.json({
    //     message: 'sdfs'
    // })

    const project = await req.query.project
    const status = await JSON.parse((req.query.status))
    const searchText = await req.query.text
    const limit = await JSON.parse(req.query.pageSize)

    // return res.json({
    //     project,
    //     status,
    //     searchText,
    //     limit
    // })

    let sortBy = 1
    if (status == true) {
        sortBy = -1
    }


    // //-- Pagination settings
    const pageNo = await JSON.parse(req.query.page)
    // const limit = 3 //-- initialize the limit / pageSize / perPage data
    const skip = pageNo * limit - limit

    // //-- Set Query Object
    const queryObj = await queryBuilder(project, searchText, status)


    // get all users

    // const users = await User.find({ projects: { $exists: true, $not: { $size: 0 } } })




    // const userResult1 = await users.filter( item => item._id == "5d84b982e2ceca298eaea5ee")


    /**
     * Search Sprint by query obj
     * 
     * 
     */
    Sprint.find(queryObj)
        .skip(skip).limit(limit)
        .sort({ endDate: sortBy })
        .then(async sprintList => {

            // check result is empty or not
            if (sprintList === undefined || sprintList.length == 0) {
                return res.status(200).json({
                    pagination: {
                        current: 1,
                        total: 0,
                        pageSize: 10
                    },
                    result: [],
                    message: 'No data found'
                })
            }


            let sprintNames = []
            let projects = [] // for find user list
            //-- Transform Data
            sprintList.forEach(item => {
                sprintNames.push(item.name)

                projects.push(...item.projects)

            })


            // Create unique elements for project list
            projects = [...new Set(projects)]

            // get all user by project list
            let allUsers = await User.find({ "projects.projectName": { $in: projects } })

            allUsers = allUsers.map(item => ({
                name: item.name,
                projects: item.projects
            }))


            // return res.json({
            //     allUsers,
            //     sprintList
            // })

            UpcomingTask.find({ sprint: { $in: sprintNames } })
                .exec()
                .then(tasks => {

                    const result = sprintList.map(sprint => {

                        const sprintTasks = tasks.filter(task => task.sprint == sprint.name)

                        const sprintStatus = sprintCalc(sprintTasks)

                        const a = moment(sprint.endDate)
                        const b = moment()
                        restOfDays = a.diff(b, 'days') + 1


                        return {
                            _id: sprint._id,
                            status: sprint.status,
                            projects: sprint.projects,
                            users: getUsersBySprint(allUsers, sprint),
                            status: sprint.status,
                            name: sprint.name,
                            startDate: sprint.startDate,
                            endDate: sprint.endDate,
                            restOfDays,
                            createdAt: sprint.createdAt,
                            description: sprint.description,
                            percent: sprintStatus.percent,
                            est: sprintStatus.est,
                            complete: sprintStatus.complete,
                            due: sprintStatus.due,
                            userDetails: sprintStatus.userDetails
                        }
                    })


                    /* --- Return API Result --- */
                    // get Total Sprint data
                    Sprint.aggregate([
                        {
                            $match: queryObj
                        },
                        { $group: { _id: null, count: { $sum: 1 } } }
                    ]).then(doc => {


                        /**
                         * 
                         * Return Result with pagination
                         */
                        res.status(200).json({
                            pagination: {
                                total: doc[0].count,
                                current: pageNo,
                                pageSize: limit
                            },
                            result
                        })
                    }).catch(err => res.status(404).json(err))

                }).catch(err => res.status(404).json(err))
        })
        .catch(err => {
            res.status(404).json({
                err
            })
        })
} //-- end function


// Sprint Percent Calculation
const sprintCalc = (tasks) => {

    let totalEst = 0
    let totalTimeLog = 0

    let completedEst = 0
    let userDetails = []

    tasks.forEach(task => {
        task.subTasks.forEach(subTask => {

            let userInfo = {
                userName: subTask.assignedUser,
                estHour: parseFloat(subTask.estHour).toFixed(2),
                timeLog: parseFloat(subTask.timeLog).toFixed(2),
                complete: 0,
                completedTask: 0,
                due: parseFloat(subTask.estHour).toFixed(2)
            }

            // totalEst += parseFloat(subTask.estHour).toFixed(2)
            totalEst += subTask.estHour
            totalTimeLog += parseFloat(subTask.timeLog)

            if (subTask.completedAt) {
                completedEst += subTask.estHour
                userInfo.complete = parseFloat(subTask.estHour).toFixed(2)
                userInfo.completedTask++
                userInfo.due = 0
            }

            userDetails.push(userInfo)

        })
    })

    // userDetails: Group by and sum of estHour
    var userDetailsResult = [];
    userDetails.reduce(function (res, value) {
        if (!res[value.userName]) {
            res[value.userName] = { userName: value.userName, estHour: 0, timeLog: 0, complete: 0, due: 0, taskCount: 0, completedTask: 0 };
            userDetailsResult.push(res[value.userName])
        }

        res[value.userName].estHour += parseFloat(value.estHour);
        res[value.userName].timeLog += parseFloat(value.timeLog);
        res[value.userName].complete += parseFloat(value.complete);
        res[value.userName].completedTask += parseFloat(value.completedTask);
        res[value.userName].due += parseFloat(value.due);
        res[value.userName].taskCount++;
        return res;
    }, {});

    const percent = Math.round(parseFloat(completedEst * 100 / totalEst)) || 0

    const due = totalEst - completedEst

    const userDetailsFinal = userDetailsResult.map(item => ({
        userName: item.userName,
        estHour: item.estHour,
        timeLog: item.timeLog,
        complete: item.complete,
        completedTask: item.completedTask,
        incompleteTask: parseInt(item.taskCount) - parseInt(item.completedTask),
        due: item.due,
        taskCount: item.taskCount,
        percent: Math.round(parseFloat(item.complete * 100 / item.estHour)) || 0
    }))

    userDetailsFinal.sort((a, b) => (a.percent > b.percent) ? 1 : ((b.percent > a.percent) ? -1 : 0));

    return {
        percent,
        est: totalEst.toString().match(/\.\d+/) ? parseFloat(totalEst).toFixed(2) : totalEst,
        timeLog: totalTimeLog.toString().match(/\.\d+/) ? parseFloat(totalTimeLog).toFixed(2) : totalTimeLog,
        complete: completedEst.toString().match(/\.\d+/) ? parseFloat(completedEst).toFixed(2) : completedEst,
        due: due.toString().match(/\.\d+/) ? parseFloat(due).toFixed(2) : due,
        userDetails: userDetailsFinal
    }
}


/**
 * Sprint Calculation With Efficiency
 * @param {*} tasks 
 * 
 */
const sprintCalcWithEfficiency = (tasks) => {

    let totalEst = 0
    let totalTimeLog = 0
    let totalTask = 0

    let completedEst = 0
    let userDetails = []

    tasks.forEach(task => {
        task.subTasks.forEach(subTask => {

            totalTask++

            let userInfo = {
                userName: subTask.assignedUser,
                estHour: parseFloat(subTask.estHour).toFixed(2),
                timeLog: parseFloat(subTask.timeLog).toFixed(2),
                efficiency: parseFloat(subTask.efficiency).toFixed(2),
                complete: 0,
                completedTask: 0,
                due: parseFloat(subTask.estHour).toFixed(2)
            }

            // totalEst += parseFloat(subTask.estHour).toFixed(2)
            totalEst += subTask.estHour
            totalTimeLog += parseFloat(subTask.timeLog)

            if (subTask.completedAt) {
                completedEst += subTask.estHour
                userInfo.complete = parseFloat(subTask.estHour).toFixed(2)
                userInfo.completedTask++
                userInfo.due = 0
            }

            userDetails.push(userInfo)

        })
    })

    // userDetails: Group by and sum of estHour
    var userDetailsResult = [];
    userDetails.reduce(function (res, value) {
        if (!res[value.userName]) {
            res[value.userName] = { userName: value.userName, estHour: 0, timeLog: 0, complete: 0, due: 0, taskCount: 0, efficiency: 0, completedTask: 0 };
            userDetailsResult.push(res[value.userName])
        }

        res[value.userName].estHour += parseFloat(value.estHour);
        res[value.userName].timeLog += parseFloat(value.timeLog);
        res[value.userName].complete += parseFloat(value.complete);
        res[value.userName].completedTask += parseFloat(value.completedTask);
        res[value.userName].due += parseFloat(value.due);
        res[value.userName].taskCount++;
        res[value.userName].efficiency += parseFloat(value.efficiency);
        return res;
    }, {});

    const percent = Math.round(parseFloat(completedEst * 100 / totalEst)) || 0

    const due = totalEst - completedEst

    const userDetailsFinal = userDetailsResult.map(item => {

        const efficiency = (item.efficiency / item.taskCount).toFixed(2)

        return {
            userName: item.userName,
            estHour: item.estHour.toFixed(2),
            timeLog: item.timeLog,
            efficiency: parseFloat(efficiency),
            complete: item.complete.toFixed(2),
            completedTask: item.completedTask,
            incompleteTask: parseInt(item.taskCount) - parseInt(item.completedTask),
            due: item.due.toFixed(2),
            taskCount: item.taskCount,
            percent: Math.round(parseFloat(item.complete * 100 / item.estHour)) || 0
        }
    })

    userDetailsFinal.sort((a, b) => (a.percent > b.percent) ? 1 : ((b.percent > a.percent) ? -1 : 0));

    return {
        percent,
        totalTask,
        est: totalEst.toString().match(/\.\d+/) ? parseFloat(totalEst).toFixed(2) : totalEst,
        timeLog: totalTimeLog.toString().match(/\.\d+/) ? parseFloat(totalTimeLog).toFixed(2) : totalTimeLog,
        complete: completedEst.toString().match(/\.\d+/) ? parseFloat(completedEst).toFixed(2) : completedEst,
        due: due.toString().match(/\.\d+/) ? parseFloat(due).toFixed(2) : due,
        userDetails: userDetailsFinal
    }
}

/**
 * ------------------------------------------------------------------------------------------------
 *  Create New
 * ------------------------------------------------------------------------------------------------
 */
exports.createNew = (req, res) => {

    const sprint = new Sprint({
        name: req.body.name,
        description: req.body.description,
        startDate: new Date(req.body.startDate),
        endDate: req.body.endDate,
        projects: req.body.projects,
    })

    sprint.save()
        .then(result => {
            const formatedData = {
                _id: result._id,
                sprintName: result.sprintName,
                description: result.description,
                startDate: result.startDate,
                endDate: result.endDate,
                projects: req.body.projects,
                createdAt: result.createdAt
            }

            res.status(200).json(formatedData)

        })
        .catch(err => {
            res.status(403).json({
                err
            })
        })
}


/**
 * ------------------------------------------------------------------------------------------------
 *  Delete
 * ------------------------------------------------------------------------------------------------
 */
exports.sprintDelete = async (req, res, next) => {

    const result = await Sprint.findById({ _id: req.params.id })

    const sprintName = await result.name

    Sprint.deleteOne({ _id: req.params.id })
        .exec()
        .then(docs => {
            /**
              * Delete tasks from upcoming task
              */
            UpcomingTask.deleteMany({
                sprint: sprintName
            }).then(doc => {
                res.json({
                    message: 'Successfully deleted',
                    docs,
                    doc
                })
            })
        })
        .catch(err => {
            res.status(500).json({ error: err })
        })
}

/**
* ------------------------------------------------------------------------------------------------
*  Update Sprint
* ------------------------------------------------------------------------------------------------
*/
exports.sprintUpdate = (req, res) => {

    Sprint.findOneAndUpdate({ _id: req.params.id }, req.body, { new: false })
        .exec()
        .then(doc => {

            const { name: oldSprintName } = doc
            const { name: newSprintName } = req.body

            //-- bulk update also upcoming task `release`
            UpcomingTask.updateMany(
                { sprint: oldSprintName },
                { $set: { sprint: newSprintName } },
                { multi: true }
            ).then(data => {
                res.status(200).json(data)
            }).catch(err => res.json(err))


        })
        .catch(err => {

            let message = 'Invalid id'

            if (err.code == 11000) {
                message = 'Already exists'
            }
            res.status(403).json({
                message,
                err
            })
        })
}


/**
 * ------------------------------------------------------------------------------------------------
 *  Update sprint status
 * ------------------------------------------------------------------------------------------------
 */
exports.sprintStatus = (req, res) => {

    Sprint.findOneAndUpdate({ _id: req.params.id }, req.body, { new: false })
        .exec()
        .then(doc => {

            const { name: findBySprint } = doc

            let upcomingTaskBody = {
                completedAt: moment(new Date()).format('YYYY-MMM-DD')
            }

            if (!req.body.status) {
                upcomingTaskBody.completedAt = null
            }

            //-- bulk update also upcoming task `sprint`
            UpcomingTask.updateMany(
                { sprint: findBySprint },
                { $set: upcomingTaskBody },
                { multi: true }
            ).then(data => {
                res.status(200).json(data)
            }).catch(err => res.json(err))

        })
        .catch(err => {

            res.status(403).json({
                message: 'Invalid id',
                err
            })
        })
}


/**
 * ------------------------------------------------------------------------------------------------
 *  Update sprint status
 * ------------------------------------------------------------------------------------------------
 */
exports.sprintStatusUpdate = (req, res) => {

    const sprintName = req.params.sprintName

    // Sprint Calculation
    UpcomingTask.find({ sprint: sprintName })
        // .exec()
        .then(sprintResult => {

            const sprintCalculation = sprintCalc(sprintResult)

            const sprintStatus = {
                est: sprintCalculation.est,
                complete: sprintCalculation.complete,
                due: sprintCalculation.due,
                percent: sprintCalculation.percent
            }

            const body = {
                sprintStatus,
                usersStatus: sprintCalculation.userDetails
            }


            // Update Sprint Status
            Sprint.findOneAndUpdate({ name: sprintName }, body, { new: true })
                .then(doc => {
                    res.json(doc)
                })
                .catch(err => res.json(err))

        }).catch(err => {
            return res.json(err)
        })

}