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
                obs.w = 60;
                obs.h = 55;
                obs.needJump = true;
                break;
            case 'firecracker': // 爆竹堆 - 需要下蹲
                obs.y = this.GROUND_Y - 55;
                obs.w = 50;
                obs.h = 35;
                obs.needDuck = true;
                break;
            case 'lantern': // 灯笼墙 - 需要跳跃
                obs.y = this.GROUND_Y;
                obs.w = 42;
                obs.h = 62;
                obs.needJump = true;
                break;
            case 'lion': // 石狮子 - 需要跳跃
                obs.y = this.GROUND_Y;
                obs.w = 55;
                obs.h = 58;
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
            // 危险光晕
            this.drawDangerGlow(ctx, o);

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

    drawDangerGlow(ctx, o) {
        const pulse = Math.sin((o.animTimer || 0) * 0.08) * 0.15;
        const cx = o.x + o.w / 2;
        const cy = o.needDuck ? o.y + o.h / 2 : o.y - o.h / 2;
        const r = Math.max(o.w, o.h) * 0.9;

        // 外层红色脉冲光晕
        const grad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
        grad.addColorStop(0, `rgba(255,30,0,${0.25 + pulse})`);
        grad.addColorStop(0.6, `rgba(255,30,0,${0.08 + pulse * 0.5})`);
        grad.addColorStop(1, 'rgba(255,30,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
    }

    drawNian(ctx, o) {
        const x = o.x;
        const y = o.y - o.h;
        const w = o.w;
        const h = o.h;
        const anim = Math.sin((o.animTimer || 0) * 0.1) * 4;

        // 身体 - 更鲜明的红色
        const grad = ctx.createLinearGradient(x, y, x, y + h);
        grad.addColorStop(0, '#AA0000');
        grad.addColorStop(0.5, '#EE1111');
        grad.addColorStop(1, '#CC0000');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(x + 5, y + h);
        ctx.lineTo(x, y + 12);
        ctx.quadraticCurveTo(x + w / 2, y - 5 + anim, x + w, y + 12);
        ctx.lineTo(x + w - 5, y + h);
        ctx.closePath();
        ctx.fill();

        // 身体轮廓
        ctx.strokeStyle = '#FF4444';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 身体花纹
        ctx.strokeStyle = 'rgba(255,215,0,0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(x + w / 2, y + h * 0.5 + i * 8, 8 - i * 2, 0, Math.PI);
            ctx.stroke();
        }

        // 角 - 更大
        ctx.fillStyle = '#5a3000';
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 12, y + 8);
        ctx.lineTo(x + 4, y - 15 + anim);
        ctx.lineTo(x + 22, y + 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + w - 12, y + 8);
        ctx.lineTo(x + w - 4, y - 15 + anim);
        ctx.lineTo(x + w - 22, y + 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 眼睛 - 更大更亮
        const eyeGlow = 0.3 + Math.sin((o.animTimer || 0) * 0.15) * 0.2;
        ctx.fillStyle = `rgba(255,215,0,${eyeGlow})`;
        ctx.beginPath();
        ctx.arc(x + 18, y + 20, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + w - 18, y + 20, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x + 18, y + 20, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + w - 18, y + 20, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(x + 18, y + 20, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + w - 18, y + 20, 3, 0, Math.PI * 2);
        ctx.fill();

        // 嘴巴 - 更大，露出獠牙
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + 35, 10, 0, Math.PI);
        ctx.stroke();

        // 獠牙
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(x + w / 2 - 8, y + 33);
        ctx.lineTo(x + w / 2 - 5, y + 42);
        ctx.lineTo(x + w / 2 - 2, y + 33);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + w / 2 + 8, y + 33);
        ctx.lineTo(x + w / 2 + 5, y + 42);
        ctx.lineTo(x + w / 2 + 2, y + 33);
        ctx.fill();
    }

    drawFirecracker(ctx, o) {
        const x = o.x;
        const y = o.y;
        const w = o.w;
        const h = o.h;
        const timer = o.animTimer || 0;

        // 连接绳
        ctx.strokeStyle = '#CC0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y + h / 2);
        ctx.lineTo(x + w, y + h / 2);
        ctx.stroke();

        // 4个鞭炮，更大更密
        for (let i = 0; i < 4; i++) {
            const fx = x + 4 + i * 11;
            const fy = y + (i % 2) * 4;
            const fh = 28;
            const fw = 12;

            // 鞭炮主体 - 更饱和的红色
            const grad = ctx.createLinearGradient(fx, fy, fx + fw, fy);
            grad.addColorStop(0, '#DD0000');
            grad.addColorStop(0.5, '#FF2222');
            grad.addColorStop(1, '#DD0000');
            ctx.fillStyle = grad;
            ctx.fillRect(fx, fy, fw, fh);

            // 金色装饰条
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(fx, fy, fw, 4);
            ctx.fillRect(fx, fy + fh - 4, fw, 4);
            ctx.fillRect(fx, fy + fh / 2 - 1.5, fw, 3);

            // 轮廓
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 0.8;
            ctx.strokeRect(fx, fy, fw, fh);

            // 引线
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(fx + fw / 2, fy);
            ctx.quadraticCurveTo(fx + fw / 2 + 6, fy - 10, fx + fw / 2 + 2, fy - 15);
            ctx.stroke();

            // 火花 - 更大更亮
            const sparkTimer = timer + i * 25;
            const sparkSize = 3 + Math.sin(sparkTimer * 0.25) * 2;
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.arc(fx + fw / 2 + 2, fy - 15, sparkSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FF8800';
            ctx.beginPath();
            ctx.arc(fx + fw / 2 + 2, fy - 15, sparkSize * 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.arc(fx + fw / 2 + 2, fy - 15, sparkSize * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // 闪烁警告 - 更醒目
        const flash = Math.sin(timer * 0.2);
        if (flash > 0) {
            ctx.fillStyle = `rgba(255,255,0,${0.5 + flash * 0.4})`;
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⚡', x + w / 2, y - 8);
            ctx.textAlign = 'left';
        }
    }

    drawLanternWall(ctx, o) {
        const x = o.x;
        const y = o.y - o.h;
        const w = o.w;
        const h = o.h;

        // 木架 - 更粗更明显
        ctx.fillStyle = '#6B3A1F';
        ctx.fillRect(x + w / 2 - 4, y, 8, h);
        ctx.fillRect(x - 8, y, w + 16, 6);
        // 木架金色装饰
        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 8, y, w + 16, 6);

        // 灯笼们 - 更大
        const lanternPositions = [
            { lx: x + w / 2, ly: y + 12 },
            { lx: x + w / 2 - 14, ly: y + 26 },
            { lx: x + w / 2 + 14, ly: y + 26 }
        ];

        lanternPositions.forEach((lp, i) => {
            const size = 13;

            // 光晕 - 更亮
            const pulse = Math.sin((o.animTimer || 0) * 0.06 + i) * 0.08;
            ctx.fillStyle = `rgba(255,60,20,${0.2 + pulse})`;
            ctx.beginPath();
            ctx.arc(lp.lx, lp.ly + size, size * 3, 0, Math.PI * 2);
            ctx.fill();

            // 灯笼体 - 更饱和
            const lGrad = ctx.createRadialGradient(lp.lx, lp.ly + size, 2, lp.lx, lp.ly + size, size);
            lGrad.addColorStop(0, '#FF4444');
            lGrad.addColorStop(0.7, '#EE0000');
            lGrad.addColorStop(1, '#BB0000');
            ctx.fillStyle = lGrad;
            ctx.beginPath();
            ctx.ellipse(lp.lx, lp.ly + size, size * 0.7, size, 0, 0, Math.PI * 2);
            ctx.fill();

            // 灯笼轮廓
            ctx.strokeStyle = '#FF6666';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(lp.lx, lp.ly + size, size * 0.7, size, 0, 0, Math.PI * 2);
            ctx.stroke();

            // 横纹装饰
            ctx.strokeStyle = 'rgba(255,215,0,0.4)';
            ctx.lineWidth = 0.8;
            for (let j = -1; j <= 1; j++) {
                ctx.beginPath();
                ctx.ellipse(lp.lx, lp.ly + size + j * 4, size * 0.65, 2, 0, 0, Math.PI * 2);
                ctx.stroke();
            }

            // 顶和底 - 更大
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(lp.lx - 5, lp.ly - 1, 10, 4);
            ctx.fillRect(lp.lx - 5, lp.ly + size * 2 - 3, 10, 4);

            // 穗子
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(lp.lx, lp.ly + size * 2 + 1);
            ctx.lineTo(lp.lx, lp.ly + size * 2 + 8);
            ctx.stroke();

            // 绳子
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(lp.lx, y + 6);
            ctx.lineTo(lp.lx, lp.ly - 1);
            ctx.stroke();
        });
    }

    drawLion(ctx, o) {
        const x = o.x;
        const y = o.y - o.h + (o.bobY || 0);
        const w = o.w;
        const h = o.h;

        // 底座 - 更精致
        const baseGrad = ctx.createLinearGradient(x + 5, o.y - 14, x + 5, o.y);
        baseGrad.addColorStop(0, '#999');
        baseGrad.addColorStop(1, '#666');
        ctx.fillStyle = baseGrad;
        ctx.fillRect(x + 3, o.y - 14, w - 6, 14);
        ctx.strokeStyle = '#AAA';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 3, o.y - 14, w - 6, 14);

        // 身体 - 更大更亮
        const lionGrad = ctx.createLinearGradient(x, y, x, y + h);
        lionGrad.addColorStop(0, '#D4B870');
        lionGrad.addColorStop(0.5, '#C0A050');
        lionGrad.addColorStop(1, '#9B7B30');
        ctx.fillStyle = lionGrad;
        ctx.beginPath();
        ctx.moveTo(x + 8, y + h - 14);
        ctx.quadraticCurveTo(x - 2, y + h * 0.3, x + w * 0.3, y + 2);
        ctx.quadraticCurveTo(x + w * 0.5, y - 6, x + w * 0.7, y + 2);
        ctx.quadraticCurveTo(x + w + 2, y + h * 0.3, x + w - 8, y + h - 14);
        ctx.closePath();
        ctx.fill();

        // 身体轮廓
        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 鬃毛 - 更浓密
        ctx.fillStyle = '#B8922E';
        for (let i = 0; i < 8; i++) {
            const angle = -Math.PI * 0.85 + i * Math.PI * 0.24;
            const mx = x + w / 2 + Math.cos(angle) * 20;
            const my = y + 14 + Math.sin(angle) * 18;
            ctx.beginPath();
            ctx.arc(mx, my, 6, 0, Math.PI * 2);
            ctx.fill();
        }

        // 脸 - 更大
        ctx.fillStyle = '#E0BE70';
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + 18, 15, 13, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#C0A050';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 眉毛
        ctx.strokeStyle = '#8B6914';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + w / 2 - 7, y + 12, 5, Math.PI * 1.2, Math.PI * 1.8);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + w / 2 + 7, y + 12, 5, Math.PI * 1.2, Math.PI * 1.8);
        ctx.stroke();

        // 眼睛 - 更大更凶
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x + w / 2 - 7, y + 17, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + w / 2 + 7, y + 17, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(x + w / 2 - 7, y + 17, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + w / 2 + 7, y + 17, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // 嘴/鼻 - 更明显
        ctx.fillStyle = '#6B3A1F';
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + 25, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // 咆哮的嘴
        ctx.strokeStyle = '#6B3A1F';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + 28, 6, 0.1, Math.PI - 0.1);
        ctx.stroke();

        // 前爪 - 更大
        ctx.fillStyle = '#D4B870';
        ctx.beginPath();
        ctx.ellipse(x + 14, y + h - 16, 8, 5, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + w - 14, y + h - 16, 8, 5, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#C0A050';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(x + 14, y + h - 16, 8, 5, -0.3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(x + w - 14, y + h - 16, 8, 5, 0.3, 0, Math.PI * 2);
        ctx.stroke();
    }
}

window.ObstacleManager = ObstacleManager;
