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
                    _id: item._id,
                    name: item.name
                }
            })

            res.json({
                total: result.length,
                result
            })

        })
}

/**
 * ------------------------------------------------------------------------------------------
 * get project
 * ------------------------------------------------------------------------------------------
 */
exports.getProject = (req, res) => {

    const id = req.params.id

    Project.findById(id)
        .exec()
        .then(data => {

            res.json({
                result: data
            })

        })
}


/**
 * ------------------------------------------------------------------------------------------
 * Update project
 * ------------------------------------------------------------------------------------------
 */
exports.updateProject = (req, res) => {

    const id = req.params.id

    Project.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true })
        .exec()
        .then(data => {
            res.json({
                result: data
            })
        }).catch( err => res.status(400).json(err))
}


/**
 * ------------------------------------------------------------------------------------------
 * Delete project
 * ------------------------------------------------------------------------------------------
 */
exports.deleteProject = (req, res) => {

    Project.remove({ _id: req.params.id })
        .exec()
        .then(data => {
            res.json({
                result: data
            })
        }).catch( err => res.status(400).json(err))
}


//-- Get User List
exports.getProjectList = (req, res) => {

    const text = req.query.text
    const pageSize = JSON.parse(req.query.pageSize)

    //-- Pagination settings
    const pageNo = JSON.parse(req.query.page)
    const skip = pageNo * pageSize - pageSize

    //-- count total records
    const totalRecord = new Promise((resolve, reject) => {
        Project.find({
            $or: [
                {
                    name: {
                        $regex: text,
                        $options: "si"
                    }
                },
                {
                    description: {
                        $regex: text,
                        $options: "si"
                    }
                },
            ]
        }).count()
            .then(data => resolve(data))
            .catch(err => reject(err))
    })


    //-- total result
    const result = new Promise((resolve, reject) => {
        Project.find({
            $or: [
                {
                    name: {
                        $regex: text,
                        $options: "si"
                    }
                },
                {
                    description: {
                        $regex: text,
                        $options: "si"
                    }
                },
            ]
        })
            .sort({ name: 1 })
            .skip(skip).limit(pageSize)
            .exec()
            .then(result => resolve(result))
            .catch(err => reject(err))
    })


    Promise.all([totalRecord, result]).then(values => {

        const [totalRecord, result] = values

        res.json({
            pagination: {
                total: totalRecord,
                current: pageNo,
                pageSize
            },
            result
        })
    }).catch(err => res.json(err))
}