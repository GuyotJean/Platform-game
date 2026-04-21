class Fish {
    constructor() {
        this.reset();
        this.x = Math.random() * canvas.width; // Random initial X
    }

    reset() {
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.x = this.direction === 1 ? -50 : canvas.width + 50;
        this.yOffset = Math.random() * 200 + 40; // Depth below water surface
        this.speed = (Math.random() * 1 + 0.5) * this.direction;
        this.size = Math.random() * 12 + 8;
        // Neon-ish fish colors
        const colors = ['#ff007f', '#00ffcc', '#ffdd00'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.x += this.speed;
        if (this.direction === 1 && this.x > canvas.width + 100) this.reset();
        if (this.direction === -1 && this.x < -100) this.reset();
    }

    draw(ctx, currentWaterY) {
        let absY = currentWaterY + this.yOffset;
        if (absY < canvas.height + 50) { // Only draw if visible on screen
            ctx.fillStyle = this.color;
            ctx.beginPath();
            // Fish body
            ctx.ellipse(this.x, absY, this.size, this.size/2.5, 0, 0, Math.PI * 2);
            // Fish tail
            ctx.moveTo(this.x - (this.size * 0.5 * this.direction), absY);
            ctx.lineTo(this.x - (this.size * 1.5 * this.direction), absY - this.size/1.5);
            ctx.lineTo(this.x - (this.size * 1.5 * this.direction), absY + this.size/1.5);
            ctx.fill();
        }
    }
}
