# Multi-Car (Proof of Concept)
A game where up to four players are all controlling the same vehicle. A fun little social game where you and your friends have to communicate and figure out as you go how to control the car amongst yourselves.

The purpose of the project for me was to become comfortable with fundamental web-development ideas, namely:
* Single-Page Application Programming
* Real-time Websocket Communication
* Organization and File Structure
* Adapting ideas and code from one language into another cleanly

## How it Works
In your browser, go to [multi-car.herokuapp.com](https://multi-car.herokuapp.com/). From there you can either start a game (by pressing the START button), and receive a five-digit Game-Code to give to your friends, or if your friend has already started a a game, you can join a game (by pressing the JOIN button) and you type in the Game-Code your friend gives you.

You can change your name to whatever you like, and once you all decide you are ready, the HOST (whoever started the game) can press the PLAY button.

As of yet, the only thing you can do is figure out who has what controls (some combination of the "W", "A", "S", and "D" keys), and move the car around the screen. There are no levels, but if there is interest in the game, further development could ensue.

#### Possible Features:
* timed run
* races with two or more cars (with extended lobbies and teams)
* collision system to enable obstacles
* capture the flag
* red-light green-light
* other game modes

## About
The project uses a pure Javascript/CSS/HTML front-end, and an Express/Node.js back-end. For websocket communication it employs the [Socket.io](https://socket.io/) library.
