/**
 * Updates NPC & agents and redraws the canvas
 * @param {number} time 
 */
const animate = (time) => {
    // Update traffic NPC and agents
    envUpdate(time, true);

    if (running)
        requestAnimationFrame(animate);
};

function trafficInit() {
    traffic.push(new Car(road.getLaneCenter(1), -100, 30, 50, "NPC", "", 2, getRandomColor()));
    traffic.push(new Car(road.getLaneCenter(3), -100, 30, 50, "NPC", "", 2, getRandomColor()));
    traffic.push(new Car(road.getLaneCenter(0), -300, 30, 50, "NPC", "", 2, getRandomColor()));
    traffic.push(new Car(road.getLaneCenter(1), -300, 30, 50, "NPC", "", 2, getRandomColor()));
    traffic.push(new Car(road.getLaneCenter(2), -300, 30, 50, "NPC", "", 2, getRandomColor()));
    traffic.push(new Car(road.getLaneCenter(3), -500, 30, 50, "NPC", "", 2, getRandomColor()));
}

window.onload = () => {
    initGlobals();
    resetCanvas(100);
    trafficInit();
    animate();
};
