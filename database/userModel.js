const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        minlength: 4
    },
    password: {
        type: String,
        required: true,
        minlength: 4
    },
    userPhoto: Object
})

module.exports = mongoose.model('usersCollection', userSchema)