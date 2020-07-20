const route = require('express').Router()

const postCollection = require('../database/postModel')
const usersCollection = require('../database/userModel')

/* ADICIONAR NOVO POST NO BANCO DE DADOS */
route.post('/newpost', (req, res) => {
    let {txtarea, db_user_id} = req.body

    usersCollection.findById({_id: db_user_id}, (err, doc) => {
        const newPost = new postCollection({
            userid: doc._id,
            headerphoto: doc.userPhoto,
            headerusername: doc.username,
            bodytext: txtarea,
            like: 0,
            love: 0,
            comment: []
        })
        
        newPost.save((err) => {
            err ? console.log(err) : res.send({message: 'Posted'})
        })
    })
})


/* ENVIAR OS POSTS */
route.get('/posts', function(req, res) {
    const numberOfPosts = Number(req.query.numberOfPosts)

    postCollection.find().sort({timestamp: -1}).limit(numberOfPosts).then(doc => {
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


/* RETORNA O NÚMERO DE LIKES DE CADA POST E OS LIKES JÁ DADOS PELO USUÁRIO */
route.post('/post-buttons', (req, res) => {
    const {postid, db_user_id} = req.body

    // FAZER COM QUE RETORNE O ARRAY ESPECIFICO DO REACTEDPOSTS
    usersCollection.findById({_id: db_user_id},
        {reactedposts: {$elemMatch: {postid: postid}}}, (usererror, userdoc) => {
            if(!usererror) {
                postCollection.findById({_id: postid}, (err, doc) => {
                    if(!err) {
                        if(doc) {
                            let reactionSaved = userdoc.reactedposts[0]
                            res.send({
                                like: doc.like,
                                love: doc.love,
                                comment: doc.comment.length,
                                isLikeClicked: reactionSaved ? reactionSaved.like : false,
                                isLoveClicked: reactionSaved ? reactionSaved.love : false
                            })
                        } else {
                            res.send('Post not found')
                        }
                    } else {
                        console.log(err)
                    }
                })
            } else {
                console.log(usererror)
            }
    })
})

/* ATUALIZAR VALORES DE LIKE, LOVE, E COMMENTS */
route.patch('/post-buttons', (req, res) => {
    const {iconName, postid, isButtonClicked, db_user_id} = req.body

    postCollection.updateOne({_id: postid}, {$inc: {[iconName]: isButtonClicked ? 1 : -1}}, err => {err && console.log(err)})
     
    usersCollection.findOneAndUpdate({_id: db_user_id, 'reactedposts.postid': postid}, {$set: {[`reactedposts.$.${iconName}`]: isButtonClicked}}, (err, doc) => {
        if(!err) {
            if(!doc) {
                let teste = {
                    like: false,
                    love: false,
                }
                usersCollection.updateOne({_id: db_user_id}, {$push: {reactedposts: {postid, ...teste, [iconName]: true}}}, (err) => {err && console.log(err)})
            } else {
                for(let post of doc.reactedposts) {
                    !post.like && !post.love && usersCollection.updateOne({_id: db_user_id}, {$pull: {'reactedposts': {'postid': post.postid}}}, err => {err && console.log(err)})
                }
            }
        } else {
            console.log(err)
        }

        res.send('Reaction sent') 
    })
})


module.exports = route