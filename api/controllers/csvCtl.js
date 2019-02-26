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
        ["d1", "d2"],
        ["e1", "e2"],
    ], { headers: true, quoteColumns: true })
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
 * ---------------------------------------------------------------------------------------------------------
 * Generate Name Summary
 * ---------------------------------------------------------------------------------------------------------
 */
exports.generateNameSummary = (req, res, next) => {

    //-- Read all files from csvTaskResult
    const readDir = 'csvTaskResult'
    nameAndHours = [['SL', 'Name', 'WorkingHours', 'Est Hours']];
    fs.readdirSync(readDir).forEach(file => nameAndHourProcess(file, 1, 'csvSummary/'));

    res.status(200).json({
        message: 'Successfully generated Name & Hour'
    })

}//- end




/**
 * Name & HOur Process
 * @param {*} fileName 
 * @param {*} groupFields 
 * @param {*} writeDir 
 * @param {*} readDir 
 */
const nameAndHourProcess = async (fileName, sumField = 1, writeDir = 'csvSummary/', readDir = 'csvTaskResult/') => {

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
    const workingHours = await new Promise((resolve, reject) => {

        const workingHours = fn.groupByNameAndSum(readData, sumField)

        resolve(workingHours)
    })


    const devName = await fileName.split('.')[0];



    nameAndHours.push([nameAndHours.length, devName, ...workingHours])

    //-- Write nameSummary.csv file
    const newFileName = await writeDir + 'nameSummary.csv';
    const ws = fs.createWriteStream(newFileName);
    csv.write(nameAndHours, { headers: true, quoteColumns: true })
        .pipe(ws)


}//-- end Name and Hour process




/**
 * ------------------------------------------------------------------------------------
 * Generate Est Hours
 * ------------------------------------------------------------------------------------
 */
exports.generateEstHour = (req, res, next) => {

    const readEstDir = 'csvEstFiles/';
    taskAndEstHours = [];

    // Estimated Time by Task
    fs.readdirSync(readEstDir).forEach(file => setEstHour(file, 1, 'csvSummary/'));

    res.status(200).json({
        message: 'Successfully generate the Est. Hour'
    })
}// end generateEstHour


//-- set Est Hour
const setEstHour = async (fileName, sumField = 1, writeDir = 'csvSummary/', readDir = 'csvEstFiles/') => {

    // console.log(fileName)
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

    //-- set Task & Est Hours
    taskAndEstHours.push(...readData)

    //-- Write nameSummary.csv file
    const newFileName = await writeDir + 'taskEstHours.csv';
    const ws = fs.createWriteStream(newFileName);
    csv.write(taskAndEstHours, { headers: true, quoteColumns: true })
        .pipe(ws)

}//-- end set Est hours







/**
 * ------------------------------------------------------------------------------------------------
 * Read & Write
 * ------------------------------------------------------------------------------------------------
 */
let nameAndHours = [['SL', 'Name', 'WorkingHours', 'Est Hours']];
let taskAndEstHours = [];

exports.readAndWrite = (req, res, next) => {

    //-- 0 => Data, 1 => Task, 2 => SubTask, 3 => Hour, 4 => Type, 5 => Project
    const readDir = 'csvFiles/';
    const estHourFilePath = 'csvSummary/taskEstHours.csv'

    //-- Est Hour Generate
    if (!fs.existsSync(estHourFilePath)) {
        return res.status(404).json({
            message: 'File is not exists.',
            url: 'localhost:3000/csv/generate-est-hour'
        })
    }

    const readTaskEstHours = new Promise((resolve, reject) => {

        let myEstData = []
        fs.createReadStream(estHourFilePath)
            .pipe(csv())
            .on('data', data => {
                myEstData.push(data)
            })
            .on('end', data => {
                resolve(myEstData)
            });
    })

    readTaskEstHours.then( estData => {
        fs.readdirSync(readDir).forEach(file => taskFileProcess(file, [1, 3], estData, 'csvTaskResult/'));
    })



    // Type
    // fs.readdirSync(readDir).forEach(file => singleFileProcess(file, [4, 3], 'csvTypeResult/'));

    // Project
    // fs.readdirSync(readDir).forEach(file => singleFileProcess(file, [5, 3], 'csvProjectResult/'));


    res.status(200).json({
        message: 'Successful'
    })
}


//-- task file process
const taskFileProcess = async (fileName, groupFields = [1, 3], estData=[], writeDir = 'csvTaskResult/', readDir = 'csvFiles/') => {

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

        const result1 = fn.groupByAndSumWithEst(estData, readData, ...groupFields)

        resolve(result1)
    })


    //-- Write Result.csv file
    const newFileName = await writeDir + fileName;
    const ws = fs.createWriteStream(newFileName);
    csv.write(processData, { headers: true, quoteColumns: true })
        .pipe(ws)


}//-- end process



/**
 * Process Data
 * @param {*} fileName 
 * @param {*} groupFields 
 * @param {*} writeDir 
 * @param {*} readDir 
 */
const singleFileProcess = async (fileName, groupFields = [1, 3], writeDir = 'csvTaskResult/', readDir = 'csvFiles/') => {

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
    csv.write(processData, { headers: true, quoteColumns: true })
        .pipe(ws)


}//-- end process