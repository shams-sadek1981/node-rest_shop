const express = require('express');

const mongoose = require('mongoose');
const UpcomingTask = require('../models/upcomingTask');

//-- Create New Task
exports.createNewTask = (req, res) => {
    
    const upcomingTask = new UpcomingTask({
        taskName: req.body.taskName,
        subTask: req.body.subTask,
        description: req.body.description,
        taskType: req.body.taskType,
        projectName: req.body.projectName,
        assignedUser: req.body.assignedUser,
        estHour: req.body.estHour,
        srs: req.body.srs,
        mockup: req.body.mockup,
        design: req.body.design,
        frontend: req.body.frontend
    })

    upcomingTask.save()
        .then( result => {
            res.status(200).json({
                result
            })
        })
        .catch( err => {

            if (err.code == 11000) {
                return res.status(409).json({
                    message: 'Already exists this Taskname'
                })
            } else {
                res.status(403).json({
                    err
                })
            }
        })
}

exports.taskList = (req, res) => {

    UpcomingTask.find({})
        .exec()
        .then( result => {
            res.status(200).json({
                result
            })
        })
}


//-- Update user
exports.updateTask = (req, res) => {

    UpcomingTask.findOneAndUpdate({_id: req.params.id}, req.body, { new: true})
        .exec()
        .then( doc => {
            res.status(200).json(doc)
        })
        .catch( err => {

            let message = 'Invalid Task id'

            if (err.code == 11000) {
                message = 'Task already exists'
            }

            res.status(403).json({
                message,
                err
            })
        })
}

//-- Delete Task by ID
exports.deleteTask = (req, res, next) => {

    UpcomingTask.deleteOne({ _id: req.params.id })
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