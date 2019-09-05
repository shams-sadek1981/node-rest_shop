const mongoose = require('mongoose');

const userRoleSchema = mongoose.Schema({
    // _id: mongoose.Schema.Types.ObjectId,
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: String,
    permissions: [{
        permissionName: {
            type: String,
            required: true
        },
    }]
})


module.exports = mongoose.model('UserRole', userRoleSchema);