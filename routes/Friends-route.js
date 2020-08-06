const route = require('express').Router()

const usersCollection = require('../database/userModel')

/* REPASSA LISTA DE AMIGOS NA FRIENDS PAGE */
route.get('/friendlist/:username', (req, res) => {
    const username = req.params.username

    usersCollection.findOne({username: username}).select({friends: 1}).then(doc => {
        if(doc) {
            res.send({friendlist: doc.friends.friendlist, success: true})
        } else {
            res.send({friendlist: [], success: false})
        }
    })
})

/* VERIFICA SE JÁ SÃO AMIGOS */
route.post('/arefriends', (req, res) => {
    const {postuserid, db_user_id} = req.body

    usersCollection.findById({_id: db_user_id}, {'friends.friendlist.userid': postuserid, 'friends.sentrequest': postuserid}, (err, doc) => {
        if(!err) {
            let areFriends

            doc.friends.friendlist.map(friend => {
                if(friend.userid == postuserid) {areFriends = true}
            })

            if(areFriends) {
                res.send(true)
            } else if(doc.friends.sentrequest.indexOf(postuserid) !== -1) {
                res.send('sent')
            } else {
                res.send(false)
            }
        } else {
            console.log(err)
        }
    })
})

/* ATUALIZAR LISTA DE CONVITES DE AMIZADE QUANDO ENVIAM SOLICITAÇÃO */
route.patch('/friendrequest', (req, res) => {
    const {db_user_id, postuserid} = req.body

    usersCollection.findByIdAndUpdate({_id: db_user_id}, {$push: {'friends.sentrequest': postuserid}}, (err1, doc1) => {
        if(!err1) {
            const request = {
                userid: db_user_id,
                username: doc1.username,
                photo: doc1.userPhoto
            }

            usersCollection.updateOne({_id: postuserid}, {$push: {'friends.friendrequest': request}}, (err) => {
                err ? console.log(err) : res.send('Friend request sent')
            })
        } else {
            console.log(err1)
        }
    })
}) 


/* REPASSA A LISTA DE FRIEND REQUESTS */
route.post('/getfriendrequest', (req, res) => {
    const db_user_id = req.body.db_user_id

    usersCollection.findById({_id: db_user_id}, 'friends.friendrequest', (err, doc) => {
        err ? console.log(err) : res.send(doc.friends.friendrequest)
    })
})

/* PROCESSA OS DADOS DE ACCEPT OU REJEIT DO PEDIDO DE AMIZADE */
route.post('/friendrequestresult', (req, res) => {
    const {result, db_user_id, userid} = req.body

    usersCollection.updateOne({_id: db_user_id}, {$pull: {'friends.friendrequest': {userid: userid}}}, (err0) => {
        if(!err0) {
            if(result) {
                const {username, photo} = req.body
                usersCollection.findByIdAndUpdate({_id: db_user_id}, {$push: {'friends.friendlist': {userid, username, photo}}}, (err, doc) => {
                    if(!err) {
                        usersCollection.findByIdAndUpdate({_id: userid}, {$push: {'friends.friendlist': {
                            userid: db_user_id,
                            username: doc.username,
                            photo: doc.userPhoto
                        }},
                        $pull: {'friends.sentrequest': db_user_id}}, (err2) => {
                            err ? console.log(err2) : res.send('Friend request accepted.')
                        })
                    } else {
                        console.log(err)
                    }
                })
            } else {
                res.send('Friend request denied.')
            }
        } else {
            console.log(err0)
        }
    })
})


/* DELETA UM AMIGO DA LISTA DE AMIGOS */
route.delete('/deletefriend', (req, res) => {
    const {db_user_id, userid} = req.query

    usersCollection.updateOne({_id: db_user_id}, {$pull: {'friends.friendlist': {userid: userid}}}, err => {
        err ? console.log(err) : res.send('friend deleted')
    })
})


/* MOSTRA A NOTIFICAÇÃO DOS NÚMEROS DE MENSAGENS E SOLICITAÇÕES DE AMIZADE */
route.get('/notification', (req, res ) => {
    const {db_user_id} = req.query

    usersCollection.findById({_id: db_user_id}).select({'friends.friendrequest': true}).then(doc => {
        res.send(`${doc.friends.friendrequest.length}`)
    })
})

module.exports = route