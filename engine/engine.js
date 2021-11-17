const config = require("./engine-config.js");
const currentGames = require("../storage/current-games.js");

module.exports = (io, gameId) => {
    console.log ("ENGINE STARTED");
    let X;
    let Y;
    let playerPosition = [0,0];
    let playerRotation = 0; 
    let currentSpeed = 0;
    const game = currentGames[gameId];

    const findCoordinates = (degrees) => {
        let radians = degrees*(Math.PI/180)
        X = currentSpeed*Math.cos(radians);
        Y = currentSpeed*Math.sin(radians);                
    };

    const accelerate = (mod) => {
        if (game.input[0].tween === true || game.input[1].tween === true) {
            game.input[0].tween = false;
            game.input[1].tween = false;
        };
        playerPosition[0] += mod*X; 
        playerPosition[1] += mod*Y; 
        if (currentSpeed < config.topSpeed) {
            currentSpeed++
        };
    };

    const deccelerate = (mod) => {
        playerPosition[0] += mod*X; 
        playerPosition[1] += mod*Y; 
        if (currentSpeed > 0) {
            currentSpeed--
        } else {
            game.input[0].tween = false;
            game.input[1].tween = false;
        };
    };

    const steerLeft = () => {
        if (game.input[0].bool === true || game.input[0].tween === true) {
            playerRotation += config.turnRadius
        } else if (game.input[1].bool === true || game.input[1].tween === true) {
            playerRotation -= config.turnRadius
        };
    };

    const steerRight = () => {
        if (game.input[0].bool === true || game.input[0].tween === true) {
            playerRotation -= config.turnRadius
        } else if (game.input[1].bool === true || game.input[1].tween === true) {
            playerRotation += config.turnRadius
        };
    };

    const steerEnd = (mod) => game.input[mod].tween = false;

    game.input = [
        {button: "w", tween: false, bool: false, otherAction: deccelerate, action: accelerate, modifier: -1},
        {button: "s", tween: false, bool: false, otherAction: deccelerate, action: accelerate, modifier: 1},
        {button: "a", tween: false, bool: false, otherAction: steerEnd, action: steerLeft, modifier: 2},      
        {button: "d", tween: false, bool: false, otherAction: steerEnd, action: steerRight, modifier: 3}
    ];

    const updateCar = () => {
        findCoordinates(playerRotation);

        for (let i = 0; i < game.input.length; i++) {
            if (game.input[i].bool === true) {                        
                game.input[i].action(game.input[i].modifier)                                                                               
            } else if (game.input[i].tween === true) {
                game.input[i].otherAction(game.input[i].modifier)
            };
        }; 

        let positionPacket = [
        playerPosition[0],
        playerPosition[1],
        playerRotation
        ];
        console.log(positionPacket);
        io.to(gameId).emit("position-update", positionPacket);
    };

    offKey = setInterval(updateCar, 20);

    game.offKey = offKey;
};