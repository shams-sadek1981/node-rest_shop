const express = require('express');

const mongoose = require('mongoose');
const Order = require('../models/order');
const Product = require('../models/product');


exports.ordersGetAll = (req, res, next) => {
    Order.find()
        .select('_id product quantity')
        .populate('product', 'name')
        .exec()
        .then( docs => {
            res.status(200).json({
                count: docs.length,
                order: docs.map( doc => {
                    return {
                        _id: doc._id,
                        quantity: doc.quantity,
                        product: doc.product,
                        request: {
                            type: 'GET',
                            url: 'http://localhost:3000/orders/' + doc._id
                        }
                    }
                })
            })
        })
        .catch( err => {
            res.status(500).json({ error: err})
        })
}