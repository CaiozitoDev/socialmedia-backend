const route = require('express').Router()
const yup = require('yup')
const mongoose = require('mongoose')

const postCollection = require('../database/postModel')
const usersCollection = require('../database/userModel')

/* PEGAR POST ÚNICO */
route.get('/getpost/:postid', (req, res, next) => {
    const postid = req.params.postid

    let schema = yup.string().test('ObjectId', 'this is not a valid database ID', value => {
        return mongoose.isValidObjectId(value)
    })

    schema.validate(postid).then(() => {
        postCollection.findById({_id: postid}).then(doc => {
            if(doc) {
                res.send(doc)
            } else {
                res.status(404).send({
                    message: 'Post not found.'
                })
            }
        })
    }).catch(err => next(err))
})

route.patch('/addcomment', (req, res, next) => {
    const {postid, content, db_user_id} = req.body

    let schema = yup.object().shape({
        postid: yup.string().test('ObjectId', 'this is not a valid database ID', value => {
            return mongoose.isValidObjectId(value)
        }),
        db_user_id: yup.string().test('ObjectId', 'this is not a valid database ID', value => {
            return mongoose.isValidObjectId(value)
        }),
        content: yup.string().min(1).max(400).required()
    })

    schema.validate({
        postid,
        db_user_id,
        content
    }, {
        abortEarly: false
    }).then(() => {
        usersCollection.findById({_id: mongoose.Types.ObjectId(db_user_id)}, {
            username: true,
            photo: true
        }).then(doc => {
            if(doc) {
                postCollection.updateOne({_id: mongoose.Types.ObjectId(postid)}, {$push: {comments: {
                    userId: doc._id,
                    username: doc.username,
                    userPhoto: doc.userPhoto,
                    content: txtValue
                }}}).then(() => {
                    res.send({message: 'Comment added'})
                }).catch(err => next(err))
            } else {
                res.status(404).send({
                    message: 'User not found.'
                })
            }
        }).catch(err => next(err))
    }).catch(err => next(err))
})

module.exports = route