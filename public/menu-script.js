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
                    console.log("WE HAVE RECEIVED WORD THAT THERE IS A NEW PLAYER");
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
                socket.on("player-left", (playerId) => {
                    for (let i = 0; i < joinedGame.players.length; i++) {
                        if (joinedGame.players[i].id === playerId) {
                            joinedGame.players.splice(i, 1);
                            updatePlayerHTML();
                            loadLobby(socket);
                            break;
                        };
                    };
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
            console.log('LOBBY LOADING TWICE?');

            const loadPlayerHTML = () => {
                let playerHTML = "";
                for (let i = 0; i < joinedGame.players.length; i++) {
                    playerHTML += joinedGame.players[i].html
                }
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
                hide(id('changeNameButton'))
            });

            click(id('changeButton'), () => {
                show(id('changeNameButton'));
                hide(id('changeNameForm'));
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
            // socket.on("name-change", () => {

            // });
            
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

                    socket.on("join-accepted", (game, player) => {
                        console.log(player.id);
                        joinedGame = game;
                        self = player;
                        updatePlayerHTML();
                        loadLobby(socket);
                        socketListeners.newPlayer(socket);
                        socketListeners.playerLeft(socket);
                    });
                    
                    socket.on("invalid-code", () => {
                        tries++;
                        loadJoinPage();
                    });

                    socket.emit("join-request", id("codeBox").value);
                };


            });
            
            click(id('backButton'), () => {
                socket.disconnect();
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