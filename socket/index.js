const db = require("../db");

const TRAFFIC_GEN_THRESHOLD = 800;
const TRAFFIC_Y_GAP = 200;

let socketRoomMap = new Map();
let socketUserMap = new Map();
let roomInfo = {};

setInterval(() => {
    for (const roomID in roomInfo) {
        if (roomInfo[roomID]["traffic"].length > 1 && roomInfo[roomID]["running"]) {
            roomInfo[roomID]["trafficOffset"] -= 1;
        }
    }
}, 16.667);

function socketHandling(io) {
    io.on("connection", (socket) => {
        const socketID = socket.id;

        // When a user disconnect, we send an icmp echo request so all the
        // clients that are still online is known
        socket.on("disconnect", function () {
            try {
                let roomID = socketRoomMap.get(socketID),
                    username = socketUserMap.get(socketID);

                removeUserFromRoom(roomID, username);
                socket.leave(socketRoomMap.get(socketID));
                socket.to(socketRoomMap.get(socketID)).emit("chat_message", socketUserMap.get(socketID) + " has left");
                socketRoomMap.delete(socketID);

                io.to(roomID).emit("agent_left", username);
            } catch (e) {
                console.log("[error]", "leave room :", e);
                socket.emit("error", "couldnt perform requested action");
            }
        });

        // On receiving of join room by client, check if it is already an existing user
        socket.on("join_room", (roomID, username, laneCount) => {
            socketUserMap.set(socketID, username);

            // Handling the case when it leaves a room its in and join another room
            if (socketRoomMap.has(socketID)) {
                try {
                    socket.leave(socketRoomMap.get(socketID));
                    socket.to(roomID).emit("chat_message", username + " has left");
                    socketRoomMap.delete(socketID);
                } catch (e) {
                    console.error("[Error]", "Leaving room: ", e);
                    socket.emit("error", "couldnt perform requested action");
                }
            }

            try {
                let res = addUserToRoom(roomID, username, laneCount);

                if (res) {
                    socket.join(roomID);
                    socket.to(roomID).emit("chat_message", username + " has joined");
                    socketRoomMap.set(socketID, roomID);
                    refreshScreen(io, roomID, socket);
                } else {
                    throw new Error("Room is currently full");
                }
            } catch (e) {
                console.error("[Error]", "Joining room: ", e);
                socket.emit("error", e.message);
            }
        });

        socket.on("lane_count_request", (roomID) => {
            if (roomInfo[roomID]) {
                io.to(roomID).emit("lane_count", roomInfo[roomID]["laneCount"]);
            }

            refreshScreen(io, roomID, socket);
        });

        socket.on("agent_ready", () => {
            let roomID = socketRoomMap.get(socketID),
                username = socketUserMap.get(socketID);
            if (roomID !== undefined)
                roomInfo[roomID]["readyUsers"].add(username);
            // console.log(roomInfo[roomID]["readyUsers"]);

            try {
                const users = roomInfo[roomID]["users"],
                    rdyUsers = roomInfo[roomID]["readyUsers"];
                
                if ([...users].sort().join() === [...rdyUsers].sort().join()) {
                    io.to(roomID).emit("game_start");
                    roomInfo[roomID]["running"] = true;
                }
            } catch (e) {
                console.log("error starting...", e);
            }
        });

        socket.on("agent_not_ready", () => {
            let roomID = socketRoomMap.get(socketID),
                username = socketUserMap.get(socketID);
            if (roomID !== undefined)
                roomInfo[roomID]["readyUsers"].delete(username);
        });

        // Broadcast the agent's position and orientation to other players
        socket.on("agent_data", (msg) => {
            let roomID = socketRoomMap.get(socketID);
            if (roomID !== undefined)
                handleAgentMovement(io, roomID, msg);
            socket.to(roomID).emit("agent_data", msg);
        });

        // On the receiving of chat message
        socket.on("chat_message", (msg) => {
            io.to(socketRoomMap.get(socketID)).emit("chat_message", socketUserMap.get(socketID), msg);
        });

        socket.on("crash", async () => {
            let roomID = socketRoomMap.get(socketID),
                username = socketUserMap.get(socketID);

            if (roomID in roomInfo && username in roomInfo[roomID]["agents"]) {
                roomInfo[roomID]["agents"][username]["crashed"] = true;

                if (checkGameEnded(roomID)) {
                    const scores = getFinalScores(roomID);
                    io.to(roomID).emit("ended", scores);

                    io.in(roomID).disconnectSockets(true);
                    delete roomInfo[roomID];
                }
            }
        });
    });
}

function refreshScreen(io, roomID, socket) {
    io.to(roomID).emit("agent_refresh", [...roomInfo[roomID]["users"]]);
    socket.emit("init_traffic", {
        type: "init",
        traffic: roomInfo[roomID]["traffic"],
        trafficOffset: roomInfo[roomID]["trafficOffset"],
    });
}

/**
 * Checks whether all agents in a room have crashed
 * @param {string} roomID 
 * @returns {boolean} Flag whether game has ended
 */
function checkGameEnded(roomID) {
    const agents = roomInfo[roomID]["agents"];
    for (user in agents) {
        if (agents[user]["crashed"] === false)
            return false;
    }
    return true;
}

/**
 * Checks whether all agents in a room have crashed
 * @param {string} roomID 
 * @returns {object} All scores of the users
 */
function getFinalScores(roomID) {
    let scores = {};
    let agents = roomInfo[roomID]["agents"];

    for (user in agents) {
        scores[user] = Math.abs(Math.round(agents[user]["pos"][1]));
    }

    db.uploadScores(roomID, agents);
    return scores;
}

/**
 * 
 * @param {string} roomID
 * @param {Object} msg Object containing keys "username" and "agentData"
 */
function handleAgentMovement(io, roomID, msg) {
    if ((roomID in roomInfo) === false)
        return;

    let username = msg["username"];
    if ((username in roomInfo[roomID]["agents"]) === false)
        return;

    roomInfo[roomID]["agents"][username]["pos"] = [msg["agentData"]["x"], msg["agentData"]["y"]];

    let newTraffic = generateTraffic(roomID, 2);
    if (newTraffic.length > 0) {
        io.to(roomID).emit("new_traffic", {
            type: "new",
            traffic: newTraffic,
            trafficOffset: roomInfo[roomID]["trafficOffset"],
        });
    }
}

/**
 * 
 * @param {string} roomID 
 * @param {string} username 
 * @returns {boolean} Flag whether user has been added to the room successfully
 */
function addUserToRoom(roomID, username, laneCount) {
    if (roomID in roomInfo === false) {
        roomInfo[roomID] = {
            "roomID": roomID,
            "userCount": 0,
            "maxUserCount": laneCount,
            "users": new Set(),
            "agents": {},
            "laneCount": laneCount,
            "traffic": [],
            "trafficOffset": 0,
            "readyUsers": new Set(),
            "running": false,
        };
    }

    if (roomInfo[roomID]["userCount"] < roomInfo[roomID]["maxUserCount"]) {
        roomInfo[roomID]["userCount"]++;
        roomInfo[roomID]["users"].add(username);
        roomInfo[roomID]["agents"][username] = {
            "pos": [0, 0],
            "crashed": false,
        };
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
        roomInfo[roomID]["users"].delete(username);
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

    const agentPos = Object.values(roomInfo[roomID]["agents"]).map((v) => v["pos"]);
    const traffic = roomInfo[roomID]["traffic"];
    const lastTrafficY = (traffic.length > 0) ? traffic[traffic.length - 1][1] : -100;

    let agentY = Object.values(agentPos).map(pos => pos[1]),
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
