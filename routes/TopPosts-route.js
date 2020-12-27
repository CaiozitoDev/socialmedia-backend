const route = require('express').Router()

const postCollection = require('../database/postModel')

/* ROTAS DO MOST LOVED POSTS*/
route.get('/topposts', (req, res) => {
    postCollection.find({love: {$gt: 0}}, {
        username: true,
        photo: true,
        content: true,
        userId: true,
        love: true
    }).sort({love: -1}).limit(10).then(data => {
        /* data = data.map(post => {
            return {
                postId: post._id,
                username: post.username,
                photo: post.photo,
                content: post.content,
                userId: post.userId
            }
        }) */
        
        res.send({
            posts: data
        })
    })
})

module.exports = route