const mongoose = require('mongoose');

const publicHolidaySchema = mongoose.Schema({
    holiday: {
        type: Date,
        required: true,
        unique: true
    },
    description: {
        type: String
    }
})

module.exports = mongoose.model('PublicHoliday', publicHolidaySchema);