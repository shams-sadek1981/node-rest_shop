const mongoose = require('mongoose');

const userTaskSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    userName: {
        type: String,
        required: true
    },
    taskName: {
        type: String,
        required: true
    },
    workingHour: {
        type: Number,
        default: 0
    },
    estHour: {
        type: Number,
        default: 0
    },
    taskType: {
        type: String
    },
    projectName: {
        type: String
    }
})


module.exports = mongoose.model('UserTask', userTaskSchema);