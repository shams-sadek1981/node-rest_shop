const mongoose = require('mongoose');

const userPermissionSchema = mongoose.Schema({
    // _id: mongoose.Schema.Types.ObjectId,
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: String
})


module.exports = mongoose.model('UserPermission', userPermissionSchema);