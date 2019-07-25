const express = require('express');
const router = express.Router();
const moment = require('moment');

const mongoose = require('mongoose');
const PublicHoliday = require('../models/publicHoliday');
const checkAuth = require('../middleware/check-auth');
// const productsCtl=require('../controllers/productsCtl');

// router.get('/', productsCtl.getAllProducts)

router.get('/', (req, res) => {

    const startDate = new Date(req.query.startDate);
    const endDate = new Date(req.query.endDate);

    PublicHoliday.find({
        holiday: {
            $gte: startDate,
            $lte: endDate
        }
    })
        .exec()
        .then( doc => {
            
            const result = doc.map( item => {
                
                return {
                    holoday: item.holiday,
                    description: item.description
                }
            })

            res.json(
                result
            )
        })
        .catch( err => res.json(err));
})

router.post('/', (req, res) => {

    const publicHoliday = new PublicHoliday({
        // _id: new mongoose.Types.ObjectId(),
        holiday: req.body.holiday,
        description: req.body.description,
    })

    publicHoliday.save().then( result => {
        res.status(201).json({
            message: "Holiday created successfully",
            createdHoliday: {
                _id: result._id,
                holiday: result.holiday,
                description: result.description,
            }
        })
    })
    .catch( err => {
        console.log( err)
        res.status(500).json({error: err})
    })
    
})

module.exports = router;