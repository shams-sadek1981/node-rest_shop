const mongoose = require('mongoose');

const upcomingTaskSchema = mongoose.Schema({
    taskName: {
        type: String,
        required: true,
        index: true
    },
    description: {
        type: String
    },
    taskType: {
        type: String
    },
    projectName: {
        type: String,
        index: true
    },
    subTasks:[
        {
            name: {
                type: String,
                required: true,
                index: true
            },
            description: {
                type: String,
            },
            assignedUser: {
                type: String,
                index: true
            },
            estHour: Number,
            status: {
                type: Boolean,
                default: false
            },
            createdAt : { type : Date, default: Date.now },
            createdBy: String,
            updatedBy: String,
            updatedAt : Date,
            startDate: Date,
            completedAt: Date,
            dueDate: Date,
            refLink: String,
            timeLog: [
                {
                    workingDate: Date,
                    hour: Number
                }
            ]
        }
    ],
    createdAt : { type : Date, default: Date.now },
    completedAt : Date,
    assignedBy: String,
    createdBy: String,
    updatedBy: String,
    updatedAt : Date,
    status: {
        type: Boolean,
        default: false
    },
    running: {
        type: Boolean,
        default: false
    },
    rate: {
        type: Number,
        default: 0
    },
    percent: {
        type: Number,
        default: 0
    },
    release: {
        type: String,
        index: true
    },
    sprint: {
        type: String,
        index: true
    }
})


module.exports = mongoose.model('UpcomingTask', upcomingTaskSchema);