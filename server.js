const dotenv = require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const session = require('express-session')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const multer = require('multer')

// functions
const formatPhotoData = require('./functions/formatPhotoData')

const app = express()

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

mongoose.connect(process.env.MONGO_API_ADDRESS, {useNewUrlParser: true, useUnifiedTopology: true})
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
                                userPhoto: profilePhoto
                            })

                            const generatedToken = jwt.sign({db_user_id: newUser._id, username: newUser.username}, process.env.TOKEN_SECRET, {expiresIn: '5m'})

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
                                const generatedToken = jwt.sign({db_user_id: doc._id, username: doc.username}, process.env.TOKEN_SECRET, {expiresIn: '5m'})

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
                const generatedToken = jwt.sign({db_user_id: doc._id, username: doc.username}, process.env.TOKEN_SECRET, {expiresIn: '5m'})
                res.send({redirect: true, token: generatedToken})
            } else {
                const newUser = new usersCollection({
                    username: name,
                    fbId: userID,
                    fbUrl: url
                })

                const generatedToken = jwt.sign({db_user_id: newUser._id, username: newUser.username}, process.env.TOKEN_SECRET, {expiresIn: '5m'})

                newUser.save((saveError) => {
                    saveError ? console.log(saveError) : res.send({redirect: true, token: generatedToken})
                })
            }
        } else {
            console.log(err)
        }
    })
})
////////////////////////////////////////////////////////////////////////////////////////////


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
///////////////////////////////////////////////////////////////////////W


/* ROTA DE LOADING DA PHOTO DO USUÁRIO */
app.get('/profile-photo/:id', (req, res) => {
    let db_user_id = req.params.id

    usersCollection.findById({_id: db_user_id}, (err, doc) => {
        res.send(formatPhotoData(err, doc))
    })
})


/* DADOS DO PROFILE DO USUÁRIO SELECIONADO */
app.get('/profile/:username', (req, res) => {
    const username = req.params.username

    usersCollection.findOne({username: username}, (err, doc) => {
        res.send(formatPhotoData(err, doc))
    })
})

////////////////////////////////////////////////////////////////////


/* ADICIONAR NOVO POST NO BANCO DE DADOS */
app.post('/newpost', (req, res) => {
    let {txtarea, db_user_id} = req.body

    usersCollection.findById({_id: db_user_id}, (err, doc) => {
        let header = formatPhotoData(err, doc)

        const newPost = new postCollection({
            userid: header.userid,
            headerphoto: header.src,
            headerusername: header.username,
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
    postCollection.find(function(err, doc) {
        if(!err) {
            res.send(doc)
        } else {
            console.log(err)
        }
    })
    
})


app.post('/post-buttons', (req, res) => {
    const postid = req.body.postid

    postCollection.findById({_id: postid}, (err, doc) => {
        if(!err) {
            if(doc) {
                res.send({
                    like: doc.like,
                    love: doc.love,
                    comment: doc.comment.length
                })
            } else {
                res.send('Post not found')
            }
        } else {
            console.log(err)
        }
    })
})


/* ATUALIZAR VALORES DE LIKE, LOVE, E COMMENTS */
app.patch('/post-buttons', (req, res) => {
    const {buttonValue, postid, isButtonClicked} = req.body

    postCollection.findByIdAndUpdate({_id: postid}, {$inc: {[buttonValue]: !isButtonClicked ? 1 : -1}}, (err, doc) => {
        if(!err) {
            usersCollection.findOneAndUpdate({_id: doc.userid},
                !isButtonClicked ? {$push: {reactedposts: {[buttonValue]: postid}}} : {$pull: {reactedposts: {[buttonValue]: postid}}}, (usererror) => {
                    if(!usererror) {
                        res.send(`${buttonValue} value updated.`)
                    } else {
                        console.log(usererror)
                    }
                })
        } else {
            console.log(err)
        }
    })
})


app.listen(process.env.PORT || 5000, () => {
    console.log('Server running')
})