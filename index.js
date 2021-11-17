const express = require("express");
const http = require("http");
const socketIO = require("socket.io")
const morgan = require("morgan");
const socketConnections = require("./storage/socket-connections.js");
const SIOL = require("./socket-IO-listeners.js");

const app = express();

app.use(morgan("dev"));
app.use("/", express.static(`${__dirname}/public`));

const server = http.createServer(app);
const io = socketIO(server);
const socketIOListeners = SIOL(io);

io.on("connection", (socket) => {
    console.log(`PLAYER HAS JOINED. PLAYER ID: ${socket.id}`);
    socketConnections.push(socket.id);

    for (const listener in socketIOListeners) {
        socketIOListeners[listener](socket);
    };
});

const port = 4000
server.listen(port, () => {
    console.log(`LISTENING on PORT ${port}`);
});