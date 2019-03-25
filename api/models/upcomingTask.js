const mongoose = require('mongoose');

const upcomingTaskSchema = mongoose.Schema({
    taskName: {
        type: String,
        required: true,
        unique: true
    },
    subTask:[
        {
            subTaskName: {
                type: String
            }
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
        default: 0
    },
    mockup: {
        type: Boolean,
        default: 0
    },
    design: {
        type: Boolean,
        default: 0
    },
    frontend: {
        type: Boolean,
        default: 0
    },
    createdAt : { type : Date, default: Date.now }
})


module.exports = mongoose.model('UpcomingTask', upcomingTaskSchema);