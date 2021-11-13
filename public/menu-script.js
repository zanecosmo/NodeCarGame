const start = () => {

    // UTILITY FUNCTIONS
    const id = id => document.getElementById(id);
    const hide = element => element.style = "display: none";
    const show = element => element.style = "display: inline-block";
    const click = (element, callback) => element.addEventListener('click', () => callback());
    const renderShell = (shell) => id('shell').innerHTML = shell;    
    const renderPartial = (page) => id('partial').innerHTML = page;
    
    let isHost = false;
    let playerID = null;

    const renderDefaultPartial = () => {            
        renderPartial(
            `
            <div id="startGameButton" class="menuButton">Start Game</div>
            <div id="joinGameButton" class="menuButton">Join Game</div>
            `
        );

        let playerHTML = [];
        let gameCode = "";
        
        const updatePlayerHTML = (game) => {
            playerHTML.push(
                `
                <div>
                    <span>${playerHTML.length+1}. ${game[playerHTML.length].name}</span>                        
                    ${game[playerHTML.length].isHost === true ? "<span id='host'>HOST</span>" : ""}
                    <span id='changeNameButton' class='changeName'>change name</span>
                    <span id="changeNameForm">
                        <input id="changeNameBox" class="input" type="text" placeholder="ENTER NAME" />
                        <span id="changeButton" class="changeName">CHANGE</span>
                    </span>                        
                </div>
                `
            );
        }

        const loadLobby = (socket) => {
            renderPartial(
                `
                <div id="displayGameCode"> GAME-CODE: <span class="gameCode">${gameCode}</span></div>
                <br>
                
                <div class="text">PLAYERS
                    <div id="maxPlayers" class="redLetter">--max number of players reached--</div>
                </div>

                <div class="playersContainer">
                ${playerHTML[0] ? playerHTML[0] : ""}
                ${playerHTML[1] ? playerHTML[1] : ""}
                ${playerHTML[2] ? playerHTML[2] : ""}
                ${playerHTML[3] ? playerHTML[3] : ""}
                </div>                
                        
                ${isHost === true 
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
                socket.emit("leave", gameCode);
                socket.disconnect();
                isHost = false;
                gameCode = "";
                playerID = null;
                renderDefaultPartial();
            });
        }

        click(id('startGameButton'), () => {
            isHost = true;
            gameID = "";
            for (let i = 0; i < 5; i++) {gameID += Math.floor(Math.random()*10)};

            const socket = io();
            socket.emit("join", gameID, isHost);
            if (playerID === null) {
                socket.on("join-return", (game, gameID, id) => {
                    gameCode = gameID;
                    playerID = id;
                    updatePlayerHTML(game);
                    loadLobby(socket);
                    console.log(gameCode);
                });
            };
        });

        // JOIN ATTEMPT + INVALID LOOP
        let tries = 0;        

        const loadJoinPage = (channel) => {                      
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
            
            if (tries > 1) show(id('invalidCode'));
            
            click(id('joinLobbyButton'), () => {
                console.log("2. join lobby PRESSED");
                if (id('codeBox').value === '') {
                    tries++;
                    loadJoinPage();                                    
                } else {
                    channel.push("find_match", {game_code: id("codeBox").value});
                    console.log("3. find_match PUSHED ==>");
                };
            });
            
            if (playerIndex === null) {
                channel.on("accepted", (sent) => {
                    console.log("6. accepted RECEIVED");
                    gameCode = sent.game_code;
                    playerIndex = sent.player_index
                    loadLobby(channel);
                    channel.push("fully_joined", {none: null});
                    console.log("7. fully_joined PUSHED ==>")
                    channel.off("accepted");
                })
            };
            
            click(id('backButton'), renderDefaultPartial);
        };
                        
        click(id('joinGameButton'), () => {
            console.log("1. Public Lobby JOINED");
            const publicSocket = new Socket("/public_socket", {params: {token: window.userToken}});
            const publicLobby = publicSocket.channel(`public:lobby`, {});
            publicSocket.connect();
            publicLobby.join();
            loadJoinPage(publicLobby);
        });
    };
        
    // DEFINES + RENDERS shell
    renderShell(
        `
        <div class="title">MULTI-CAR</div>
        `
    );
    
    //RENDERS DEFAULT PARTIAL
    renderDefaultPartial();
};

// RUNS JAVASCIPT SINGLE PAGE APPLICATION
start();