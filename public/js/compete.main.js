let roomID;

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(";");

    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];

        while (c.charAt(0) == " ") {
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
    envUpdate(time, false);

    data = {
        "x": bestCar.x,
        "y": bestCar.y,
        "a": bestCar.angle,
    };

    emitAgentData(getCookie("username"), data);
    requestAnimationFrame(animate);
};

window.onload = () => {
    let urlParams = new URLSearchParams(window.location.search);
    roomID = urlParams.get("roomID");

    joinRoom(roomID, getCookie("username"));
    emitNew(getCookie("username"));
    initGlobals();
    resetCanvas(1);
    animate();
};
