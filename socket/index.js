var userCount = 0;
var userRoomMap = new Map();
var userIDusernameMap = new Map();

function socketHandling(io, app, usersOnline) {
    io.on("connection", (socket) => {
        const sessionID = socket.id;
        userCount++;
        usersOnline[userRoomMap.get(sessionID)] = [];

        // When a user disconnect, we send an icmp echo request so all the
        // clients that are still online is known
        socket.on("disconnect", function() {
            try {
                console.log(sessionID.toString() + ": " + userIDusernameMap.get(sessionID) + ": " + " left " + userRoomMap.get(sessionID));
                socket.leave(userRoomMap.get(sessionID));
                userCount--;
                usersOnline[userRoomMap.get(sessionID)] = [];
                io.to(userRoomMap.get(sessionID)).emit("icmp_echo");
                userIDusernameMap.delete(sessionID);
                userRoomMap.delete(sessionID);
            } catch(e) {
                console.log("[error]", "leave room :", e);
                socket.emit("error", "couldnt perform requested action");
            }
        });

        // On receiving of icmp echo request, we find out who is still online in a room
        socket.on("whose_online", (username, roomID) => {
            if (!userRoomMap.has(sessionID)) {
                userRoomMap.set(sessionID, roomID);
            }

            if (!userIDusernameMap.has(sessionID)) {
                userIDusernameMap.set(sessionID, username);
            }
            
            // console.log(sessionID.toString() + ": " + userIDusernameMap.get(sessionID) + ": " + " joined " + roomID);

            usersOnline[roomID].push(username);

            io.to(userRoomMap.get(sessionID)).emit("agent_refresh", usersOnline[userRoomMap.get(sessionID)]);
        });

        // On receiving of join room by client, check if it is already an existing user
        socket.on("join_room", (roomID, username) => {
            // Handling the case when it leaves a room its in and join another room
            if (userRoomMap.has(sessionID)) {
                try {
                    socket.leave(userRoomMap.get(sessionID));
                    userRoomMap.delete(sessionID);
                } catch(e) {
                    console.log("[error]", "leave room :", e);
                    socket.emit("error", "couldnt perform requested action");
                }
            }

            try {
                socket.join(roomID);
                userRoomMap.set(sessionID, roomID);
                userIDusernameMap.set(sessionID, username);
                usersOnline[roomID] = [];
                io.to(userRoomMap.get(sessionID)).emit("icmp_echo");
                
                console.log(sessionID.toString() + ": " + username + ": " + " joined " + roomID);
            } catch(e) {
                console.log("[error]", "join room :", e);
                socket.emit("error", "couldnt perform requested action");
            }
        });
        
        // Broadcast the agent's position and orientation to other players
        socket.on("agent_data", (msg) => {
            socket.to(userRoomMap.get(sessionID)).emit("agent_data", msg);
        });
    });
}

module.exports = {
    socketHandling
};
