const start = () => {

    const id = id => document.getElementById(id);
    const hide = element => element.style = "display: none";
    const show = element => element.style = "display: inline-block";
    const click = (element, callback) => element.addEventListener('click', () => callback());
    const renderShell = (shell) => id('shell').innerHTML = shell;    
    const renderPartial = (page) => id('partial').innerHTML = page;
    
    let self = null;
    let joinedGame = null;
    let controlKeys = ["w", "s", "a", "d"];

    const startGameInstance = (socket) => {
        renderShell(
            `
            <div></div>
            `
        );
        
        renderPartial(
            `
            <img id="square" src="white-car.jpg" />
            `
        );

        document.addEventListener("keydown", (e) => {
            for (let i = 0; i < controlKeys.length; i++) {
                if (e.key === controlKeys[i]) {
                    socket.emit("key-down", controlKeys[i], joinedGame.id);
                };
            };
        });

        document.addEventListener("keyup", (e) => {
            for (let i = 0; i < controlKeys.length; i++) {
                if (e.key === controlKeys[i]) {
                    socket.emit("key-up", controlKeys[i], joinedGame.id);
                };
            };
        });
    
        const playerObject = id("square");

        socket.on("position-update", (updatePacket) => {
            console.log(playerObject);
            console.log(updatePacket);
            playerObject.style.transform = `rotateZ(${updatePacket[2]*(-1)}deg)`;
            playerObject.style.left = `${updatePacket[1]}px`;
            playerObject.style.top = `${updatePacket[0]}px`;
        });
    };

    const renderDefaultPartial = () => { 
        
        const socketListeners = {
            newPlayer: (socket) => {
                socket.on("new-player", (playerObject) => {
                    joinedGame.players.push(playerObject);
                    updatePlayerHTML();
                    loadLobby(socket);
                });
            },
            gameStarted: (socket) => {
                socket.on("game-started", (game, player) => {
                    self = player;
                    joinedGame = game;
                    updatePlayerHTML();
                    loadLobby(socket);
                });
            },
            playerLeft: (socket) => {
                socket.on("player-left", (playerArray, newHost) => {
                    joinedGame.players = playerArray;
                    
                    if (newHost.id === self.id) {self.isHost = true};
                    
                    updatePlayerHTML();
                    loadLobby(socket);
                });
            },
            joinAccepted: (socket) => {
                socket.on("join-accepted", (game, player) => {
                    joinedGame = game;
                    self = player;
                    updatePlayerHTML();
                    loadLobby(socket);
                    
                    socketListeners.newPlayer(socket);
                    socketListeners.playerLeft(socket);
                    socketListeners.nameChangeIncoming(socket);
                    socketListeners.gameStarting(socket);
                });
            },
            invalidCode : (socket) => {
                // console.log(tries);
                socket.on("invalid-code", () => {
                    tries++;
                    loadJoinPage();
                });
            },
            lobbyFull: (socket) => {
                socket.on("lobby-full", () => {
                    triedButFull++;
                    loadJoinPage();
                });
            },
            nameChangeIncoming: (socket) => {
                socket.on("name-change-incoming", (newName, playerId) => {
                    for (let i = 0; i < joinedGame.players.length; i++) {
                        if (joinedGame.players[i].id === playerId) {
                            joinedGame.players[i].name = newName;
                            break;
                        };
                    };

                    if (self.id === playerId) {self.name = newName};

                    updatePlayerHTML();
                    loadLobby(socket);
                });
            },
            gameStarting: (socket) => {
                socket.on("game-starting", () => {
                    console.log("GAME STARTING");
                    startGameInstance(socket);
                });
            },
        };

        renderPartial(
            `
            <div id="startGameButton" class="menuButton">Start Game</div>
            <div id="joinGameButton" class="menuButton">Join Game</div>
            `
        );
        
        const updatePlayerHTML = () => {
            for (let i = 0; i < joinedGame.players.length; i++) {
                
                const player = joinedGame.players[i];
                
                const changeNameButtons = 
                `   <span id='changeNameButton' class='changeName'>change name</span>
                    <span id="changeNameForm">
                        <input id="changeNameBox" class="input" type="text" placeholder="ENTER NAME" />
                        <span id="changeButton" class="changeName">CHANGE</span>
                    </span>
                `;
                player.html = 
                `
                <div>
                    <span>${player.position + 1}. ${player.name}</span>                        
                    ${player.isHost === true ? "<span id='host'>HOST</span>" : ""}
                    ${self.id === player.id
                        ? changeNameButtons
                        : ""
                    }                         
                </div>
                `;
            };
        };

        const loadLobby = (socket) => {

            const loadPlayerHTML = () => {
                let playerHTML = "";
                for (let i = 0; i < joinedGame.players.length; i++) {
                    playerHTML += joinedGame.players[i].html
                };
                return playerHTML;
            };
            
            renderPartial(
                `
                <div id="displayGameCode"> GAME-CODE: <span class="gameCode">${joinedGame.id}</span></div>
                <br>
                
                <div class="text">PLAYERS
                    <div id="maxPlayers" class="redLetter">--max number of players reached--</div>
                </div>

                <div class="playersContainer">
                ${loadPlayerHTML()}
                </div>                
                        
                ${self.isHost === true 
                    ? "<div id='playGameButton' class='menuButton'>Play</div>" 
                    : "<div class='smallText'>Please wait for host to start the game</div>"
                }
                <div id="leaveGameButton" class="menuButton">Leave Game</div>
                `
            );         
            
            click(id('changeNameButton'), () => {
                show(id('changeNameForm'));
                hide(id('changeNameButton'));
            });

            click(id('changeButton'), () => {
                show(id('changeNameButton'));
                hide(id('changeNameForm'));
                
                const newName = id("changeNameBox").value;
                if (newName === "") {newName = "anonymous"};
                socket.emit("name-change-submit", newName, self.id, joinedGame.id);
            });

            if (id("playGameButton")) {
                click(id('playGameButton'), () => {
                    socket.emit("game-start-submit", joinedGame.id);
                }
            )};

            click(id('leaveGameButton'), () => {
                socket.emit("leave-game", joinedGame.id, self);
                self = null;
                joinedGame = null;
                renderDefaultPartial();
            });

        };
        
        click(id('startGameButton'), () => {
            const socket = io();
            
            socketListeners.newPlayer(socket);
            socketListeners.gameStarted(socket);
            socketListeners.playerLeft(socket);
            socketListeners.nameChangeIncoming(socket);
            socketListeners.gameStarting(socket);
            
            socket.emit("start-game"); 
        });

        // JOIN ATTEMPT + INVALID LOOP
        let tries = 0;
        let triedButFull = 0;

        const loadJoinPage = () => {                      
            renderPartial(
                `
                <div class="text">ENTER GAME CODE:</div>
                
                <input id="codeBox" type="text" class="input" placeholder="ENTER CODE HERE"/>
                <div id="invalidCode" class="redLetter">--invalid game-code, please try again${
                    tries < 2
                        ? ''
                        : ` (${tries.toString()})`
                }--</div>
                <div id="lobbyFull" class="redLetter">--cannot join, lobby is full${
                    triedButFull < 2
                    ? ''
                    : ` (${triedButFull.toString()})`
                }--</div>
                
                <div id="joinLobbyButton" class="menuButton">Join</div>                
                <div id="backButton" class="menuButton">Back</div>
                `
            );
            
            if (tries > 0) show(id('invalidCode'));
            if (triedButFull > 0) show(id('lobbyFull'));
            
            click(id('joinLobbyButton'), () => {
                // console.log("JOIN LOBBY PRESSED");
                if (id('codeBox').value === '') {
                    tries++;
                    loadJoinPage();                                    
                } else {
                    const socket = io();

                    socketListeners.joinAccepted(socket);
                    socketListeners.invalidCode(socket);
                    socketListeners.lobbyFull(socket);

                    socket.emit("join-request", id("codeBox").value);
                };
            });
            
            click(id('backButton'), () => {
                renderDefaultPartial();
            });
        };
                        
        click(id('joinGameButton'), () => {
            loadJoinPage();
        });
    };

    renderShell(
        `
        <div class="title">MULTI-CAR</div>
        `
    );
    
    renderDefaultPartial();
};

start();