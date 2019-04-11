const mongoose = require('mongoose');

const upcomingTaskSchema = mongoose.Schema({
    taskName: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    taskType: {
        type: String
    },
    projectName: {
        type: String
    },
    subTasks:[
        {
            name: {
                type: String,
                required: true
            },
            assignedUser: String,
            estHour: Number,
            status: Boolean,
            createdAt : { type : Date, default: Date.now },
            startAt: Date,
            completedAt: Date
        }
    ],
    createdAt : { type : Date, default: Date.now },
    status: {
        type: Boolean,
        default: false
    }
})


module.exports = mongoose.model('UpcomingTask', upcomingTaskSchema);