const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const port = 8083;

app.use(express.static("public"));

app.get("/", (req, res) => {
    res.sendFile("index.html");
});

app.get("/train", (req, res) => {
    res.sendFile(__dirname + "/public/train.html");
});

app.get("/compete", (req, res) => {
    res.sendFile(__dirname + "/public/compete.html");
});

io.on("connection", (socket) => {
    // handshake.headers[x-forwarded-for] for public IP if available
    // conn.remoteAddress for private IP
    let clientIP = socket.handshake.headers["x-forwarded-for"] || socket.conn.remoteAddress.split(":")[3];
    console.log(`User from ${clientIP} connected`);
});

http.listen(port, () => {
    console.log(`Server running at port ${port}`);
});