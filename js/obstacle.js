// ==========================================
// obstacle.js - 障碍物系统
// ==========================================
class ObstacleManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.W = canvas.width;
        this.H = canvas.height;
        this.GROUND_Y = this.H * 0.78;

        this.obstacles = [];
        this.spawnTimer = 0;
        this.spawnInterval = 120; // 帧数
        this.minInterval = 50;
    }

    reset() {
        this.obstacles = [];
        this.spawnTimer = 0;
        this.spawnInterval = 120;
    }

    update(speed, difficulty) {
        // 调整生成间隔
        this.spawnInterval = Math.max(this.minInterval, 120 - difficulty * 5);

        this.spawnTimer++;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawn();
        }

        // 更新位置
        this.obstacles.forEach(o => {
            o.x -= speed;
            if (o.type === 'lion') {
                o.moveTimer = (o.moveTimer || 0) + 1;
                o.bobY = Math.sin(o.moveTimer * 0.05) * 3;
            }
            if (o.type === 'nian') {
                o.animTimer = (o.animTimer || 0) + 1;
            }
        });

        // 移除超出屏幕的障碍
        this.obstacles = this.obstacles.filter(o => o.x + o.w > -50);
    }

    spawn() {
        const types = ['nian', 'firecracker', 'lantern', 'lion'];
        const type = types[Math.floor(Math.random() * types.length)];

        let obs = {
            x: this.W + 50,
            type: type,
            passed: false,
            animTimer: 0,
            moveTimer: 0,
            bobY: 0
        };

        switch (type) {
            case 'nian': // 年兽 - 需要跳跃
                obs.y = this.GROUND_Y;
                obs.w = 50;
                obs.h = 45;
                obs.needJump = true;
                break;
            case 'firecracker': // 爆竹堆 - 需要下蹲
                obs.y = this.GROUND_Y - 55;
                obs.w = 40;
                obs.h = 30;
                obs.needDuck = true;
                break;
            case 'lantern': // 灯笼墙 - 需要跳跃
                obs.y = this.GROUND_Y;
                obs.w = 35;
                obs.h = 55;
                obs.needJump = true;
                break;
            case 'lion': // 石狮子 - 需要跳跃
                obs.y = this.GROUND_Y;
                obs.w = 45;
                obs.h = 50;
                obs.needJump = true;
                break;
        }

        // 确保不与上一个障碍太近
        const lastObs = this.obstacles[this.obstacles.length - 1];
        if (lastObs && this.W + 50 - lastObs.x < 200) return;

        this.obstacles.push(obs);
    }

    getHitboxes() {
        return this.obstacles.map(o => ({
            x: o.x + 5,
            y: (o.needDuck ? o.y : o.y - o.h) + 5,
            w: o.w - 10,
            h: o.h - 10,
            ref: o
        }));
    }

    render() {
        const ctx = this.ctx;
        this.obstacles.forEach(o => {
            switch (o.type) {
                case 'nian':
                    this.drawNian(ctx, o);
                    break;
                case 'firecracker':
                    this.drawFirecracker(ctx, o);
                    break;
                case 'lantern':
                    this.drawLanternWall(ctx, o);
                    break;
                case 'lion':
                    this.drawLion(ctx, o);
                    break;
            }
        });
    }

    drawNian(ctx, o) {
        const x = o.x;
        const y = o.y - o.h;
        const w = o.w;
        const h = o.h;
        const anim = Math.sin((o.animTimer || 0) * 0.1) * 3;

        // 身体
        const grad = ctx.createLinearGradient(x, y, x, y + h);
        grad.addColorStop(0, '#8B0000');
        grad.addColorStop(1, '#CC0000');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(x + 5, y + h);
        ctx.lineTo(x, y + 10);
        ctx.quadraticCurveTo(x + w / 2, y - 5 + anim, x + w, y + 10);
        ctx.lineTo(x + w - 5, y + h);
        ctx.closePath();
        ctx.fill();

        // 眼睛
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x + 15, y + 15, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + w - 15, y + 15, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + 15, y + 15, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + w - 15, y + 15, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // 嘴巴
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + 28, 8, 0, Math.PI);
        ctx.stroke();

        // 角
        ctx.fillStyle = '#4a2800';
        ctx.beginPath();
        ctx.moveTo(x + 10, y + 5);
        ctx.lineTo(x + 5, y - 10 + anim);
        ctx.lineTo(x + 18, y + 5);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + w - 10, y + 5);
        ctx.lineTo(x + w - 5, y - 10 + anim);
        ctx.lineTo(x + w - 18, y + 5);
        ctx.fill();

        // 发光眼睛效果
        ctx.fillStyle = 'rgba(255,215,0,0.2)';
        ctx.beginPath();
        ctx.arc(x + 15, y + 15, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + w - 15, y + 15, 10, 0, Math.PI * 2);
        ctx.fill();
    }

    drawFirecracker(ctx, o) {
        const x = o.x;
        const y = o.y;
        const w = o.w;
        const h = o.h;

        // 多个鞭炮横着飞
        for (let i = 0; i < 3; i++) {
            const fx = x + i * 12;
            const fy = y + i * 5;
            const fh = 25;
            const fw = 10;

            // 鞭炮主体
            ctx.fillStyle = '#CC0000';
            ctx.fillRect(fx, fy, fw, fh);

            // 黄色条纹
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(fx, fy, fw, 3);
            ctx.fillRect(fx, fy + fh - 3, fw, 3);
            ctx.fillRect(fx, fy + fh / 2 - 1, fw, 2);

            // 引线
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(fx + fw / 2, fy);
            ctx.quadraticCurveTo(fx + fw / 2 + 5, fy - 8, fx + fw / 2 + 2, fy - 12);
            ctx.stroke();

            // 火花
            const sparkTimer = (o.animTimer || 0) + i * 20;
            ctx.fillStyle = `rgba(255,${150 + Math.sin(sparkTimer * 0.2) * 100},0,${0.5 + Math.sin(sparkTimer * 0.3) * 0.3})`;
            ctx.beginPath();
            ctx.arc(fx + fw / 2 + 2, fy - 12, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // 警告标记 - 闪烁的⚠
        if (Math.floor((o.animTimer || 0) / 10) % 2 === 0) {
            ctx.fillStyle = 'rgba(255,255,0,0.6)';
            ctx.font = '14px Arial';
            ctx.fillText('⚡', x + w / 2 - 7, y - 5);
        }
    }

    drawLanternWall(ctx, o) {
        const x = o.x;
        const y = o.y - o.h;
        const w = o.w;
        const h = o.h;

        // 木架
        ctx.fillStyle = '#5c3317';
        ctx.fillRect(x + w / 2 - 3, y, 6, h);
        ctx.fillRect(x - 5, y, w + 10, 5);

        // 灯笼们
        const lanternPositions = [
            { lx: x + w / 2, ly: y + 15 },
            { lx: x + w / 2 - 12, ly: y + 25 },
            { lx: x + w / 2 + 12, ly: y + 25 }
        ];

        lanternPositions.forEach((lp, i) => {
            const size = 10;
            // 灯笼体
            const lGrad = ctx.createRadialGradient(lp.lx, lp.ly + size, 1, lp.lx, lp.ly + size, size);
            lGrad.addColorStop(0, '#ff3333');
            lGrad.addColorStop(1, '#cc0000');
            ctx.fillStyle = lGrad;
            ctx.beginPath();
            ctx.ellipse(lp.lx, lp.ly + size, size * 0.65, size, 0, 0, Math.PI * 2);
            ctx.fill();

            // 顶和底
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(lp.lx - 4, lp.ly, 8, 3);
            ctx.fillRect(lp.lx - 4, lp.ly + size * 2 - 3, 8, 3);

            // 穗子
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(lp.lx, lp.ly + size * 2);
            ctx.lineTo(lp.lx, lp.ly + size * 2 + 6);
            ctx.stroke();

            // 绳子
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(lp.lx, y + 5);
            ctx.lineTo(lp.lx, lp.ly);
            ctx.stroke();

            // 光晕
            ctx.fillStyle = 'rgba(255,80,30,0.1)';
            ctx.beginPath();
            ctx.arc(lp.lx, lp.ly + size, size * 2.5, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    drawLion(ctx, o) {
        const x = o.x;
        const y = o.y - o.h + (o.bobY || 0);
        const w = o.w;
        const h = o.h;

        // 底座
        ctx.fillStyle = '#808080';
        ctx.fillRect(x + 5, o.y - 10, w - 10, 10);

        // 身体
        const lionGrad = ctx.createLinearGradient(x, y, x, y + h);
        lionGrad.addColorStop(0, '#C0A060');
        lionGrad.addColorStop(1, '#8B7340');
        ctx.fillStyle = lionGrad;
        ctx.beginPath();
        ctx.moveTo(x + 8, y + h - 10);
        ctx.quadraticCurveTo(x, y + h * 0.3, x + w * 0.3, y);
        ctx.quadraticCurveTo(x + w * 0.5, y - 5, x + w * 0.7, y);
        ctx.quadraticCurveTo(x + w, y + h * 0.3, x + w - 8, y + h - 10);
        ctx.closePath();
        ctx.fill();

        // 脸
        ctx.fillStyle = '#D4AA60';
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + 15, 12, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // 眼睛
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(x + w / 2 - 5, y + 13, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + w / 2 + 5, y + 13, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // 嘴/鼻
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + 20, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // 鬃毛
        ctx.fillStyle = '#A08040';
        for (let i = 0; i < 6; i++) {
            const angle = -Math.PI * 0.8 + i * Math.PI * 0.32;
            const mx = x + w / 2 + Math.cos(angle) * 16;
            const my = y + 12 + Math.sin(angle) * 14;
            ctx.beginPath();
            ctx.arc(mx, my, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // 前爪
        ctx.fillStyle = '#C0A060';
        ctx.beginPath();
        ctx.ellipse(x + 12, y + h - 12, 6, 4, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + w - 12, y + h - 12, 6, 4, 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
}

window.ObstacleManager = ObstacleManager;
