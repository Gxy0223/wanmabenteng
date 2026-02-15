// ==========================================
// scene.js - 场景与视差背景渲染
// ==========================================
class Scene {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.W = canvas.width;
        this.H = canvas.height;
        this.GROUND_Y = this.H * 0.78;

        // 视差层偏移
        this.layers = {
            sky: 0,
            farMountain: 0,
            nearMountain: 0,
            buildings: 0,
            ground: 0
        };

        // 装饰元素
        this.lanterns = [];
        this.snowflakes = [];
        this.clouds = [];

        this.initDecorations();
    }

    initDecorations() {
        // 生成云朵
        for (let i = 0; i < 5; i++) {
            this.clouds.push({
                x: Math.random() * this.W,
                y: 30 + Math.random() * 60,
                w: 60 + Math.random() * 80,
                speed: 0.2 + Math.random() * 0.3
            });
        }
        // 生成灯笼
        for (let i = 0; i < 3; i++) {
            this.lanterns.push({
                x: 200 + i * 300 + Math.random() * 100,
                baseY: 40 + Math.random() * 30,
                swing: Math.random() * Math.PI * 2,
                size: 15 + Math.random() * 10
            });
        }
        // 生成雪花
        for (let i = 0; i < 40; i++) {
            this.snowflakes.push({
                x: Math.random() * this.W,
                y: Math.random() * this.H,
                r: 1 + Math.random() * 3,
                speed: 0.5 + Math.random() * 1.5,
                drift: Math.random() * Math.PI * 2
            });
        }
    }

    update(speed, dt) {
        // 更新视差层
        this.layers.farMountain += speed * 0.1;
        this.layers.nearMountain += speed * 0.25;
        this.layers.buildings += speed * 0.5;
        this.layers.ground += speed;

        // 更新云朵
        this.clouds.forEach(c => {
            c.x -= c.speed + speed * 0.05;
            if (c.x + c.w < 0) c.x = this.W + c.w;
        });

        // 更新灯笼
        this.lanterns.forEach(l => {
            l.swing += 0.02;
            l.x -= speed * 0.5;
            if (l.x + l.size < 0) l.x = this.W + 100 + Math.random() * 200;
        });

        // 更新雪花
        this.snowflakes.forEach(s => {
            s.y += s.speed;
            s.x += Math.sin(s.drift) * 0.5;
            s.drift += 0.02;
            if (s.y > this.H) {
                s.y = -5;
                s.x = Math.random() * this.W;
            }
        });
    }

    render() {
        const ctx = this.ctx;
        const W = this.W;
        const H = this.H;
        const GY = this.GROUND_Y;

        // === 天空渐变 ===
        const skyGrad = ctx.createLinearGradient(0, 0, 0, GY);
        skyGrad.addColorStop(0, '#1a0a2e');
        skyGrad.addColorStop(0.3, '#2d1b69');
        skyGrad.addColorStop(0.7, '#4a2c8a');
        skyGrad.addColorStop(1, '#e8845c');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, W, GY);

        // === 星星 ===
        ctx.fillStyle = 'rgba(255,255,200,0.8)';
        for (let i = 0; i < 30; i++) {
            const sx = (i * 137.5 + 50) % W;
            const sy = (i * 97.3 + 10) % (GY * 0.5);
            const sr = 0.5 + (i % 3) * 0.5;
            ctx.beginPath();
            ctx.arc(sx, sy, sr, 0, Math.PI * 2);
            ctx.fill();
        }

        // === 月亮 ===
        ctx.fillStyle = '#ffe4a0';
        ctx.beginPath();
        ctx.arc(W - 100, 60, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a0a2e';
        ctx.beginPath();
        ctx.arc(W - 88, 52, 26, 0, Math.PI * 2);
        ctx.fill();

        // === 远山 ===
        this.drawMountains(ctx, GY - 60, 0.3, '#3d1f6d', this.layers.farMountain, 100);
        this.drawMountains(ctx, GY - 30, 0.4, '#5c2d82', this.layers.nearMountain, 80);

        // === 云朵 ===
        this.clouds.forEach(c => {
            ctx.fillStyle = 'rgba(200,180,220,0.3)';
            this.drawCloud(ctx, c.x, c.y, c.w);
        });

        // === 建筑/古镇轮廓 ===
        this.drawBuildings(ctx, GY, this.layers.buildings);

        // === 地面 ===
        const groundGrad = ctx.createLinearGradient(0, GY, 0, H);
        groundGrad.addColorStop(0, '#8B4513');
        groundGrad.addColorStop(0.3, '#A0522D');
        groundGrad.addColorStop(1, '#6B3410');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, GY, W, H - GY);

        // 地面纹理线
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1;
        const gOffset = this.layers.ground % 40;
        for (let i = -1; i < W / 40 + 1; i++) {
            const gx = i * 40 - gOffset;
            ctx.beginPath();
            ctx.moveTo(gx, GY);
            ctx.lineTo(gx + 10, H);
            ctx.stroke();
        }

        // 地面顶部边缘 - 雪/霜
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(0, GY - 2, W, 4);

        // === 灯笼 ===
        this.lanterns.forEach(l => {
            const swingX = Math.sin(l.swing) * 5;
            this.drawLantern(ctx, l.x + swingX, l.baseY, l.size);
        });

        // === 雪花 ===
        this.snowflakes.forEach(s => {
            ctx.fillStyle = `rgba(255,255,255,${0.3 + s.r * 0.15})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    drawMountains(ctx, baseY, amplitude, color, offset, period) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, this.H);
        for (let x = 0; x <= this.W; x += 5) {
            const y = baseY - Math.sin((x + offset) * 0.008) * period * amplitude
                     - Math.sin((x + offset) * 0.003) * period * amplitude * 0.5;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(this.W, this.H);
        ctx.closePath();
        ctx.fill();
    }

    drawCloud(ctx, x, y, w) {
        const h = w * 0.4;
        ctx.beginPath();
        ctx.ellipse(x, y, w * 0.5, h * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x - w * 0.2, y + h * 0.1, w * 0.3, h * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + w * 0.2, y + h * 0.1, w * 0.35, h * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBuildings(ctx, groundY, offset) {
        const buildings = [
            { w: 40, h: 50, roof: 'pagoda' },
            { w: 30, h: 35, roof: 'flat' },
            { w: 50, h: 65, roof: 'pagoda' },
            { w: 25, h: 30, roof: 'pointed' },
            { w: 45, h: 55, roof: 'pagoda' },
            { w: 35, h: 40, roof: 'flat' },
            { w: 55, h: 70, roof: 'pagoda' },
            { w: 28, h: 32, roof: 'pointed' },
        ];

        const spacing = 120;
        const totalW = buildings.length * spacing;
        const baseOffset = -(offset % totalW);

        ctx.fillStyle = '#2a1040';
        buildings.forEach((b, i) => {
            const bx = baseOffset + i * spacing;
            // 循环显示
            const drawX = ((bx % totalW) + totalW) % totalW - spacing;
            const by = groundY - b.h;

            // 建筑主体
            ctx.fillStyle = '#2a1040';
            ctx.fillRect(drawX, by, b.w, b.h);

            // 屋顶
            if (b.roof === 'pagoda') {
                ctx.beginPath();
                ctx.moveTo(drawX - 8, by);
                ctx.lineTo(drawX + b.w / 2, by - 20);
                ctx.lineTo(drawX + b.w + 8, by);
                // 翘角
                ctx.quadraticCurveTo(drawX + b.w + 12, by - 5, drawX + b.w + 5, by);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(drawX - 8, by);
                ctx.quadraticCurveTo(drawX - 12, by - 5, drawX - 5, by);
                ctx.fill();
            } else if (b.roof === 'pointed') {
                ctx.beginPath();
                ctx.moveTo(drawX - 3, by);
                ctx.lineTo(drawX + b.w / 2, by - 15);
                ctx.lineTo(drawX + b.w + 3, by);
                ctx.fill();
            }

            // 窗户
            ctx.fillStyle = 'rgba(255,200,100,0.4)';
            const winSize = 6;
            for (let wy = by + 10; wy < groundY - 10; wy += 15) {
                for (let wx = drawX + 8; wx < drawX + b.w - 8; wx += 12) {
                    ctx.fillRect(wx, wy, winSize, winSize);
                }
            }
            ctx.fillStyle = '#2a1040';
        });
    }

    drawLantern(ctx, x, y, size) {
        // 绳子
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, y);
        ctx.stroke();

        // 灯笼主体
        const grad = ctx.createRadialGradient(x, y + size, 2, x, y + size, size);
        grad.addColorStop(0, '#ff4444');
        grad.addColorStop(0.7, '#cc0000');
        grad.addColorStop(1, '#880000');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(x, y + size, size * 0.7, size, 0, 0, Math.PI * 2);
        ctx.fill();

        // 灯笼顶和底装饰
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(x - size * 0.3, y, size * 0.6, 4);
        ctx.fillRect(x - size * 0.3, y + size * 2 - 4, size * 0.6, 4);

        // 灯笼穗子
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y + size * 2);
        ctx.lineTo(x, y + size * 2 + 8);
        ctx.stroke();

        // 发光效果
        ctx.fillStyle = 'rgba(255,100,50,0.15)';
        ctx.beginPath();
        ctx.arc(x, y + size, size * 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

window.Scene = Scene;
