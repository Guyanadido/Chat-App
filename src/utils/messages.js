const generateMessages = (text, username='admin') => {
    return {
        username,
        text,
        createdAt: new Date().getTime()
    }
}

const generateLocationMessages = (username, url) => {
    return {
        username,
        url,
        createdAt: new Date().getTime(),
    }
}

module.exports = {
    generateMessages,
    generateLocationMessages
}