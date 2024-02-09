// SOCKET.IO
const users = {};
let io;

module.exports.socketconnection = (server) => {
    io = require('socket.io')(server);
    io.on('connection', (socket) => {
    logger.info('a user is connected to the socket');
    socket.on('userLogin', email => {
        users[email] = socket.id;
        logger.info('socket.io users:', users);
    });
    socket.on('disconnect', socket, email => {
        logger.info('user disconnected');
        delete users[email];
        logger.info('socket.io users:', users);
    });
    });
};

module.exports.sendMessage = (roomId, eventName, message) => {
    try {
        if (roomId === null || roomId === undefined) {
            io.emit(eventName, message);
            return true;
        }
        if (users[roomId]) {
            io.to(users[roomId]).emit(eventName, message);
            return true;
        }
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

