const express = require("express");
const http = require("http");
const socketIO = require("socket.io")
const morgan = require("morgan");

let currentGames = {};
let existingIDs = [];

const createGameInstance = (gameID) => {
    console.log("CREATE GAME CALLED");
    currentGames[gameID] = [];
    existingIDs.push(gameID);
    console.log(currentGames);
}

const addPlayer = (gameID, hostStatus, socketID) => {
    const game = currentGames[gameID];
    game.push({});
    game[game.length-1].id = socketID;
    game[game.length-1].isHost = hostStatus;
    game[game.length-1].name = `Player${game.length}`;
    return socketID;
};

const removePlayer = (playerID, gameID) => {
    console.log("REMOVE PLAYER CALLED");
    for (let i = 0; i < currentGames[gameID].length; i++) {
        console.log(currentGames[gameID][i]);
        if (currentGames[gameID][i].id === playerID) {
            currentGames[gameID].splice(i, 1);
        }
    }
}

const checkForEmpty = (gameID) => {
    if (currentGames[gameID].length === 0) {
        delete currentGames[gameID];
    }
}

const app = express();

app.use(morgan("dev"));
app.use("/", express.static(`${__dirname}/public`));

const server = http.createServer(app);
const io = socketIO(server);

io.on("connection", (socket) => {
    
    socket.on("join", (gameID, isHost) => {
        // console.log(`SOCKET ID: ${socket.id}`);
        if (isHost === true) {
            socket.join(gameID);
            createGameInstance(gameID);
            const playerID = addPlayer(gameID, isHost, socket.id);
            io.to(gameID).emit("join-return", currentGames[gameID], gameID, playerID);
        } else if (isHost === false) {
            for (let i = 0; i < existingIDs.length; i++) {
                if (existingIDs[i] === gameID) {
                    socket.join(gameID);
                    const playerID = addPlayer(gameID, isHost, socket.id);
                    io.to(gameID).emit("join-return", currentGames[gameID], gameID, playerID)
                };
            };
        };
    });

    socket.on("leave", (gameID) => {
        socket.leave(gameID);
        removePlayer(socket.id, gameID);
        checkForEmpty(gameID);
    });
});

server.listen(4000, () => {
    console.log("LISTENING on PORT 4000");
});

