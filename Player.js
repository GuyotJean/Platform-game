class Player {
    constructor() {
        this.width = 30;
        this.height = 30;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 150;
        this.vx = 0;
        this.vy = 0;
        this.speed = 6;
        this.jumpPower = -16;
        this.gravity = 0.6;
        this.grounded = false;
        this.color = '#00ffcc';
        this.jumpsLeft = 1;
        this.jumpKeyWasPressed = false;
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

        const isJumpKeyPressed = keys.ArrowUp || keys.w || keys[' '];

        // Jumping
        if (isJumpKeyPressed) {
            if (!this.jumpKeyWasPressed) {
                if (this.grounded) {
                    this.vy = this.jumpPower;
                    this.grounded = false;
                } else if (this.jumpsLeft > 0) {
                    this.vy = this.jumpPower; // Double jump
                    this.jumpsLeft--;
                    // Create some particles at player's feet
                    for(let i = 0; i < 8; i++) {
                        let p = new Particle(this.x + this.width / 2, this.y + this.height);
                        p.color = '#00ffcc';
                        particles.push(p);
                    }
                }
            }
            this.jumpKeyWasPressed = true;
        } else {
            this.jumpKeyWasPressed = false;
        }

        // Variable jump height: fall faster if button is released early
        let currentGravity = this.gravity;
        if (!isJumpKeyPressed && this.vy < 0) {
            currentGravity *= 2.5; 
        }

        // Apply gravity
        this.vy += currentGravity;
        
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
                this.jumpsLeft = 1; // Refill double jump on landing
            }
        }

        // Bottom of screen or Water = Death
        if (this.y + this.height > waterY) {
            document.querySelector('#game-over p').innerText = "The water caught you!";
            endGame();
        } else if (this.y > canvas.height) {
            document.querySelector('#game-over p').innerText = "You fell into the void!";
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
