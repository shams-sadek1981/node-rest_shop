const mongoose = require('mongoose');

const taskEstHourSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    projectName: {
        type: String
    },
    taskType: {
        type: String
    },
    taskName: {
        type: String,
        required: true
    },
    estHour: {
        type: Number,
        default: 0
    }
})


module.exports = mongoose.model('TaskEstHour', taskEstHourSchema);