const express = require('express');
const mongoose = require('mongoose');
const Sprint = require('../../models/sprint');
const UpcomingTask = require('../../models/upcomingTask');
const moment = require('moment')

const { queryBuilder } = require('./helperFunctions')



/**
 * ------------------------------------------------------------------------------------
 * Search upcoming task
 * ------------------------------------------------------------------------------------
 */
exports.searchUpcomingTask = (req, res) => {

    const sprintName = decodeURIComponent(req.query.sprintName)

    UpcomingTask.find({ sprint: sprintName })
        .sort({ 
            projectName: 1,
            rate: -1,
            taskName: 1
        })    
        .exec()
        .then(data => {

            let totalEst = 0
            let completedEst = 0
            let dueEst = 0

            data.forEach(task => {
                task.subTasks.forEach(subTask => {
                    totalEst += parseFloat(subTask.estHour)
                    if (subTask.completedAt) {
                        completedEst += parseFloat(subTask.estHour)
                    } else {
                        dueEst += parseFloat(subTask.estHour)
                    }
                })
            })


            const percent = parseFloat(completedEst * 100 / totalEst) || 0

            res.json({
                sprintName,
                totalEst,
                completedEst,
                dueEst,
                percent: Math.round(percent),
                result: data
            })

        }).catch(err => res.json(err))
}



/**
 * ------------------------------------------------------------------------------------
 * Search
 * ------------------------------------------------------------------------------------
 */
exports.search = async (req, res) => {

    const project = await req.query.project
    const status = await JSON.parse((req.query.status))
    const searchText = await req.query.text
    const limit = await JSON.parse(req.query.limit)

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
    // return res.json(
    //     queryObj
    // )


    Sprint.find(queryObj)
        .skip(skip).limit(limit)
        .sort({ endDate: sortBy })
        .then(sprintList => {

            // return res.json(
            //     sprintList
            // )

            let sprintNames = []

            //-- Transform Data
            sprintList.forEach(item => {
                sprintNames.push(item.name)
            })


            UpcomingTask.find({ sprint: { $in: sprintNames } })
                .exec()
                .then(tasks => {

                    const result = sprintList.map(item => {

                        const sprintTasks = tasks.filter(task => task.sprint == item.name)

                        const sprintStatus = sprintCalc(sprintTasks)

                        const a = moment(item.endDate)
                        const b = moment()
                        restOfDays = a.diff(b, 'days') + 1

                        return {
                            _id: item._id,
                            status: item.status,
                            projects: item.projects,
                            status: item.status,
                            name: item.name,
                            startDate: item.startDate,
                            endDate: item.endDate,
                            restOfDays,
                            createdAt: item.createdAt,
                            description: item.description,
                            percent: sprintStatus.percent,
                            est: sprintStatus.est,
                            complete: sprintStatus.complete,
                            due: sprintStatus.due,
                            userDetails: sprintStatus.userDetails
                        }
                    })

                    /* --- Return API Result --- */
                    res.status(200).json(result)

                }).catch(err => res.json(err))
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
    let completedEst = 0
    let userDetails = []

    tasks.forEach(task => {
        task.subTasks.forEach(subTask => {

            let userInfo = {
                userName: subTask.assignedUser,
                estHour: subTask.estHour,
                complete: 0,
                due: subTask.estHour
            }

            totalEst += parseFloat(subTask.estHour)
            if (subTask.completedAt) {
                completedEst += parseFloat(subTask.estHour)
                userInfo.complete = subTask.estHour
                userInfo.due = 0
            }

            userDetails.push(userInfo)

        })
    })

    // userDetails: Group by and sum of estHour
    var userDetailsResult = [];
    userDetails.reduce(function (res, value) {
        if (!res[value.userName]) {
            res[value.userName] = { userName: value.userName, estHour: 0, complete: 0, due: 0 };
            userDetailsResult.push(res[value.userName])
        }

        res[value.userName].estHour += parseFloat(value.estHour);
        res[value.userName].complete += parseFloat(value.complete);
        res[value.userName].due += parseFloat(value.due);
        return res;
    }, {});

    const percent = Math.round(parseFloat(completedEst * 100 / totalEst)) || 0

    const due = totalEst - completedEst

    const userDetailsFinal = userDetailsResult.map( item => ({
        userName: item.userName,
        estHour: item.estHour,
        complete: item.complete,
        due: item.due,
        percent: Math.round(parseFloat(item.complete * 100 / item.estHour)) || 0
    }))

    userDetailsFinal.sort((a,b) => (a.percent > b.percent) ? 1 : ((b.percent > a.percent) ? -1 : 0));

    return {
        percent,
        est: totalEst,
        complete: completedEst,
        due,
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
exports.sprintDelete = (req, res, next) => {
    Sprint.deleteOne({ _id: req.params.id })
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

// /**
//  * ------------------------------------------------------------------------------------------------
//  *  Update Sprint
//  * ------------------------------------------------------------------------------------------------
//  */
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
 *  Update release status
 * ------------------------------------------------------------------------------------------------
 */
exports.sprintStatusUpdate = (req, res) => {

    Sprint.findOneAndUpdate({ _id: req.params.id }, req.body, { new: false })
        .exec()
        .then(doc => {

            res.json({
                doc
            })

            // const { version: findByVersion } = doc

            // let upcomingTaskBody = {
            //     completedAt: doc.releaseDate
            // }

            // if (!req.body.status) {
            //     upcomingTaskBody.completedAt = null
            // }

            //-- bulk update also upcoming task `release`
            // UpcomingTask.updateMany(
            //     { release: findByVersion },
            //     { $set: upcomingTaskBody },
            //     { multi: true }
            // ).then(data => {
            //     res.status(200).json(data)
            // }).catch(err => res.json(err))


        })
        .catch(err => {

            res.status(403).json({
                message: 'Invalid id',
                err
            })
        })
}