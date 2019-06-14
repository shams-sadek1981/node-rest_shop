const mongoose = require('mongoose');

const subTaskSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('SubTask', subTaskSchema);