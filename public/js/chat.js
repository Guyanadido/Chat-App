const socket = io()

//elements
const $messageForm = document.querySelector('#message_form')
const $messageFormButton = $messageForm.querySelector('button')
const $messageFormInput = $messageForm.querySelector('input')
const $sendLocationButton = document.querySelector('#get_location')
const $messages = document.querySelector('#messages')

//templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = () => {
    //get the new message 
    const $newMessage = $messages.lastElementChild

    //get the height of the last element 
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //visible Height 
    const visibleHeight = $messages.offsetHeight

    //total height
    const totalheight = $messages.scrollHeight

    //how much we have scrolled
    const scrolledHeight = $messages.scrollTop + visibleHeight

    if(scrolledHeight >= totalheight - newMessageHeight) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('locationMessage', (message, callback) => {
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a'),
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room: room,
        users: users
    })

    document.querySelector('#sidebar').innerHTML = html
})

document.querySelector('#message_form').addEventListener('submit', (e) => {
    e.preventDefault()

    //disable the button till the message is sent
    $messageFormButton.setAttribute('disabled', 'disabled')
    socket.emit('message', e.target.elements.message.value, (error) => {
        //re-enable the button once the message is sent
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        if (error) {
            $messageFormInput.setAttribute('placeholder', error)
            setTimeout(() => {

                $messageFormInput.setAttribute('placeholder', 'type your message')
            }, 2000)
            return
        }

        console.log('message delivered')
    })
})

document.querySelector('#get_location').addEventListener('click', () => {
    if(!navigator.geolocation) {
        return alert("you're browser doesn't support geolocation")
    }

    //disable the sendlocation button
    $sendLocationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition(position => {
        socket.emit('sendLocation', { 'latitude': position.coords.latitude, 'longitude': position.coords.longitude }, (error) => {
            //re-enable the send location button 
            $sendLocationButton.removeAttribute('disabled')
            if (error) {
                return console.log('location not shared')
            }

            console.log('location shared')
        })
    })
})

socket.emit('join', {username, room}, (error) => {
    if(error) {
        alert(error)
        location.href = '/'
    }
})