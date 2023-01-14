let roadCanvas;
let NNCanvas;
let roadCtx;
let NNCtx;
let road;
let agentNum;
let agentArr;
let bestCar;
let prevBestCar;
let timeSinceBestChange;
let traffic;
let agentTraffic;
let popup;
let running;
let controlList = [false, false, false, false];
let roadMinX;
let roadMaxX;
let isAwaitingDQNRes = true;
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

    popup = document.querySelector("#divPopup");
    running = true;
};

const resetCanvas = (agentCount = 10, isMultiplayerCar = false, laneCount = 4) => {
    popup.style.display = "none";
    popup.style.opacity = 0;

    road = new Road(roadCanvas.width / 2, roadCanvas.width * 0.9, laneCount);

    // Agent Generation
    agentNum = agentCount;
    agentArr = generateCars(agentNum);

    bestCar = agentArr[0];

    // Check if there is already saved brain in local storage
    if (localStorage.getItem("bestBrain")) {
        // Load brain into agents
        for (let i = 0; i < agentArr.length; i++) {
            agentArr[i].brain = JSON.parse(localStorage.getItem("bestBrain"));
            agentArr[i].sensor = new Sensor(agentArr[i], JSON.parse(localStorage.getItem("bestBrain"))["levels"][0]["inputs"].length);

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

// Generate agents on road
const generateCars = (N) => {
    let cars = [];

    // Initialize all the agents
    for (let i = 1; i <= N; i++) {
        cars.push(new Car(road.getLaneCenter(2), 0, 30, 50, "AI", "", 3, "green", sensorCount, hiddenLayerCount));
    }

    return cars;
};

/**
 * Resets the canvas, for a next round of training
 * @param {boolean} saveBest Flag whether to save the best agent for the current session
 */
const resetTraining = (saveBest) => {
    if (saveBest)
        saveBrain();

    running = true;
    startEnv();
};

/**
 * Shows popup when all agents have stopped
 */
const showPopup = () => {
    // running = false;
    popup.style.display = "block";
    setTimeout(function () {
        popup.style.opacity = 1;
    }, 100);
};

function startEnv() {
    let urlParams = new URLSearchParams(window.location.search);
    laneCount = parseInt(urlParams.get("laneCount"));
    agentCount = parseInt(urlParams.get("agentCount"));
    sensorSpread = parseInt(urlParams.get("sensorSpread"));
    sensorLength = parseInt(urlParams.get("sensorLength"));
    sensorCount = parseInt(urlParams.get("sensorCount"));
    hiddenLayerCount = parseInt(urlParams.get("hiddenLayerCount"));
    boolDQN = urlParams.get("dqnOn");

    if (boolDQN === "true")
        isUsingDQN = true;
    else
        isUsingDQN = false;

    if (!agentCount)
        agentCount = 10;

    if (!laneCount || laneCount < 3 || laneCount > 9)
        laneCount = 4;

    if (!sensorSpread)
        sensorSpread = 90;

    if (!sensorLength)
        sensorLength = 150;

    if (!sensorCount)
        sensorCount = 5;

    if (!hiddenLayerCount)
        hiddenLayerCount = 6;

    initGlobals(laneCount);
    resetCanvas(agentCount, false, laneCount);
    trafficInit();
}

function trafficNPCController() {
    // Compare best car with last NPC car
    let lastNPC = traffic[traffic.length - 1];
    let distDiff = bestCar.y - lastNPC.y;

    // If the distance is close enough, generate a new NPC car
    if (distDiff <= road.yDistThreshold) {
        let l1 = road.getRandomLaneCenter();
        let l2 = road.getRandomLaneCenter();

        while (l2 == l1) {
            l2 = road.getRandomLaneCenter();
        }

        traffic.push(new Car(l1, lastNPC.y - 200, 30, 50, "NPC", "", 2, getRandomColor()));
        traffic.push(new Car(l2, lastNPC.y - 200, 30, 50, "NPC", "", 2, getRandomColor()));

        // Remove first 2 to reduce traffic processing
        traffic.slice(2);
    }
}

function envUpdate(time, isSinglePlayer) {
    if (isAwaitingDQNRes) {
        if (isUsingDQN) {
            isAwaitingDQNRes = false;
        }

        for (let i = 0; i < traffic.length; i++) {
            traffic[i].update(road.borders, [], []);
        }
        for (let i = 0; i < agentTraffic.length; i++) {
            agentTraffic[i].update(road.borders, [], []);
        }
        for (let i = 0; i < agentArr.length; i++) {
            agentArr[i].update(road.borders, traffic, agentTraffic);
        }

        prevBestCar = bestCar;
        bestCar = getBestAgent();

        let sensorOffset = [];
        for (singleSensor of bestCar.sensor.readings) {
            if (singleSensor)
                sensorOffset.push(singleSensor["offset"].toFixed(2));
            else
                sensorOffset.push(0);
        }
        
        // Car Angle Normalization
        let carAngle;
        if (bestCar.angle % (2 * Math.PI) > Math.PI) {
            carAngle = (bestCar.angle % (2 * Math.PI)) - (2 * Math.PI);
        } else if (bestCar.angle % (2 * Math.PI) < -Math.PI) {
            carAngle = (bestCar.angle % (2 * Math.PI)) + (2 * Math.PI);
        } else {
            carAngle = (bestCar.angle % (2 * Math.PI));
        }

        // Reward Calculator
        if (isUsingDQN) {
            let reward;
            if (!bestCar.realTimeCollision) {
                let carAngleReward = ((Math.PI - Math.abs(carAngle)) / Math.PI) - 0.5; 
                let carSpeed = bestCar.speed / 6.0;
                reward = carAngleReward + carSpeed;
            } else {
                reward = -1;
            }

            // State to send
            stringState = String(reward.toFixed(2)) + "," +
                String((bestCar.speed / 2.95).toFixed(2)) + "," + 
                String(carAngle.toFixed(2)) + "," +
                String(sensorOffset);
            carStateReward(stringState);
        }

        // if all cars have stopped
        let stopCond = agentArr.every((agent) => agent.damaged);
        if (stopCond) {
            showPopup();
        }

        roadCanvas.height = window.innerHeight;
        NNCanvas.height = window.innerHeight;

        roadCtx.save();

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

        // Draw all the agents that are not best to be lower in alpha value
        roadCtx.globalAlpha = 0.2;
        for (let i = 0; i < agentArr.length; i++) {
            agentArr[i].draw(roadCtx);
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
}
