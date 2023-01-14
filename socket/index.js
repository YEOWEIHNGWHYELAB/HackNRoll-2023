var userCount = 0;

function socketHandling(io, app, usersOnline) {
    io.on('connection', (socket) => {
        // handshake.headers[x-forwarded-for] for public IP if available
        // conn.remoteAddress for private IP
        // let clientIP = socket.handshake.headers["x-forwarded-for"] || socket.conn.remoteAddress.split(":")[3];
        // console.log(`User from ${clientIP} connected`);

        if (userCount > 2) {

        }

        userCount++;

        console.log('a user connected');
        // socket.broadcast.emit('new_agent', userCount);

        socket.on('disconnect', () => {
            console.log('user disconnected');
            userCount--;
            // socket.broadcast.emit('agent_left', userCount);
        });

        socket.on('new_agent', (msg) => {
            socket.broadcast.emit('new_agent', msg)
        });

        socket.on('agent_data', (msg) => {
            socket.broadcast.emit('agent_data', msg);
        });
    });
}

module.exports = {
    socketHandling
};
