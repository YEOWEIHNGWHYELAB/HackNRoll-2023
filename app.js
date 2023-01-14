const socket = require("./socket");
require("dotenv").config();
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const http = require("http").Server(app);
const io = require("socket.io")(http);
const port = 8083;

const routes = require("./routes");

// initialise db
const db = require("./db");
db.initDB();

// built in middleware
app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());

// routes
app.use(routes.pages);
app.use(routes.user);

// Socket Handling
socket.socketHandling(io);

// Server Initialization
http.listen(port, () => {
    console.log(`Server running at port ${port}`);
});
