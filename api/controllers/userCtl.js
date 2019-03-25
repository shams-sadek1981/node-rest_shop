const express = require('express');

const mongoose = require('mongoose');
const User = require('../models/user');

//-- Update user
exports.updateUser = (req, res, next) => {
    
    User.findOneAndUpdate({_id: req.params.id}, req.body, { new: true})
        .exec()
        .then( doc => {
            res.status(200).json(doc)
        })
        .catch( err => {

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
exports.getUserList = (req, res, next) => {
    User.find({})
        .exec()
        .then(result => {
            res.json({
                result
            })
        })
}