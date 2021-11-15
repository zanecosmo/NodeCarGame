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

const defaultNames = [
    "Player1",
    "Player2",
    "Player3",
    "Player4",
];

const createPlayer = (game, socketId, hostStatus) => {
    const position = currentGames[game.id].players.length;
    const player = {
        id: socketId,
        position: position,
        isHost: hostStatus,
        name: defaultNames[position],
        html: ""
    };
    currentGames[game.id].players.push(player);
    return player;
};

const removePlayer = (playerId, gameId) => {
    console.log(gameId);
    const players = currentGames[gameId].players;
    for (let i = 0; i < players.length; i++) {
        if (players[i].id === playerId) {
            players.splice(i, 1);
        };
    };
};

const removeGameIfEmpty = (gameId) => {
    if (currentGames[gameId].players.length === 0) {
        delete currentGames[gameId];
    };
};

const fixPlayerPositions = (gameId) => {
    const players = currentGames[gameId].players;
    for (let i = 0; i < players.length; i++) {
        players[i].position = i;
        fixPlayerName(players[i], i);
        
    };
};

const fixPlayerName = (player, index) => {
    for (let i = 0; i < defaultNames.length; i++) {
        if (defaultNames[i] === player.name) {
            player.name = defaultNames[index];
        };
    };
};

const app = express();

app.use(morgan("dev"));
app.use("/", express.static(`${__dirname}/public`));

const server = http.createServer(app);
const io = socketIO(server);

let socketConnections = [];

const removeSocket = (socketId) => {
    for (let i = 0; i < socketConnections.length; i++) {
        if (socketId === socketConnections[i]) {
            socketConnections.splice(i, 1);
        };
    };
};

io.on("connection", (socket) => {
    console.log(`PLAYER HAS JOINED. PLAYER ID: ${socket.id}`);
    socketConnections.push(socket.id);
    console.log(socketConnections);

    socket.on("start-game", () => {
        const game = createGame();
        const player = createPlayer(game, socket.id, true);
        
        socket.join(game.id);
        io.to(player.id).emit("game-started", game, player);
    });
    
    socket.on("join-request", (proposedId) => {
            console.log(`PROPOSED ID: ${proposedId}`);
            console.log(socketConnections);

            let foundMatch = false;
            for (const gameIdKey in currentGames) {
                if (gameIdKey === proposedId) {
                    foundMatch = true;
                    if (currentGames[gameIdKey].players.length === 4) {
                        console.log("PLAYER TRIED TO JOIN BUT LOBBY WAS FULL")
                        io.to(socket.id).emit("lobby-full");
                        socket.disconnect();
                        removeSocket(socket.id);
                    } else {
                        socket.join(gameIdKey);

                        const player = createPlayer(currentGames[gameIdKey], socket.id, false);
                        console.log(`NEW PLAYER ACCEPTED. PLAYER ID: ${player.id}`);
                    
                        io.to(player.id).emit("join-accepted", currentGames[gameIdKey], player)
                        socket.to(gameIdKey).emit("new-player", player);
                        break;
                    };
                };
            };
                
            if (foundMatch === false) {
                io.to(socket.id).emit("invalid-code");
                socket.disconnect();
                removeSocket(socket.id);
            };
                
    });

    socket.on("leave-game", (gameId, leavingPlayer) => {
        socket.leave(gameId);
        socket.disconnect();
        
        console.log(`PLAYER HAS LEFT. PLAYER ID: ${leavingPlayer.id}`)
        removeSocket(socket.id);
        removePlayer(leavingPlayer.id, gameId);
        removeGameIfEmpty(gameId);

        if (currentGames[gameId]) {
            const newHost = currentGames[gameId].players[0];
            newHost.isHost = true;
            
            fixPlayerPositions(gameId);
            io.to(gameId).emit("player-left", currentGames[gameId].players, newHost);
        };
    });

    socket.on("name-change-submit", (newName, playerId, gameId) => {
        const players = currentGames[gameId].players;
        for (let i = 0; i < players.length; i++) {
            if (players[i].id === playerId) {
                console.log(`1. PLAYER ID IS ${playerId} AND THEIR NAME IS ${players[i].name}`);
                players[i].name = newName;
                console.log(`2. PLAYER ID IS ${playerId} AND THEIR NAME IS ${players[i].name}`);
                break;
            };
        };
        io.to(gameId).emit("name-change-incoming", newName, playerId);
    });

    socket.on("keydownTrue", (key) => {
        for (let i = 0; i < keyVerb.length; i++) {
            if (key === keyVerb[i].button) {
                keyVerb[i].bool = true;
            };
        };
    });
});

server.listen(4000, () => {
    console.log("LISTENING on PORT 4000");
});

