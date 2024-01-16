const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const http = require('http')
const path = require('path')

const app = express()
const server = http.createServer(app)
const io = socketio(server)
const {generateMessages, generateLocationMessages} = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const publicDir = path.join(__dirname, '../public')
app.use(express.static(publicDir))
const port = process.env.PORT || 3000

app.get('/', (req, res) => {
    res.render('index')
})


io.on('connection', (socket) => {
    console.log('new webSocket connection')

    socket.on('join', (options, callback) => {
        const {error, user} = addUser({id: socket.id, ...options})

        if(error) {
            return callback(error)
        }
        
        socket.join(user.room)

        socket.emit('message', generateMessages('welcome'))
        socket.broadcast.to(user.room).emit('message', generateMessages(`${user.username} has joined!`, user.username))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })
    
    socket.on('message', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()
        if(filter.isProfane(message)) {
            return callback('profanity is not allowed')
        }

        io.to(user.room).emit('message', generateMessages(message, user.username))
        callback()
    })

    socket.on('sendLocation', (cords, callback) => {
        const user = getUser(socket.id)

        io.to(user.room).emit('locationMessage', generateLocationMessages(user.username, `https://www.google.com/maps?q=${cords.latitude},${cords.longitude}`))
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        
        if(user) {
            io.to(user.room).emit('message', generateMessages(`${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
        
    })
})

server.listen(port, () => {
    console.log(`server is up and running on port ${port}`)
})