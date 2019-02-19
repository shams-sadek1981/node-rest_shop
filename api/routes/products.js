const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Product = require('../models/product');
const checkAuth = require('../middleware/check-auth');
const productsCtl=require('../controllers/productsCtl');

router.get('/', productsCtl.getAllProducts)

router.get('/:productId', (req, res, next) => {

    const id = req.params.productId;

    Product.findById(id)
        .exec()
        .then( doc => {
            console.log(doc)
            if(doc){
                res.status(200).json(doc)
            }else{
                res.status(404).json({message: 'No valid entry found for provided ID'})
            }
            
        })
        .catch( err => {
            console.log(err)
            res.status(500).json({ error: err})
        });
})

router.post('/', checkAuth, (req, res, next) => {

    const product = new Product({
        _id: new mongoose.Types.ObjectId(),
        name: req.body.name,
        price: req.body.price
    })

    product.save().then( result => {
        console.log(result)
        res.status(201).json({
            message: "Product created successfully",
            createdProduct: {
                name: result.name,
                price: result.price,
                _id: result._id,
                request: {
                    type: 'GET',
                    url: "http://localhost:3000/products/" + result._id
                }
            }
        })
    })
    .catch( err => {
        console.log( err)
        res.status(500).json({error: err})
    })
    
})

router.delete('/:productId', (req, res, next) => {
    const id = req.params.productId
    Product.remove({ _id: id})
        .exec()
        .then( result => {
            res.status(200).json(result)
        })
        .catch( err => {
            res.status(500).json({error: err})
        })
})

router.patch('/:productId', (req, res, next) => {
    const id = req.params.productId;

    const updateOps = {};

    for (const ops of req.body){
        updateOps[ops.propName] = ops.value
    }

    Product.update({ _id: id}, { $set: updateOps })
        .exec()
        .then( result => {
            res.status(200).json(result)
        })
        .catch( err => {
            res.status(500).json({error: err})
        })
        
})

module.exports = router;