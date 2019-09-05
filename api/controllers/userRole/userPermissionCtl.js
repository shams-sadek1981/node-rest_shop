const express = require('express');
const mongoose = require('mongoose');
const moment = require('moment');
const UserPermission = require('../../models/userPermission');
const { _ } = require('lodash')


/**
 * ------------------------------------------------------------------------------------------------------
 * Role List
 * ------------------------------------------------------------------------------------------------------
 */
exports.permissionList = (req, res) => {

    UserPermission.find({})
        .exec()
        .then(data => {

            let plainOptions = []
            let result = []
            data.forEach( item => {
                plainOptions.push(item.name)
                result.push({
                    _id: item._id,
                    name: item.name,
                    description: item.description,
                })
            })


            res.status(200).json({
                result,
                plainOptions
            })
        })
        .catch(err => res.status(500).json({ error: err }))

}


/**
 * ------------------------------------------------------------------------------------------------------
 * Create Role
 * ------------------------------------------------------------------------------------------------------
 */
exports.permissionCreate = (req, res) => {
    
    const userRole = new UserPermission({
        // _id: new mongoose.Types.ObjectId(),
        name: req.body.name,
        description: req.body.description
    })

    userRole.save().then(result => {
        res.status(201).json({
            message: "User Permission created successfully",
            result
        })
    })
        .catch(err => res.status(500).json({ error: err }))

}

/**
 * ------------------------------------------------------------------------------------------------------
 * Delete Role
 * ------------------------------------------------------------------------------------------------------
 */
exports.permissionDelete = (req, res) => {
    const id = req.params.permissionId

    UserPermission.remove({ _id: id })
        .exec()
        .then(result => {
            res.status(200).json(result)
        })
        .catch(err => {
            res.status(500).json({ error: err })
        })
}


/**
 * ------------------------------------------------------------------------------------------------------
 * Update Role
 * ------------------------------------------------------------------------------------------------------
 */
exports.permissionUpdate = (req, res) => {

    UserPermission.findOneAndUpdate({ _id: req.params.permissionId }, req.body, { new: true })
        .exec()
        .then(doc => {
            res.status(200).json(doc)
        })
        .catch(err => {

            let message = 'Invalid permission id'

            if (err.code == 11000) {
                message = 'Permission already exists'
            }

            res.status(403).json({
                message,
                err
            })
        })

}