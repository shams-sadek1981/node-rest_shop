const express = require('express');
const mongoose = require('mongoose');
const Project = require('../../models/project');

/**
 * ------------------------------------------------------------------------------------------------
 *  Create New Project
 * ------------------------------------------------------------------------------------------------
 */
exports.createNewProject = (req, res) => {

    const project = new Project({
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
                    message: 'Already exists this code'
                })
            }

            res.status(403).json({
                err
            })

        })
}


/**
 * ------------------------------------------------------------------------------------------
 * get all project
 * ------------------------------------------------------------------------------------------
 */
exports.getAll = (req, res) => {

    Project.find({})
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