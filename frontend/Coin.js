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
