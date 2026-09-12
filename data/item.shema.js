const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    min: {
        type: Number,
        required: true
    },
    max: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    images: {
        type: [String],
        required: true
    },
    category: {
        type: String,
        required: true
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }]
});

module.exports = mongoose.model('Item', itemSchema);