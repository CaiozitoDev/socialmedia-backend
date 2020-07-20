const dotenv = require('dotenv').config()
const jwt = require('jsonwebtoken')

const route = require('express').Router()

const usersCollection = require('../database/userModel')

route.post('/auth', (req, res) => {
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

module.exports = route