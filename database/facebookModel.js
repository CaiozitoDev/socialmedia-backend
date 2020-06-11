const mongoose = require('mongoose')

const facebookSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        minlength: 4
    },
    fbId: {
        type: String,
        required: true,
        minlength: 4
    },
    userUrl: {
        type: String,
    },
})

module.exports = mongoose.model('facebookCollection', facebookSchema)