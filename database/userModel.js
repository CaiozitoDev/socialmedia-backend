const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        minlength: 4
    },
    password: {
        type: String,
        minlength: 4
    },
    fbId: {
        type: String,
    },
    fbUrl: {
        type: String,
    },
    userPhoto: {
        type: Object,
    },
    posts: Array,
    reactedposts: Array,
    friends: Array,
    timestamp: {
        type: Date,
        default: Date.now
    }
    
})

module.exports = mongoose.model('usersCollection', userSchema)