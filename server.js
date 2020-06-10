const dotenv = require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const session = require('express-session')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false
}))

const postCollection = require('./database/postModel')
const usersCollection = require('./database/userModel')
const facebookCollection = require('./database/facebookModel')

mongoose.connect(process.env.MONGO_API_ADDRESS, {useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => {console.log('MongoDB Connected')})
    .catch((err) => {console.log(err)})


app.post('/registerdata', (req, res) => {
    const {username, password} = req.body
    console.log(req.body)
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
                            })

                            const generatedToken = jwt.sign({db_user_id: newUser._id, username: newUser.username}, process.env.TOKEN_SECRET, {expiresIn: '5m'})

                            newUser.save(() => {
                                res.send({redirect: true, token: generatedToken})
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

app.post('/logindata', (req, res) => {
    const {username, password, userUrl} = req.body

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
                            facebookCollection.findById({_id: decoded.db_user_id}, (fberror, fbdoc) => {
                                if(!fberror) {
                                    if(fbdoc) {
                                        res.send({message: 'Ok', authorized: true})
                                    } else {
                                        res.send({message: 'User not found by token', authorized: false})
                                    }
                                } else {
                                    res.send({message: fberror, authorized: false})
                                }
                            })
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

    facebookCollection.findOne({userId: userID}, (err, doc) => {
        if(!err) {
            if(doc) {
                const generatedToken = jwt.sign({db_user_id: doc._id, username: doc.username}, process.env.TOKEN_SECRET, {expiresIn: '5m'})
                res.send({redirect: true, token: generatedToken})
            } else {
                const newUser = new facebookCollection({
                    username: name,
                    userId: userID,
                    userUrl: url
                })

                const generatedToken = jwt.sign({db_user_id: newUser._id, username: newUser.username}, process.env.TOKEN_SECRET, {expiresIn: '5m'})

                newUser.save(() => {
                    res.send({redirect: true, token: generatedToken})
                })
            }
        } else {
            console.log(err)
        }
    })
})



app.get('/logout', function(req, res) {
    req.logOut()

    res.redirect('/register')
})



app.get('/teste', function(req, res) {
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

app.post('/newpost', (req, res) => {
    let newtext = req.body.txtarea

    const newpost = new postCollection({
        postbodytext: newtext
    })
    
    newpost.save(() => {
        console.log('post recebido')
        res.sendStatus(200)
    })
})


app.listen(process.env.PORT || 5000, () => {
    console.log('Server running')
})