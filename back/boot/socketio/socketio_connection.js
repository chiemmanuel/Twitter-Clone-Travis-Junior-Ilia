const logger = require("../../middleware/winston");


// SOCKET.IO
const users = {};
let io;


module.exports.socketconnection = (server) => {
    io = require('socket.io')(server, {
        cors: {
            origin: "*",

        }
    });
    io.on('connection', (socket) => {
    logger.info('a user is connected to the socket');
    socket.on('userLogin', email => {
        users[email] = socket.id;
        logger.info('socket.io users:', users);
    });
    socket.on('disconnect', email => {
        logger.info('user disconnected');
        delete users[email];
        logger.info('socket.io users:', users);
    });
    });
};

module.exports.sendMessage = (roomId, eventName, message) => {
    try {
        console.log(eventName)
        if ( roomId === null || roomId === undefined ) {
            io.emit(eventName, message);
            logger.info('Message sent to all users:', message);
            return true;
        }
        roomId = users[roomId] || roomId;
        io.to(roomId).emit(eventName, message);
        return true;
    }
    catch (error) {
        logger.error('Error sending message:', error);
        return false;
    }
};

module.exports.getRooms = () => io.sockets.adapter.rooms;

module.exports.getUsers = () => users;

