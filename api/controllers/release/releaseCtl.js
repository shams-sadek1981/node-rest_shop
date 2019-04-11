const express = require('express');
const mongoose = require('mongoose');
const Release = require('../../models/release');


const { queryBuilder } = require('./helperFunctions')

/**
 * ------------------------------------------------------------------------------------
 * Search
 * ------------------------------------------------------------------------------------
 */
exports.search = async (req, res) => {

    const projectName = await req.query.project
    const status = await req.query.status
    const searchText = await req.query.text

    // Release.find({})
    //     .then(doc => {
    //         return res.json({
    //             result: doc
    //         })
    //     })


    // //-- Pagination settings
    const pageNo = await req.query.page
    const limit = 3 //-- initialize the limit / pageSize / perPage data
    const skip = pageNo * limit - limit

    // //-- Set Query Object
    const queryObj = await queryBuilder(projectName, searchText, status)


    // return res.json(
    //     queryObj
    // )

    Release.find(queryObj)
    .skip(skip).limit(limit)
    .then(data => {

        //-- Transform Data
        const result = data.map(item => {
            return {
                _id: item._id,
                projectName: item.projectName,
                projectType: item.projectType,
                version: item.version,
                description: item.description
            }
        })

        res.json(
            // data,
            result
        )
    })
    .catch(err => {
        res.status(404).json({
            err
        })
    })
} //-- end function

/**
 * ------------------------------------------------------------------------------------------------
 *  Create New
 * ------------------------------------------------------------------------------------------------
 */
exports.createNew = (req, res) => {

    const release = new Release({
        projectName: req.body.projectName,
        projectType: req.body.projectType,
        version: req.body.version,
        expectedDate: req.body.expectedDate,
        description: req.body.description,
    })

    release.save()
        .then(result => {
            const formatedData = {
                _id: result._id,
                projectName: result.projectName,
                projectType: result.projectType,
                version: result.version,
                expectedDate: result.expectedDate,
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
 *  Update
 * ------------------------------------------------------------------------------------------------
 */
exports.releaseUpdate = (req, res) => {

    Release.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true })
        .exec()
        .then(doc => {
            res.status(200).json(doc)
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