let socket = io.connect();

function carStateReward(stringState) {
    socket.emit("agent_state_reward", stringState);
}

function agentActionExecute(control) {
    controlList = [false, false, false, false];

    if (parseInt(control) == 0) {
        controlList[0] = true;
    } else if (parseInt(control) == 1) {
        controlList[2] = true;
    } else if (parseInt(control) == 2) {
        controlList[2] = true;
    } else {
        controlList[3] = true;
    }

    isAwaitingDQNRes = true;
}

socket.on("agent_action", agentActionExecute);
