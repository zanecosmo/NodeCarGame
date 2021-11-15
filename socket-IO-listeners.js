const socketConnections = require("./storage/socket-connections.js");
const currentGames = require("./storage/current-games.js");
const util = require("./util.js");

module.exports = (io) => {
    return {
        disconnect: function(socket) {
            socket.on("disconnect", (reason) => {
                console.log(`PLAYER ${socket.id} IS TRYING TO DISCONNECT`);
                if (reason = "transport close") {
                    
                    for (const gameKeyId in currentGames) {
                        for (let i = 0; i < currentGames[gameKeyId].players.length; i++) {
                            if (currentGames[gameKeyId].players[i].id === socket.id) {
                                // console.log("----");
                                // console.log(currentGames);
                                // console.log("----");
                                util.removePlayer(socket.id, gameKeyId);
                                util.removeGameIfEmpty(gameKeyId);
                                // console.log(currentGames);

                                if (currentGames[gameKeyId]) {
                                    const newHost = currentGames[gameKeyId].players[0];
                                    newHost.isHost = true;
                                    
                                    util.fixPlayerPositions(gameKeyId);
                                    io.to(gameKeyId).emit("player-left", currentGames[gameKeyId].players, newHost);
                                };

                                break;
                            };
                        };
                    };

                    for (let i = 0; i < socketConnections.length; i++) {
                        if (socketConnections[i] === socket.id) {
                            util.removeSocket(socket.id);
                            break;
                        };
                    };
                };
            });
        },
        startGame: (socket) => {
            socket.on("start-game", () => {
                const game = util.createGame();
                const player = util.createPlayer(game, socket.id, true);
                
                socket.join(game.id);
                io.to(player.id).emit("game-started", game, player);
            });
        },
        joinRequest: (socket) => {
            socket.on("join-request", (proposedId) => {
                // console.log(`PROPOSED ID: ${proposedId}`);
                // console.log(socketConnections);
    
                let foundMatch = false;
                for (const gameIdKey in currentGames) {
                    if (gameIdKey === proposedId) {
                        foundMatch = true;
                        if (currentGames[gameIdKey].players.length === 4) {
                            // console.log("PLAYER TRIED TO JOIN BUT LOBBY WAS FULL");
                            io.to(socket.id).emit("lobby-full");
                            // console.log("PLAYER DISCONNECTED");
                            socket.disconnect(true);
                            util.removeSocket(socket.id);
                        } else {
                            socket.join(gameIdKey);
    
                            const player = util.createPlayer(currentGames[gameIdKey], socket.id, false);
                            // console.log(`NEW PLAYER ACCEPTED. PLAYER ID: ${player.id}`);
                        
                            io.to(player.id).emit("join-accepted", currentGames[gameIdKey], player)
                            socket.to(gameIdKey).emit("new-player", player);
                            break;
                        };
                    };
                };
                    
                if (foundMatch === false) {
                    io.to(socket.id).emit("invalid-code");
                    // console.log("PLAYER DISCONNECTED");
                    socket.disconnect(true);
                    util.removeSocket(socket.id);
                };         
            });
        },
        leaveGame: (socket) => {
            socket.on("leave-game", (gameId, leavingPlayer) => {
                socket.leave(gameId);
                // console.log("PLAYER DISCONNECTED");
                socket.disconnect(true);
                
                // console.log(`PLAYER HAS LEFT. PLAYER ID: ${leavingPlayer.id}`)
                util.removeSocket(socket.id);
                util.removePlayer(leavingPlayer.id, gameId);
                util.removeGameIfEmpty(gameId);
        
                if (currentGames[gameId]) {
                    const newHost = currentGames[gameId].players[0];
                    newHost.isHost = true;
                    
                    util.fixPlayerPositions(gameId);
                    io.to(gameId).emit("player-left", currentGames[gameId].players, newHost);
                };
            });
        },
        nameChangeSubmit: (socket) => {
            socket.on("name-change-submit", (newName, playerId, gameId) => {
                // console.log("WOO HOO THE METHOD VERSION WORKED");
                const players = currentGames[gameId].players;
                for (let i = 0; i < players.length; i++) {
                    if (players[i].id === playerId) {
                        // console.log(`1. PLAYER ID IS ${playerId} AND THEIR NAME IS ${players[i].name}`);
                        players[i].name = newName;
                        // console.log(`2. PLAYER ID IS ${playerId} AND THEIR NAME IS ${players[i].name}`);
                        break;
                    };
                };
                io.to(gameId).emit("name-change-incoming", newName, playerId);
            });
        }
    };
};