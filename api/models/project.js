const mongoose = require('mongoose');

const projectSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String
    }
})

module.exports = mongoose.model('Project', projectSchema);