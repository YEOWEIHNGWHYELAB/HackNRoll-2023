function getParam() {
    let laneCount = document.querySelector("#txtLaneCount").value;
    let sensorLength = document.querySelector("#sensorLength").value;
    let sensorSpread = document.querySelector("#sensorSpread").value;
    let sensorCount = document.querySelector("#sensorCount").value;
    let hiddenLayerCount = document.querySelector("#hiddenLayerCount").value;
    return { laneCount, sensorLength, sensorSpread, sensorCount, hiddenLayerCount };
}

const redirCompete = () => {
    let roomID = document.querySelector("#txtRoomID").value;
    let { laneCount, sensorLength, sensorSpread, sensorCount, hiddenLayerCount } = getParam();
    window.location.href = `/compete?roomID=${roomID}&laneCount=${laneCount}&sensorLength=${sensorLength}&sensorSpread=${sensorSpread}`;
};

const redirTrain = () => {
    let agentCount = document.querySelector("#agentCount").value;
    let dqnOn = document.querySelector("#dqnOn").checked;
    let { laneCount, sensorLength, sensorSpread, sensorCount, hiddenLayerCount } = getParam();
    window.location.href = `/train?laneCount=${laneCount}&agentCount=${agentCount}&sensorLength=${sensorLength}&sensorSpread=${sensorSpread}&sensorCount=${sensorCount}&hiddenLayerCount=${hiddenLayerCount}&dqnOn=${dqnOn}`;
};

const register = () => {
    let username = document.querySelector("#txtUsername").value,
        password = document.querySelector("#txtPassword").value;

    const data = { "username": username, "password": password };

    fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    })
        .then((response) => response.json())
        .then((data) => {
            if ("errorMsg" in data) {
                alert(data["errorMsg"]);
            }

            if ("success" in data) {
                alert("Registered successfully!");
            }
        })
        .catch((error) => {
            console.error("Error:", error);
        });
};

const login = () => {
    let username = document.querySelector("#txtUsername").value,
        password = document.querySelector("#txtPassword").value;

    const data = { "username": username, "password": password };

    fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    })
        .then((response) => response.json())
        .then((data) => {
            if ("errorMsg" in data) {
                alert(data["errorMsg"]);
            }

            if ("success" in data) {
                alert("Logged in successfully!");
            }
        })
        .catch((error) => {
            console.error("Error:", error);
        });
};

fetch("/leaderboard", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(),
})
    .then((response) => response.json())
    .then((data) => {
        let leaderboardTable = document.querySelector("#leaderboardTable");

        for (entry of data) {
            var tr = document.createElement('tr');
            let td1 = document.createElement('td');
            let td2 = document.createElement('td');

            td1.innerHTML = entry["username"];
            td2.innerHTML  = entry["score_value"];
            tr.appendChild(td1);
            tr.appendChild(td2);

            leaderboardTable.appendChild(tr);
        }
    })
    .catch((error) => {
        console.error("Error:", error);
    });
