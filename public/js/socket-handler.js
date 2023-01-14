var socket = io();

socket.on("connect", () => {
    console.log("Connected to Socket.io server!");
});

// Emit your data to other users
function emitAgentData(username, agentData) {
    dataEmit = {}
    dataEmit["username"] = username;
    dataEmit["agentData"] = agentData;
    socket.emit('agent_data', dataEmit);
}

function emitNew(username) {
    socket.emit("new_agent", username);
}

socket.on("new_agent", function (username) {
    console.log(username + " has joined");
    agentTraffic.push(new Car(road.getLaneCenter(1), -100, 30, 50, "NPCAgent", username, 2, getRandomColor()));
});

socket.on("agent_left", function (username) {
    console.log(username + " has left");
});

// Gets emitted data of other agents and updates environment
socket.on("agent_data", function (data) {
    // console.log(data);
    username = data["username"];
    
    agentTraffic[0].agentTrafficUpdate(data["agentData"]);
});
