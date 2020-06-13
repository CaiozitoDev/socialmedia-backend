const dotenv = require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const session = require('express-session')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const multer = require('multer')
const base64ArrayBuffer = require('base64-arraybuffer')

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


app.post('/facebook', (req, res) => {
    const {name, userID, url} = req.body

    usersCollection.findOne({userId: userID}, (err, doc) => {
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
///////////////////////////////////////////////////////////////////////






/* ROTA DE LOADING DO PROFILE PHOTO DO USUÁRIO */
app.get('/profile-photo/:id', (req, res) => {
    let db_user_id = req.params.id

    usersCollection.findById({_id: db_user_id}, (err, doc) => {
        if(!err) {
            if(doc.fbId)  {
                res.send({
                    src: doc.fbUrl,
                    username: doc.username
                })
            } else {
                const profilePhotoType = doc.userPhoto.mimetype
                const profilePhotoBase64 = base64ArrayBuffer.encode(doc.userPhoto.buffer.buffer)
                res.send({
                    src: `data:${profilePhotoType};base64, ${profilePhotoBase64}`,
                    username: doc.username
                })
            }
        } else {
            console.log(err)
        }
    })
})
/////////////////////////////////////////////////////////////////////////



/* DADOS DO PROFILE DO USUÁRIO */
app.get('/profile/:id', (req, res) => {
    const db_user_id = req.params.id

    usersCollection.findById({_id: db_user_id}, (err, doc) => {
        if(!err) {
            res.send({
                username: doc.username,

            })
        } else {
            console.log(err)
        }
    })
})

app.post('/fodase', (req, res) => {
    console.log(req.body)
    console.log(req.files)
})
////////////////////////////////////////////////////////////////////


app.post('/newpost', (req, res) => {
    let {newtext, db_user_id} = req.body

    const postHeaderPhoto

    usersCollection.findById({_id: db_user_id}, (err, doc) => {
        if(!err) {
            if(doc.fbId) {
                postHeaderPhoto = doc.fbUrl
            } else {
                postHeaderPhoto = doc.userPhoto
            }

            const newPost = new postCollection({
                headerphoto: postHeaderPhoto,
                headerusername: doc.username,
                bodytext: newtext,
                like: 0,
                love: 0,
                comment: []
            })
            
            newPost.save(() => {
                res.send({message: 'Posted'})
            })
        } else {
            console.log(err)
        }
    })
})


app.get('/posts', function(req, res) {
    postCollection.find(function(err, doc) {
        if(!err) {
            res.send(doc)
        } else {
            console.log(err)
        }
    })
    
})

app.post('/postbuttons', (req, res) => {
    console.log(req.body.postfooterbutton)
})


app.listen(process.env.PORT || 5000, () => {
    console.log('Server running')
})