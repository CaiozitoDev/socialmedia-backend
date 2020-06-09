const mongoose = require('mongoose')
const findOrCreate = require('mongoose-findorcreate')
const passportLocalMongoose = require('passport-local-mongoose')


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
    googleId: String,
})

module.exports = mongoose.model('usersCollection', userSchema)