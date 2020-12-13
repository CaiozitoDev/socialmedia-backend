const dotenv = require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const Firebase = require('./utils/firebase')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const authMiddleware = require('./middlewares/Auth')
const errorHandlerMiddleware = require('./errors/ErrorHandler')
global.XMLHttpRequest = require('xhr2')

const app = express()

const http = require('http').createServer(app)
const io = require('socket.io')(http, {
    cors: {
        origin: 'https://frontendtestedoteste.herokuapp.com'  /* 'http://localhost:3000' */
    }
})

let currentSocketClient = {
    io: io
}

io.on('connection', socket => {
    console.log('connected to Socket.IO with ID: ' + socket.id)
    currentSocketClient['socket'] = socket
})

io.on('disconnect', socket => {
    console.log('disconnected from Socket.IO with ID: ' + socket.id)
    currentSocketClient = {}
})

// MIDDLEWARES
app.use(cors({
    credentials: true,
    origin: 'https://frontendtestedoteste.herokuapp.com',/* 'http://localhost:3000' */
}))
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(session({
    secret: process.env.SESSION_KEY,
    saveUninitialized: false,
    resave: true,
    cookie: {
        httpOnly: true,
        sameSite: 'none',
        secure: true
    }
}))
app.use(cookieParser())
app.use(authMiddleware)

new Firebase()

// LISTA DE ROTAS
app.use(require('./routes/Chat-route')(currentSocketClient))
app.use(require('./routes/Comment-route')(currentSocketClient))
app.use(require('./routes/Friends-route')(currentSocketClient))
app.use(require('./routes/LoginRegister-route'))
app.use(require('./routes/Message-route'))
app.use(require('./routes/Posts-route')(currentSocketClient))
app.use(require('./routes/ProfileData-route'))
app.use(require('./routes/TopPosts-route'))
app.use(require('./routes/UserFilter-route'))
app.use(require('./routes/UserPost-route'))

app.use(errorHandlerMiddleware)

// CONEXÃO COM BANCO DE DADOS
mongoose.connect(process.env.MONGO_API_ADDRESS, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false})
    .then(() => {console.log('MongoDB Connected')})
    .catch(err => {console.log(err)})
    
// PORTAS
http.listen(process.env.PORT || 5000, () => {
    console.log('Server running')
})