const start = () => {

    const id = id => document.getElementById(id);
    const hide = element => element.style = "display: none";
    const show = element => element.style = "display: inline-block";
    const click = (element, callback) => element.addEventListener('click', () => callback());
    const renderShell = (shell) => id('shell').innerHTML = shell;    
    const renderPartial = (page) => id('partial').innerHTML = page;
    
    let self = null;
    let joinedGame = null;

    const renderDefaultPartial = () => { 
        
        const socketListeners = {
            newPlayer: (socket) => {
                socket.on("new-player", (playerObject) => {
                    console.log(joinedGame.players);
                    joinedGame.players.push(playerObject);
                    console.log(joinedGame.players);
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
                    console.log("MADE IT THIS FAR");
                    console.log(joinedGame.players);
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
                });
            },
            invalidCode : (socket) => {
                socket.on("invalid-code", () => {
                    tries++;
                    loadJoinPage();
                });
            },
            nameChangeIncoming: (socket) => {
                socket.on("name-change-incoming", (newName, playerId) => {
                    for (let i = 0; i < joinedGame.players.length; i++) {
                        if (joinedGame.players[i].id === playerId) {
                            console.log(joinedGame.players);
                            console.log(`MY ID IS ${self.id}`);
                            // console.log(`INCOMING ID: ${playerId} player[i].id: ${joinedGame.players[i].id}`);
                            joinedGame.players[i].name = newName;
                            // console.log(`NEW NAME: ${joinedGame.players[i].name}`);
                            break;
                        };
                    };

                    if (self.id === playerId) {self.name = newName};

                    console.log(joinedGame.players);

                    updatePlayerHTML();
                    loadLobby(socket);
                    console.log(joinedGame.players);
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
                renderShell(
                    `
                    <div></div>
                    `
                );
                
                renderPartial(
                    `
                    <div id="square"><img id="car" src="blackCar.jpg"></div>
                    `
                );
                startRender();
            })};

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
            
            socket.emit("start-game"); 
        });

        // JOIN ATTEMPT + INVALID LOOP
        let tries = 0;        

        const loadJoinPage = () => {                      
            renderPartial(
                `
                <div class="text">ENTER GAME CODE:</div>
                
                <input id="codeBox" type="text" class="input" placeholder="ENTER CODE HERE"/>
                <div id="invalidCode" class="redLetter">--invalid game-code, please try again${
                    tries === 1
                        ? ''
                        : ` (${tries.toString()})`
                }--</div>                
                
                <div id="joinLobbyButton" class="menuButton">Join</div>                
                <div id="backButton" class="menuButton">Back</div>
                `
            );
            
            if (tries > 0) show(id('invalidCode'));
            
            click(id('joinLobbyButton'), () => {
                if (id('codeBox').value === '') {
                    tries++;
                    loadJoinPage();                                    
                } else {
                    const socket = io();

                    socketListeners.joinAccepted(socket);
                    socketListeners.invalidCode(socket);
                    socketListeners.nameChangeIncoming(socket);

                    socket.emit("join-request", id("codeBox").value);
                };


            });
            
            click(id('backButton'), () => {
                socket.disconnect(); /////////////////////////////////////////////
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