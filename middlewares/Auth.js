const dotenv = require('dotenv').config()
const jwt = require('jsonwebtoken')
const ObjectId = require('mongoose').Types.ObjectId

const usersCollection = require('../database/userModel')

module.exports = (req, res, next) => {
    if(['/login', '/register'].indexOf(req.url) == -1 && !req.session.user) {
        if(req.cookies.token) {
            jwt.verify(req.cookies.token, process.env.TOKEN_SECRET, (err, decoded) => {
                if(!err) {
                    usersCollection.exists({_id: ObjectId(decoded.db_user_id)}, (error, exists) => {
                        if(!error) {
                            if(exists) {
                                req.session.user = jwt.decode(req.cookies.token)
                                
                                next()
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