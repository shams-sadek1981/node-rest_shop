const express = require('express');
const mongoose = require('mongoose');
const Release = require('../../models/release');
const UpcomingTask = require('../../models/upcomingTask');
const moment = require('moment')

const { queryBuilder } = require('./helperFunctions')



/**
 * ------------------------------------------------------------------------------------
 * Search upcoming task
 * ------------------------------------------------------------------------------------
 */
exports.searchUpcomingTask = (req, res) => {

    // const version = req.query.version
    const version = decodeURIComponent(req.query.version)

    UpcomingTask.find({ release: version })
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
                version,
                totalEst,
                completedEst,
                dueEst,
                percent: Math.round(percent),
                result: data
            })

        })
        .catch(err => res.json(err))
}



/**
 * ------------------------------------------------------------------------------------
 * Search
 * ------------------------------------------------------------------------------------
 */
exports.search = async (req, res) => {

    const projectName = await req.query.project
    const status = await JSON.parse((req.query.status))
    const searchText = await req.query.text
    const limit = await req.query.limit

    let sortBy = 1
    if (status == true) {
        sortBy = -1
    }

    // Release.find({})
    //     .then(doc => {
    //         return res.json({
    //             result: doc
    //         })
    //     })

    // //-- Pagination settings
    const pageNo = await req.query.page
    // const limit = 3 //-- initialize the limit / pageSize / perPage data
    const skip = pageNo * limit - limit

    // //-- Set Query Object
    const queryObj = await queryBuilder(projectName, searchText, status)


    // return res.json(
    //     queryObj
    // )

    Release.find(queryObj)
        .skip(skip).limit(limit)
        .sort({ releaseDate: sortBy })
        .then(releaseList => {

            let releaseNames = []

            //-- Transform Data
            releaseList.forEach(item => {
                releaseNames.push(item.version)
            })

            UpcomingTask.find({ release: { $in: releaseNames } })
                .exec()
                .then(tasks => {

                    const result = releaseList.map(item => {

                        const releaseTasks = tasks.filter(task => task.release == item.version)

                        const releaseStatus = releaseCalc(releaseTasks)

                        return {
                            _id: item._id,
                            status: item.status,
                            releaseDate: item.releaseDate,
                            projectName: item.projectName,
                            version: item.version,
                            description: item.description,
                            percent: releaseStatus.percent,
                            est: releaseStatus.est,
                            complete: releaseStatus.complete,
                            due: releaseStatus.due,
                        }
                    })

                    /* --- Return API Result --- */
                    res.status(200).json({result})

                }).catch(err => res.status(404).json(err))
        })
        .catch(err => {
            res.status(404).json({
                err
            })
        })
} //-- end function

// Sprint Percent Calculation
const releaseCalc = (tasks) => {

    let totalEst = 0
    let completedEst = 0

    tasks.forEach(task => {
        task.subTasks.forEach(subTask => {
            totalEst += parseFloat(subTask.estHour)
            if (subTask.completedAt) {
                completedEst += parseFloat(subTask.estHour)
            }
        })
    })

    const percent = Math.floor(parseFloat(completedEst * 100 / totalEst)) || 0

    const due = totalEst - completedEst

    return {
        percent,
        est: totalEst,
        complete: completedEst,
        due
    }
}

/**
 * ------------------------------------------------------------------------------------------------
 *  Create New
 * ------------------------------------------------------------------------------------------------
 */
exports.createNew = (req, res) => {

    const release = new Release({
        releaseDate: req.body.releaseDate,
        projectName: req.body.projectName,
        version: req.body.version,
        description: req.body.description,
    })

    release.save()
        .then(result => {
            const formatedData = {
                _id: result._id,
                releaseDate: result.releaseDate,
                projectName: result.projectName,
                version: result.version,
                description: result.description,
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
exports.releaseDelete = (req, res, next) => {
    Release.deleteOne({ _id: req.params.id })
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
 * ------------------------------------------------------------------------------------------------
 *  Update release
 * ------------------------------------------------------------------------------------------------
 */
exports.releaseUpdate = (req, res) => {

    Release.findOneAndUpdate({ _id: req.params.id }, req.body, { new: false })
        .exec()
        .then(doc => {
            const { version: oldVersion } = doc
            const { version: newVersion } = req.body

            //-- bulk update also upcoming task `release`
            UpcomingTask.updateMany(
                { release: oldVersion },
                { $set: { release: newVersion, completedAt: req.body.releaseDate } },
                { multi: true }
            ).then(data => {
                res.status(200).json(data)
            })
                .catch(err => res.json(err))


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
exports.releaseStatusUpdate = (req, res) => {

    Release.findOneAndUpdate({ _id: req.params.id }, req.body, { new: false })
        .exec()
        .then(doc => {

            const { version: findByVersion } = doc

            let upcomingTaskBody = {
                completedAt: doc.releaseDate
            }

            if (!req.body.status) {
                upcomingTaskBody.completedAt = null
            }

            //-- bulk update also upcoming task `release`
            UpcomingTask.updateMany(
                { release: findByVersion },
                { $set: upcomingTaskBody },
                { multi: true }
            ).then(data => {
                res.status(200).json(data)
            })
                .catch(err => res.json(err))


        })
        .catch(err => {

            res.status(403).json({
                message: 'Invalid id',
                err
            })
        })
}