const route = require('express').Router()

const usersCollection = require('../database/userModel')

route.get('/userfilter', (req, res) => {
    const {username} = req.query
    const numberOfUsers = Number(req.query.numberOfUsers)

    usersCollection.find({username: {$regex: username, $options: 'i'}}).select({
        userPhoto: true, username: true
    }).limit(numberOfUsers).then(doc => {

        usersCollection.find({username: {$regex: username, $options: 'i'}}).countDocuments().then(value => {
            res.send({users: doc, userLength: `${value}`})
        })
    })
})

module.exports = route