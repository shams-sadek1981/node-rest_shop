const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { checkJwt } = require('../functions');
const { deleteUser, getUserList, updateUser, getAllUser } = require('../controllers/userCtl')

//-- Delete user
router.delete('/delete/:id', checkJwt, deleteUser)

router.get('/list', checkJwt, getUserList)
router.get('/all-user', checkJwt, getAllUser)

router.put('/update/:id', checkJwt, updateUser)


router.post('/signup', (req, res) => {

    User.find({ email: req.body.email })
        .exec()
        .then(user => {
            if (user.length >= 1) {
                return res.status(409).json({
                    message: 'Email already exists'
                })
            }
        })

    bcrypt.hash(req.body.password, 10, (err, hash) => {
        if (err) {
            return res.status(500).json({
                error: err
            })
        } else {
            const user = new User({
                _id: new mongoose.Types.ObjectId(),
                email: req.body.email,
                password: hash,
                name: req.body.name,
                mobile: req.body.mobile,
                department: req.body.department
            })

            user.save()
                .then(result => {
                    res.status(201).json({
                        message: 'User Created',
                        user: result
                    })
                })
                .catch(err => {
                    error: err
                })
        }
    })
})

//-- POST Login url
router.post('/login', (req, res) => {
    User.find({ email: req.body.email })
        .exec()
        .then(user => {
            if (user.length < 1) {
                return res.status(401).json({
                    message: 'Auth Failed 1'
                })
            }

            //-- compare password
            bcrypt.compare(req.body.password, user[0].password, (err, result) => {
                if (err) {
                    return res.status(401).json({
                        message: 'Auth Failed 2'
                    })
                }

                if (result) {

                    //-- generate token
                    const token = jwt.sign(
                        {
                            email: user[0].email,
                            userId: user[0]._id
                        },
                        process.env.JWT_KEY,
                        {
                            expiresIn: "1h"
                        }
                    );

                    return res.status(200).json({
                        message: 'Auth Successful',
                        token: token
                    })
                }

                res.status(401).json({
                    message: 'Auth Failed 3'
                })
            })
        })
        .catch(err => {
            res.status(500).json({ error: err })
        })
})

module.exports = router;