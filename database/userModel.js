const mongoose = require('mongoose')
const findOrCreate = require('mongoose-findorcreate')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    googleId: String,
})

userSchema.plugin(findOrCreate)

module.exports = mongoose.model('usersCollection', userSchema)