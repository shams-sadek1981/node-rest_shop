const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Product = require('../models/product');
const checkAuth = require('../middleware/check-auth');

exports.getAllProducts = (req, res, next) => {
    Product.find()
        .select('name price _id')
        .exec()
        .then( docs=> {
            // console.log(docs)
            // if(docs.length >= 0) {
                const response = {
                    count: docs.length,
                    products: docs.map( doc => {
                        return {
                            name: doc.name,
                            price: doc.price,
                            id: doc._id,
                            request: {
                                type: 'GET',
                                url: "http://localhost:3000/products/" + doc._id
                            }
                        }
                    })
                }

                return res.status(200).json(response)


        })
        .catch( err => {
            console.log(err)
            res.status(500).json({ error: err})
        });
}