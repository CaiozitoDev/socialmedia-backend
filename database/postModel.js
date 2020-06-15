const mongoose = require('mongoose')

const postSchema = new mongoose.Schema({
    userid: {
        type: String
    },
    headerphoto: {
        required: true,
        type: String
    },
    headerusername: {
        required: true,
        type: String,
    },
    bodytext: {
        required: true,
        type: String
    },
    like: {
        type: Number
    },
    love: {
        type: Number
    },
    comment: {
        type: Array
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('postsCollection', postSchema)