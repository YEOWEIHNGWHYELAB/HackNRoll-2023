let roomID;
let laneCount;
let sensorSpread;
let sensorLength;
let sensorCount;
let hiddenLayerCount;


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
    envUpdate();
    drawEnv(time, false);

    data = {
        x: bestCar.x,
        y: bestCar.y,
        a: bestCar.angle,
    };

    emitAgentData(getCookie("username"), data);
    requestAnimationFrame(animate);
};

window.onload = () => {
    let urlParams = new URLSearchParams(window.location.search);
    username = getCookie("username");
    roomID = urlParams.get("roomID");
    sensorSpread = urlParams.get("sensorSpread");
    sensorLength = urlParams.get("sensorLength");
    laneCount = urlParams.get("laneCount");

    if (laneCount < 3 || laneCount > 9)
        laneCount = 4;

    if (!sensorSpread)
        sensorSpread = 90;
    
    if (!sensorLength) 
        sensorLength = 150;

    initChatDOM();
    joinRoom(roomID, username, laneCount);
    requestLaneSync(roomID);
    initGlobals(laneCount);
    resetCanvas(laneCount);
};
