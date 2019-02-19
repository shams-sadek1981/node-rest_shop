const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Order = require('../models/order');
const Product = require('../models/product');
const { ordersGetAll } = require('../controllers/ordersCtl');


router.get('/', ordersGetAll)


router.post('/', (req, res, next) => {
    Product.findById(req.body.productId)
        .then( product => {
            if(!product){
                return res.status(404).json({
                    message: 'Product not found'
                })
            }

            const order = new Order({
                _id: mongoose.Types.ObjectId(),
                quantity: req.body.quantity,
                product: req.body.productId
            })
        
            return order.save();
                
        })
        .then( result => {
            console.log(result)
            res.status(201).json(result)
        })
        .catch( err => {
            res.status(500).json({ error: err})
        })
})

router.delete('/:productId', (req, res, next) => {

})

router.patch('/:productId', (req, res, next) => {


})

module.exports = router;