var socket = io();

socket.on("connect", () => {
    console.log("Connected to Socket.io server!");
});

// Emit your data to other users
function emitAgentData(username, agentData) {
    dataEmit = {};
    dataEmit["username"] = username;
    dataEmit["agentData"] = agentData;
    socket.emit("agent_data", dataEmit);
}

function emitNew(username) {
    socket.emit("new_agent", username);
}

function emitWhoseOnline(username) {
    socket.emit("whose_online", username);
}

socket.on("agent_refresh", function (username) {
    agentOnline = [...username];
    agentTraffic = [];

    laneNum = 0;   

    for (agents of agentOnline) {
        if (agents != getCookie("username")) {
            agentTraffic.push(new Car(road.getLaneCenter(laneNum++), -100, 30, 50, "NPCAgent", agents, 2, getRandomColor()));
        } else {
            bestCar.x = road.getLaneCenter(laneNum++);
            bestCar.y = -100;
            bestCar.angle = 0;
        }
    }
});

socket.on("agent_left", function (username) {
    console.log(username + " has left");
});

// ICMP Echo request by server, emit your own username
socket.on("icmp_echo", function () {
    emitWhoseOnline(getCookie("username"));
});

// Gets emitted data of other agents and updates environment
socket.on("agent_data", function (data) {
    username = data["username"];
    i = 0;

    for (agents of agentTraffic) {
        if (agentTraffic[i].username == username) {
            agentTraffic[i].agentTrafficUpdate(data["agentData"]);
        }
        i++;
    }
});
