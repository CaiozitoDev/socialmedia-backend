const mongoose = require('mongoose')
const moment = require('moment')

const postSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    photo: {
        required: true,
        type: String
    },
    username: {
        required: true,
        type: String,
    },
    content: {
        required: true,
        type: String
    },
    like: {
        type: Number,
        default: 0
    },
    love: {
        type: Number,
        default: 0
    },
    comments: [{
        type: Object,
        userId: {
            required: true,
            type: mongoose.Types.ObjectId
        },
        username: {
            required: true,
            type: String
        },
        photo: {
            required: true,
            type: String
        },
        content: {
            required: true,
            type: String
        }
    }],
    timestamp: {
        type: Date,
        default: () => {
            return new Date(moment().locale('pt-BR').format())
        }
    }
})

module.exports = mongoose.model('posts', postSchema)