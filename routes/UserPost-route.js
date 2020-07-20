const route = require('express').Router()

const postCollection = require('../database/postModel')

route.get('/userpost', (req, res) => {
    const {username} = req.query
    const numberOfPosts = Number(req.query.numberOfPosts)

    postCollection.find({headerusername: username}).limit(numberOfPosts).then(doc => {
        let lightVersion = []
        doc.map(post => {
            lightVersion.push({
                headerusername: post.headerusername,
                headerphoto: post.headerphoto,
                bodytext: post.bodytext,
                _id: post._id,
                userid: post.userid,
                date: post.timestamp
            })
        })
        postCollection.countDocuments().then(value => {
            res.send({posts: lightVersion, postLength: value})
        })
    })
})

module.exports = route