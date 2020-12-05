const route = require('express').Router()
const mongoose = require('mongoose')
const postCollection = require('../database/postModel')
const usersCollection = require('../database/userModel')
const mongoTimestampFormat = require('../utils/mongoTimestampFormat')

const yup = require('yup')

/* ADICIONAR NOVO POST NO BANCO DE DADOS */
route.post('/posts', (req, res, next) => {
    let {content, db_user_id} = req.body

    let schema = yup.object().shape({
        content: yup.string().min(1).max(400).required(),
        db_user_id: yup.string().test('ObjectId', 'this is not a valid database ID', value => {
            return mongoose.isValidObjectId(value)
        }).required()
    })

    schema.validate({
        content,
        db_user_id
    }, {
        abortEarly: false
    }).then(() => {
        usersCollection.findById({_id: mongoose.Types.ObjectId(db_user_id)}, {
            _id: true,
            photo: true,
            username: true
        }).then(doc => {
            if(doc) {
                const newPost = new postCollection({
                    userId: doc._id,
                    photo: doc.photo,
                    username: doc.username,
                    content,
                })
                
                newPost.save().then(() => {
                    res.send({message: 'Post sent successfully.'})
                }).catch(err => next(err))
            } else {
                res.status(404).send({
                    message: 'User not found.'
                })
            }
        }).catch(err => next(err))
    }).catch(err => next(err))
})


/* ENVIAR OS POSTS */
route.get('/posts', function(req, res, next) {
    const from = Number(req.query.from)
    const to = Number(req.query.to)

    let schema = yup.object().shape({
        from: yup.number().integer().min(0).required(),
        to: yup.number().integer().positive().required()
    })

    schema.validate({
        from,
        to
     }, {
        abortEarly: false
    }).then(() => {
        postCollection.find({}, {
            username: true,
            photo: true,
            content: true,
            userId: true,
            timestamp: true
        }).sort({_id: -1}).skip(from).limit(to).then(doc => {
            if(doc) {
                doc.filter(post => {
                    return {
                        username: post.username,
                        photo: post.photo,
                        content: post.content,
                        _id: post._id,
                        userId: post.userId,
                        date: mongoTimestampFormat.toDate(post.timestamp)
                    }
                })
                
                postCollection.estimatedDocumentCount().then(allPostsLength => {
                    res.send({posts: doc, allPostsLength})
                }).catch(err => next(err))
            } else {
                res.status(404).send({
                    message: 'Post not found.'
                })
            }
        })
    }).catch(err => next(err))
}) 

/* RETORNA O NÚMERO DE LIKES DE CADA POST E OS LIKES JÁ DADOS PELO USUÁRIO */
route.get('/post-buttons', (req, res, next) => {
    const {postid, db_user_id} = req.query

    let schema = yup.object().shape({
        postid: yup.string().test('ObjectId', 'this is not a valid database ID', value => {
            return mongoose.isValidObjectId(value)
        }),
        db_user_id: yup.string().test('ObjectId', 'this is not a valid database ID', value => {
            return mongoose.isValidObjectId(value)
        })
    })

    schema.validate({
        postid,
        db_user_id
    }, {
        abortEarly: false
    }).then(() => {
        // FAZER COM QUE RETORNE O ARRAY ESPECIFICO DO REACTEDPOSTS
        usersCollection.findById({_id: mongoose.Types.ObjectId(db_user_id)}, {
            reactedPosts: {
                $elemMatch: {
                    postId: mongoose.Types.ObjectId(postid)
                }
            }
        }).then(userDoc => {
            if(userDoc.reactedPosts.length) {
                postCollection.aggregate()
                .match({_id: mongoose.Types.ObjectId(postid)})
                .project({
                    like: true,
                    love: true,
                    comments: {$size:"$comments"}
                }).exec(function(err, doc) {
                    err && next(err)

                    if(doc) {
                        console.log(userDoc)
                        doc = doc[0]
                        let reactionSaved = userDoc.reactedPosts[0]

                        res.send({
                            like: {
                                value: doc.like,
                                isClicked: reactionSaved.like ? reactionSaved.like : false
                            },
                            love: {
                                value: doc.love,
                                isClicked: reactionSaved.love ? reactionSaved.love : false
                            },
                            comments: doc.comments,
                        })
                    }
                })
            } else {
                res.status(404).send({
                    message: 'No reactions found.'
                })
            }
        }).catch(err => next(err))
    }).catch(err => next(err))
})


/* ATUALIZAR VALORES DE LIKE, LOVE, E COMMENTS */
route.patch('/post-buttons', (req, res, next) => {
    const {iconName, postid, isButtonClicked, db_user_id} = req.body

    let schema = yup.object().shape({
        iconName: yup.string().equals(['like', 'love']).required(),
        postid: yup.string().test('ObjectId', 'this is not a valid database ID', value => {
            return mongoose.isValidObjectId(value)
        }),
        isButtonClicked: yup.bool().strict(true).required(),
        db_user_id: yup.string().test('ObjectId', 'this is not a valid database ID', value => {
            return mongoose.isValidObjectId(value)
        })
    })

    schema.validate({
        iconName,
        postid,
        isButtonClicked,
        db_user_id
    }, {
        abortEarly: false
    }).then(() => {
        postCollection.updateOne({_id: mongoose.Types.ObjectId(postid)}, {$inc: {[iconName]: isButtonClicked ? 1 : -1}}, err => {err && next(err)})
     
        usersCollection.findOneAndUpdate({
            _id: mongoose.Types.ObjectId(db_user_id), 
            'reactedPosts.postId': mongoose.Types.ObjectId(postid)
        }, {
            $set: {[`reactedPosts.$.${iconName}`]: isButtonClicked}
        }, {
            new: true
        }).then(doc => {
            if(!doc) {
                let pattern = {
                    like: false,
                    love: false,
                }

                usersCollection.updateOne({_id: mongoose.Types.ObjectId(db_user_id)}, {$push: {reactedPosts: {postId: mongoose.Types.ObjectId(postid), ...pattern, [iconName]: true}}}, err => {err && next(err)})
            } else {
                for(let post of doc.reactedPosts) {
                    !post.like && !post.love && doc.updateOne({$pull: {reactedPosts: {postId: mongoose.Types.ObjectId(post.postId)}}}, err => {err && next(err)})
                }
            }
    
            res.send({message: 'Reaction sent successfully'}) 
        }).catch(err => next(err))
    }).catch(err => next(err))
})


module.exports = route