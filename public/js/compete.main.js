let x;
let y;
let a;

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');

    for(let i = 0; i <ca.length; i++) {
        let c = ca[i];

        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }

        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }

    return "";
}

/**
 * Updates NPC & agents and redraws the canvas
 * @param {number} time 
 */
const animate = (time) => {
    // Update traffic NPC and agents
    envUpdate(time);

    data = {};

    if (x != bestCar.x) {
        x = bestCar.x;
        data["x"] = x;
    }

    if (y != bestCar.y) {
        y = bestCar.y;
        data["y"] = y;
    }

    if (a != bestCar.angle) {
        a = bestCar.angle;
        data["a"] = a;
    }
    
    emitAgentData(getCookie("username"), data);
    
    if (running)
        requestAnimationFrame(animate);
};

window.onload = () => {
    emitNew(getCookie("username"));
    initGlobals();
    resetCanvas(1);
    animate();
};
