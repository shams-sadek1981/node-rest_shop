const mongoose = require('mongoose');

const taskLogSchema = mongoose.Schema({
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
    projectName: {
        type: String
    },
    taskType: {
        type: String
    }
})


module.exports = mongoose.model('TaskLog', taskLogSchema);