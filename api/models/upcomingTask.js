const mongoose = require('mongoose');

const upcomingTaskSchema = mongoose.Schema({
    taskName: {
        type: String,
        required: true
    },
    subTask:[
        {
            name: {
                type: String,
                required: true
            },
            assignedUser: String,
            estHour: Number,
            createdAt : { type : Date, default: Date.now },
            startAt: Date,
            completedAt: Date
        }
    ],
    description: {
        type: String
    },
    taskType: {
        type: String
    },
    projectName: {
        type: String
    },
    assignedUser: {
        type: String
    },
    estHour: {
        type: Number
    },
    srs: {
        type: Boolean,
        default: false
    },
    mockup: {
        type: Boolean,
        default: false
    },
    design: {
        type: Boolean,
        default: false
    },
    frontend: {
        type: Boolean,
        default: false
    },
    createdAt : { type : Date, default: Date.now }
})


module.exports = mongoose.model('UpcomingTask', upcomingTaskSchema);