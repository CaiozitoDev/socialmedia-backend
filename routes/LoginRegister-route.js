const dotenv = require('dotenv').config()
const bcrypt = require('bcrypt')
const multer = require('multer')
const jwt = require('jsonwebtoken')

const usersCollection = require('../database/userModel')

let upload = multer()

// functions
const formatPhotoData = require('../functions/formatPhotoData')

const route = require('express').Router()


/* ROTAS DE AUTENTICAÇÃO */
route.post('/registerdata', upload.single('fileimage'), (req, res) => {
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

route.post('/logindata', upload.any(), (req, res) => {
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
route.post('/facebook', (req, res) => {
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


module.exports = route