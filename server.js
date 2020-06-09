const dotenv = require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const session = require('express-session')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

const postCollection = require('./database/postModel')
const usersCollection = require('./database/userModel')

mongoose.connect(process.env.MONGO_API_ADDRESS, {useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => {console.log('MongoDB Connected')})
    .catch((err) => {console.log(err)})



    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,      // CHAVES DE AUTENTICAÇÃO CEDIDAS PELA API CRIADA NO GOOGLE DEVELOPERS WEBSITE
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/google/finish"  // PRA ONDE O GOOGLE VAI RETORNAR QUANDO AUTENTICAR A CONTA NA SESSÃO DE LOGIN
        },
        function(accessToken, refreshToken, profile, cb) {
            console.log(profile)
    
            return cb(err, user);                                                       // NO BANCO DE DADOS O PROFILE ID DA PESSOA QUE LOGOU COM A CONTA 
        }
    ))
    
    app.get('/google',
        passport.authenticate('google', { scope: ['profile'] }))   // SERVE PRA CHAMAR A API DO GOOGLE DE LOGIN (COM O ESCOPO DE CONTAS)
    
    
    app.get('/google/finish', 
    passport.authenticate('google', { failureRedirect: 'http://localhost:3000/login' }),  // RESPOSTA DO SERVER QUANDO O GOOGLE AUTENTICAR E REDIRECIONAR PARA ESSA ROTA
    function(req, res) {
      // Successful authentication, redirect secrets.
    
        console.log('chegou no finish')
      res.redirect('/home');
    })






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
                res.send({message: err, authorized: false})
            }
        })
    } else {
        res.send({message: 'Token not found', authorized: false})
    }
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