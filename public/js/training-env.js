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

const initGlobals = () => {
    // Window for Training Environment
    roadCanvas = document.querySelector("#roadCanvas");
    roadCanvas.width = 300;

    // Window for Neural Network Visualization
    NNCanvas = document.querySelector("#NNCanvas");
    NNCanvas.width = 300;

    roadCtx = roadCanvas.getContext("2d");
    NNCtx = NNCanvas.getContext("2d");

    popup = document.querySelector("#divPopup");
    running = true;
};

const resetCanvas = (agentCount = 10) => {
    popup.style.display = "none";
    popup.style.opacity = 0;

    road = new Road(roadCanvas.width / 2, roadCanvas.width * 0.9, 4);

    // Agent Generation
    agentNum = agentCount;
    agentArr = generateCars(agentNum);
    bestCar = agentArr[0];

    // Check if there is already saved brain in local storage
    if (localStorage.getItem("bestBrain")) {
        // Load brain into agents
        for (let i = 0; i < agentArr.length; i++) {
            agentArr[i].brain = JSON.parse(localStorage.getItem("bestBrain"));

            // Mutate all agent's brain except first one
            if (i != 0) {
                NeuralNetwork.mutate(agentArr[i].brain, 0.1);
            }
        }
    }

    // Traffic NPCs
    traffic = [
        new Car(road.getLaneCenter(1), -100, 30, 50, "NPC", "", 2, getRandomColor()),
        new Car(road.getLaneCenter(3), -100, 30, 50, "NPC", "", 2, getRandomColor()),
        new Car(road.getLaneCenter(0), -300, 30, 50, "NPC", "", 2, getRandomColor()),
        new Car(road.getLaneCenter(1), -300, 30, 50, "NPC", "", 2, getRandomColor()),
        new Car(road.getLaneCenter(2), -300, 30, 50, "NPC", "", 2, getRandomColor()),
        new Car(road.getLaneCenter(3), -500, 30, 50, "NPC", "", 2, getRandomColor()),
    ];

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
        cars.push(new Car(road.getLaneCenter(2), 100, 30, 50, "MANUAL"));
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
    resetCanvas();
};

/**
 * Shows popup when all agents have stopped
 */
const showPopup = () => {
    running = false;
    popup.style.display = "block";
    setTimeout(function () {
        popup.style.opacity = 1;
    }, 100);
};

function envUpdate(time) {
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
        agentArr[i].draw(roadCtx, true);
    }

    // Only draw the sensor and the clearest on the best car
    roadCtx.globalAlpha = 1;
    bestCar.draw(roadCtx, true);

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

        traffic.push(new Car(l1, lastNPC.y - 200, 30, 50, "", "NPC", 2, getRandomColor()));
        traffic.push(new Car(l2, lastNPC.y - 200, 30, 50, "", "NPC", 2, getRandomColor()));

        // Remove first 2 to reduce traffic processing
        traffic.slice(2);
    }

    roadCtx.restore();

    // Neural network visualizer
    if (bestCar.brain) {
        NNCtx.lineDashOffset = -time / 50; // Make the line dash of the neural network visualizer move
        Visualizer.drawNetwork(NNCtx, bestCar.brain);
    }
}

