let roadCanvas;
let NNCanvas;
let roadCtx;
let NNCtx;
let road;
let agentArr;
let bestCar;
let traffic;
let agentTraffic;
let running;
let roadMinX;
let roadMaxX;
let isUsingDQN = false;

const initGlobals = (laneCount) => {
    // Window for Training Environment
    roadCanvas = document.querySelector("#roadCanvas");
    roadCanvas.width = 300 + ((laneCount - 4) * 60);

    // Window for Neural Network Visualization
    NNCanvas = document.querySelector("#NNCanvas");
    NNCanvas.width = 300;

    roadCtx = roadCanvas.getContext("2d");
    NNCtx = NNCanvas.getContext("2d");

    running = false;
};

const resetCanvas = (laneCount = 4) => {
    road = new Road(roadCanvas.width / 2, roadCanvas.width * 0.9, laneCount);

    // Agent Generation
    agentArr = [new Car(road.getLaneCenter(2), 0, 30, 50, "AI", getCookie("username"), 3, "blue", 5, 6)];
    bestCar = agentArr[0];

    // Check if there is already saved brain in local storage
    if (localStorage.getItem("bestBrain")) {
        // Load brain into agents
        for (let i = 0; i < agentArr.length; i++) {
            agentArr[i].sensor = new Sensor(agentArr[i], JSON.parse(localStorage.getItem("bestBrain"))["levels"][0]["inputs"].length);
            agentArr[i].brain = JSON.parse(localStorage.getItem("bestBrain"));
            
            // Mutate all agent's brain except first one
            if (i != 0) {
                NeuralNetwork.mutate(agentArr[i].brain, 0.1);
            }
        }
    }

    // Traffic NPCs & Other Agent Traffic
    traffic = [];
    agentTraffic = [];
};

// Rules for defining best car
const getBestAgent = () => {
    return agentArr.find((c) => c.y == Math.min(...agentArr.map((c) => c.y)));
};

function updateCars() {
    for (let i = 0; i < traffic.length; i++) {
        traffic[i].update(road.borders, [], []);
    }
    for (let i = 0; i < agentTraffic.length; i++) {
        agentTraffic[i].update(road.borders, [], []);
    }
    for (let i = 0; i < agentArr.length; i++) {
        agentArr[i].update(road.borders, traffic, agentTraffic);
    }
}

function updateAgentTraffic() {
    for (let i = 0; i < agentTraffic.length; i++) {
        agentTraffic[i].update(road.borders, [], []);
    }
}

function envUpdate() {
    if (running) {
        updateCars();
    }

    prevBestCar = bestCar;
    bestCar = getBestAgent();

    // if all cars have stopped
    let stopCond = agentArr.every((agent) => agent.damaged);
    if (stopCond) {
        if (running)
            socket.emit("crash", "");
    }

    roadCanvas.height = window.innerHeight;
    NNCanvas.height = window.innerHeight;

    roadCtx.save();
}

function drawEnv(time, isSinglePlayer) {
    // Move camera based on best car
    roadCtx.translate(0, -bestCar.y + roadCanvas.height * 0.7);

    // Draw traffic NPCs
    road.draw(roadCtx);
    for (let i = 0; i < traffic.length; i++) {
        traffic[i].draw(roadCtx);
    }

    // Draw Agent of another traffic
    for (let i = 0; i < agentTraffic.length; i++) {
        agentTraffic[i].draw(roadCtx);
    }

    // Only draw the sensor and the clearest on the best car
    roadCtx.globalAlpha = 1;
    bestCar.draw(roadCtx, true);

    if (isSinglePlayer)
        trafficNPCController();

    roadCtx.restore();

    // Neural network visualizer
    if (bestCar.brain) {
        NNCtx.lineDashOffset = -time / 50; // Make the line dash of the neural network visualizer move
        Visualizer.drawNetwork(NNCtx, bestCar.brain);
    }
}
