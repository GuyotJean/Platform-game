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
