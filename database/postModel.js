const mongoose = require('mongoose')

const postSchema = new mongoose.Schema({
    postbodytext: {
        required: true,
        type: String
    }
})

module.exports = mongoose.model('posts', postSchema)