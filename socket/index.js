const TRAFFIC_GEN_THRESHOLD = 800;
const TRAFFIC_Y_GAP = 200;

let userRoomMap = new Map();
let socketUserMap = new Map();
let roomInfo = {};

setInterval(() => {
    for (const roomID in roomInfo) {
        if (roomInfo[roomID]["traffic"].length > 1) {
            roomInfo[roomID]["traffic"][roomInfo[roomID]["traffic"].length - 1][1] -= 1;
        }
    }
}, 8.33);

function socketHandling(io) {
    io.on("connection", (socket) => {
        const sessionID = socket.id;

        // When a user disconnect, we send an icmp echo request so all the
        // clients that are still online is known
        socket.on("disconnect", function () {
            try {
                let roomID = userRoomMap.get(sessionID),
                    username = socketUserMap.get(sessionID);

                removeUserFromRoom(roomID, username);
                socket.leave(userRoomMap.get(sessionID));
                userRoomMap.delete(sessionID);
            } catch (e) {
                console.log("[error]", "leave room :", e);
                socket.emit("error", "couldnt perform requested action");
            }
        });

        // On receiving of join room by client, check if it is already an existing user
        socket.on("join_room", (roomID, username) => {
            socketUserMap.set(sessionID, username);

            // Handling the case when it leaves a room its in and join another room
            if (userRoomMap.has(sessionID)) {
                try {
                    socket.leave(userRoomMap.get(sessionID));
                    userRoomMap.delete(sessionID);
                } catch (e) {
                    console.error("[Error]", "Leaving room: ", e);
                    socket.emit("error", "couldnt perform requested action");
                }
            }

            try {
                let res = addUserToRoom(roomID, username);

                if (res) {
                    socket.join(roomID);
                    userRoomMap.set(sessionID, roomID);
                    io.to(roomID).emit("agent_refresh", roomInfo[roomID]["users"]);
                    io.to(roomID).emit("init_traffic", roomInfo[roomID]["traffic"]);
                } else {
                    throw new Error("Room is currently full");
                }
            } catch (e) {
                console.error("[Error]", "Joining room: ", e);
                socket.emit("error", "couldnt perform requested action");
            }
        });

        // Broadcast the agent's position and orientation to other players
        socket.on("agent_data", (msg) => {
            let roomID = userRoomMap.get(sessionID);
            if (roomID !== undefined)
                handleAgentMovement(io, roomID, msg);
            socket.to(roomID).emit("agent_data", msg);
        });
    });
}


/**
 * 
 * @param {string} roomID
 * @param {Object} msg Object containing keys "username" and "agentData"
 */
function handleAgentMovement(io, roomID, msg) {
    let username = msg["username"];
    roomInfo[roomID]["agents"][username] = [msg["agentData"]["x"], msg["agentData"]["y"]];

    let newTraffic = generateTraffic(roomID, 2);
    if (newTraffic.length > 0)
        io.to(roomID).emit("new_traffic", newTraffic);
}


/**
 * 
 * @param {string} roomID 
 * @param {string} username 
 * @returns {boolean} Flag whether user has been added to the room successfully
 */
function addUserToRoom(roomID, username) {
    if (roomID in roomInfo === false) {
        roomInfo[roomID] = {
            "roomID": roomID,
            "userCount": 0,
            "users": [],
            "agents": {},
            "laneCount": 4,
            "traffic": [],
        };
    }

    if (roomInfo[roomID]["userCount"] < roomInfo[roomID]["laneCount"]) {
        roomInfo[roomID]["userCount"]++;
        roomInfo[roomID]["users"].push(username);
        roomInfo[roomID]["agents"][username] = [0, 0];
        return true;
    } else {
        return false;
    }
}


/**
 * 
 * @param {string} roomID 
 * @param {string} username 
 */
function removeUserFromRoom(roomID, username) {
    if (roomInfo[roomID]) {
        roomInfo[roomID]["userCount"]--;
        roomInfo[roomID]["users"] = roomInfo[roomID]["users"].filter(u => u !== username);
        delete roomInfo[roomID]["agents"][username];

        if (roomInfo[roomID]["userCount"] == 0)
            delete roomInfo[roomID];
    }
}


/**
 * 
 * @param {string} roomID
 * @param {number} count Number of cars to make
 * @returns {Array<Array<number>>} Array of new traffic NPCs spawned 
 */
function generateTraffic(roomID, count = 2) {
    let newTraffic = [];

    const agents = roomInfo[roomID]["agents"];
    const traffic = roomInfo[roomID]["traffic"];
    const lastTrafficY = (traffic.length > 0) ? traffic[traffic.length - 1][1] : -100;

    let agentY = Object.values(agents).map(pos => pos[1]),
        minY = Math.min(...agentY);

    // Compare best car with last NPC car
    let distDiff = minY - lastTrafficY;

    // If the distance is close enough, generate a new NPC car
    if (distDiff <= TRAFFIC_GEN_THRESHOLD) {
        let laneCount = roomInfo[roomID]["laneCount"],
            lanes = getTrafficLanes(count, laneCount);

        for (const lane of lanes) {
            const newY = lastTrafficY - TRAFFIC_Y_GAP;
            roomInfo[roomID]["traffic"].push([lane, newY]);
            newTraffic.push([lane, newY]);
        }
    }

    return newTraffic;
}

/**
 * Generates the lanes of traffic to generate the cars
 * @param {number} count Number of lanes to generate
 * @param {number} laneCount Number of lanes in total
 * @returns {Array<number>}
 */
function getTrafficLanes(count, laneCount) {
    let lanes = [],
        l = getRandomInt(0, laneCount);

    for (let i = 0; i < count; i++) {
        while (lanes.includes(l))
            l = getRandomInt(0, laneCount);
        lanes.push(l);
    }

    return lanes;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}

module.exports = {
    socketHandling
};
