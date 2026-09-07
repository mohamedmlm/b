const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 20
    },
    username: {
        type: String,
        unique: true,
        required: true,
        minlength: 3,
        maxlength: 20
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        default: 'user'
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    verificationCode: {
        type: String,
        default: null
    },
    notExpiredUntil: {
        type: Date,
        default: null
    },
    timetodeleteuser: {
        type: Date,
        default: null
    },
    avatar: {
        type: String,
        default: "Uploads/avatar/profile.jpg"
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }]
});

module.exports = mongoose.model('User', userSchema);