const route = require('express').Router()
const yup = require('yup')
const mongoose = require('mongoose')

const usersCollection = require('../database/userModel')

module.exports = function(io) {
    /* REPASSA LISTA DE AMIGOS NA FRIENDS PAGE */
    route.get('/friendlist/:db_user_id', (req, res, next) => {
        const db_user_id = req.params.db_user_id

        let schema = yup.string().test('ObjectId', 'this is not a valid database ID', value => {
            return mongoose.isValidObjectId(value)
        }).required()

        schema.validate(db_user_id, {
            abortEarly: false
        }).then(() => {
            usersCollection.findById({_id: mongoose.Types.ObjectId(db_user_id)}, {
                'friends.friendList': true
            }).then(doc => {
                if(doc) {
                    doc = doc.toJSON()
            
                    res.send({friendList: doc.friends.friendList, success: true})
                } else {
                    res.send({friendList: [], success: false})
                }
            })
        }).catch(err => next(err))
    })

    /* VERIFICA SE JÁ SÃO AMIGOS */
    route.post('/arefriends', (req, res, next) => {
        const {postuserid, db_user_id} = req.body

        let schema = yup.object().shape({
            postuserid: yup.string().test('ObjectId', 'this is not a valid database ID', value => {
                return mongoose.isValidObjectId(value)
            }).required().notOneOf([
                yup.ref('db_user_id')
            ]),
            db_user_id: yup.string().test('ObjectId', 'this is not a valid database ID', value => {
                return mongoose.isValidObjectId(value)
            }).required().notOneOf([
                yup.ref('postuserid')
            ])
        })

        schema.validate({
            postuserid,
            db_user_id
        }, {
            abortEarly: false
        }).then(() => {
            usersCollection.findById({_id: mongoose.Types.ObjectId(db_user_id)}, {
                'friends.friendList.userId': true,
                'friends.sentRequests': true
            }).then(doc => {
                if(doc) { 
                    let areFriends

                    doc.friends.friendList.map(friend => {
                        if(friend.userId == postuserid) {areFriends = true}
                    })
        
                    if(areFriends) {
                        res.send({
                            status: 'accepted'
                        })
                    } else if(doc.friends.sentRequests.indexOf(postuserid) !== -1) {
                        res.send({
                            status: 'sent'
                        })
                    } else {
                        res.send({
                            status: 'denied'
                        })
                    }
                } else {
                    res.status(404).send({
                        message: 'Friendship data not found.'
                    })
                }
            }).catch(err => next(err))
        }).catch(err => next(err))
    })

    /* ATUALIZAR LISTA DE CONVITES DE AMIZADE QUANDO ENVIAM SOLICITAÇÃO */
    route.patch('/friendrequest', (req, res, next) => {
        const {db_user_id, postuserid} = req.body

        let schema = yup.object().shape({
            postuserid: yup.string().test('ObjectId', 'this is not a valid database ID', value => {
                return mongoose.isValidObjectId(value)
            }).required(),
            db_user_id: yup.string().test('ObjectId', 'this is not a valid database ID', value => {
                return mongoose.isValidObjectId(value)
            }).required()
        })

        schema.validate({
            postuserid,
            db_user_id
        }, {
            abortEarly: false
        }).then(() => {
            usersCollection./* findByIdAndUpdate */updateOne({_id: mongoose.Types.ObjectId(db_user_id)}, 
            {$push: {
                'friends.sentRequests': mongoose.Types.ObjectId(postuserid)
            }}/* , {fields: {
                username: true,
                photo: true
            }} */).then(doc => {
                /* if(doc) {  */
                    let request = {
                        userId: /* doc._id */mongoose.Types.ObjectId(req.session.user.db_user_id),
                        username: /* doc.username */req.session.user.username,
                        photo: /* doc.photo */req.session.user.photo
                    }

                    usersCollection.updateOne({_id: mongoose.Types.ObjectId(postuserid)}, {$push: {'friends.friendRequests': request}}).then(() => {
                        io.io.emit(`${postuserid}_friendrequest`)
                        io.io.emit(`${postuserid}_friendrequestnotification`)

                        res.send({
                            message: 'Friend request sent successfully.'
                        })
                    }).catch(err => next(err))
                /* } else {
                    res.status(404).send({
                        message: 'User not found.'
                    })
                } */
            }).catch(err => next(err))
        }).catch(err => next(err))
    }) 


    /* REPASSA A LISTA DE FRIEND REQUESTS */
    route.post('/getfriendrequest', (req, res, next) => {
        const db_user_id = req.body.db_user_id

        let schema = yup.string().test('ObjectId', 'this is not a valid database ID', value => {
            return mongoose.isValidObjectId(value)
        }).required()

        schema.validate(db_user_id, {abortEarly: false}).then(() => {
            usersCollection.findById({_id: mongoose.Types.ObjectId(db_user_id)}, {'friends.friendRequests': true}).then(doc => {
                if(doc) {
                    res.send({
                        friendRequests: doc.friends.friendRequests
                    })    
                } else {
                    res.status(404).send({
                        message: 'User not found'
                    })
                }
            }).catch(err => next(err))
        }).catch(err => next(err))
    })

    /* PROCESSA OS DADOS DE ACCEPT OU REJEIT DO PEDIDO DE AMIZADE */
    route.post('/friendrequestresult', (req, res, next) => {
        const {result, db_user_id, userid} = req.body

        let schema = yup.object().shape({
            result: yup.boolean().strict().required(),
            db_user_id: yup.string().test('ObjectId', 'this is not a valid database ID', value => {
                return mongoose.isValidObjectId(value)
            }).required(),
            userid: yup.string().test('ObjectId', 'this is not a valid database ID', value => {
                return mongoose.isValidObjectId(value)
            }).required(),
        })

        schema.validate({
            result,
            db_user_id,
            userid,
        }, {
            abortEarly: false
        }).then(() => {
            usersCollection./* findByIdAndUpdate */updateOne({_id: mongoose.Types.ObjectId(db_user_id)}, {
                $pull: {'friends.friendRequests': {userId: mongoose.Types.ObjectId(userid)}}
            }/* , {fields: {
                username: true,
                photo: true
            }}*/)/*.then(doc => {

            })*/.catch(err => next(err))

            /* if(doc) { */
                if(result) {
                    usersCollection.findByIdAndUpdate({_id: mongoose.Types.ObjectId(userid)}, {$push: {'friends.friendList': {
                        userId: mongoose.Types.ObjectId(/* doc._id */req.session.user.db_user_id),
                        username: /* doc.username */req.session.user.username,
                        photo: /* doc.photo */req.session.user.photo
                    }}, $pull: {
                        'friends.sentRequests': mongoose.Types.ObjectId(db_user_id)
                    }}, {
                        fields: {username: true, photo: true}
                    }).then(userDoc => {
                        /* doc */usersCollection.updateOne({_id: mongoose.Types.ObjectId(/* doc._id */req.session.user.db_user_id)}, {$push: {'friends.friendList': {
                            userId: mongoose.Types.ObjectId(userDoc._id),
                            username: userDoc.username,
                            photo: userDoc.photo
                        }}}).then(() => {
                            io.io.emit(`${db_user_id}_friendrequest`)
                            io.io.emit(`${db_user_id}_friendlist`)
                            io.io.emit(`${userid}_friendlist`)
                            io.io.emit(`${db_user_id}_friendrequestnotification`)

                            res.send({
                                message: 'Friend request accepted successfully.'
                            })
                        }).catch(err => next(err))
                    }).catch(err => next(err))
                } else {
                    io.io.emit(`${db_user_id}_friendrequest`)
                    res.send({
                        message: 'Friend request denied successfully.'
                    })
                }
            /* } else {
                res.status(404).send({
                    message: 'User not found.'
                })
            } */
        }).catch(err => next(err))
    })


    /* DELETA UM AMIGO DA LISTA DE AMIGOS */
    route.delete('/deletefriend', (req, res, next) => {
        const {db_user_id, userid} = req.query

        let schema = yup.object().shape({
            db_user_id: yup.string().test('ObjectId', 'this is not a valid database ID', value => {
                return mongoose.isValidObjectId(value)
            }).required(),
            userid: yup.string().test('ObjectId', 'this is not a valid database ID', value => {
                return mongoose.isValidObjectId(value)
            }).required()
        })

        schema.validate({
            db_user_id,
            userid
        }, {
            abortEarly: false
        }).then(() => {
            usersCollection.updateOne({_id: mongoose.Types.ObjectId(db_user_id)}, {$pull: {'friends.friendList': {userId: mongoose.Types.ObjectId(userid)}}}).then(() => {
                io.io.emit(`${db_user_id}_friendlist`)
                res.send({
                    message: 'Friend deleted successfully.'
                })
            }).catch(err => next(err))
        }).catch(err => next(err))
    })


    /* MOSTRA A NOTIFICAÇÃO DOS NÚMEROS DE MENSAGENS E SOLICITAÇÕES DE AMIZADE */
    route.get('/notification', (req, res, next) => {
        const {db_user_id} = req.query

        let schema = yup.string().test('ObjectId', 'this is not a valid database ID', value => {
            return mongoose.isValidObjectId(value)
        }).required()

        schema.validate(db_user_id, {abortEarly: false}).then(() => {
            usersCollection.aggregate().match({_id: mongoose.Types.ObjectId(db_user_id)})
                .project({
                    friendsLength: {
                        $size: '$friends.friendRequests'
                    }
                }).exec((err, doc) => {
                    if(err) {
                        next(err)
                    } else {
                        if(doc) {
                            doc = doc[0]

                            res.send({
                                friendsLength: doc.friendsLength
                            })
                        } else {
                            res.status(404).send({
                                message: 'Friend request list not found'
                            })
                        }
                    }
                })
        }).catch(err => next(err))
    })

    return route
}