const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Product = require('../models/product');
const checkAuth = require('../middleware/check-auth');

const fs = require('fs');
const csv = require('fast-csv');

const _ = require('lodash');
const fn = require('../functions')

exports.writeFile = (req, res, next) => {

    const ws = fs.createWriteStream('my.csv');

    csv.write([
        ["a1", "b1"],
        ["b2", "c2"],
        ["c3", "d3"],
    ], { headers: true })
        .pipe(ws)

    res.status(200).json({
        message: 'Successfully write the file'
    })
}

exports.readFile = (req, res, next) => {
    let myData = []
    fs.createReadStream('tasks.csv')
        .pipe(csv())
        .on('data', data => {
            myData.push(data)
        })
        .on('end', data => {
            console.log('Read finished')

            res.status(200).json({
                message: 'CSV file working',
                data: myData
            })
        });
}


/**
 * ------------------------------------------------
 * Read & Write
 * ------------------------------------------------
 */
exports.readAndWrite = (req, res, next) => {
    
    
    processData('tasks')

    res.status(200).json({
        message: 'Successful'
    })
}


//-- Process Data
const processData = async (fileName) => {
    
    const readFileName = fileName + '.csv';

    
    //-- Read .csv file
    let myData = []
    const readData = await new Promise((resolve, reject) => {

        fs.createReadStream(readFileName)
            .pipe(csv())
            .on('data', data => {
                myData.push(data)
            })
            .on('end', data => {
                console.log('Read finished')
                resolve(myData)
            });
    });


    //-- Process Data
    const processData = await new Promise((resolve, reject) => {

        const result1 = fn.groupByAndSum(readData, 1, 2)

        resolve(result1)
    })

    
    //-- Write Result.csv file
    const newFileName = await fileName + 'Result.csv';
    const ws = fs.createWriteStream( newFileName );
    csv.write(processData, { headers: true })
        .pipe(ws)
}
