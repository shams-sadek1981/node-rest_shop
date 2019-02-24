const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Product = require('../models/product');
const checkAuth = require('../middleware/check-auth');

const fs = require('fs');
const csv = require('fast-csv');

const _ = require('lodash');
const fn = require('../functions')
const localStorage = require('localStorage')

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
let nameAndHours = [ ['Name', 'WorkingHours'] ];

exports.readAndWrite = (req, res, next) => {

    //-- 0 => Data, 1 => Task, 2 => SubTask, 3 => Hour, 4 => Type, 5 => Project
    const readDir = 'csvFiles/';

    // Task
    // fs.readdirSync(readDir).forEach(file => singleFileProcess(file, [1, 3], 'csvTaskResult/') );
    
    // Type
    // fs.readdirSync(readDir).forEach(file => singleFileProcess(file, [4, 3], 'csvTypeResult/') );
    
    // Project
    // fs.readdirSync(readDir).forEach(file => singleFileProcess(file, [5, 3], 'csvProjectResult/') );
    
    // Name And working Hours
    fs.readdirSync(readDir).forEach(file => nameAndHourProcess(file, 3, 'csvSummary/') );

    res.status(200).json({
        message: 'Successful'
    })
}



/**
 * Name & HOur Process
 * @param {*} fileName 
 * @param {*} groupFields 
 * @param {*} writeDir 
 * @param {*} readDir 
 */
const nameAndHourProcess = async (fileName, sumField=3, writeDir='csvSummary/', readDir='csvFiles/') => {

    const readFileName = readDir + fileName;

    //-- Read .csv file
    let myData = []
    const readData = await new Promise((resolve, reject) => {

        fs.createReadStream(readFileName)
            .pipe(csv())
            .on('data', data => {
                myData.push(data)
            })
            .on('end', data => {
                console.log('Read finished: ', fileName)
                resolve(myData)
            });
    });

    // console.log(readData)

    //-- Process Data
    const workingHours = await new Promise((resolve, reject) => {

        const workingHours = fn.groupByNameAndSum(readData, sumField)
        
        resolve(workingHours)
    })


    const devName = await fileName.split('.')[0];
    
    nameAndHours.push([devName, workingHours])

    //-- Write nameSummary.csv file
    const newFileName = await writeDir + 'nameSummary.csv';
    const ws = fs.createWriteStream(newFileName);
    csv.write(nameAndHours, { headers: true })
        .pipe(ws)


}//-- end Name and Hour process


/**
 * Process Data
 * @param {*} fileName 
 * @param {*} groupFields 
 * @param {*} writeDir 
 * @param {*} readDir 
 */
const singleFileProcess = async (fileName, groupFields=[1,3], writeDir='csvTaskResult/', readDir='csvFiles/') => {

    const readFileName = readDir + fileName;

    //-- Read .csv file
    let myData = []
    const readData = await new Promise((resolve, reject) => {

        fs.createReadStream(readFileName)
            .pipe(csv())
            .on('data', data => {
                myData.push(data)
            })
            .on('end', data => {
                console.log('Read finished: ', fileName)
                resolve(myData)
            });
    });


    //-- Process Data
    const processData = await new Promise((resolve, reject) => {

        const result1 = fn.groupByAndSum(readData, ...groupFields)

        resolve(result1)
    })


    //-- Write Result.csv file
    const newFileName = await writeDir + fileName;
    const ws = fs.createWriteStream(newFileName);
    csv.write(processData, { headers: true })
        .pipe(ws)


}//-- end process


