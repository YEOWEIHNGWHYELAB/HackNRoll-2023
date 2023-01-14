const db = require("../db");

const TRAFFIC_GEN_THRESHOLD = 800;
const TRAFFIC_Y_GAP = 200;

let userRoomMap = new Map();
let socketUserMap = new Map();
let roomInfo = {};

setInterval(() => {
    for (const roomID in roomInfo) {
        if (roomInfo[roomID]["traffic"].length > 1) {
            roomInfo[roomID]["trafficOffset"] -= 1;
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

                io.to(roomID).emit("agent_left", username);
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
                    socket.emit("init_traffic", {
                        traffic: roomInfo[roomID]["traffic"],
                        trafficOffset: roomInfo[roomID]["trafficOffset"],
                    });
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

        socket.on("crash", () => {
            let roomID = userRoomMap.get(sessionID),
                username = socketUserMap.get(sessionID);

            if (roomID in roomInfo) {
                roomInfo[roomID]["agents"][username]["crashed"] = true;

                if (checkGameEnded(roomID)) {
                    const scores = getFinalScores(roomID);
                    io.to(roomID).emit("ended", scores);
                    delete roomInfo[roomID];
                    console.log(`Game in room '${roomID}' has ended`);
                }
            }
        });
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
function addUserToRoom(roomID, username) {
    if (roomID in roomInfo === false) {
        roomInfo[roomID] = {
            "roomID": roomID,
            "userCount": 0,
            "users": [],
            "agents": {},
            "laneCount": 4,
            "traffic": [],
            "trafficOffset": 0,
        };
    }

    if (roomInfo[roomID]["userCount"] < roomInfo[roomID]["laneCount"]) {
        roomInfo[roomID]["userCount"]++;
        roomInfo[roomID]["users"].push(username);
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
