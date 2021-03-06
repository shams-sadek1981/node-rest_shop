const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    email: {
        type: String,
        required: true,
        unique: true,
        match: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String
    },
    mobile: {
        type: String
    },
    department: String,
    roles: [{
        roleName: {
            type: String,
            required: true
        },
        permissions: [{
            permissionName: {
                type: String,
                required: true
            },
        }]
    }],
    projects: [{
        projectName: String
    }]
})


module.exports = mongoose.model('User', userSchema);