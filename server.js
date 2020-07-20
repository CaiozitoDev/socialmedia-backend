const dotenv = require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const cors = require('cors')

const app = express()

// MIDDLEWARES
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

// LISTA DE ROTAS
app.use(require('./routes/Auth-route'))
app.use(require('./routes/Chat-route'))
app.use(require('./routes/Comment-route'))
app.use(require('./routes/Friends-route'))
app.use(require('./routes/LoginRegister-route'))
app.use(require('./routes/Message-route'))
app.use(require('./routes/Posts-route'))
app.use(require('./routes/ProfileData-route'))
app.use(require('./routes/TopPosts-route'))
app.use(require('./routes/UserFilter-route'))
app.use(require('./routes/UserPost-route'))


// CONEXÃO COM BANCO DE DADOS
mongoose.connect(process.env.MONGO_API_ADDRESS, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false})
    .then(() => {console.log('MongoDB Connected')})
    .catch((err) => {console.log(err)})


// PORTAS
app.listen(process.env.PORT || 5000, () => {
    console.log('Server running')
})