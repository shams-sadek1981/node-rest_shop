const express = require('express');
const mongoose = require('mongoose');
const moment = require('moment');
const UserRole = require('../../models/userRole');
const User = require('../../models/user');
const { _ } = require('lodash')


/**
 * ------------------------------------------------------------------------------------------------------
 * get Role
 * ------------------------------------------------------------------------------------------------------
 */
exports.getRole = (req, res) => {

    const roleId = req.params.roleId

    UserRole.findById(roleId)
        .exec()
        .then(data => {

            let checkedList = []
            data.permissions.forEach(item => {
                checkedList.push(item.permissionName)
            })

            const result = {
                _id: data._id,
                name: data.name,
                description: data.description,
                permissions: data.permissions,
                checkedList: checkedList,
            }

            res.status(200).json({
                ...result
            })
        })
        .catch(err => res.status(500).json({ error: err }))

}

/**
 * ------------------------------------------------------------------------------------------------------
 * Role List
 * ------------------------------------------------------------------------------------------------------
 */
exports.roleList = (req, res) => {

    UserRole.find({})
        .exec()
        .then(result => {
            res.status(200).json({
                result
            })
        })
        .catch(err => res.status(500).json({ error: err }))

}


/**
 * ------------------------------------------------------------------------------------------------------
 * Create Role
 * ------------------------------------------------------------------------------------------------------
 */
exports.roleCreate = (req, res) => {

    const userRole = new UserRole({
        // _id: new mongoose.Types.ObjectId(),
        name: req.body.name,
        description: req.body.description
    })

    userRole.save().then(result => {
        res.status(201).json({
            message: "User Role created successfully",
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
exports.roleDelete = (req, res) => {

    const id = req.params.roleId

    UserRole.findById(id)
        .then(role => {

            UserRole.remove({ _id: id })
                .exec()
                .then(result => {

                    //-- update permission into the users
                    User.updateMany({ "roles.roleName": role.name },
                        {
                            $pull: { "roles" : { roleName: role.name } } 
                        },
                        { multi: true })
                        .then(data => res.json({
                            message: 'Role Deleted Successfully',
                            role
                        })).catch(err => res.json(err))
                })
                .catch(err => {
                    res.status(500).json({ error: err })
                })

        }).catch(err => console.log(err))


}


/**
 * ------------------------------------------------------------------------------------------------------
 * Update Role
 * ------------------------------------------------------------------------------------------------------
 */
exports.roleUpdate = (req, res) => {

    UserRole.findOneAndUpdate({ _id: req.params.roleId }, req.body, { new: true })
        .exec()
        .then(role => {

            // return res.json({
            //     message: role
            // })
            // console.log('doc', doc)
            let checkedList = []
            role.permissions.forEach(item => {
                checkedList.push(item.permissionName)
            })

            //-- update permission into the users
            User.updateMany({ "roles.roleName": role.name },
                {
                    $set: {
                        "roles.$": {
                            roleName: role.name,
                            permissions: role.permissions
                        }
                    }
                },
                { multi: true })
                .then(data => res.json(data)).catch(err => res.json(err))

            res.status(200).json({
                _id: role._id,
                name: role.name,
                description: role.description,
                permissions: role.permissions,
                checkedList
            })

        })
        .catch(err => {

            let message = 'Invalid role id'

            if (err.code == 11000) {
                message = 'Role already exists'
            }

            res.status(403).json({
                message,
                err
            })
        })

}