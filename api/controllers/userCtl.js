const express = require('express');

const mongoose = require('mongoose');
const User = require('../models/user');
const bcrypt = require('bcrypt');

//-- Update user
exports.updateUser = (req, res) => {

    bcrypt.hash(req.body.password, 10, (err, hash) => {
        if (err) {
            return res.status(500).json({
                error: err
            })
        } else {
            const user = new User({
                email: req.body.email,
                password: hash,
                name: req.body.name,
                mobile: req.body.mobile,
                department: req.body.department
            })

            User.findOneAndUpdate({ _id: req.params.id }, user, { new: true })
                .exec()
                .then(doc => {
                    res.status(200).json(doc)
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
}


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
        .catch( err => res.status(403).json(err))
}