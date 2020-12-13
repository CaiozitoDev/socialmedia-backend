const route = require('express').Router()
const mongoose = require('mongoose')
const yup = require('yup')
const mongoTimestampFormat = require('../utils/mongoTimestampFormat')

const usersCollection = require('../database/userModel')
const chatCollection = require('../database/chatModel')

module.exports = function(io) {
    route.get('/chat', (req, res, next) => {
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
            usersCollection.find({_id: {$in: [mongoose.Types.ObjectId(db_user_id), mongoose.Types.ObjectId(userid)]}}, {
                username: true,
                photo: true,
                activeChats: true
            }).then(doc => {
                if(doc.length > 1) {
                    let same_chat_id = doc[0].activeChats.filter(e => {
                        return (doc[1].activeChats.indexOf(e) !== -1)
                    })
                    // same_chat_id verifica se tem o mesmo chatID entre os dois usuários
    
                    if(same_chat_id.length) {
                        res.send({
                            chatId: same_chat_id[0]
                        })
                    } else { 
                        const newChat = new chatCollection({
                            members: doc.map(user => {
                                return {
                                    userId: mongoose.Types.ObjectId(user._id),
                                    username: user.username,
                                    photo: user.photo
                                }
                            })
                        })
            
                        newChat.save().then(newDoc => {
                            usersCollection.updateMany({_id: {$in: [mongoose.Types.ObjectId(db_user_id), mongoose.Types.ObjectId(userid)]}}, {
                                $push: {activeChats: mongoose.Types.ObjectId(newDoc._id)}
                            }).then(() => {
                                res.send({
                                    chatId: newDoc._id
                                })
                            }).catch(err => next(err))
                        }).catch(err => next(err))
                    }
                } else {
                    res.status(404).send({
                        message: 'Chat not found.'
                    })
                }
            }) 
        }).catch(err => next(err))
    })
    
    
    route.get('/chat/:chatid', (req, res, next) => {
        const chatid = req.params.chatid
    
        let schema = yup.string().test('ObjectId', 'this is not a valid database ID', value => {
            return mongoose.isValidObjectId(value)
        }).required()
    
        schema.validate(chatid, {abortEarly: false}).then(() => {
            chatCollection.findById({_id: mongoose.Types.ObjectId(chatid)}).then(doc => {
                if(doc) {
                    doc.messages.forEach(msg => {
                        if(msg.timestamp) msg.timestamp = mongoTimestampFormat.toDateAndTime(msg.timestamp)
                    })
    
                    res.send({
                        chatData: doc
                    })
                } else {
                    res.status(404).send({
                        message: 'Chat data not found.'
                    })
                }
            }).catch(err => next(err))
        }).catch(err => next(err))
    })
    
    
    route.post('/newmessage', (req, res, next) => {
        const {db_user_id, userid, chatid, content, username} = req.body
    
        let schema = yup.object().shape({
            db_user_id: yup.string().test('ObjectId', 'this is not a valid database ID', value => {
                return mongoose.isValidObjectId(value)
            }).required(),
            userid: yup.string().test('ObjectId', 'this is not a valid database ID', value => {
                return mongoose.isValidObjectId(value)
            }).required(),
            chatid: yup.string().test('ObjectId', 'this is not a valid database ID', value => {
                return mongoose.isValidObjectId(value)
            }).required(),
            content: yup.string().min(1).trim().strict().required(),
            username: yup.string().min(3).trim().strict().required(),
        })
    
        schema.validate({
            db_user_id,
            userid,
            chatid,
            content,
            username
        }, {
            abortEarly: false
        }).then(() => {
            chatCollection.findOneAndUpdate({ 'members.userId': mongoose.Types.ObjectId(db_user_id), 'members.username': username, _id: mongoose.Types.ObjectId(chatid)},
            {$push: 
                {messages: {
                    userId: mongoose.Types.ObjectId(db_user_id),
                    username,
                    content,
                    timestamp: new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), new Date().getHours(), new Date().getMinutes(), new Date().getSeconds()))
                }}
            }).then(doc => {
                if(doc) {
                    io.io.emit(`${chatid}_newmessage`)
                    io.io.emit(`${userid}_newmessage`)
                    io.io.emit(`${userid}_messagesnotification`)

                    res.send({
                        message: 'Message sent successfully.'
                    })
                } else {
                    res.send({
                        message: 'Could not find chat data.'
                    })
                }
            }).catch(err => next(err))
        }).catch(err => next(err))
    })
    
    
    route.get('/lastchat', (req, res, next) => {
        const {db_user_id} = req.query
    
        let schema = yup.string().test('ObjectId', 'this is not a valid database ID', value => {
            return mongoose.isValidObjectId(value)
        }).required()
    
        schema.validate(db_user_id, {abortEarly: false}).then(() => {
            chatCollection.find({'members.userId': mongoose.Types.ObjectId(db_user_id)}, {
                members: true
            }).limit(7).sort({_id: -1}).then(doc => {
                if(doc) {
                    let chatList = doc.map(member => {
                        let memberIndex = member.members[0].userId != db_user_id ? 0 : 1
                        
                        return {
                            user: member.members[memberIndex],
                            chatId: member._id
                        }
                    })
        
                    res.send({
                        chatList
                    })
                } else {
                    res.status(404).send({
                        message: 'Chat list not found.'
                    })
                }
            })
        }).catch(err => next(err))
    })

    return route
}