const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const TaskLog = require('../models/taskLog');
const TaskEstHour = require('../models/taskEstHour');
const UserTask = require('../models/userTask');
const checkAuth = require('../middleware/check-auth');

const fs = require('fs');
const csv = require('fast-csv');

const _ = require('lodash');
const fn = require('../functions')
const localStorage = require('localStorage')

//-- Task Est Hours (Temporary write data)
let taskAndEstHours = [];
let nameAndHours = [['SL', 'Name', 'WorkingHours', 'Est Hours']];


exports.writeTaskLog = (req, res, next) => {

    //-- Delete All docs
    TaskLog.deleteMany({}, result => {})

    const readDir = 'csvFiles/';

    result = [];
    fs.readdirSync(readDir).forEach(mainFile => {
        fn.readCsvFile(readDir + mainFile).then(readData => {

            readData.shift()//-- Remove Header
            const rawObject = readData.map(log => {

                return {
                    userName: mainFile.split('.')[0],
                    taskName: log[1],
                    workingHour: log[3],
                    projectType: log[4],
                    projectName: log[5]
                }
            })

            TaskLog.insertMany(rawObject)

        })
    })

    estTaskHour()//-- generate Estimation Hour by Project
    res.status(200).json({
        message: 'Success'
    })
}

//-- est hour save
const estTaskHour = () => {
    //-- Delete All docs
    TaskEstHour.deleteMany({}, result => {})

    const readDir = 'csvEstFiles/';

    result = [];
    fs.readdirSync(readDir).forEach(mainFile => {
        fn.readCsvFile(readDir + mainFile).then(readData => {

            readData.shift()//-- Remove Header
            const rawObject = readData.map(log => {

                return {
                    projectName: mainFile.split('.')[0],
                    taskName: log[0],
                    estHour: log[1],
                    taskType: log[2],
                }
            })

            TaskEstHour.insertMany(rawObject)

        })
    })
}


/**
 * --------------------------------------------------------------------------------------------
 * Write User Task
 * --------------------------------------------------------------------------------------------
 */
exports.writeUserTask = async (req, res, next) => {

    const taskEstHourResult = await new Promise((resolve, reject) => {
        TaskEstHour.find({}).then(data => resolve(data))
    })

    const taskLog = await new Promise((resolve, reject) => {

        TaskLog.aggregate([
            {
                $group: {
                    _id: { taskName: "$taskName", userName: "$userName" },
                    workingHour: { $sum: "$workingHour" }
                }
            }
        ]).then(data => resolve(data))
    })

    const result = taskLog.map(item => {

        const getTaskEstHour = taskEstHourResult.find(data => data.taskName == item._id.taskName)

        let estHour=0
        let projectName=''
        let taskType=''
        if (getTaskEstHour) {
            estHour=getTaskEstHour.estHour
            taskType=getTaskEstHour.taskType
            projectName=getTaskEstHour.projectName
        }
        
        return {
            userName: item._id.userName,
            taskName: item._id.taskName,
            workingHour: item.workingHour,
            estHour,
            taskType,
            projectName
        }
    })

    //-- save User Task
    UserTask.deleteMany({}, result => { })
    UserTask.insertMany(result)

    res.status(200).json({
        message: "Write User Task",
        count: result.length,
        result
    })
}

//-- Read Task Log
exports.readTaskLog = async (req, res, next) => {

    const userAllTask = await new Promise((resolve, reject) => {
        UserTask.aggregate([
            {
                $group: {
                    _id: { userName: "$userName", projectName: "$projectName", taskType: "$taskType"},
                    workingHour: { $sum: "$workingHour" },
                    estHour: { $sum: "$estHour" }
                }
            }
        ]).sort({ _id: 1, projectName: 1, taskType: 1 }).then(data => {
            resolve(data)
        })
    })

    const result = userAllTask.map( item => {

        return {
            userName: item._id.userName,
            projectName: item._id.projectName,
            taskType: item._id.taskType,
            workingHour: item.workingHour,
            estHour: item.estHour
        }
    })


    res.status(200).json({
        result
    })





}

/**
 * ------------------------------------------------------------------------------------------------
 * Read & Write
 * ------------------------------------------------------------------------------------------------
 */
exports.readAndWrite = (req, res, next) => {

    //-- 0 => Data, 1 => Task, 2 => SubTask, 3 => Hour, 4 => Type, 5 => Project
    const readDir = 'csvFiles/';

    generateEstHour().then(estData => {
        fs.readdirSync(readDir).forEach(mainFile => {
            taskFileProcess(mainFile, [1, 3], estData, 'csvTaskResult/').then(taskData => {
                generateNameSummary()

            })
        });
    })

    // Type
    fs.readdirSync(readDir).forEach(file => singleFileProcess(file, [4, 3], 'csvTypeResult/'));


    // Project
    fs.readdirSync(readDir).forEach(file => singleFileProcess(file, [5, 3], 'csvProjectResult/'));


    // personalFileGenerate()

    res.status(200).json({
        message: 'Successful'
    })
}


const personalFileGenerate = () => {
    fs.readdirSync('csvTaskResult').forEach(file => {
        fn.readCsvFile(file).then(data => {
            console.log(data)
        })
    });
}

/**
 * ---------------------------------------------------------------------------------------------------------
 * Generate Name Summary
 * ---------------------------------------------------------------------------------------------------------
 */
// exports.generateNameSummary = (req, res, next) => {
const generateNameSummary = () => {

    //-- Read all files from csvTaskResult
    const readDir = 'csvTaskResult'
    nameAndHours = [['SL', 'Name', 'WorkingHours', 'Est Hours']];
    fs.readdirSync(readDir).forEach(file => nameAndHourProcess(file, 1, 'csvSummary/'));

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
    const writeFilePath = writeDir + 'nameSummary.csv';

    fn.readCsvFile(readFileName).then(readData => {
        const workingHours = fn.groupByNameAndSum(readData, sumField)

        const devName = fileName.split('.')[0];

        nameAndHours.push([nameAndHours.length, devName, ...workingHours])

        fn.writeCsvFile(nameAndHours, writeFilePath)

    })

}//-- end Name and Hour process




/**
 * -------------------------------------------------------------------------------------------------
 * Generate Est Hours
 * -------------------------------------------------------------------------------------------------
 */
// const generateEstHour = (req, res, next) => {
const generateEstHour = () => {

    const readEstDir = 'csvEstFiles/';
    taskAndEstHours = [];

    // Estimated Time by Task
    return new Promise((resolve, reject) => {
        fs.readdirSync(readEstDir).forEach(file => {
            const result = setEstHour(file, 1, 'csvSummary/')
            resolve(result)
        });
    })

}// end generateEstHour


//-- set Est Hour
const setEstHour = async (fileName, sumField = 1, writeDir = 'csvSummary/', readDir = 'csvEstFiles/') => {

    const readFileName = readDir + fileName;
    const filePath = writeDir + 'taskEstHours.csv';

    return new Promise((resolve, reject) => {

        fn.readCsvFile(readFileName).then(readData => {
            readData.shift()//-- Remove Header
            taskAndEstHours.push(...readData)
            fn.writeCsvFile(taskAndEstHours, filePath)
            resolve(taskAndEstHours)
        })
    })

}//-- end set Est hours


//-- task file process
const taskFileProcess = async (fileName, groupFields = [1, 3], estData = [], writeDir = 'csvTaskResult/', readDir = 'csvFiles/') => {

    const readFileName = readDir + fileName;
    const writeFilePath = writeDir + fileName;

    return new Promise((resolve, reject) => {
        fn.readCsvFile(readFileName).then(readData => {
            const processData = fn.groupByAndSumWithEst(estData, readData, ...groupFields)

            fn.writeCsvFile(processData, writeFilePath)

            resolve(processData)
        })
    })


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
    const writeFilePath = writeDir + fileName;

    fn.readCsvFile(readFileName).then(readData => {
        const precessedData = fn.groupByAndSum(readData, ...groupFields)
        fn.writeCsvFile(precessedData, writeFilePath)
    })

}//-- end process


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