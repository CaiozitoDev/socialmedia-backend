const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    members: Array,
    messages: Array
})

module.exports = mongoose.model('chatCollection', schema)