const mongoose = require('mongoose')
const moment = require('moment')

const userSchema = new mongoose.Schema({
    login: {
        type: String,
        minlength: 4,
        required: true
    },
    username: {
        type: String,
        minlength: 3,
        required: true
    },
    password: {
        type: String,
        minlength: 4
    },
    fbId: {
        type: String,
    },
    photo: {
        type: Object,
        required: true
    },
    activeChats: [mongoose.Types.ObjectId],
    reactedPosts: [{
        type: Object,
        postId: {
            required: true,
            type: mongoose.Types.ObjectId
        },
        like: {
            type: Boolean,
            default: false
        },
        love: {
            type: Boolean,
            default: false
        },
    }],
    friends: {
        friendRequests: [{
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
            }
        }],
        friendList: [{
            type: Object,
            userId: {
                required: true,
                type: mongoose.Types.ObjectId
            },
            username: {
                required: true,
                type: String
            },
            photo: String
        }],
        sentRequests: [mongoose.Types.ObjectId]
    },
    sessionKey: {
        required: true,
        type: String
    },
    timestamp: {
        type: Date,
        default: () => {
            return new Date(moment('pt-BR').format())
        }
    }
})

module.exports = mongoose.model('users', userSchema)