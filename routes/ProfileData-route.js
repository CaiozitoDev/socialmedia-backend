const route = require('express').Router()

const usersCollection = require('../database/userModel')

route.get('/profile-photo/:id', (req, res) => {
    let db_user_id = req.params.id

    usersCollection.findById({_id: db_user_id}, (err, doc) => {
        res.send({src: doc.userPhoto, username: doc.username})
    })
})


/* DADOS DO PROFILE DO USUÁRIO SELECIONADO */
route.get('/profile/:username', (req, res) => {
    const username = req.params.username

    username !== 'favicon.ico' &&
    usersCollection.findOne({username: username}, (err, doc) => {
        if(doc) {
            res.send({src: doc.userPhoto,
                username: doc.username,
                userid: doc._id,
                friendslength: `${doc.friends.friendlist.length}`,
                date: doc.timestamp
            })
        } else {
            res.send({src: 'https://image.flaticon.com/icons/png/512/718/718672.png', username: 'User not found', userid: ''})
        }
    })
})

module.exports = route