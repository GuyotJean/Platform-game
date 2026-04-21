const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverScreen = document.getElementById('game-over');

const restartBtn = document.getElementById('restart-btn');

// --- UI Elements Setup ---
const mainMenu = document.getElementById('main-menu');
const gameUi = document.getElementById('game-ui');
const playBtn = document.getElementById('play-btn');
const createAccountBtn = document.getElementById('create-account-btn');
const usernameInput = document.getElementById('username-input');
const welcomeMessage = document.getElementById('welcome-message');
const playerNameDisplay = document.getElementById('player-name-display');
const accountCreationDiv = document.getElementById('account-creation');
const prevScoreDisplay = document.getElementById('prev-score-display');
const menuBtn = document.getElementById('menu-btn');

// Set the internal resolution of the canvas
canvas.width = 800;
canvas.height = 600;

// --- Game State Variables ---
let score = 0;
// A boolean flag to indicate if the game has ended (player died)
let isGameOver = false;
// Stores the ID returned by requestAnimationFrame, used to cancel/stop the game loop
let animationId;

// --- Input Handling ---
// An object storing the current state (pressed or not) of relevant keys
const keys = {
    ArrowLeft: false, // For moving left
    ArrowRight: false, // For moving right
    ArrowUp: false, // For jumping
    a: false, // Alternative left
    d: false, // Alternative right
    w: false, // Alternative jump
    ' ': false // Spacebar for jumping
};

// Listen for when a key is pressed down
window.addEventListener('keydown', (e) => {
    // If the key pressed is one we track in our 'keys' object, set its state to true (pressed)
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
});

// Listen for when a key is released
window.addEventListener('keyup', (e) => {
    // If the key released is one we track, set its state to false (unpressed)
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
});

// --- Entity Arrays and Global Variables ---
// The main player object
let player;
// Array holding all the platforms currently in the game
let platforms = [];
// Array holding all the collectable coins
let coins = [];
// Array holding all visual particle effects (e.g., when a coin is collected)
let particles = [];
// Array holding the decorative fish that swim underneath the water
let fishes = [];

// --- Rising Water Hazard Variables ---
// The current vertical position (Y coordinate) of the water level
let waterY;
// How fast the water is currently rising (pixels per frame)
let waterSpeed;
// Boolean flag indicating if the water has started rising yet
let waterHasRisen = false;
// Records the timestamp when the current game started, used to delay the water
let startTime;

// --- Game Initialization ---
// This function sets up a new game, resetting all variables and entities
function init() {
    // Create a new player instance (resetting position, velocity, etc.)
    player = new Player();

    // Clear out any existing entities from the previous game
    platforms = [];
    coins = [];
    particles = [];
    fishes = [];

    // Spawn 8 decorative fish to swim around
    for (let i = 0; i < 8; i++) {
        fishes.push(new Fish());
    }

    // Set the initial water level far below the screen so it's hidden
    waterY = canvas.height + 5000;
    // Set the starting speed of the rising water
    waterSpeed = 0.5;
    // Reset the water flag so it waits before rising
    waterHasRisen = false;
    // Record the start time so we can calculate the 3-second delay
    startTime = Date.now();

    // Reset score to 0 and update the UI
    score = 0;
    scoreElement.innerText = score;

    // Clear the game over state and hide the game over screen
    isGameOver = false;
    gameOverScreen.classList.add('hidden');

    // Create the very first platform at the bottom of the screen for the player to stand on
    platforms.push(new Platform(50, canvas.height - 50, 700, 20));

    // Procedurally generate the initial set of platforms going upwards
    generateLevel();

    // Kick off the main game loop
    gameLoop();
}

// --- Level Generation ---
// Generates a chunk of platforms above the current ones
function generateLevel() {
    // Start generating slightly above the bottom of the canvas
    let currentY = canvas.height - 50;

    // Loop to create 15 initial platforms
    for (let i = 0; i < 15; i++) {
        // Move the Y coordinate up by a random amount between 70 and 130 pixels
        currentY -= Math.random() * 60 + 70;

        // Pick a random width for the platform between 80 and 200 pixels
        const width = Math.random() * 120 + 80;

        // Pick a random X position so the platform fits entirely within the screen width
        const x = Math.random() * (canvas.width - width);

        // Add the newly created platform to our array
        platforms.push(new Platform(x, currentY, width, 15));

        // 60% chance to spawn a collectable coin on top of this platform
        if (Math.random() > 0.4) {
            // Place the coin in the middle of the platform, slightly above it
            coins.push(new Coin(x + width / 2, currentY - 30));
        }
    }
}

// --- Collision Detection ---
// Checks if the player is touching any uncollected coins
function checkCoinCollisions() {
    for (let coin of coins) {
        // Only check coins that haven't been collected yet
        if (!coin.collected) {
            // Calculate the absolute distance between the center of the player and the center of the coin
            const distX = Math.abs(player.x + player.width / 2 - coin.x);
            const distY = Math.abs(player.y + player.height / 2 - coin.y);

            // Simple Axis-Aligned Bounding Box (AABB) / Circle collision approximation
            if (distX < player.width / 2 + coin.radius && distY < player.height / 2 + coin.radius) {
                // Mark the coin as collected so it disappears
                coin.collected = true;

                // Increase the score by 10 and update the HTML text
                score += 10;
                scoreElement.innerText = score;

                // Spawn 10 visual particles at the coin's location for a burst effect
                for (let i = 0; i < 10; i++) {
                    particles.push(new Particle(coin.x, coin.y));
                }
            }
        }
    }
}

// --- Camera Logic ---
// Simulates a scrolling camera by moving everything downwards when the player goes too high
function updateCamera() {
    // Determine the threshold height; if the player goes above this, the camera moves
    const targetMiddle = canvas.height / 4;

    // Check if the player is higher up (smaller Y value) than the threshold
    if (player.y < targetMiddle) {
        // Calculate how far the player is above the threshold
        const diff = targetMiddle - player.y;

        // Push the player down to stay at the threshold line
        player.y += diff;

        // Move all platforms down by the same amount to create the illusion of upward movement
        for (let p of platforms) {
            p.y += diff;
        }
        // Move all coins down
        for (let c of coins) {
            c.originY += diff; // Update the origin so bobbing animation doesn't break
            c.y += diff;
        }
        // Move all particles down
        for (let p of particles) {
            p.y += diff;
        }

        // Also push the rising water down so it doesn't instantly catch up
        waterY += diff;
    }

    // --- Memory Management / Garbage Collection ---
    // Remove entities that have fallen below the screen to save memory
    platforms = platforms.filter(p => p.y < canvas.height + 50);
    // Remove collected coins AND coins that fell off the bottom
    coins = coins.filter(c => c.y < canvas.height + 50 && !c.collected);
    // Remove particles whose life has depleted
    particles = particles.filter(p => p.life > 0);

    // --- Infinite Generation ---
    // If we have fewer than 15 platforms, generate a new one at the very top
    if (platforms.length < 15) {
        // Find the platform with the smallest Y value (the highest one on screen)
        const highestPlatform = platforms.reduce((min, p) => p.y < min.y ? p : min, platforms[0]);

        // Calculate the position for the next platform above the current highest one
        const newY = highestPlatform.y - (Math.random() * 60 + 70);
        const width = Math.random() * 120 + 80;
        const x = Math.random() * (canvas.width - width);

        // Add the new platform
        platforms.push(new Platform(x, newY, width, 15));

        // 60% chance to add a coin to this new platform
        if (Math.random() > 0.4) {
            coins.push(new Coin(x + width / 2, newY - 30));
        }
    }
}

// --- Game Over Logic ---
// Called when the player dies (e.g., touches the rising water)
function endGame() {
    // Set flag to stop the game loop from updating logic
    isGameOver = true;

    // Show the Game Over screen and hide the in-game UI
    gameOverScreen.classList.remove('hidden');
    gameUi.classList.add('hidden');

    // Stop the animation frame loop completely
    cancelAnimationFrame(animationId);

    // Save the final score into localStorage so it persists across page reloads
    localStorage.setItem('gravityPrevScore', score);
}

// --- Main Game Loop ---
// This function runs every single frame to update the game logic and draw visuals
function gameLoop() {
    // If the game is over, stop updating and drawing entirely
    if (isGameOver) return;

    // 1. Clear the entire canvas from the previous frame to prepare for the new frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Update the logic for all entities
    player.update(platforms); // Update player physics and collision with platforms
    checkCoinCollisions();    // Check if player picked up coins
    updateCamera();           // Move the screen down if the player went too high

    // 3. Rising Water Logic
    if (!waterHasRisen) {
        // The water waits exactly 3 seconds (3000ms) before it starts rising
        if (Date.now() - startTime >= 3000) {
            // Bring the water into view right at the bottom of the screen
            waterY = canvas.height - 20;
            // Mark the flag so it doesn't enter this block again
            waterHasRisen = true;
        }
    } else {
        // Advance the rising water upwards (subtracting from Y moves it up)
        waterY -= waterSpeed;

        // Slowly accelerate the water's speed over time to increase difficulty
        waterSpeed += 0.001;

        // Prevent the water from ever falling below the screen again due to camera movement
        if (waterY > canvas.height - 20) {
            waterY = canvas.height - 20;
        }
    }

    // 4. Draw all game entities onto the canvas

    // Draw all platforms
    for (let p of platforms) {
        p.draw(ctx);
    }

    // Update animation and draw all uncollected coins
    for (let c of coins) {
        c.update();
        c.draw(ctx);
    }

    // Update life/physics and draw all explosion particles
    for (let p of particles) {
        p.update();
        p.draw(ctx);
    }

    // Draw the player character
    player.draw(ctx);

    // Update and draw the decorative fish underneath the water layer
    for (let f of fishes) {
        f.update();
        // The fish need to know the waterY so they only render below it
        f.draw(ctx, waterY);
    }

    // --- Draw the Rising Water Hazard ---
    // The water is drawn on top of the player and platforms to obscure them

    // Calculate a 'time' variable used to animate the sine waves continuously
    const time = Date.now() * 0.003;

    // Draw the background layer of the water (faint wave for depth effect)
    ctx.fillStyle = 'rgba(0, 150, 255, 0.2)'; // Transparent blue
    ctx.beginPath();
    ctx.moveTo(0, canvas.height + 500); // Start way below the screen

    // Draw the wavy top edge across the screen width
    for (let x = 0; x <= canvas.width; x += 20) {
        // Calculate the vertical offset using a sine wave formula
        let waveOffset = Math.sin(x * 0.015 + time * 0.7 + Math.PI) * 10;
        if (x === 0) ctx.lineTo(x, waterY - 8 + waveOffset);
        else ctx.lineTo(x, waterY - 8 + waveOffset);
    }
    // Complete the polygon by drawing down to the bottom right and left
    ctx.lineTo(canvas.width, canvas.height + 500);
    ctx.closePath();
    ctx.fill();

    // Draw the foreground main layer of the water
    ctx.fillStyle = 'rgba(0, 200, 255, 0.4)'; // Slightly darker transparent blue
    ctx.beginPath();
    ctx.moveTo(0, canvas.height + 500);

    for (let x = 0; x <= canvas.width; x += 20) {
        let waveOffset = Math.sin(x * 0.02 + time) * 6;
        if (x === 0) ctx.lineTo(x, waterY + waveOffset);
        else ctx.lineTo(x, waterY + waveOffset);
    }
    ctx.lineTo(canvas.width, canvas.height + 500);
    ctx.closePath();
    ctx.fill();

    // Draw a bright, glowing line at the very crest of the water wave
    ctx.strokeStyle = '#00e5ff'; // Cyan color
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    // Add a glowing shadow effect
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00e5ff';
    ctx.beginPath();

    for (let x = 0; x <= canvas.width; x += 20) {
        let waveOffset = Math.sin(x * 0.02 + time) * 6;
        if (x === 0) ctx.moveTo(x, waterY + waveOffset);
        else ctx.lineTo(x, waterY + waveOffset);
    }
    ctx.stroke();
    // Reset shadow blur so it doesn't affect other drawings in the next frame
    ctx.shadowBlur = 0;

    // Request the browser to call gameLoop again before the next repaint (~60 FPS)
    animationId = requestAnimationFrame(gameLoop);
}

// --- UI Event Listeners ---

// When the restart button is clicked on the Game Over screen
restartBtn.addEventListener('click', () => {
    cancelAnimationFrame(animationId); // Stop any lingering game loops
    gameOverScreen.classList.add('hidden'); // Hide the game over screen
    gameUi.classList.remove('hidden'); // Show the score UI again
    init(); // Restart the game from scratch
});

// When the 'Menu' button is clicked on the Game Over screen
menuBtn.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden'); // Hide game over screen
    // Load the previous score from local storage to display on the menu
    prevScoreDisplay.innerText = localStorage.getItem('gravityPrevScore') || 0;
    mainMenu.classList.remove('hidden'); // Show the main menu screen
});

// When the user clicks the button to create their account/username
createAccountBtn.addEventListener('click', () => {
    // Get the value typed in the input box, trimming extra spaces
    const name = usernameInput.value.trim();
    if (name) {
        // Save the username to the browser's local storage
        localStorage.setItem('gravityUsername', name);
        // Hide the input form
        accountCreationDiv.classList.add('hidden');
        // Show the personalized welcome message
        welcomeMessage.classList.remove('hidden');
        // Update the span to show their name
        playerNameDisplay.innerText = name;
    }
});

// When the 'Play' button is clicked from the main menu
playBtn.addEventListener('click', () => {
    mainMenu.classList.add('hidden'); // Hide the menu
    gameUi.classList.remove('hidden'); // Show the score UI
    init(); // Start the game!
});

// --- App Entry Point ---
// This runs exactly once when the web page finishes loading
window.onload = () => {
    // Check if the user has a saved username from a previous visit
    const savedName = localStorage.getItem('gravityUsername');
    if (savedName) {
        // If they do, skip the account creation form and welcome them back
        accountCreationDiv.classList.add('hidden');
        welcomeMessage.classList.remove('hidden');
        playerNameDisplay.innerText = savedName;
    }

    // Check if they have a saved high score from a previous visit
    const prevScore = localStorage.getItem('gravityPrevScore');
    if (prevScore) {
        // Update the main menu to show their last score
        prevScoreDisplay.innerText = prevScore;
    }
};
