let socket = io.connect();
let username = "";
let hasSync = false;

// Emit your data to other users
function emitAgentData(username, agentData) {
    let dataEmit = {
        "username": username,
        "agentData": agentData,
    };
    socket.emit("agent_data", dataEmit);
}

function joinRoom(roomID, username, laneCount) {
    socket.emit("join_room", roomID, username, laneCount);
}

function toggleReady() {
    let btnReady = document.querySelector("#btnReady");

    if (btnReady.dataset.ready === "0") {
        btnReady.dataset.ready = "1";
        btnReady.style.background = "greenyellow";
        socket.emit("agent_ready");
    } else if (btnReady.dataset.ready === "1") {
        btnReady.dataset.ready = "0";
        btnReady.style.background = "white";
        socket.emit("agent_not_ready");
    }
}

function syncAgentData(data) {
    username = data["username"];

    for (let i = 0; i < agentTraffic.length; i++) {
        if (agentTraffic[i].username == username) {
            agentTraffic[i].agentTrafficUpdate(data["agentData"]);
        }
    }
}

function agentRefresh(users) {
    if (JSON.stringify(users) === "{}")
        return;

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
}

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

function gameStart() {
    running = true;
    startTime = new Date().getTime();
}

function error(msg) {
    alert(msg);
}

function requestLaneSync(roomID) {
    socket.emit("lane_count_request", roomID);
}

function laneCountSync(roomLaneCount) {
    if (!hasSync) {
        laneCount = roomLaneCount;
        initGlobals(laneCount);
        resetCanvas(laneCount);
        updateCars();
        animate();

        hasSync = true;
    }
}

// Removes agent from memory when they disconnect
socket.on("connect", () => {
    console.log("Connected to Socket.io server");
});
socket.on("agent_left", function (username) {
    agentTraffic = agentTraffic.filter((a) => a.username !== username);
});
socket.on("lane_count", laneCountSync);
socket.on("agent_refresh", agentRefresh);
socket.on("chat_message", appendChatMsg);
socket.on("agent_data", syncAgentData);
socket.on("ended", showScores);
socket.on("init_traffic", spawnTraffic);
socket.on("new_traffic", spawnTraffic);
socket.on("game_start", gameStart);
socket.on("error", error);
