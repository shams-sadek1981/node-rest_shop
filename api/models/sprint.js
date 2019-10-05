const mongoose = require('mongoose');

const sprintSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String
    },
    projects: [{
        type: String
    }],
    createdAt : { type : Date, default: Date.now },
    startDate : { type : Date },
    endDate : { type : Date },
    status: {
        type: Boolean,
        default: false
    }
})

module.exports = mongoose.model('sprint', sprintSchema);