const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const User = new Schema({
    index: {
        type: Number,
        required: true
    },
    timeStamp: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    companyName: {
        type: Array,
        required: true
    },
    companyEmails: {
        type: Array,
        required: true
    },
    nonce: {
        type: Number,
        required: true
    },
    previousBlockHash: {
        type: String,
        required: true
    },
    hash: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('user',User);