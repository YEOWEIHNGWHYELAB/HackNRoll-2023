/**
 * Updates NPC & agents and redraws the canvas
 * @param {number} time 
 */
const animate = (time) => {
    // Update traffic NPC and agents
    envUpdate(time);

    if (running)
        requestAnimationFrame(animate);
};

window.onload = () => {
    initGlobals();
    resetCanvas();
    animate();
};
