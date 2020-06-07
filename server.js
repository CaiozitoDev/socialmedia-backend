const dotenv = require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const session = require('express-session')
const passport = require('passport')
const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(session({
    secret: 'vapo',
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())


const postCollection = require('./database/postModel')
const usersCollection = require('./database/userModel')

mongoose.connect('mongodb+srv://caiothegod:caio123@cluster0-wdivt.gcp.mongodb.net/cornobook?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true})

app.post('/registerdata', (req, res) => {
    const username = req.body.username
    const password = req.body.password

    usersCollection.findOne({username: username}, (err, doc) => {
        if(!err) {
            if(doc) {
                res.send({message: 'User already exist', redirect: '/register'})
            } else {
                const newUser = new usersCollection({
                    username: username,
                    password: password,
                })
            
                newUser.save(() => {
                    res.send({message: 'Ok', redirect: '/home'})
                })
            }
        } else {
            console.log(err)
        }
    })
})

app.post('/logindata', (req, res) => {
    const username = req.body.username
    const password = req.body.password

    usersCollection.findOne({username: username}, (err, doc) => {
        if(!err) {
            if(doc) {
                if(doc.password == password) {
                    passport.authenticate('local') (req, res, () => {
                        res.send({message: 'Ok', redirect: '/home'})
                    })
                } else {
                    res.send({message: 'Incorrect data', redirect: '/login'})
                }
            } else {
                res.send({message: 'User not found', redirect: '/login'})
            }
        } else {
            console.log(err)
        }
    })
})

app.get('/auth', (req, res) => {
    console.log('porran pozehn')
    if(req.isAuthenticated()) {
        res.send(true)
    } else {
        res.send(false)
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


app.listen(5000, () => {
    console.log('Server running on port 5000')
})