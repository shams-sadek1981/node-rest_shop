const express = require('express');
const mongoose = require('mongoose');
const PublicHoliday = require('../../models/publicHoliday');
const moment = require('moment')

/**
 * --- get all holidays
 */
exports.getHolidays = (req, res) => {

    const startDate = new Date(req.query.startDate);
    const endDate = new Date(req.query.endDate);

    PublicHoliday.find({
        holiday: {
            $gte: startDate,
            $lte: endDate
        }
    }).sort({ holiday: 1 })
        .exec()
        .then(doc => {

            const result = doc.map(item => {

                return {
                    _id: item._id,
                    holiday: item.holiday,
                    description: item.description
                }
            })

            res.json(
                result
            )
        })
        .catch(err => res.json(err));
}

/**
 * --- Create Holiday ---
 */
exports.createHoliday = (req, res) => {

    const publicHoliday = new PublicHoliday({
        // _id: new mongoose.Types.ObjectId(),
        holiday: req.body.holiday,
        description: req.body.description,
    })

    publicHoliday.save().then(result => {
        res.status(201).json({
            message: "Holiday created successfully",
            createdHoliday: {
                _id: result._id,
                holiday: result.holiday,
                description: result.description,
            }
        })
    })
        .catch(err => {
            console.log(err)
            res.status(500).json({ error: err })
        })
}

/**
 * ------------------------------------------------------------------------------------------
 * Delete Holiday
 * ------------------------------------------------------------------------------------------
 */
exports.deleteHoliday = (req, res) => {

    PublicHoliday.remove({ _id: req.params.id })
        .exec()
        .then(data => {
            res.json({
                result: data
            })
        }).catch( err => res.status(400).json(err))
}