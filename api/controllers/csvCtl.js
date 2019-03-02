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
    TaskLog.deleteMany({}, result => { })

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
    TaskEstHour.deleteMany({}, result => { })

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

        let estHour = 0
        let projectName = ''
        let taskType = ''
        if (getTaskEstHour) {
            estHour = getTaskEstHour.estHour
            taskType = getTaskEstHour.taskType
            projectName = getTaskEstHour.projectName
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

    //-- Collect All user from DB
    const allUsers = await new Promise((resolve, reject) => {
        UserTask.aggregate([
            {
                $group: {
                    _id: { userName: "$userName" },
                    workingHour: { $sum: "$workingHour" },
                    estHour: { $sum: "$estHour" }
                }
            }
        ]).sort({ _id: 1 }).then(data => {
            resolve(data)
        })
    })

    const userAllTask = await new Promise((resolve, reject) => {
        UserTask.aggregate([
            {
                $group: {
                    _id: { userName: "$userName", taskName: "$taskName" },
                    workingHour: { $sum: "$workingHour" },
                    estHour: { $sum: "$estHour" }
                }
            }
        ]).sort({ _id: 1, projectName: 1, taskType: 1 }).then(data => {
            resolve(data)
        })
    })

    const userAllType = await new Promise((resolve, reject) => {
        UserTask.aggregate([
            {
                $group: {
                    _id: { userName: "$userName", taskType: "$taskType" },
                    workingHour: { $sum: "$workingHour" },
                    estHour: { $sum: "$estHour" }
                }
            }
        ]).sort({ _id: 1, projectName: 1, taskType: 1 }).then(data => {
            resolve(data)
        })
    })

    const userAllProject = await new Promise((resolve, reject) => {
        UserTask.aggregate([
            {
                $group: {
                    _id: { userName: "$userName", projectName: "$projectName" },
                    workingHour: { $sum: "$workingHour" },
                    estHour: { $sum: "$estHour" }
                }
            }
        ]).sort({ _id: 1, projectName: 1, taskType: 1 }).then(data => {
            resolve(data)
        })
    })



    //-- get Individual user
    let result = []
    for (let user of allUsers) {

        result.push(...generateAllUser(allUsers))

        result.push(...generateTask(user, userAllTask))

        result.push(...generateType(user, userAllType))

        result.push(...generateProject(user, userAllProject))
    }

    //-- Write .csv file
    fn.writeCsvFile(result, 'csvSummary/userTaskDetails.csv')

    res.status(200).json({
        result,
        // allUsers,
        // userAllTask,
        // userAllType,
        // userAllProject
    })

}// end readTaskLog

//-- generate All User
const generateAllUser = (allUsers) => {
    let result = [
        ['', '', '', ''],
        ['SL', 'Name', 'Office Hour', 'Working Hour', 'Est Hour']
    ]

    let sl=0;
    let totalOfficeHour = 0;
    let totalWorkingHour = 0;
    let totalEstHour = 0;
    for (user of allUsers) {
        sl++;
        result.push([
            sl,user._id.userName, 20*8, user.workingHour, user.estHour 
        ])

        totalOfficeHour += parseFloat(20*8)
        totalWorkingHour += parseFloat(user.workingHour)
        totalEstHour += parseFloat(user.estHour)
    }

    result.push(['', 'Total =', totalOfficeHour, totalWorkingHour, totalEstHour])
    result.push(['', '', '', ''])
    result.push(['', '', '', ''])
    result.push(['', '', '', ''])

    return result;

}

//-- generate Task
const generateTask = (user, userAllTask) => {

    let result = [
        ['', '', '', ''],
        ['User Name', user._id.userName, '', ''],
        ['SL', 'Task Name', 'Working Hour', 'Est Hour']
    ]

    const userTask = userAllTask.filter(item => item._id.userName == user._id.userName)

    let sl = 0;
    let totalWorkingHour = 0;
    let totalEstHour = 0;
    for (let task of userTask) {
        sl++;

        result.push([
            sl, task._id.taskName, task.workingHour, task.estHour
        ])

        totalWorkingHour += parseFloat(task.workingHour)
        totalEstHour += parseFloat(task.estHour)
    }

    result.push(['', 'Total =', totalWorkingHour, totalEstHour])


    return result;
}

//-- generate Type
const generateType = (user, userAllType) => {

    let result = [
        ['', '', '', ''],
        ['SL', 'Task Type', 'Working Hour', 'Est Hour'],
    ]

    const userType = userAllType.filter(item => item._id.userName == user._id.userName)

    let sl = 0;
    let totalWorkingHour = 0;
    let totalEstHour = 0;
    for (let type of userType) {
        sl++;

        result.push([
            sl, type._id.taskType, type.workingHour, type.estHour
        ])

        totalWorkingHour += parseFloat(type.workingHour)
        totalEstHour += parseFloat(type.estHour)
    }

    result.push(['', 'Total =', totalWorkingHour, totalEstHour])


    return result;
}

//-- generate Project
const generateProject = (user, userAllProject) => {

    let result = [
        ['', '', '', ''],
        ['SL', 'Project Name', 'Working Hour', 'Est Hour'],
    ]

    const userProject = userAllProject.filter(item => item._id.userName == user._id.userName)

    let sl = 0;
    let totalWorkingHour = 0;
    let totalEstHour = 0;
    for (let project of userProject) {
        sl++;

        result.push([
            sl, project._id.projectName, project.workingHour, project.estHour
        ])

        totalWorkingHour += parseFloat(project.workingHour)
        totalEstHour += parseFloat(project.estHour)
    }

    result.push(['', 'Total =', totalWorkingHour, totalEstHour])

    return result;
}

const taskArrayGenerate = (userAllTask, userAllType, userAllProject) => {

    // let result = [
    //     ['User Name', userAllTask[0]._id.userName, '', ''],
    //     ['SL', 'Task Name', 'Working Hour', 'Est Hour']
    // ]

    // let userName = userAllTask[0]._id.userName
    // let sl = 0;
    // let workingHourTotal = 0
    // let estHourTotal = 0
    // for ( let item of userAllTask ) {
    //     sl++

    //     //-- set Header
    //     if (userName != item._id.userName) {
    //         result.push(['', 'Total =', workingHourTotal , estHourTotal])

    //         result.push(...typeArrayGenerate(userAllType,item._id.userName))

    //         result.push(['', '', '', ''])
    //         result.push(['', '', '', ''])
    //         result.push(['', '', '', ''])
    //         result.push(['', '', '', ''])
    //         result.push(['User Name', item._id.userName, '', ''])   
    //         result.push(['SL', 'Task Name', 'Working Hour', 'Est Hour'])


    //         sl=1
    //         workingTotal = 0
    //         estHourTotal = 0

    //         userName = item._id.userName
    //     }

    //     //-- set Body for Task
    //     workingHourTotal += parseFloat(item.workingHour)
    //     estHourTotal += parseFloat(item.estHour)
    //     result.push([
    //         sl,
    //         item._id.taskName,
    //         item.workingHour,
    //         item.estHour
    //     ])

    // }

    //-- end user push
    // result.push(['', 'Total =', workingHourTotal , estHourTotal])
    // result.push(...typeArrayGenerate(userAllType,userName))


    return result
}


const typeArrayGenerate = (userAllType, userName) => {

    const userTaskType = userAllType.filter(item => item._id.userName == userName)

    let result = [
        ['', '', '', ''],
        ['SL', 'Task Type', 'Working Hour', 'Est Hour']
    ]


    let sl = 0
    for (let item of userTaskType) {
        sl++

        result.push([
            sl,
            item._id.taskType,
            item.workingHour,
            item.estHour
        ])
    }

    return result
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