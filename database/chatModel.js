const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    members: [{
        type: Object,
        userId: {
            type: mongoose.Types.ObjectId,
            required: true
        },
        username: {
            type: String,
            required: true
        },
        photo: {
            type: String,
            required: true
        }
    }],
    messages: [{
        type: Object,
        userId: {
            type: mongoose.Types.ObjectId,
            required: true
        },
        username: {
            type: String,
            required: true
        },
        content: {
            type: String,
            required: true
        },
        timestamp: Date
    }],
    timestamp: {
        type: Date,
        default: () => {
            return new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), new Date().getHours(), new Date().getMinutes(), new Date().getSeconds()));
        }
    }
})

module.exports = mongoose.model('chats', schema)