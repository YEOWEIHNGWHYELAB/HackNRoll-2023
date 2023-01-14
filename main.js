// Window for Training Environment
const roadCanvas = document.getElementById("roadCanvas");
roadCanvas.width = 200;

// Window for Neural Network Visualization
const neuralnetworkCanvas = document.getElementById("neuralnetworkCanvas");
neuralnetworkCanvas.width = 300;

const roadCtx = roadCanvas.getContext("2d");
const neuralnetworkCtx = neuralnetworkCanvas.getContext("2d");

const road = new Road(roadCanvas.width / 2, roadCanvas.width * 0.9, 3);

// Agent Generation
const num_agent = 1;
const agents_arr = generateCars(num_agent);
let bestCar = agents_arr[0];

// Check if there is already saved brain in local storage
if (localStorage.getItem("bestBrain")) {
  // Load brain into agents
  for (let i = 0; i < agents_arr.length; i++) {
    agents_arr[i].brain = JSON.parse(localStorage.getItem("bestBrain"));

    // Mutate all agent's brain except first one
    if (i != 0) {
      NeuralNetwork.mutate(agents_arr[i].brain, 0.1);
    }
  }
}

// Traffic NPCs
const traffic = [
  new Car(road.getLaneCenter(1), -100, 30, 50, "NPC", 2, getRandomColor()),
  new Car(road.getLaneCenter(0), -300, 30, 50, "NPC", 2, getRandomColor()),
  new Car(road.getLaneCenter(2), -300, 30, 50, "NPC", 2, getRandomColor()),
  new Car(road.getLaneCenter(0), -500, 30, 50, "NPC", 2, getRandomColor()),
  new Car(road.getLaneCenter(1), -500, 30, 50, "NPC", 2, getRandomColor()),
  new Car(road.getLaneCenter(1), -700, 30, 50, "NPC", 2, getRandomColor()),
  new Car(road.getLaneCenter(2), -700, 30, 50, "NPC", 2, getRandomColor()),
];

// Rules for defining best car
function get_best_agent() {
  bestCar = agents_arr.find((c) => c.y == Math.min(...agents_arr.map((c) => c.y)));
}

// Generate agents on road
function generateCars(N) {
  const cars = [];

  // Initialize all the agents
  for (let i = 1; i <= N; i++) {
    cars.push(new Car(road.getLaneCenter(1), 100, 30, 50, "AI"));
  }

  return cars;
}

function animate(time) {
  // Update traffic NPC and agents
  for (let i = 0; i < traffic.length; i++) {
    traffic[i].update(road.borders, []);
  }
  for (let i = 0; i < agents_arr.length; i++) {
    agents_arr[i].update(road.borders, traffic);
  }

  get_best_agent();

  roadCanvas.height = window.innerHeight;
  neuralnetworkCanvas.height = window.innerHeight;

  roadCtx.save();

  // Move camera based on best car
  roadCtx.translate(0, -bestCar.y + roadCanvas.height * 0.7);

  // Draw traffic NPCs
  road.draw(roadCtx);
  for (let i = 0; i < traffic.length; i++) {
    traffic[i].draw(roadCtx);
  }

  // Draw all the agents that are not best to be lower in alpha value
  roadCtx.globalAlpha = 0.2;
  for (let i = 0; i < agents_arr.length; i++) {
    agents_arr[i].draw(roadCtx);
  }

  // Only draw the sensor and the clearest on the best car
  roadCtx.globalAlpha = 1;
  bestCar.draw(roadCtx, true);

  roadCtx.restore();

  // Neural network visualizer
  neuralnetworkCtx.lineDashOffset = -time / 50; // Make the line dash of the neural network visualizer move
  Visualizer.drawNetwork(neuralnetworkCtx, bestCar.brain);
  
  requestAnimationFrame(animate);
}

animate();
