const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    itemname: {
        type: String,
        required: true
    },
    itemprice: {
        type: Number,
        required: true
    },
    itempicture: {
        type: String,
        required: true
    },
    addressDetails: {
        street: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        district: {
            type: String,
            required: true
        },
        buildingNumber: {
            type: String,
            required: true
        },
        apartmentNumber: {
            type: String,
            required: false
        },
        distinctiveMark: {
            type: String,
            required: false
        }
    }, 
    min: {
        type: Number,
        required: true
    },
    max: {
        type: Number,
        required: true
    },
    ispayed: {
        type: Boolean,
        required: true,
        default: false
    },
    // ✅ جديد: حالة الرفض وسببه
    isRejected: {
        type: Boolean,
        required: true,
        default: false
    },
    rejectionReason: {
        type: String,
        default: ""
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    callnumber: {
        type: String,
        required: true,
        minlength: 6,
        maxlength: 20
    }
});

module.exports = mongoose.model('Pay', schema);