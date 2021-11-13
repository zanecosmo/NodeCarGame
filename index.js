const express = require("express");
const http = require("http");
const socketIO = require("socket.io")
const morgan = require("morgan");

let currentGames = {};

const randomId = () => {
    let gameId = "";
    for (let i = 0; i < 5; i++) {gameId += Math.floor(Math.random()*10)};
    return gameId;
}

const createGame = () => {
    gameId = randomId();
    currentGames[gameId] = {
        id: gameId,
        players: []
    };
    return currentGames[gameId];
};

const createPlayer = (game, socketId, hostStatus) => {
    const position = currentGames[game.id].players.length;
    const player = {
        id: socketId,
        position: position,
        isHost: hostStatus,
        name: `Player${position + 1}`,
        html: ""
    };
    currentGames[game.id].players.push(player);
    return player;
};

const removePlayer = (playerId, gameId) => {
    for (let i = 0; i < currentGames[gameId].players.length; i++) {
        if (currentGames[gameId].players[i].id === playerId) {
            currentGames[gameId].players.splice(i, 1);
        };
    };
};

const removeGameIfEmpty = (gameId) => {
    if (currentGames[gameId].players.length === 0) {
        delete currentGames[gameId];
    }
};

const app = express();

app.use(morgan("dev"));
app.use("/", express.static(`${__dirname}/public`));

const server = http.createServer(app);
const io = socketIO(server);

io.on("connection", (socket) => {
    console.log(`PLAYER HAS JOINED. PLAYER ID: ${socket.id}`);

    socket.on("start-game", () => {
        const game = createGame();
        const player = createPlayer(game, socket.id, true);
        
        socket.join(game.id);
        io.to(player.id).emit("game-started", game, player);
        console.log(currentGames);
    });
    
    socket.on("join-request", (proposedId) => {
            console.log(`PROPOSED ID: ${proposedId}`);
            let foundMatch = false;
            for (const gameIdKey in currentGames) { // fix this up XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
                
                if (foundMatch === false) {
                    
                    if (gameIdKey === proposedId) {
                        foundMatch = true;
                        socket.join(gameIdKey);
                        const player = createPlayer(currentGames[gameIdKey], socket.id, false);
                        
                        console.log("FINDING 2 MATCHES?");
                        io.to(player.id).emit("join-accepted", currentGames[gameIdKey], player)
                        socket.to(gameIdKey).emit("new-player", player);
                    };
                } else {
                    io.to(socket.id).emit("invalid-code");
                    socket.disconnect();
                    break;
                };
                
            };
    });

    socket.on("leave-game", (gameId, player) => {
        socket.leave(gameId);
        socket.disconnect();
        removePlayer(player.id, gameId);
        removeGameIfEmpty(gameId);
        if (currentGames[gameId]) {
            // choose new host
            io.to(gameId).emit("player-left", player.id);
        };
        
    });
});

server.listen(4000, () => {
    console.log("LISTENING on PORT 4000");
});

