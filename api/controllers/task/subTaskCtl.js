const express = require('express');
const mongoose = require('mongoose');
const UpcomingTask = require('../../models/upcomingTask');

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
                        estHour: req.body.estHour,
                        status: req.body.status,
                        startDate: req.body.startDate,
                        dueDate: req.body.dueDate,
                        completedAt: req.body.completedAt
                    }]
                }
            }
        },
        { new: true }
    ).then(result => {
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
    if(req.body.completedAt==null){
        status = false
    }

    console.log("Completed At: ",req.body.completedAt)

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
                    completedAt: req.body.completedAt
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
            completedAt: result.completedAt
        }

        res.status(200).json({
            result: 'newResult'
        })
    })
        .catch(err => {
            res.status(409).json({
                err
            })
        })
}