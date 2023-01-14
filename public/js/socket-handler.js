let socket = io.connect();

socket.on("connect", () => {
    console.log("Connected to Socket.io server!");
});

// Emit your data to other users
function emitAgentData(username, agentData) {
    let dataEmit = {
        "username": username,
        "agentData": agentData,
    };
    socket.emit("agent_data", dataEmit);
}

function emitNew(username) {
    socket.emit("new_agent", username);
}

function joinRoom(roomID, username) {
    socket.emit("join_room", roomID, username);
}

socket.on("agent_refresh", function (users) {
    agentOnline = [...users];
    agentTraffic = [];
    laneNum = 0;

    for (agents of agentOnline) {
        if (agents != getCookie("username")) {
            agentTraffic.push(new Car(road.getLaneCenter(laneNum++), 0, 30, 50, "NPCAgent", agents, 2, getRandomColor()));
        } else {
            bestCar.x = road.getLaneCenter(laneNum++);
            bestCar.y = 0;
            bestCar.angle = 0;
        }
    }
});

socket.on("agent_left", function (username) {
    console.log(username + " has left");
});

// Gets emitted data of other agents and updates environment
socket.on("agent_data", function (data) {
    username = data["username"];

    for (let i = 0; i < agentTraffic.length; i++) {
        if (agentTraffic[i].username == username) {
            agentTraffic[i].agentTrafficUpdate(data["agentData"]);
        }
    }
});

socket.on("init_traffic", spawnTraffic);
socket.on("new_traffic", spawnTraffic);

/**
 * 
 * @param {Array<Array<number>>} trafficArr 
 */
function spawnTraffic(trafficArr) {
    for (npc of trafficArr) {
        let x = road.getLaneCenter(npc[0]),
            y = npc[1],
            car = new Car(x, y, 30, 50, "NPC", "", 1, getRandomColor());
        traffic.push(car);
    }
}