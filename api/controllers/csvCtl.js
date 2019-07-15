const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const TaskLog = require('../models/taskLog');
const TaskEstHour = require('../models/taskEstHour');
const ThreeMonth = require('../models/threeMonth');
const UserTask = require('../models/userTask');
const UpcomingTask = require('../models/upcomingTask');

// const PDFDocument = require('pdfkit');
// const doc = new PDFDocument;
const PdfPrinter = require('pdfmake');

const checkAuth = require('../middleware/check-auth');

const fs = require('fs');
const csv = require('fast-csv');

const _ = require('lodash');
const fn = require('../functions')
const localStorage = require('localStorage')

//-- Task Est Hours (Temporary write data)
let taskAndEstHours = [];
let nameAndHours = [['SL', 'Name', 'WorkingHours', 'Est Hours']];

const { employees, replaceTypes, replaceProjects } = require('../changeString')


String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
};


exports.importThreeMonth = (req, res) => {

    // Define font files
    var fonts = {
        Roboto: {
            normal: 'fonts/Roboto-Regular.ttf',
            bold: 'fonts/Roboto-Medium.ttf',
            italics: 'fonts/Roboto-Italic.ttf',
            bolditalics: 'fonts/Roboto-MediumItalic.ttf'
        }
    };


    var printer = new PdfPrinter(fonts);
    var fs = require('fs');

    var docDefinition = {
        // ...
    };

    var options = {
        // ...
    }

    var pdfDoc = printer.createPdfKitDocument(docDefinition, options);
    pdfDoc.pipe(fs.createWriteStream('document.pdf'));
    pdfDoc.end();
    res.json({
        message: 'ok'
    })

    // //-- Delete All docs
    // ThreeMonth.deleteMany({}, result => { })

    // const readDir = 'csvFiles/';
    // result = [];
    // fn.readCsvFile(readDir + 'threeMonth.csv').then(readData => {

    //     const heads = readData.shift()//-- Remove Header

    //     // const header = Object.entries(heads)

    //     //-- create raw object
    //     const rawObject = readData.map(log => {

    //         const taskName = log[3]

    //         return {
    //             name: log[1],
    //             learningCurve: log[2],
    //             personalityCurve: log[3],
    //             performanceCurve: log[4],
    //             totalAchivePoint: log[5],
    //             badge: log[6],
    //             meetUpDeadline: log[7],
    //             qualityOfWork: log[8],
    //             extraResponsibility: log[9],
    //             innovativeContribution: log[10],
    //             customerHappiness: log[11],
    //             preservingData: log[12],
    //             productivity: log[13],
    //             total1: log[14],
    //             organizationBehaviour: log[15],
    //             standUpAttendance: log[16],
    //             avgWorkingHour: log[17],
    //             helpsColleague: log[18],
    //             communityEngagement: log[19],
    //             total2: log[20],
    //             knowledgeSharing: log[21],
    //             domainKnowledge: log[22],
    //             total3: log[23]
    //         }
    //     })

    //     //-- sort by taskName
    //     // rawObject.sort((a, b) => {
    //     //     return a.taskName > b.taskName
    //     // })

    //     ThreeMonth.insertMany(rawObject)
    //         .then( data => {
    //             return res.json(data)
    //         })

    //     // res.json(rawObject)
    // })
}

/**
 * -----------------------------------------------------------------------------------
 * Import upcoming task
 * -----------------------------------------------------------------------------------
 */
exports.importUpcomingTask = (req, res) => {

    const readDir = 'csvFiles/';
    result = [];
    fn.readCsvFile(readDir + 'upcomingTask.csv').then(readData => {

        readData.shift()//-- Remove Header

        //-- create raw object
        const rawObject = readData.map(log => {

            const taskName = log[3]

            return {
                projectName: log[0],
                taskType: log[1],
                assignedBy: log[2],
                taskName: taskName.trim().toProperCase(),
                subTask: log[4],
                estHour: log[5],
                startDate: log[6],
                endDate: log[7],
                completedAt: log[8],
                assignedUser: log[9]
            }
        })

        //-- sort by taskName
        rawObject.sort((a, b) => {
            return a.taskName > b.taskName
        })


        //-- group by taskName
        let taskName = ''
        let newArrayObject = []
        let newObject = {
            subTasks: []
        }
        rawObject.forEach(item => {

            if (taskName == item.taskName) {
                newObject.subTasks.push({
                    name: item.subTask,
                    estHour: item.estHour,
                    startDate: item.startDate,
                    endDate: item.endDate,
                    completedAt: item.completedAt,
                    assignedUser: item.assignedUser
                })
            } else {
                newObject = {
                    projectName: item.projectName,
                    taskType: item.taskType,
                    assignedBy: item.assignedBy,
                    taskName: item.taskName,
                    completedAt: item.completedAt,
                    subTasks: [{
                        name: item.subTask,
                        estHour: item.estHour,
                        startDate: item.startDate,
                        endDate: item.endDate,
                        completedAt: item.completedAt,
                        assignedUser: item.assignedUser
                    }]
                }

                newArrayObject.push(newObject)
            }

            taskName = item.taskName
        })

        //-- set percent
        const result = newArrayObject.map(item => {
            let totalEstHour = 0
            let completedHour = 0

            item.subTasks.forEach(subTask => {
                totalEstHour += parseFloat(subTask.estHour)

                if (subTask.completedAt) {
                    console.log('Completed At: ', subTask.completedAt)
                    completedHour += parseFloat(subTask.estHour)
                }
            })


            console.log('Completed Hour: ', completedHour)
            console.log('Total. Hour: ', totalEstHour)

            return {
                projectName: item.projectName,
                taskType: item.taskType,
                assignedBy: item.assignedBy,
                taskName: item.taskName,
                completedAt: item.completedAt,
                percent: Math.floor(completedHour * 100 / totalEstHour),
                subTasks: item.subTasks
            }
        })


        //-- Insert All
        UpcomingTask.insertMany(result)
        // console.log(result)

    })

    // estTaskHour()//-- generate Estimation Hour by Project

    return res.status(200).json({
        message: 'Success'
    })

}


//-- For May-2019
exports.writeTaskMayEst = (req, res, next) => {

    //-- Delete All docs
    UpcomingTask.deleteMany({}, result => { })

    const readDir = 'csvFiles/';
    result = [];
    fs.readdirSync(readDir).forEach(mainFile => {
        fn.readCsvFile(readDir + mainFile).then(readData => {

            readData.shift()//-- Remove Header
            const rawObject = readData.map(log => {

                const taskName = log[1]

                return {
                    projectName: log[3],
                    taskName: taskName.trim().toProperCase(),
                    taskType: log[4],
                    subTasks: [{
                        assignedUser: mainFile.split('.')[0],
                        name: "Develop",
                        estHour: log[2],
                        completedAt: log[0],
                    }]
                }
            })

            // console.log(rawObject)

            UpcomingTask.insertMany(rawObject)
        })
    })

    // estTaskHour()//-- generate Estimation Hour by Project

    res.status(200).json({
        message: 'Success'
    })
}//-- end writeTaskLog


exports.writeTaskLog = (req, res, next) => {

    //-- Delete All docs
    TaskLog.deleteMany({}, result => { })

    const readDir = 'csvFiles/';

    result = [];
    fs.readdirSync(readDir).forEach(mainFile => {
        fn.readCsvFile(readDir + mainFile).then(readData => {

            readData.shift()//-- Remove Header
            const rawObject = readData.map(log => {

                const taskName = log[1] || 'Others'
                const taskType = log[4] || 'Others'
                taskType

                return {
                    userName: mainFile.split('.')[0],
                    taskName: taskName.trim().toProperCase(),
                    workingHour: parseFloat(log[3]) || 0,
                    taskType: taskType.trim().toProperCase(),
                    projectName: log[5] || 'Others'
                }
            })

            TaskLog.insertMany(rawObject)

        })
    })

    estTaskHour()//-- generate Estimation Hour by Project

    res.status(200).json({
        message: 'Success'
    })
}//-- end writeTaskLog


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
                    taskName: log[1],
                    estHour: parseFloat(log[2]),
                    taskType: log[3]
                }
            })

            TaskEstHour.insertMany(rawObject)
        })
    })
}


/**
 * --------------------------------------------------------------------------------------------
 * Write Task Est
 * --------------------------------------------------------------------------------------------
 */
exports.writeTaskEst = async (req, res, next) => {

    const taskEstHourResult = await new Promise((resolve, reject) => {
        TaskEstHour.find({}).then(data => resolve(data))
    })

    const taskLog = await new Promise((resolve, reject) => {

        TaskLog.aggregate([
            {
                $group: {
                    _id: { taskName: "$taskName", userName: "$userName" },
                    workingHour: { $sum: "$workingHour" },
                    projectName: { $max: "$projectName" },
                    taskType: { $max: "$taskType" },
                }
            }
        ]).then(data => resolve(data))
    })

    const result = taskLog.map(item => {

        const getTaskEstHour = taskEstHourResult.find(data => data.taskName == item._id.taskName)

        const findEmp = employees.find(emp => emp.name == item._id.userName)

        //-- set value for percent calculation
        let valuePercent = .10
        if (findEmp) {
            valuePercent = findEmp.value
        }

        //-- Process AI for Est Hour
        let aiEstHour = item.workingHour
        if (aiEstHour > 2) { //-- After Two Hours
            aiEstHour = Math.floor(item.workingHour - (item.workingHour * valuePercent))
        }

        //-- set Task Type String
        let taskType = item.taskType
        let findTaskType = replaceTypes.find(item => item.searchString == taskType)
        if (findTaskType) {
            taskType = findTaskType.replaceString
        }


        //-- set Project String
        let projectName = item.projectName
        let findProject = replaceProjects.find(item => item.searchString == projectName)
        if (findProject) {
            projectName = findProject.replaceString
        }


        let estHour = aiEstHour


        if (getTaskEstHour) {
            estHour = getTaskEstHour.estHour
            taskType = getTaskEstHour.taskType || item.taskType
            projectName = getTaskEstHour.projectName || item.projectName
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

/**
 * ----------------------------------------------------------------------------------
 * Read Task Log
 * ----------------------------------------------------------------------------------
 */
exports.generateCsv = async (req, res, next) => {

    const allProjects = await new Promise((resolve, reject) => {
        UserTask.aggregate([
            {
                $group: {
                    _id: { projectName: "$projectName" },
                    workingHour: { $sum: "$workingHour" },
                    estHour: { $sum: "$estHour" }
                }
            }
        ]).sort({ _id: 1 }).then(data => {
            resolve(data)
        })
    })

    const allTaskType = await new Promise((resolve, reject) => {
        UserTask.aggregate([
            {
                $group: {
                    _id: { taskType: "$taskType" },
                    workingHour: { $sum: "$workingHour" },
                    estHour: { $sum: "$estHour" }
                }
            }
        ]).sort({ _id: 1 }).then(data => {
            resolve(data)
        })
    })


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

    //--All Project
    result.push(...generateAllProject(allProjects))

    //--All Task Type
    result.push(...generateAllTaskType(allTaskType))

    //-- All user details
    result.push(...generateAllUser(allUsers))

    for (let user of allUsers) {

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



//-- generate All Task Type
const generateAllTaskType = (allTaskType) => {
    let result = [
        ['', '', '', ''],
        ['SL', 'Task Type', 'Working Hour', 'Est Hour']
    ]

    let sl = 0;
    let totalWorkingHour = 0;
    let totalEstHour = 0;
    for (item of allTaskType) {
        sl++;
        result.push([
            sl, item._id.taskType, item.workingHour, item.estHour
        ])

        totalWorkingHour += parseFloat(item.workingHour)
        totalEstHour += parseFloat(item.estHour)
    }

    result.push(['', 'Total =', totalWorkingHour, totalEstHour])
    result.push(['', '', '', ''])
    result.push(['', '', '', ''])
    result.push(['', '', '', ''])

    return result;

}


//-- generate All Project
const generateAllProject = (allProjects) => {
    let result = [
        ['', '', '', ''],
        ['SL', 'Project Name', 'Working Hour', 'Est Hour']
    ]

    let sl = 0;
    let totalWorkingHour = 0;
    let totalEstHour = 0;
    for (item of allProjects) {
        sl++;
        result.push([
            sl, item._id.projectName, item.workingHour, item.estHour
        ])

        totalWorkingHour += parseFloat(item.workingHour)
        totalEstHour += parseFloat(item.estHour)
    }

    result.push(['', 'Total =', totalWorkingHour, totalEstHour])
    result.push(['', '', '', ''])
    result.push(['', '', '', ''])
    result.push(['', '', '', ''])

    return result;

}


//-- generate All User
const generateAllUser = (allUsers) => {
    let result = [
        ['', '', '', ''],
        ['SL', 'Name', 'Office Hour', 'Working Hour', 'Est Hour']
    ]

    const officeHours = parseFloat(process.env.WORKING_DAYS) * parseFloat(process.env.OFFICE_HOURS)
    let sl = 0;
    let totalOfficeHour = 0;
    let totalWorkingHour = 0;
    let totalEstHour = 0;
    for (user of allUsers) {
        sl++;
        result.push([
            sl, user._id.userName, officeHours, user.workingHour, user.estHour
        ])

        totalOfficeHour += parseFloat(officeHours)
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