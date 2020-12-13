const dotenv = require('dotenv').config()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const ObjectId = require('mongoose').Types.ObjectId

const usersCollection = require('../database/userModel')

module.exports = (req, res, next) => {
    if(['/login', '/register'].indexOf(req.url) == -1 && !req.session.user) {
        if(req.cookies.token) {
            jwt.verify(req.cookies.token, process.env.TOKEN_SECRET, (err, decoded) => {
                if(!err) {
                    usersCollection.findById({_id: ObjectId(decoded.db_user_id)}, {
                        username: true,
                        photo: true,
                        sessionKey: true
                    }, (error, doc) => {
                        if(!error) {
                            if(doc) {
                                console.log(req.cookies.token)
                                console.log(decoded)
                                console.log(doc.sessionKey)
                                console.log(decoded.sessionKey)
                                let result = bcrypt.compareSync(doc.sessionKey, decoded.sessionKey)

                                console.log(result)

                                if(result) {
                                    req.session.user = {
                                        db_user_id: doc._id,
                                        username: doc.username,
                                        photo: doc.photo
                                    }
                                    
                                    return next()
                                } else {
                                    res.status(401).send({message: 'There is a validation error with the token sent', authorized: false})
                                }
                            } else {
                                res.status(401).send({message: 'User not found by session token', authorized: false})
                            }
                        } else {
                            res.send({message: error, authorized: false})
                        }
                    })
                } else {
                    res.status(401).send({message: 'There is a error with the session token sent', authorized: false})
                }
            })
        } else {
            res.status(401).send({message: 'Session token not found', authorized: false})
        }
    } else {
        next()
    }
}