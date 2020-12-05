const route = require('express').Router()
const mongoose = require('mongoose')
const mongoTimestampFormat = require('../utils/mongoTimestampFormat')

const yup = require('yup')

const usersCollection = require('../database/userModel')

/* DADOS DO PROFILE DO USUÁRIO SELECIONADO */
route.get('/profile/:db_user_id', (req, res, next) => {
    const db_user_id = req.params.db_user_id

    let schema = yup.string().test('ObjectId', 'this is not a valid database ID', value => {
        return mongoose.isValidObjectId(value)
    }).required()

    schema.validate(db_user_id).then(() => {
        db_user_id == 'favicon.ico' ? next() :
        usersCollection.aggregate()
            .match({_id: mongoose.Types.ObjectId(db_user_id)})
            .project({
                username: true,
                userPhoto: true,
                timestamp: true, 
                friendsLength: {$size: '$friends.friendList'}   
            }).exec((err, doc) => {
                if(!err) {
                    if(doc) {
                        doc = doc[0]
        
                        res.send({
                            src: doc.userPhoto,
                            username: doc.username,
                            userid: doc._id,
                            friendslength: doc.friendsLength,
                            date: mongoTimestampFormat.toDate(doc.timestamp)
                        })
                    } else {
                        res.status(404).send({
                            message: 'User not found.'
                        })
                    }
                } else {
                    next(err)
                }
            })
    }).catch(err => next(err))
})

module.exports = route