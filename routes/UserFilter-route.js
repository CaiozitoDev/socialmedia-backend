const route = require('express').Router()
const yup = require('yup')

const usersCollection = require('../database/userModel')

route.get('/userfilter', (req, res, next) => {
    const username = req.query.username
    const from = Number(req.query.from)
    const to = Number(req.query.to)

    let schema = yup.object().shape({
        username: yup.string().trim().strict().notRequired(),
        from: yup.number().integer().min(0).required(),
        to: yup.number().integer().positive().required() // não sei se precisa ser múltiplo de 10
    })

    schema.validate({
        username,
        from,
        to
    }, {
        abortEarly: false
    }).then(() => {
        usersCollection.find({username: {$regex: `^${username}.*$`, $options: 'i'}}, {
            username: true,
            photo: true
        }).skip(from).limit(to).then(doc => {
            if(doc) {
                usersCollection.find({username: {$regex: `^${username}.*$`, $options: 'i'}}).countDocuments().then(value => {
                    res.send({users: doc, allUsersLength: value})
                })
            } else {
                res.status(404).send({
                    message: 'User not found.'
                })
            }
        })
    }).catch(err => next(err))
})

module.exports = route