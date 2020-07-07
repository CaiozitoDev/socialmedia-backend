const dotenv = require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const session = require('express-session')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const multer = require('multer')
const cors = require('cors')

// functions
const formatPhotoData = require('./functions/formatPhotoData')

const app = express()

app.use(express.static(__dirname + '/build'))

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false
}))

let upload = multer()

const postCollection = require('./database/postModel')
const usersCollection = require('./database/userModel')
const chatCollection = require('./database/chatModel')

mongoose.connect(process.env.MONGO_API_ADDRESS, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false})
    .then(() => {console.log('MongoDB Connected')})
    .catch((err) => {console.log(err)})



/* ROTAS DE AUTENTICAÇÃO */
app.post('/registerdata', upload.single('fileimage'), (req, res) => {
    const {username, password} = req.body
    const profilePhoto = req.file

    if(username !== '' && password !== '') {
        usersCollection.findOne({username: username}, (err, doc) => {
            if(!err) {
                if(doc) {
                    res.send({message: 'User already exist', redirect: false})
                } else {
                    bcrypt.hash(password, 10, (error, hash) => {
                        if(!error) {
                            const newUser = new usersCollection({
                                username: username,
                                password: hash,
                                userPhoto: formatPhotoData(profilePhoto),
                            })

                            const generatedToken = jwt.sign({db_user_id: newUser._id, username: newUser.username}, process.env.TOKEN_SECRET, {expiresIn: '7d'})

                            newUser.save((saveError) => {
                                saveError ? console.log(saveError) : res.send({redirect: true, token: generatedToken})
                            })
                        } else {
                            console.log(error)
                        }
                    })
                }
            } else {
                console.log(err)
            }
        })
    } else {
        res.send({message: 'Blank data is not accept', redirect: false})
    }
})

app.post('/logindata', upload.any(), (req, res) => {
    const {username, password} = req.body

    if(username !== '' && password !== '') {
        usersCollection.findOne({username: username}, (err, doc) => {
            if(!err) {
                if(doc) {
                    bcrypt.compare(password, doc.password, (error, result) => {
                        if(!error) {
                            if(result) {
                                const generatedToken = jwt.sign({db_user_id: doc._id, username: doc.username}, process.env.TOKEN_SECRET, {expiresIn: '7d'})

                                res.send({redirect: true, token: generatedToken})
                            } else {
                                res.send({message: 'Incorrect data', redirect: false})
                            }
                        } else {
                            console.log(error)
                        }
                    })
                } else {
                    res.send({message: 'User not found', redirect: false})
                }
            } else {
                console.log(err)
            }
        })
    } else {
        res.send({message: 'Blank data is not accept', redirect: false})
    }
})


/* LOGIN/REGISTER COM A API DO FACEBOOK */
app.post('/facebook', (req, res) => {
    const {name, userID, url} = req.body

    usersCollection.findOne({fbId: userID}, (err, doc) => {
        if(!err) {
            if(doc) {
                const generatedToken = jwt.sign({db_user_id: doc._id, username: doc.username}, process.env.TOKEN_SECRET, {expiresIn: '7d'})
                res.send({redirect: true, token: generatedToken})
            } else {
                const newUser = new usersCollection({
                    username: name,
                    fbId: userID,
                    userPhoto: url
                })

                const generatedToken = jwt.sign({db_user_id: newUser._id, username: newUser.username}, process.env.TOKEN_SECRET, {expiresIn: '7d'})

                newUser.save((saveError) => {
                    saveError ? console.log(saveError) : res.send({redirect: true, token: generatedToken})
                })
            }
        } else {
            console.log(err)
        }
    })
})
/////////////////////////////////////////////////////////////////////////////////////////////////


/* ROTA DE AUTENTICAÇÃO DO USUÁRIO PRA NAVEGAÇÃO NO SITE */
app.post('/auth', (req, res) => {
    if(req.body.local_token) {
        jwt.verify(req.body.local_token, process.env.TOKEN_SECRET, (err, decoded) => {
            if(!err) {
                usersCollection.findById({_id: decoded.db_user_id}, (error, doc) => {
                    if(!error) {
                        if(doc) {
                            res.send({message: 'Ok', authorized: true})
                        } else {
                            res.send({message: 'User not found by token', authorized: false})
                        }
                    } else {
                        res.send({message: error, authorized: false})
                    }
                })
            } else {
                res.send({message: 'There is a error with token', authorized: false})
            }
        })
    } else {
        res.send({message: 'Token not found', authorized: false})
    }
})
/////////////////////////////////////////////////////////////////////////////////////////////////


/* ROTA DE LOADING DA PHOTO DO USUÁRIO */
app.get('/profile-photo/:id', (req, res) => {
    let db_user_id = req.params.id

    usersCollection.findById({_id: db_user_id}, (err, doc) => {
        res.send({src: doc.userPhoto, username: doc.username})
    })
})


/* DADOS DO PROFILE DO USUÁRIO SELECIONADO */
app.get('/profile/:username', (req, res) => {
    const username = req.params.username

    username !== 'favicon.ico' &&
    usersCollection.findOne({username: username}, (err, doc) => {
        if(doc) {
            res.send({src: doc.userPhoto, username: doc.username})
        } else {
            res.send({src: 'https://image.flaticon.com/icons/png/512/718/718672.png', username: 'User not found'})
        }
    })
})

/////////////////////////////////////////////////////////////////////////////////////////////////


/* ADICIONAR NOVO POST NO BANCO DE DADOS */
app.post('/newpost', (req, res) => {
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
app.get('/posts', function(req, res) {
    const numberOfPosts = Number(req.query.numberOfPosts)

    postCollection.find().limit(numberOfPosts).then(doc => {
        let lightVersion = []
        doc.map(post => {
            lightVersion.push({
                headerusername: post.headerusername,
                headerphoto: post.headerphoto,
                bodytext: post.bodytext,
                _id: post._id,
                userid: post.userid
            })
        })
        res.send(lightVersion)
    })
})


/* RETORNA O NÚMERO DE LIKES DE CADA POST E OS LIKES JÁ DADOS PELO USUÁRIO */
app.post('/post-buttons', (req, res) => {
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
app.patch('/post-buttons', (req, res) => {
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
//////////////////////////////////////////////////////////////////////////////////////////////////


/* PEGAR POST ÚNICO */
app.get('/getpost/:postid', (req, res) => {
    const postid = req.params.postid

    postCollection.findById({_id: postid}).then(doc => {
        res.send(doc)
    })
})

app.patch('/addcomment', (req, res) => {
    const {postid, txtValue, db_user_id} = req.body

    usersCollection.findById({_id: db_user_id}).select({username: 1, userPhoto: 1}).then((doc) => {
        postCollection.updateOne({_id: postid}, {$push: {comment: {
            userid: db_user_id,
            username: doc.username,
            userPhoto: doc.userPhoto,
            bodytext: txtValue
        }}}, (err1) => {
            err1 ? console.log(err1) : res.send('Comment added')
        })
    })
})
//////////////////////////////////////////////////////////////////////////////////////////////////

/* ROTAS DO MOST LOVED POSTS*/
app.get('/topposts', (req, res) => {
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
////////////////////////////////////////////////////////////////////////////////////////////////

/* ROTAS DE FRIENDS */

/* REPASSA LISTA DE AMIGOS NA FRIENDS PAGE */
app.get('/friendlist/:username', (req, res) => {
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
app.post('/arefriends', (req, res) => {
    const {postuserid, db_user_id} = req.body

    usersCollection.findById({_id: db_user_id}, {'friends.friendlist.userid': postuserid, 'friends.sentrequest': postuserid}, (err, doc) => {
        if(!err) {
            if(doc.friends.friendlist[0]) {
                res.send(true)
            } else {
                console.log(2)
                if(doc.friends.sentrequest.indexOf(postuserid) !== -1) {
                    res.send('sent')
                } else {
                    res.send(false)
                }
            }
        } else {
            console.log(err)
        }
    })
})

/* ATUALIZAR LISTA DE CONVITES DE AMIZADE QUANDO ENVIAM SOLICITAÇÃO */
app.patch('/friendrequest', (req, res) => {
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
app.post('/getfriendrequest', (req, res) => {
    const db_user_id = req.body.db_user_id

    usersCollection.findById({_id: db_user_id}, 'friends.friendrequest', (err, doc) => {
        err ? console.log(err) : res.send(doc.friends.friendrequest)
    })
})

/* PROCESSA OS DADOS DE ACCEPT OU REJEIT DO PEDIDO DE AMIZADE */
app.post('/friendrequestresult', (req, res) => {
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
app.delete('/deletefriend', (req, res) => {
    const {db_user_id, userid} = req.query

    usersCollection.updateOne({_id: db_user_id}, {$pull: {'friends.friendlist': {userid: userid}}}, err => {
        err ? console.log(err) : res.send('friend deleted')
    })
})


/* MOSTRA A NOTIFICAÇÃO DOS NÚMEROS DE MENSAGENS E SOLICITAÇÕES DE AMIZADE */
app.get('/notification', (req, res ) => {
    const {db_user_id} = req.query

    usersCollection.findById({_id: db_user_id}).select({'friends.friendrequest': true}).then(doc => {
        res.send(`${doc.friends.friendrequest.length}`)
    })
})
///////////////////////////////////////////////////////////////////////////////////////////////////


app.get('/chat', (req, res) => {
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


app.get('/chat/:chatid', (req, res) => {
    const chatid = req.params.chatid

    chatCollection.findById({_id: chatid}).then(doc => {
        res.send(doc)
    })
})


app.post('/newmessage', (req, res) => {
    const {db_user_id, chatid, messagetext, username, userPhoto} = req.body

    chatCollection.findByIdAndUpdate({_id: chatid}, {$push: {messages: {
        userid: db_user_id,
        username: username,
        userPhoto: userPhoto,
        messagetext: messagetext
    }}}).then(() => {
        res.send('Message sent')
    })
})


app.get('/lastchat', (req, res) => {
    const {db_user_id} = req.query

    chatCollection.find({'members.userid': `${db_user_id}`}).select({'members': true}).limit(7).sort('-1').then(doc => {
        const chatList = []

        doc.map(member => {
            console.log(member.members)
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
//////////////////////////////////////////////////////////////////////////////////////

app.get('/messagelist', (req, res) => {
    const {db_user_id, notification} = req.query

    chatCollection.find({'members.userid': `${db_user_id}`}).select({messages: true}).then(doc => {
        const notSawMessages = []

        doc.map(chat => {
            if(chat.messages[chat.messages.length - 1].userid !== db_user_id) {
                const lastMessage = chat.messages[chat.messages.length - 1]
                notSawMessages.push({...lastMessage, chatid: chat._id})
            }
        })
        
        if(notification) {
            res.send(`${notSawMessages.length}`)
        } else {
            res.send(notSawMessages)
        }
    })
})
 


app.listen(process.env.PORT || 5000, () => {
    console.log('Server running')
})