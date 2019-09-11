const express = require('express');

const mongoose = require('mongoose');
const User = require('../models/user');
const UserRole = require('../models/userRole');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

//-- Update user
exports.updateUser = (req, res) => {

    bcrypt.hash(req.body.password, 10, (err, hash) => {
        if (err) {
            return res.status(500).json({
                error: err
            })
        } else {

            //Find User Role
            UserRole.find({
                name: req.body.roles
            }).then(data => {

                // Role & Permission Setup
                const roles = data.map(role => ({
                    roleName: role.name,
                    permissions: role.permissions
                }))


                const projects = req.body.projects.map(item => ({
                    projectName: item
                }))

                const user = new User({
                    email: req.body.email,
                    password: hash,
                    name: req.body.name,
                    mobile: req.body.mobile,
                    department: req.body.department,
                    roles,
                    projects
                })

                User.findOneAndUpdate({ _id: req.params.id }, user, { new: true })
                    .exec()
                    .then(doc => {


                        // get unique permissions
                        let permissionList = new Set()
                        let roleList = new Set()
                        doc.roles.forEach(item => {

                            roleList.add(item.roleName)

                            item.permissions.forEach(permission => {
                                permissionList.add(permission.permissionName)
                            })
                        })

                        //-- get projects
                        const projectList = []
                        doc.projects.forEach(item => {
                            projectList.push(item.projectName)
                        })

                        // get unique permissions
                        permissionList = [...new Set(permissionList)];
                        roleList = [...new Set(roleList)];

                        res.status(200).json({
                            _id: doc._id,
                            email: doc.email,
                            name: doc.name,
                            mobile: doc.mobile,
                            department: doc.department,
                            roles: doc.roles,
                            roleList,
                            permissionList,
                            projects: doc.projects,
                            projectList
                        })
                    })
                    .catch(err => {

                        let message = 'Invalid user id'

                        if (err.code == 11000) {
                            message = 'Email already exists'
                        }

                        res.status(403).json({
                            message,
                            err
                        })
                    })

            })
                .catch(err => res.json(err))
        }
    })



}

//-- Delete User by ID
exports.deleteUser = (req, res, next) => {

    User.deleteOne({ _id: req.params.id })
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

//-- Get User List
exports.getUserList = (req, res) => {

    const text = req.query.text
    const pageSize = JSON.parse(req.query.pageSize)

    //-- Pagination settings
    const pageNo = JSON.parse(req.query.page)
    const skip = pageNo * pageSize - pageSize

    //-- count total records
    const totalRecord = new Promise((resolve, reject) => {
        User.find({
            $or: [
                {
                    name: {
                        $regex: text,
                        $options: "si"
                    }
                },
                {
                    department: {
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
        User.find({
            $or: [
                {
                    name: {
                        $regex: text,
                        $options: "si"
                    }
                },
                {
                    department: {
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

}//-- end


//-- Get All User
exports.getAllUser = (req, res) => {
    User.find()
        .sort({
            name: 1
        })
        .exec()
        .then(data => {
            res.json(data)
        })
        .catch(err => res.status(403).json(err))
}


//-- get user permissions
exports.getUserPermissions = (req, res) => {

    const { authorization } = req.headers
    // res.json({
    //     sss: authorization
    // })

    jwt.verify(authorization, process.env.JWT_KEY, function (err, decoded) {

        if (decoded) {
            return User.findOne({ email: decoded.email })
                .exec()
                .then(data => {

                    let permissions = new Set()
                    data.roles.forEach(role => {
                        role.permissions.forEach(permission => {
                            permissions.add(permission.permissionName)
                        })
                    })

                    permissions = [...new Set(permissions)]

                    return res.json({
                        userInfo: {
                            name: data.name,
                            email: data.email,
                            mobile: data.mobile,
                            department: data.department,
                            projects: data.projects,
                            roles: data.roles,
                            permissions
                        }
                    })
                })
                .catch(err => res.json(err))

        }

        res.status(404).json({
            message: 'No data found'
        })


    });
}