const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverScreen = document.getElementById('game-over');
const restartBtn = document.getElementById('restart-btn');

canvas.width = 800;
canvas.height = 600;

// Game State
let score = 0;
let isGameOver = false;
let animationId;

// Input handling
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    a: false,
    d: false,
    w: false,
    ' ': false
};

window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
});

class Player {
    constructor() {
        this.width = 30;
        this.height = 30;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 150;
        this.vx = 0;
        this.vy = 0;
        this.speed = 6;
        this.jumpPower = -14;
        this.gravity = 0.6;
        this.grounded = false;
        this.color = '#00ffcc';
    }

    update(platforms) {
        // Horizontal movement
        if (keys.ArrowLeft || keys.a) {
            this.vx = -this.speed;
        } else if (keys.ArrowRight || keys.d) {
            this.vx = this.speed;
        } else {
            this.vx = 0;
        }

        // Jumping
        if ((keys.ArrowUp || keys.w || keys[' ']) && this.grounded) {
            this.vy = this.jumpPower;
            this.grounded = false;
        }

        // Apply gravity
        this.vy += this.gravity;
        
        // Update positions
        this.x += this.vx;
        this.y += this.vy;

        // Boundary checks (wrap around)
        if (this.x < -this.width) this.x = canvas.width;
        if (this.x > canvas.width) this.x = -this.width;

        this.grounded = false;

        // Platform collisions
        for (let platform of platforms) {
            // Check if falling down and above platform
            if (this.vy > 0 &&
                this.y + this.height - this.vy <= platform.y &&
                this.y + this.height >= platform.y &&
                this.x + this.width > platform.x &&
                this.x < platform.x + platform.width) {
                
                this.y = platform.y - this.height;
                this.vy = 0;
                this.grounded = true;
            }
        }

        // Bottom of screen = Death
        if (this.y > canvas.height) {
            endGame();
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        // Draw trailing effect for motion (optional enhancement)
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.shadowBlur = 0;
    }
}

class Platform {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = '#252b3b';
        this.glow = '#ff007f';
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Top highlight
        ctx.fillStyle = this.glow;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.glow;
        ctx.fillRect(this.x, this.y, this.width, 4);
        ctx.shadowBlur = 0;
    }
}

class Coin {
    constructor(x, y) {
        this.originX = x;
        this.originY = y;
        this.x = x;
        this.y = y;
        this.radius = 8;
        this.collected = false;
        this.angle = Math.random() * Math.PI * 2;
    }

    update() {
        if (this.collected) return;
        this.angle += 0.1;
        this.y = this.originY + Math.sin(this.angle) * 5;
    }

    draw(ctx) {
        if (this.collected) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffdd00';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffdd00';
        ctx.fill();
        ctx.closePath();
        ctx.shadowBlur = 0;
    }
}

// Particles effect on coin collection
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.life = 1;
        this.color = '#ffdd00';
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.05;
    }

    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, 3, 3);
        ctx.globalAlpha = 1;
    }
}

let player;
let platforms = [];
let coins = [];
let particles = [];

function init() {
    player = new Player();
    platforms = [];
    coins = [];
    particles = [];
    score = 0;
    scoreElement.innerText = score;
    isGameOver = false;
    gameOverScreen.classList.add('hidden');

    // Starting platform
    platforms.push(new Platform(50, canvas.height - 50, 700, 20));

    // Generate initial platforms
    generateLevel();

    gameLoop();
}

function generateLevel() {
    let currentY = canvas.height - 50;
    for (let i = 0; i < 15; i++) {
        currentY -= Math.random() * 80 + 80;
        const width = Math.random() * 120 + 80;
        const x = Math.random() * (canvas.width - width);
        platforms.push(new Platform(x, currentY, width, 15));

        // Add coin occasionally
        if (Math.random() > 0.4) {
            coins.push(new Coin(x + width / 2, currentY - 30));
        }
    }
}

function checkCoinCollisions() {
    for (let coin of coins) {
        if (!coin.collected) {
            const distX = Math.abs(player.x + player.width/2 - coin.x);
            const distY = Math.abs(player.y + player.height/2 - coin.y);

            if (distX < player.width/2 + coin.radius && distY < player.height/2 + coin.radius) {
                coin.collected = true;
                score += 10;
                scoreElement.innerText = score;
                
                // Spawn particles
                for(let i=0; i<10; i++) {
                    particles.push(new Particle(coin.x, coin.y));
                }
            }
        }
    }
}

function updateCamera() {
    const targetMiddle = canvas.height / 2;
    if (player.y < targetMiddle) {
        const diff = targetMiddle - player.y;
        player.y += diff;
        
        for (let p of platforms) {
            p.y += diff;
        }
        for (let c of coins) {
            c.originY += diff;
            c.y += diff;
        }
        for (let p of particles) {
            p.y += diff;
        }
        
        // Increase score as you go higher
        score += Math.floor(diff * 0.1);
        scoreElement.innerText = score;
    }
    
    // Remove out-of-bounds entities
    platforms = platforms.filter(p => p.y < canvas.height + 50);
    coins = coins.filter(c => c.y < canvas.height + 50 && !c.collected);
    particles = particles.filter(p => p.life > 0);
    
    // Generate new platforms
    if (platforms.length < 15) {
        const highestPlatform = platforms.reduce((min, p) => p.y < min.y ? p : min, platforms[0]);
        const newY = highestPlatform.y - (Math.random() * 80 + 80);
        const width = Math.random() * 120 + 80;
        const x = Math.random() * (canvas.width - width);
        platforms.push(new Platform(x, newY, width, 15));
        
        if (Math.random() > 0.4) {
            coins.push(new Coin(x + width / 2, newY - 30));
        }
    }
}

function endGame() {
    isGameOver = true;
    gameOverScreen.classList.remove('hidden');
    cancelAnimationFrame(animationId);
}

function gameLoop() {
    if (isGameOver) return;

    // Draw background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    player.update(platforms);
    checkCoinCollisions();
    updateCamera();

    // Draw platforms
    for (let p of platforms) {
        p.draw(ctx);
    }

    // Draw coins
    for (let c of coins) {
        c.update();
        c.draw(ctx);
    }

    // Draw particles
    for (let p of particles) {
        p.update();
        p.draw(ctx);
    }

    // Draw player
    player.draw(ctx);

    animationId = requestAnimationFrame(gameLoop);
}

restartBtn.addEventListener('click', () => {
    cancelAnimationFrame(animationId);
    init();
});

// Start game
init();
