const mongoose = require('mongoose');

const taskNo = mongoose.Schema({
    // _id: mongoose.Schema.Types.ObjectId,
    f_year: Number,
    seq: {
        type: Number,
        default: 1
    }
})

module.exports = mongoose.model('TaskNo', taskNo);