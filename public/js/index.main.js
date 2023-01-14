const redirCompete = () => {
    let roomID = document.querySelector("#txtRoomID").value;
    window.location.href = `/compete?roomID=${roomID}`;
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