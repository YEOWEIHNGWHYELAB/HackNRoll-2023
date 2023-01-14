let socket;

window.onload = () => {
    socket = io();
    socket.on("connect", () => {
        console.log("Connected to Socket.io server!");
    });
};