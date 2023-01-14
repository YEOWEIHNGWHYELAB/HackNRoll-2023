var userCount = 0;

function socketHandling(io, app, usersOnline) {
    io.on("connection", (socket) => {
        console.log("new player joined...");
        userCount++;
        usersOnline = [];
        io.emit("icmp_echo");

        // When a user disconnect, we send an icmp echo request so all the
        // clients that are still online is known
        socket.on("disconnect", () => {
            console.log("a player left...");
            userCount--;
            usersOnline = [];
            io.emit("icmp_echo");
        });

        // On receiving of icmp echo request, we find out who is still online
        socket.on("whose_online", (username) => {
            // console.log("new player count: " + userCount.toString());
            usersOnline.push(username);
            io.emit("agent_refresh", usersOnline);

            console.log(usersOnline);
        });
        
        // Broadcast the agent's position and orientation to other players
        socket.on("agent_data", (msg) => {
            socket.broadcast.emit("agent_data", msg);
        });
    });
}

module.exports = {
    socketHandling
};
