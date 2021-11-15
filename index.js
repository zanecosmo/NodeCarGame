const express = require("express");
const http = require("http");
const socketIO = require("socket.io")
const morgan = require("morgan");
const socketConnections = require("./storage/socket-connections.js");
const SIOL = require("./socket-listeners.js");


const app = express();

app.use(morgan("dev"));
app.use("/", express.static(`${__dirname}/public`));

const server = http.createServer(app);
const io = socketIO(server);
const socketIOListeners = SIOL(io);

io.on("connection", (socket) => {
    console.log(`PLAYER HAS JOINED. PLAYER ID: ${socket.id}`);
    socketConnections.push(socket.id);
    console.log(socketConnections);

    for (const listener in socketIOListeners) {
        socketIOListeners[listener](socket);
    };
});

server.listen(4000, () => {
    console.log("LISTENING on PORT 4000");
});

