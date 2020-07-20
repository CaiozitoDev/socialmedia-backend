const route = require('express').Router()
const mongoose = require('mongoose')

const usersCollection = require('../database/userModel')
const chatCollection = require('../database/chatModel')

route.get('/chat', (req, res) => {
    const {db_user_id, userid} = req.query

    usersCollection.find({_id: {$in: [db_user_id, userid]}}).select({username: true, userPhoto: true, chat: true}).then(doc => {
        let same_value_array = doc[0].chat.filter(e => doc[1].chat.indexOf(e) !== -1)
        // same_value_array verifica se tem o mesmo chatID entre os dois usuários
        
        if(same_value_array.length == 1) {
            res.send(same_value_array[0])
        } else {
            const newChat = new chatCollection({
                members: [
                    {
                        userid: `${doc[0]._id}`,
                        username: doc[0].username,
                        userPhoto: doc[0].userPhoto
                    },
                    {
                        userid: `${doc[1]._id}`,
                        username: doc[1].username,
                        userPhoto: doc[1].userPhoto
                    }
                ]
            })

            newChat.save((err, newdoc) => {
                let id = String(newdoc._id)
                usersCollection.updateMany({_id: {$in: [db_user_id, userid]}}, {$push: {chat: id}}).then(() => {
                    res.send(id)
                })
            })
        }
    }) 
})


route.get('/chat/:chatid', (req, res) => {
    const chatid = req.params.chatid

    const valid = mongoose.isValidObjectId(chatid)

    !valid ? res.send({found: false}) :
        chatCollection.findOne({_id: chatid}).then(doc => {
            if(doc) {
                res.send({found: true, doc: doc})
            } else {
                res.send({found: false})
            }
        })
})


route.post('/newmessage', (req, res) => {
    const {db_user_id, chatid, messagetext, username} = req.body

    chatCollection.findByIdAndUpdate({_id: chatid}, {$push: {messages: {
        userid: db_user_id,
        username: username,
        messagetext: messagetext
    }}}).then(() => {
        res.send('Message sent')
    })
})


route.get('/lastchat', (req, res) => {
    const {db_user_id} = req.query

    chatCollection.find({'members.userid': `${db_user_id}`}).select({'members': true}).limit(7).sort({timestamp: -1}).then(doc => {
        const chatList = []

        doc.map(member => {
            const chatid = member._id

            if(member.members[0].userid !== db_user_id) {
                const user = member.members[0]
                chatList.push({user, chatid})
            } else {
                const user = member.members[1]
                chatList.push({user, chatid})
            }
        })

        res.send(chatList)
    })
})

module.exports = route