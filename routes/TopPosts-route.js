const route = require('express').Router()

const postCollection = require('../database/postModel')

/* ROTAS DO MOST LOVED POSTS*/
route.get('/topposts', (req, res) => {
    postCollection.find().sort({love: -1}).limit(10).then(data => {
        let lightVersion = []
        data.map(post => {
            if(post.love >= 1) {
                lightVersion.push({
                    headerusername: post.headerusername,
                    headerphoto: post.headerphoto,
                    bodytext: post.bodytext,
                    postid: post._id
                })
            }
        })
        
        res.send(lightVersion)
    })
})

module.exports = route