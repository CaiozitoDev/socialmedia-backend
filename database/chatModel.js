const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    members: Array,
    messages: Array,
    timestamp: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('chatCollection', schema)