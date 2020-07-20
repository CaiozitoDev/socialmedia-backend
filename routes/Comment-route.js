const route = require('express').Router()

const postCollection = require('../database/postModel')
const usersCollection = require('../database/userModel')

/* PEGAR POST ÚNICO */
route.get('/getpost/:postid', (req, res) => {
    const postid = req.params.postid

    postCollection.findById({_id: postid}).then(doc => {
        res.send(doc)
    })
})

route.patch('/addcomment', (req, res) => {
    const {postid, txtValue, db_user_id} = req.body

    usersCollection.findById({_id: db_user_id}).select({username: 1, userPhoto: 1}).then((doc) => {
        postCollection.updateOne({_id: postid}, {$push: {comment: {
            userid: db_user_id,
            username: doc.username,
            userPhoto: doc.userPhoto,
            bodytext: txtValue
        }}}, (err1) => {
            err1 ? console.log(err1) : res.send('Comment added')
        })
    })
})

module.exports = route