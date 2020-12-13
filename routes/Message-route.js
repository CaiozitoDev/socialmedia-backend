const route = require('express').Router()
const mongoose = require('mongoose')
const yup = require('yup')

const mongoTimestampFormat = require('../utils/mongoTimestampFormat')

const chatCollection = require('../database/chatModel')

route.get('/messagelist', (req, res, next) => {
    let {db_user_id, notification} = req.query

    let schema = yup.object().shape({
        db_user_id: yup.string().test('ObjectId', 'this is not a valid database ID', value => {
            return mongoose.isValidObjectId(value)
        }).required(),
        notification: yup.string().trim().strict().equals(['true', 'false']).required()
    })

    schema.validate({
        db_user_id,
        notification
    }, {
        abortEarly: false
    }).then(() => {
        chatCollection.find({'members.userId': mongoose.Types.ObjectId(db_user_id)}).then(doc => {
            if(doc) {
                let notSawMessages = doc.filter(chat => {
                    if(chat.messages.length && chat.messages[chat.messages.length - 1].userId != db_user_id) {
                        return true
                    } 
                    
                    return false
                }).map(chat => {
                    const lastMessage = chat.messages[chat.messages.length - 1]

                    let memberIndex = chat.members[0].userId != db_user_id ? 0 : 1

                    return {
                        ...lastMessage,
                        chatId: chat._id,
                        photo: chat.members[memberIndex].photo,
                        timestamp: mongoTimestampFormat.toDateAndTime(lastMessage['timestamp'])
                    }
                })
                
                if(notification == 'true') {
                    res.send({
                        notSawMessages: notSawMessages.length
                    })
                } else {
                    res.send({
                        notSawMessages
                    })
                }
            } else {
                res.status(404).send({
                    message: 'Chat not found.'
                })
            }
        })
    }).catch(err => next(err))
})

module.exports = route