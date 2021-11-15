const socketConnections = require("./storage/socket-connections.js");
const defaultNames = require("./storage/default-names.js");
const currentGames = require("./storage/current-games.js");

module.exports = {
    randomId: function() {
        let gameId = "";
        for (let i = 0; i < 5; i++) {gameId += Math.floor(Math.random()*10)};
        return gameId;
    },
    
    createGame: function() {
        const gameId = this.randomId();
        currentGames[gameId] = {
            id: gameId,
            players: []
        };
        return currentGames[gameId];
    },
    
    createPlayer: function(game, socketId, hostStatus) {
        console.log(currentGames[game.id].players.length);
        const position = currentGames[game.id].players.length;
        const player = {
            id: socketId,
            position: position,
            isHost: hostStatus,
            name: defaultNames[position],
            html: ""
        };
        console.log(currentGames[game.id].players);
        currentGames[game.id].players.push(player);
        return player;
    },
    
    removePlayer: function(playerId, gameId) {
        console.log(gameId);
        const players = currentGames[gameId].players;
        for (let i = 0; i < players.length; i++) {
            if (players[i].id === playerId) {
                players.splice(i, 1);
            };
        };
    },
    
    removeGameIfEmpty: function(gameId) {
        if (currentGames[gameId].players.length === 0) {
            delete currentGames[gameId];
        };
    },
    
    fixPlayerName: function(player, index) {
        for (let i = 0; i < defaultNames.length; i++) {
            if (defaultNames[i] === player.name) {
                player.name = defaultNames[index];
            };
        };
    },

    fixPlayerPositions: function(gameId) {
        const players = currentGames[gameId].players;
        for (let i = 0; i < players.length; i++) {
            players[i].position = i;
            this.fixPlayerName(players[i], i);
            
        };
    },
    
    removeSocket: function(socketId) {
        for (let i = 0; i < socketConnections.length; i++) {
            if (socketId === socketConnections[i]) {
                socketConnections.splice(i, 1);
            };
        };
    },
}