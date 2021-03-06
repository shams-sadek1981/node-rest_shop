const mongoose = require('mongoose');

const releaseSchema = mongoose.Schema({
    projectName: {
        type: String
    },
    projectType: {
        type: String
    },
    version: {
        type: String
    },
    description: {
        type: String
    },
    createdAt : { type : Date, default: Date.now },
    releaseDate : { type : Date },
    releasedAt : { type : Date },
    status: {
        type: Boolean,
        default: false
    }
})

module.exports = mongoose.model('release', releaseSchema);