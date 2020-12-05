const mongoose = require('mongoose')

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
            return new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), new Date().getHours(), new Date().getMinutes(), new Date().getSeconds()));
        }
    }
})

module.exports = mongoose.model('posts', postSchema)