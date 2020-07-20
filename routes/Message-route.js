const route = require('express').Router()

const chatCollection = require('../database/chatModel')

route.get('/messagelist', (req, res) => {
    const {db_user_id, notification} = req.query

    chatCollection.find({'members.userid': `${db_user_id}`}).then(doc => {
        const notSawMessages = []

        doc.map(chat => {
            if(chat.messages[chat.messages.length - 1].userid !== db_user_id) {
                const lastMessage = chat.messages[chat.messages.length - 1]
                
                if(chat.members[0].userid !== db_user_id) {
                    notSawMessages.push({...lastMessage, chatid: chat._id, userPhoto: chat.members[0].userPhoto})
                } else if(chat.members[1].useri !== db_user_id) {
                    notSawMessages.push({...lastMessage, chatid: chat._id, userPhoto: chat.members[1].userPhoto})
                }
            }
        })
        
        if(notification) {
            res.send(`${notSawMessages.length}`)
        } else {
            res.send(notSawMessages)
        }
    })
})

module.exports = route