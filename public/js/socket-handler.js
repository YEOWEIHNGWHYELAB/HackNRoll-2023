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

// Removes agent from memory when they disconnect
socket.on("agent_left", function (username) {
    agentTraffic = agentTraffic.filter((a) => a.username !== username);
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

socket.on("ended", showScores);

socket.on("init_traffic", spawnTraffic);
socket.on("new_traffic", spawnTraffic);

/**
 * 
 * @param {object} trafficInfo
 */
function spawnTraffic(trafficInfo) {
    const trafficOffset = trafficInfo["trafficOffset"];
    const trafficArr = trafficInfo["traffic"];

    for (npc of trafficArr) {
        let x = road.getLaneCenter(npc[0]),
            y = npc[1] + trafficOffset,
            car = new Car(x, y, 30, 50, "NPC", "", 1, getRandomColor());
        traffic.push(car);
    }
}

function showScores(scores) {
    const divScores = document.querySelector("#divScores"),
        tblScores = document.querySelector("#tblScores");

    tblScores.innerHTML = "";
    for (user in scores) {
        let newRow = tblScores.insertRow(0),
            nameCell = newRow.insertCell(0),
            scoreCell = newRow.insertCell(1);

        nameCell.innerHTML = user;
        scoreCell.innerHTML = scores[user];
    }

    divScores.style.display = "block";
    setTimeout(function () {
        divScores.style.opacity = 1;
    }, 100);
}