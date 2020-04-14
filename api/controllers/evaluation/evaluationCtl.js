const express = require('express');
const mongoose = require('mongoose');
const moment = require('moment');
const EvaluationMark = require('../../models/evaluationMark');
const { _ } = require('lodash')
const fs = require('fs');

/**
 * .pdf file generate by pdfkit
 */
const PDFDocument = require('pdfkit');

const fn = require('../../functions')

const { queryBuilder, singleUserEst, totalEst, totalTask, importCsvFile } = require('./helperFunctions')

const csv = require('fast-csv');

const generate = require('csv-generate')
const assert = require('assert')


/**
 * isFloat
 * @param {*} n 
 */
function isFloat(n){
    return Number(n) === n && n % 1 !== 0;
}

const comments = [

    /**
     * Performance Curve
     */
    {
        name: 'meatupDeadline',
        maxPoint: 8,
        msgPositive: 'Your "Meet up deadline" marks is up to mark, Thanks',
        minPoint: 4,
        msgNegative: 'You have to ensure that you meet your deadline'
    },
    {
        name: 'qualityOfWork',
        maxPoint: 8,
        msgPositive: 'Your "Quality assurance of the task" marks satifactory, Thanks for your dedication',
        minPoint: 4,
        msgNegative: 'You need to assure your quality is up to mark. Focus on improving your quality'
    },
    {
        name: 'extraResponsibility',
        maxPoint: 4,
        msgPositive: 'You have taken extra responsibility as well, we appreciate that heartily',
        minPoint: 1,
        msgNegative: 'Try to take Extra responsibility beside with your regular tasks',
    },
    {
        name: 'innovativeContribution',
        maxPoint: 4,
        msgPositive: 'Innovation is natural for your personality, keep it up',
        minPoint: 1,
        msgNegative: 'Innovation is the prime key to success, give a keen attention on Innovation and contribute every where possible',
    },
    {
        name: 'customerHappiness',
        maxPoint: 4,
        msgPositive: 'You keep customers happy, we appreciate it',
        minPoint: 1,
        msgNegative: 'Customer happiness is our prime mission & vision. So, please ensure you make an improvement on customer happiness',
    },
    {
        name: 'preservingData',
        maxPoint: 4,
        msgPositive: 'You preserve data & documentation, thanks for your effort',
        minPoint: 2,
        msgNegative: 'Preserving Data & Documentation of each task is an identity of your professionalism. You need to improve your skill in this case',
    },
    {
        name: 'productivity',
        maxPoint: 8,
        minPoint: 4,
        msgNegative: 'You need to upgrade your productivity level, try hard to recover',
        msgPositive: 'Your Productivity level is up to the mark, great!'
    },
    
    /**
     * Learning Curve
     */
    {
        name: 'knowledgeSharing',
        maxPoint: 8,
        msgPositive: 'Thanks for your knowledge sharing',
        minPoint: 4,
        msgNegative: 'Try to contribute as Speaker when you offered and please try to attend all the Session & encourage knowledge sharing',
    },
    {
        name: 'domainKnowledge',
        maxPoint: 8,
        msgPositive: 'You\'ve fair Domain knowledge, cheers!',
        minPoint: 4,
        msgNegative: 'Your domain knowledge is not up to the mark. Please work on improving your domain knowledge',
    },

    /**
     * Personality Curve
     */
    {
        name: 'organizationBehavior',
        maxPoint: 8,
        msgPositive: 'We\'re pleased with your behavior and hopefully, you will maintain it.',
        minPoint: 5,
        msgNegative: 'Organazaitional behavior is a point where you need to focus on',
    },
    {
        name: 'standupAttendance',
        maxPoint: 8,
        msgPositive: 'Thanks for attending the standup meeting on regular basis',
        minPoint: 4,
        msgNegative: 'Try to attend Standup meeting on a regular basis',
    },
    {
        name: 'avgWorkingHour',
        maxPoint: 7,
        msgPositive: 'You have met the Average. Working Hour. Thanks',
        minPoint: 4,
        msgNegative: 'Please meet at least 9 Hrs avg. Working Hour',
    },
    {
        name: 'helpsColleague',
        maxPoint: 2,
        msgPositive: 'You\'ve helped your colleague, great!',
        minPoint: 1,
        msgNegative: 'It\'s extremely sad to see, you didn\'t help your colleague all time. It\'s teamwork. Please help your colleague whenever possible',
    },
    {
        name: 'communityEngagement',
        maxPoint: 2,
        minPoint: 0,
        msgNegative: 'Enrich your community engagement rate',
        // msgPositive: ''
    },
]



/**
 * 
 * Generate personal csv file
 */
exports.generatePersonalCsv = async (req, res) => {

    /**
     * Result
     */
    const result = await allMarks()



    // Create a document
    const doc = new PDFDocument({
        pageSize: 'a4',
        layout: 'portrait', // can be 'landscape'
        info: {
            Title: 'Q1-2020', 
            Author: 'Md. Shams Sadek', // the name of the author
            Subject: 'Evaluation Report Q1-2020', // the subject of the document
            // Keywords: 'pdf;javascript', // keywords associated with the document
            // CreationDate: 'DD/MM/YYYY', // the date the document was created (added automatically by PDFKit)
            // ModDate: 'DD/MM/YYYY' // the date the document was last modified
        }
    });
    

    // Pipe its output somewhere, like to a file or HTTP response
    // See below for browser usage
    doc.pipe(fs.createWriteStream('public/evaluationReport2020-Q1.pdf'));

    // Embed a font, set the font size, and render some text
    doc.font('public/fonts/PalatinoBold.ttf')
    // .fontSize(25)

    // const lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam in suscipit purus.  Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Vivamus nec hendrerit felis. Morbi aliquam facilisis risus eu lacinia. Sed eu leo in turpis fringilla hendrerit. Ut nec accumsan nisl.';

    doc.fontSize(15)

    result.forEach( (item, index, arr) => {

        /**
         * -------------------------------
         * Set Header Logo
         * -------------------------------
         */
        doc.moveDown(4).image('public/images/Header.png', 72, 50, {
            // fit: [100, 100],
            height: 40,
            align: 'center',
            valign: 'center',
        })

        /**
         * -------------------------
         * Set Background Logo
         * -------------------------
         */
        doc.opacity(.2)
        doc.moveDown(4).image('public/images/weDevsLogo.jpeg', 170, 250, {
            fit: [250, 250],
            // width: 50,
            align: 'center',
            valign: 'center',
        })
        doc.opacity(1)



        /**
         * Header Text
         */
        doc.fontSize(13)
            .text('Evaluation report of the month Jan-2020 to Mar-2020', 72, 115, {
                align: 'center', underline: 'true'
            })
        
        /**
         * ----------------------------------
         * User Name
         * ----------------------------------
         */
        doc.font('public/fonts/Chalkboard.ttc', 'Chalkboard-Bold')
            .fontSize(16)
            .fillColor("dodgerblue")
            .text(item.userName, 72, 150)



        /**
         * --------------------------------------
         * Badge
         * --------------------------------------
         */
        // draw a line
        // .quadraticCurveTo(130, 200, 150, 120)        // draw a quadratic curve
        // .bezierCurveTo(190, -40, 200, 200, 300, 150) // draw a bezier curve

        // [125,125]
        doc.polygon([90, 205], [120, 200], [250, 200])
            .fill('dodgerblue')
            .stroke()
            .fontSize(10)
            .fillColor('black')
            .opacity(50)

        
        doc.text('Badge : ', 72, 190)
        doc.fillColor('green').text('Total : ' + item.total, 240, 190)

        doc.font('public/fonts/good_dog/GOODDP__.ttf')
            .fontSize(17)
            .fillColor('olive')
            .text(item.badge, 115, 187)

        






        /**
         * --------------------------------------------------------
         * Performance Curve
         * --------------------------------------------------------
         */
        doc.font('public/fonts/PalatinoBold.ttf')
        doc.moveDown(2)
            .fontSize(11)
            .fillColor('green')
            .opacity(80)
            .text('Performance Curve : ' + item.performanceCurve + '/50', 80)

        doc.moveDown(.5)
        doc.fontSize(9)
            .fillColor('black')
            .opacity(80)
            .text(
                'Meatup Deadline : ' + item.meatupDeadline + '/10'
                + '    Quality of Work : ' + item.qualityOfWork + '/10'
                + '    Extra Responsibility : ' + item.extraResponsibility + '/5'
                + '    Innovative Contribution : ' + item.innovativeContribution + '/5'
            ).moveDown(.5)
            .text(
                'Customer Happiness : ' + item.customerHappiness + '/5'
                + '     Preserving Data : ' + item.preservingData + '/5'
                + '     Productivity : ' + item.productivity + '/10'
            )



        /**
         * --------------------------------------
         * Learning Curve
         * --------------------------------------
         */
        doc.moveDown(3)
            .fontSize(11)
            .fillColor('green')
            .opacity(80)
            .text('Learning Curve : ' + item.learningCurve + '/17')


        doc.moveDown(.5)
            .fontSize(9)
            .fillColor('black')
            .opacity(80)
            .text('Knowledge Sharing : ' + item.knowledgeSharing + '/7', {
                continued: true
            }).text('    Domain Knowledge : ' + item.domainKnowledge + '/10')

        /**
         * --------------------------------------
         * Personality Curve
         * --------------------------------------
         */
        doc.moveDown(4)
            .fontSize(11)
            .fillColor('green')
            .opacity(80)
            .text('Personality Curve : ' + item.personalityCurve + '/33')


        doc.moveDown(.5)
            .fontSize(9)
            .fillColor('black')
            .opacity(80)
            .text('Organization Behavior : ' + item.organizationBehavior + '/10', { continued: true })
            .text('     Standup Attendance : ' + item.standupAttendance + '/10', { continued: true })
            .text('     Avg. WorkingHour : ' + item.avgWorkingHour + '/8', { continued: false })
            .moveDown(.5)
            .text('Helps Colleague : ' + item.helpsColleague + '/3', { continued: true })
            .text('      Community Engagement : ' + item.communityEngagement + '/2', { continued: false })


        /**
         * ----------------------------------
         * Comments section
         * ----------------------------------
         */
        doc.moveDown(4).text('Comments : ').fillColor('#696969').font('Times-Roman').fontSize(9)

        doc.moveDown(.5)

        let number = 0
        comments.forEach( comment => {

            if(item[comment.name]){
                if(item[comment.name] >= comment.maxPoint) {
                    if(comment.msgPositive){
                        number++
                        doc.text(number + '. ' + comment.msgPositive, { listType: 'numbered', indent: 16 })
                        
                    }
                }
                else if ( item[comment.name] <= comment.minPoint) {
                    if( comment.msgNegative ){
                        number++
                        doc.text(number + '. ' + comment.msgNegative, { listType: 'numbered', indent: 16 })
                    }
                }
            }
        })


        /**
         * ---------------------------------------
         * Add signature image
         * ---------------------------------------
         */
        doc.moveDown(4).image('public/images/Nazir.PNG', 72, 620, {
            fit: [100, 100],
            // height: 50,
            align: 'center',
            valign: 'center'
        });

        doc.moveDown(4).image('public/images/Sadek.PNG', 450, 620, {
            fit: [100, 100],
            // height: 50,
            align: 'center',
            valign: 'center'
        });


        /**
         * Add New Page
         */
        if ( arr.length > ++index) {
            doc.addPage()
        }

    })


    // doc.removePage(result.length+1)

    // doc.fontSize(8);
    // doc.text(`This text is left aligned. ${lorem}`, {
    //     width: 410,
    //     align: 'left'
    // }
    // );

    // doc.moveDown();
    // doc.text(`This text is centered. ${lorem}`, {
    //     width: 410,
    //     align: 'center'
    // });

    // doc.moveDown();
    // doc.text(lorem, {
    //     columns: 3,
    //     columnGap: 15,
    //     height: 20,
    //     width: 465,
    //     align: 'justify'
    // });

    // // Add an image, constrain it to a given size, and center it vertically and horizontally
    // doc.image('public/images/tablet.jpg', {
    //     fit: [250, 300],
    //     align: 'center',
    //     valign: 'center'
    // });

    // // Add another page
    // doc.addPage()
    //     .fontSize(25)
    //     .text('Here is some vector graphics...', 100, 100);

    // // Draw a triangle
    // doc.save()
    //     .moveTo(100, 150)
    //     .lineTo(100, 250)
    //     .lineTo(200, 250)
    //     .fill("#FF3300");

    // // Apply some transforms and render an SVG path with the 'even-odd' fill rule
    // doc.scale(0.6)
    //     .translate(470, -380)
    //     .path('M 250,75 L 323,301 131,161 369,161 177,301 z')
    //     .fill('red', 'even-odd')
    //     .restore();

    // // Add some text with annotations
    // doc.addPage()
    //     .fillColor("blue")
    //     .text('Here is a link!', 100, 100)
    //     .underline(100, 100, 160, 27, { color: "#0000FF" })
    //     .link(100, 100, 160, 27, 'http://google.com/');

    // Finalize PDF file
    doc.end();


    res.json({
        message: 'Success',
        result
    })

}



/**
 * Get all marks
 */

exports.getAllMarks = async (req, res) => {

    const startDate = new Date(req.query.startDate)
    const endDate = new Date(req.query.endDate)

    const evaluationName = req.query.evaluationName

    const result = await allMarks(startDate, endDate, evaluationName)

    res.json({
        result
    })
}


/**
 * 
 * All marks
 */
const allMarks = (startDate, endDate, evaluationName) => {

    const badges = [
        {
            name: "SuperNova",
            value: 95
        },
        {
            name: "RockStar",
            value: 85
        },
        {
            name: "SuperStar",
            value: 80
        },
        {
            name: "Star",
            value: 75
        },
        {
            name: "Quite Star",
            value: 70
        },
        {
            name: "Promising Star",
            value: 65
        },
        {
            name: "Hidden Star",
            value: 60
        },
        {
            name: "Disappointing",
            value: 50
        },
        {
            name: "Frustrating",
            value: 0
        }
    ];


    // const startDate = new Date(req.query.startDate)
    // const endDate = new Date(req.query.endDate)

    // const evaluationName = req.query.evaluationName


    /**
     * 
     * Define Query Object
     */
    let queryObj = {}

    if (startDate instanceof Date && !isNaN(startDate.valueOf())) {
        queryObj.endDate = {
            "$gte": startDate,
            "$lte": endDate
        }
    }

    // set Evaluation Name
    if (evaluationName) {
        queryObj.evaluationName = evaluationName
    }

    return EvaluationMark.aggregate([
        {
            $match: queryObj
        },
        {
            $group: {
                _id: {
                    userName: "$userName"
                },
                count: { $sum: 1 },
                total: {
                    $sum: {
                        $add: [

                            // Performance curve
                            "$meatupDeadline", "$qualityOfWork", "$extraResponsibility",
                            "$innovativeContribution", "$customerHappiness", "$preservingData",
                            "$productivity",

                            // Personality Curve
                            "$organizationBehavior", "$standupAttendance", "$avgWorkingHour", "$helpsColleague",
                            "$communityEngagement",

                            // Learning Curve
                            "$knowledgeSharing", "$domainKnowledge"
                        ]
                    }
                },
                // Performance curve total
                performanceCurve: {
                    $sum: {
                        $add: [
                            "$meatupDeadline", "$qualityOfWork", "$extraResponsibility",
                            "$innovativeContribution", "$customerHappiness", "$preservingData",
                            "$productivity"
                        ]
                    }
                },
                meatupDeadline: { $sum: "$meatupDeadline" },
                qualityOfWork: { $sum: "$qualityOfWork" },
                extraResponsibility: { $sum: "$extraResponsibility" },
                innovativeContribution: { $sum: "$innovativeContribution" },
                customerHappiness: { $sum: "$customerHappiness" },
                preservingData: { $sum: "$preservingData" },
                productivity: { $sum: "$productivity" },

                // Personality Curve total
                personalityCurve: {
                    $sum: {
                        $add: [
                            "$organizationBehavior", "$standupAttendance", "$avgWorkingHour", "$helpsColleague",
                            "$communityEngagement"
                        ]
                    }
                },
                organizationBehavior: { $sum: "$organizationBehavior" },
                standupAttendance: { $sum: "$standupAttendance" },
                avgWorkingHour: { $sum: "$avgWorkingHour" },
                helpsColleague: { $sum: "$helpsColleague" },
                communityEngagement: { $sum: "$communityEngagement" },

                // Learning Curve total
                learningCurve: {
                    $sum: {
                        $add: [
                            "$knowledgeSharing", "$domainKnowledge"
                        ]
                    }
                },
                knowledgeSharing: { $sum: "$knowledgeSharing" },
                domainKnowledge: { $sum: "$domainKnowledge" }
            }
        }
    ]).then(data => {

        // return res.json(data)
        const result = data.map(doc => {

            const userName = doc._id.userName
            const total = (parseFloat(doc.total) / parseFloat(doc.count)).toFixed(2)
            const badge = badges.find(badge => badge.value < total)

            // Performance Curve
            const performanceCurve = doc.performanceCurve / parseFloat(doc.count)
            const meatupDeadline = doc.meatupDeadline / parseFloat(doc.count)
            const qualityOfWork = doc.qualityOfWork / parseFloat(doc.count)
            const extraResponsibility = doc.extraResponsibility / parseFloat(doc.count)
            const innovativeContribution = doc.innovativeContribution / parseFloat(doc.count)
            const customerHappiness = doc.customerHappiness / parseFloat(doc.count)
            const preservingData = doc.preservingData / parseFloat(doc.count)
            const productivity = doc.productivity / parseFloat(doc.count)

            // Personality Curve
            const personalityCurve = (doc.personalityCurve / parseFloat(doc.count)).toFixed(2)
            const organizationBehavior = doc.organizationBehavior / parseFloat(doc.count)
            const standupAttendance = doc.standupAttendance / parseFloat(doc.count)
            const avgWorkingHour = doc.avgWorkingHour / parseFloat(doc.count)
            const helpsColleague = doc.helpsColleague / parseFloat(doc.count)
            const communityEngagement = doc.communityEngagement / parseFloat(doc.count)

            // Learning Curve
            const learningCurve = doc.learningCurve / parseFloat(doc.count)
            const knowledgeSharing = doc.knowledgeSharing / parseFloat(doc.count)
            const domainKnowledge = doc.domainKnowledge / parseFloat(doc.count)

            return {
                userName,
                total,
                badge: badge.name,

                // Performance Curve
                performanceCurve,
                meatupDeadline,
                qualityOfWork,
                extraResponsibility,
                innovativeContribution,
                customerHappiness,
                preservingData,
                productivity,
                personalityCurve,

                // Personality Curve
                organizationBehavior,
                standupAttendance,
                avgWorkingHour,
                helpsColleague,
                communityEngagement,

                // Learning Curve
                learningCurve,
                knowledgeSharing,
                domainKnowledge
            }
        })

        return result
        // res.json('result')
        // res.json('result')

    })
    // .catch(err => res.status(404).json(err))


}

/**
 * -----------------------------------------------------------------------------
 * Report Task By Project (24-Jul-2019)
 * -----------------------------------------------------------------------------
 */
exports.reportTaskStatus = (req, res) => {

    const startDate = new Date(req.query.startDate)
    const endDate = new Date(req.query.endDate)
    const project = req.query.project

    const queryObj = {
        "completedAt": {
            "$gte": startDate,
            "$lte": endDate
        },
        projectName: project
    }

    UpcomingTask.aggregate([
        {
            "$unwind": {
                'path': '$subTasks',
                "preserveNullAndEmptyArrays": true,
                "includeArrayIndex": "arrayIndex"
            }
        },
        // { $sort: { "subTasks.assignedUser": 1 } },
        {
            $match: queryObj
        },
        {
            $group: {
                _id: {
                    taskName: "$taskName",
                    completedAt: "$completedAt",
                    taskType: "$taskType",
                },
                estHour: {
                    $sum: "$subTasks.estHour"
                },
                startDate: {
                    $min: "$subTasks.startDate"
                },
                endDate: {
                    $max: "$subTasks.completedAt"
                },
                subTasks: {
                    $addToSet: {
                        user: "$subTasks.assignedUser",
                        estHour: "$subTasks.estHour",
                        subTask: "$subTasks.name",
                    }
                }
            }
        },

        { $sort: { "estHour": -1 } }

    ]).then(data => {

        // return res.json({
        //     data: data
        // })

        let result = []
        let totalEst = 0
        data.forEach(item => {

            totalEst += parseFloat(item.estHour)

            let startDate = moment(item.startDate).format("DD-MMM-YYYY")
            if (startDate == 'Invalid date') {
                startDate = "---"
            }

            result.push({
                taskName: item._id.taskName,
                completedAt: moment(item._id.completedAt).format("DD-MMM-YYYY"),
                taskType: item._id.taskType,
                estHour: item.estHour,
                startDate,
                endDate: moment(item.endDate).format("DD-MMM-YYYY"),
                subTasks: item.subTasks,
            })
        })

        res.json({
            totalTask: data.length,
            totalEst: totalEst.toFixed(2),
            result
        })
    }).catch(err => res.json(err))

}

//-- This script or function use only for bulk update upcoming task. -----
exports.allTaskUpdate = (req, res) => {

    UpcomingTask.find({})
        .exec()
        .then(doc => {

            doc.forEach(task => {

                let totalEstHour = 0
                let completedHour = 0

                if (task.subTasks.length > 0) {
                    task.subTasks.forEach(subTask => {
                        totalEstHour += subTask.estHour
                        if (subTask.completedAt != null) {
                            completedHour += subTask.estHour
                        }
                    })
                }

                const percent = Math.floor(completedHour * 100 / totalEstHour)

                UpcomingTask.update({ _id: task._id }, { percent })
                    .then(data => {
                        console.log(data)
                    })
            })
        })

    res.json({
        message: 'Success'
    })

    // UpcomingTask.updateMany(
    //     {},
    //     {
    //         $addToSet: {
    //             percent: 
    //         }
    //     },
    //     {
    //         multi: true
    //     }
    // )
    // .then( data => {
    //     res.json(data)
    // })
    // .catch( err => res.json(err))

}

exports.taskSearchRunning = async (req, res) => {

    const userName = await req.query.name
    const projectName = await req.query.project
    const searchText = await req.query.text
    const pageSize = await JSON.parse(req.query.pageSize)
    const running = await JSON.parse(req.query.running)
    const completedAt = await JSON.parse(req.query.completedAt)
    const newlyAdded = await JSON.parse(req.query.newlyAdded)

    //-- Pagination settings
    const pageNo = await JSON.parse(req.query.page)
    const skip = pageNo * pageSize - pageSize

    //-- Set Query Object
    const queryObj = await queryBuilder(userName, projectName, searchText, running, completedAt)

    // return res.json(queryObj)

    //-- Count total tasks
    const totalTasks = await totalTask(queryObj)


    //-- by user & project
    const { userEstHour, userTotalSubTask } = await singleUserEst(queryObj)


    //-- all user
    const { totalEstHour, totalSubTask } = await totalEst(queryObj)

    //-- set sort items
    let sort = {
        release: -1,
        completedAt: -1,
        percent: -1,
        rate: -1,
        "subTasks.name": 1
    }

    if (newlyAdded == true) {
        sort = { createdAt: -1, ...sort }
    }

    UpcomingTask.find(queryObj)
        .sort(sort)
        .skip(skip).limit(pageSize)
        // sort: { "_id.completedAt": -1, "_id.rate": -1, "_id.taskName": 1 } }
        .then(data => {

            //-- Transform Data
            let result = data.map(item => {

                let estHour = 0
                let completedHour = 0
                let maxCompletedAt = null
                let startAt = null
                let dueHour = 0
                // let percent = 0

                if (item.subTasks.length > 0) {

                    item.subTasks.forEach(subTask => {
                        //-- calculation of completed hour
                        if (subTask.completedAt != null) {
                            completedHour += subTask.estHour


                            /**
                             * ------------------------------
                             * set subTask maxCompletedAt
                             * ------------------------------
                             */
                            if (subTask.completedAt) {
                                if (maxCompletedAt == null) {
                                    maxCompletedAt = subTask.completedAt
                                } else {
                                    if (subTask.completedAt > maxCompletedAt) {
                                        maxCompletedAt = subTask.completedAt
                                    }
                                }
                            }
                        }

                        /**
                         * ---------------------------
                         * Set startAt
                         * ---------------------------
                         */
                        if (subTask.startDate) {
                            if (startAt == null) {
                                startAt = subTask.startDate
                            } else {
                                if (subTask.startDate < startAt) {
                                    startAt = subTask.startDate
                                }
                            }
                        }

                        // totalEstHour += subTask.estHour
                        estHour += subTask.estHour
                    })

                    dueHour = estHour - completedHour
                    // percent = Math.floor(completedHour * 100 / estHour)
                }


                return {
                    _id: item._id,
                    status: item.status,
                    running: item.running,
                    rate: item.rate,
                    taskName: item.taskName,
                    description: item.description,
                    taskType: item.taskType,
                    projectName: item.projectName,
                    completedAt: item.completedAt,
                    maxCompletedAt: maxCompletedAt,
                    startAt,
                    assignedBy: item.assignedBy,
                    createdAt: moment(item.createdAt).format('DD-MMM-YYYY'),
                    createdBy: item.createdBy,
                    updatedBy: item.updatedBy,
                    updatedAt: moment(item.updatedAt).format('DD-MMM-YYYY'),
                    estHour,
                    completedHour,
                    percent: item.percent || 0,
                    dueHour,
                    subTasks: item.subTasks,
                    release: item.release,
                    sprint: item.sprint
                }
            })//-- end result


            //-- sort by percent
            // const newResult = _.orderBy(result, ['percent', 'rate', 'taskName'],['desc', 'desc', 'asc']); // Use Lodash to sort array by 'name'

            return res.json({
                pagination: {
                    total: totalTasks,
                    current: pageNo,
                    pageSize
                },
                userName,
                totalEstHour,
                totalSubTask,
                userEstHour,
                userTotalSubTask,
                result
            })


        }).catch(err => {
            res.status(404).json({
                err
            })
        })
}

/**
 * ------------------------------------------------------------------------------------
 * Search Task
 * ------------------------------------------------------------------------------------
 */
exports.taskSearch = async (req, res) => {

    const userName = await req.query.name
    const projectName = await req.query.project
    const searchText = await req.query.text
    const pageSize = await JSON.parse(req.query.pageSize)
    const running = await JSON.parse(req.query.running)
    const completedAt = await JSON.parse(req.query.completedAt)

    //-- Pagination settings
    const pageNo = await JSON.parse(req.query.page)
    // const pageSize = 3 //-- initialize the pageSize / pageSize / perPage data
    const skip = pageNo * pageSize - pageSize


    //-- Set Query Object
    const queryObj = await queryBuilder(userName, projectName, searchText, running, completedAt)


    // return res.json(
    //     queryObj
    // )

    // UpcomingTask.find({
    //     completedAt: { $eq: null}
    // }).then(data => res.json(data))


    //-- Count total tasks
    const totalTasks = await totalTask(queryObj)


    //-- by user & project
    const { userEstHour, userTotalSubTask } = await singleUserEst(queryObj)


    //-- all user
    const { totalEstHour, totalSubTask } = await totalEst(queryObj)


    // return res.json({
    //     totalEstHour
    // })

    UpcomingTask.aggregate([
        {
            "$unwind": {
                'path': '$subTasks',
                "preserveNullAndEmptyArrays": true,
                "includeArrayIndex": "arrayIndex"
            }
        },
        { $sort: { "subTasks.name": 1 } },
        {
            $match: queryObj
        },
        {
            $group: {
                _id: {
                    _id: "$_id",
                    taskName: "$taskName",
                    projectName: "$projectName",
                    taskType: "$taskType",
                    description: "$description",
                    assignedBy: "$assignedBy",
                    completedAt: "$completedAt",
                    // status: "$status",
                    running: "$running",
                    rate: "$rate",
                },
                subTasks: { $push: "$subTasks" },
                estHour: {
                    $sum: "$subTasks.estHour"
                }
            }
        },
        { $sort: { "_id.completedAt": -1, "_id.rate": -1, "_id.taskName": 1 } }

    ])
        .skip(skip).limit(pageSize)
        .then(data => {

            //-------- Transform Data --------
            const result = data.map(item => {

                //-- calculation of completed hour
                const completedHour = item.subTasks.filter(item1 => {
                    if (item1.completedAt != null) {
                        return item1
                    }
                }).reduce((acc, cur) => acc + cur.estHour, 0)

                const percent = Math.floor(completedHour * 100 / item.estHour)

                return {
                    ...item._id,
                    subTasks: item.subTasks,
                    estHour: item.estHour,
                    completedHour,
                    dueHour: item.estHour - completedHour,
                    percent: percent || 0
                }
            })

            //-- Return Result
            res.status(200).json({
                pagination: {
                    total: totalTasks,
                    current: pageNo,
                    pageSize
                },
                totalEstHour,
                totalSubTask,
                userName,
                userEstHour,
                userTotalSubTask,
                result
            })

        }).catch(err => {
            res.status(404).json({
                err
            })
        })
}

/**
 * ------------------------------------------------------------------------------------------------
 *  Create New Task
 * ------------------------------------------------------------------------------------------------
 */
exports.createNewTask = (req, res) => {

    const upcomingTask = new UpcomingTask({
        taskName: req.body.taskName,
        description: req.body.description,
        taskType: req.body.taskType,
        projectName: req.body.projectName,
        assignedBy: req.body.assignedBy,
        createdBy: req.body.createdBy,
        sprint: req.body.sprint,
    })

    upcomingTask.save()
        .then(result => {

            const formatedData = {
                _id: result._id,
                rate: result.rate,
                taskName: result.taskName,
                description: result.description,
                projectName: result.projectName,
                taskType: result.taskType,
                createdAt: result.createdAt,
                assignedBy: result.assignedBy,
                createdBy: result.createdBy,
                sprint: result.sprint,
            }

            res.status(200).json({
                ...formatedData
            })
        })
        .catch(err => {
            res.status(403).json({
                err
            })
        })
}



/**
 * ------------------------------------------------------------------------------------------------
 *  All List
 * ------------------------------------------------------------------------------------------------
 */
exports.taskList = (req, res) => {

    UpcomingTask.aggregate([
        {
            $group: {
                _id: null,
                totalEst: { $sum: "$estHour" }
            }
        }
    ])
        .exec()
        .then(estHour => {

            //-- get Total Est Hour
            const totalEstHour = estHour[0].totalEst

            //-- get all task
            UpcomingTask.find({})
                .exec()
                .then(allData => {
                    res.status(200).json({
                        count: allData.length,
                        totalEstHour,
                        result: allData
                    })
                })
        })
}


//-- Task Bulk Insert from description (Edit Mode)
createBulkTask = (id) => {
    return UpcomingTask.findById(id)
        .exec()
        .then(data => {

            const spittedTasks = data.description.split(/\r\n|\n|\r/);

            if (spittedTasks.length > 0) {

                const bulkTasks = spittedTasks.map(task => {
                    return {
                        taskName: task,
                        description: task,
                        taskType: data.taskType,
                        projectName: data.projectName,
                        assignedBy: data.assignedBy,
                        createdBy: data.updatedBy,
                    }
                })

                //-- Delete main task
                UpcomingTask.deleteOne({ _id: id }).exec()

                //-- Insert Many
                return UpcomingTask.insertMany(bulkTasks)
                    .exec()
                    .then(result => result)
                    .catch(err => err)
            } else {
                return false
            }
        })
        .catch(err => err)
}

//-- Update user
exports.updateTask = (req, res) => {

    req.body.updatedAt = new Date()

    UpcomingTask.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true })
        .exec()
        .then(doc => {

            //-- bulkInsert from description field
            if (req.body.bulkInsert) {
                createBulkTask(req.params.id)
            }

            res.status(200).json(doc)
        })
        .catch(err => {
            res.status(403).json({
                err
            })
        })
}

//-- Delete Task by ID
exports.deleteTask = (req, res, next) => {

    UpcomingTask.deleteOne({ _id: req.params.id })
        .exec()
        .then(docs => {
            res.status(200).json({
                message: 'Successfully deleted',
                docs
            })
        })
        .catch(err => {
            res.status(500).json({ error: err })
        })
}


/**
 * ----------------------------------------------------------------------------------------------------
 * user Summary Report
 * ----------------------------------------------------------------------------------------------------
 */
exports.summaryUser = (req, res) => {

    UpcomingTask.aggregate([
        {
            "$unwind": {
                'path': '$subTasks',
                "preserveNullAndEmptyArrays": true,
                "includeArrayIndex": "arrayIndex"
            }
        },
        {
            $match: {
                $and: [
                    { completedAt: { $eq: null } },
                    { "subTasks.completedAt": { $eq: null } }
                ]
            }
        },
        {
            $group: {
                _id: {
                    assignedUser: "$subTasks.assignedUser"
                },
                estHour: {
                    $sum: "$subTasks.estHour"
                }
            }
        },
        {
            $match: {
                "_id.assignedUser": { $ne: null }
            }
        },
        { $sort: { "_id.assignedUser": 1 } }

    ])
        .then(data => {

            //-- Transform Data
            const result = data.map(item => {
                return {
                    ...item._id,
                    estHour: item.estHour,
                }
            })


            res.json({
                result
            })
        })
}


/**
 * ----------------------------------------------------------------------------------------------------
 * Project Summary Report
 * ----------------------------------------------------------------------------------------------------
 */
exports.summaryProject = (req, res) => {

    UpcomingTask.aggregate([
        {
            "$unwind": {
                'path': '$subTasks',
                "preserveNullAndEmptyArrays": true,
                "includeArrayIndex": "arrayIndex"
            }
        },
        {
            $match: {
                $and: [
                    { completedAt: { $eq: null } },
                    { "subTasks.completedAt": { $eq: null } }
                ]
            }
        },
        {
            $group: {
                _id: {
                    projectName: "$projectName"
                },
                estHour: {
                    $sum: "$subTasks.estHour"
                }
            }
        },
        { $sort: { "_id.projectName": 1 } }
    ])
        .then(data => {
            //-- Transform Data
            const result = data.map(item => {
                return {
                    ...item._id,
                    estHour: item.estHour,
                }
            })

            res.json({
                result
            })
        })
}