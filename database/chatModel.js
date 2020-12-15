const mongoose = require('mongoose')
const moment = require('moment')

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
            return new Date(moment('pt-BR').format())
        }
    }
})

module.exports = mongoose.model('chats', schema)