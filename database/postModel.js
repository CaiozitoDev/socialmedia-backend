const mongoose = require('mongoose')

const postSchema = new mongoose.Schema({
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
    }
})

module.exports = mongoose.model('postsCollection', postSchema)