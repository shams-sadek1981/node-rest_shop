const express = require('express');
const mongoose = require('mongoose');
const TaskType = require('../../models/taskType');

/**
 * ------------------------------------------------------------------------------------------------
 *  Create New Task Type
 * ------------------------------------------------------------------------------------------------
 */
exports.createNewTaskType = (req, res) => {

    const project = new TaskType({
        name: req.body.name,
    })

    project.save()
        .then(result => {
            res.json(result)
        })
        .catch(err => {

            //-- check duplicate entry
            if (err.code == 11000) {
                return res.status(409).json({
                    message: 'Already exists this task type'
                })
            }

            res.status(403).json({
                err
            })

        })
}


/**
 * ------------------------------------------------------------------------------------------
 * get all task Type
 * ------------------------------------------------------------------------------------------
 */
exports.getAll = (req, res) => {

    TaskType.find({})
        .sort({ name: 'asc' })
        .exec()
        .then(data => {

            const result = data.map(item => {
                return {
                    name: item.name
                }
            })

            res.json({
                total: result.length,
                result
            })

        })
}