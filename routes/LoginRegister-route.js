const dotenv = require('dotenv').config()
const bcrypt = require('bcrypt')
const multer = require('multer')
const jwt = require('jsonwebtoken')
const yup = require('yup')

const Firebase = require('../utils/firebase')
const usersCollection = require('../database/userModel')

let upload = multer()

const route = require('express').Router()

yup.addMethod(yup.object, 'atLeastOneOf', function(list) {
    return this.test({
        name: 'atLeastOneOf',
        message: 'At least one of these keys must to be received: ${keys}',
        exclusive: true,
        params: { keys: list.join(', ') },
        test: value => value == null || list.some(f => value[f] != null)
    })
})

/* ROTAS DE AUTENTICAÇÃO */
route.post('/register', upload.single('photo'), (req, res, next) => {
    const {login, username, password, fbId} = req.body
    const profilePhoto = req.file

    const schema = yup.object().shape({
        login: yup.string().required().min(4).trim().strict().matches(/^[a-zA-Z0-9_.-]*$/, 'Special characters and spaces are not allowed.'),
        username: yup.string().required().min(3).trim().strict().matches(/^[a-zA-Z\s]*$/, 'Special characters are not allowed.'),
        profilePhoto: yup.object().shape({
            size: yup.number().moreThan(0).required(),
            mimetype: yup.string().equals(['image/png', 'image/jpg', 'image/jpeg']).required()
        }),
        password: yup.string().trim().strict(),
        fbId: yup.string().trim().strict()
    }).atLeastOneOf(['password', 'fbId'])

    schema.validate({
        login,
        username,
        profilePhoto,
        password,
        fbId
    }, {
        abortEarly: false,
    }).then(() => {
            usersCollection.exists({login: login}).then(exists => {
                if(exists) {
                    res.status(401).send({message: `Login: '${login}' already registered, please, insert another one.`, redirect: false})
                } else {
                    Firebase.uploadImage(profilePhoto, Date.now(), username).then(url => {
                        bcrypt.hash(password ? password : fbId, 10,).then(hash => {
                            let time = `${username}${Date.now()}`

                            const userData = {
                                login,
                                username,
                                photo: url,
                                sessionKey: time
                            }
    
                            if(fbId) {userData.fbId = hash} else {userData.password = hash}
    
                            const newUser = new usersCollection(userData)
    
                            let sessionHash = bcrypt.hashSync(`${username}${time}`, 10)

                            const generatedToken = jwt.sign({
                                db_user_id: newUser._id,
                                sessionKey: sessionHash
                            }, process.env.TOKEN_SECRET, {expiresIn: '7d'})
    
                            req.session.user = {
                                db_user_id: newUser._id, 
                                username: newUser.username,
                                photo: url
                            }

                            newUser.save()
                                .then(() => {
                                    res.cookie('token', generatedToken).send({
                                        message: 'Registration successfully',
                                        authorized: true
                                    })
                                }).catch(saveError => next(saveError))
                        }).catch(err => next(err))
                    }).catch(err => next(err))
                }
            }).catch(err => next(err))
    }).catch(err => next(err))
})


route.post('/login', upload.any(), (req, res, next) => {
    const {login, password, fbId} = req.body
    
    const schema = yup.object().shape({
        login: yup.string().required().min(4).trim().strict(),
        password: yup.string().trim().strict(),
        fbId: yup.string().trim().strict()
    }).atLeastOneOf(['password', 'fbId'])

    schema.validate({
        login,
        password,
        fbId
    }).then(() => {
        usersCollection.findOne({login: login}, {
            _id: true,
            username: true,
            password: true,
            fbId: true,
            photo: true
        }).then(doc => {
                if(doc) {
                    bcrypt.compare(password ? password : fbId, doc.password ? doc.password : doc.fbId).then(result => {
                        if(result) {
                            req.session.user = {
                                db_user_id: doc._id, 
                                username: doc.username, 
                                photo: doc.photo
                            }

                            let time = `${doc.username}${Date.now()}`

                            doc.updateOne({$set: {sessionKey: time}}).then(() => {
                                let sessionHash = bcrypt.hashSync(`${doc.username}${time}`, 10)

                                const generatedToken = jwt.sign({
                                    db_user_id: doc._id,
                                    sessionKey: sessionHash
                                }, process.env.TOKEN_SECRET, {expiresIn: '7d'})

                                res.cookie('token', generatedToken, {
                                    domain: 'https://frontendtestedoteste.herokuapp.com',
                                    sameSite: 'none',
                                    secure: true
                                }).send({
                                    message: 'Login successfully',
                                    authorized: true
                                })
                            }).catch(err => next(err))
                        } else {
                            res.status(401).send({message: 'Incorrect user data.', redirect: false})
                        }
                    }).catch(err => next(err))
                } else {
                    res.status(404).send({message: 'User not found.', redirect: false})
                }
        }).catch(err => next(err))
    }).catch(err => next(err))
})

route.get('/', (req, res) => {
    res.send({
        message: 'Authenticated successfully.',
        userData: req.session.user ? req.session.user : null
    })
})

module.exports = route