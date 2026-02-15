// ==========================================
// player.js - 马匹角色控制
// ==========================================
class Player {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.W = canvas.width;
        this.H = canvas.height;
        this.GROUND_Y = this.H * 0.78;

        // 位置和物理
        this.x = 100;
        this.y = this.GROUND_Y;
        this.vy = 0;
        this.gravity = 0.65;
        this.jumpForce = -14;
        this.width = 90;
        this.height = 65;

        // 状态
        this.state = 'run';
        this.jumpsLeft = 2;
        this.isOnGround = true;
        this.isDucking = false;
        this.isInvincible = false;
        this.invincibleTimer = 0;

        // 道具状态
        this.hasShield = false;
        this.isBoosted = false;
        this.boostTimer = 0;
        this.hasMagnet = false;
        this.magnetTimer = 0;
        this.scoreMultiplier = 1;
        this.multiplierTimer = 0;

        // 动画
        this.animFrame = 0;
        this.animTimer = 0;
        this.legAngle = 0;
        this.runPhase = 0;

        // 皮肤
        this.skin = window.GameStorage.getSelectedSkin();
        this.skins = {
            white: {
                body: '#F0EDE8', light: '#FFFFFF', dark: '#CFC8BA',
                mane: '#B0A898', mane2: '#D8D0C4', mane3: '#E8E2D8',
                hoof: '#4A3A2C', belly: '#FAFAFA', eye: '#4A3020',
                name: '白龙马'
            },
            red: {
                body: '#CC2A1A', light: '#E84838', dark: '#901A0E',
                mane: '#FFD700', mane2: '#FF8C00', mane3: '#FFAA22',
                hoof: '#2A1508', belly: '#E85848', eye: '#3A1A08',
                name: '赤兔马'
            },
            brown: {
                body: '#9A7040', light: '#BA8A58', dark: '#6A4A28',
                mane: '#2A1A0A', mane2: '#4A3420', mane3: '#3A2818',
                hoof: '#1A0E04', belly: '#B08858', eye: '#2A1A0A',
                name: '汗血宝马'
            },
            black: {
                body: '#383840', light: '#505060', dark: '#202028',
                mane: '#18181E', mane2: '#282830', mane3: '#202028',
                hoof: '#0E0E14', belly: '#484858', eye: '#101018',
                name: '千里马'
            },
            gold: {
                body: '#EEBB30', light: '#FFD860', dark: '#B88A18',
                mane: '#FF5500', mane2: '#FF8822', mane3: '#FF6A11',
                hoof: '#5A3A08', belly: '#FFD050', eye: '#5A3008',
                name: '金马驹'
            }
        };

        // 粒子效果
        this.particles = [];
    }

    reset() {
        this.y = this.GROUND_Y;
        this.vy = 0;
        this.state = 'run';
        this.jumpsLeft = 2;
        this.isOnGround = true;
        this.isDucking = false;
        this.isInvincible = false;
        this.invincibleTimer = 0;
        this.hasShield = false;
        this.isBoosted = false;
        this.boostTimer = 0;
        this.hasMagnet = false;
        this.magnetTimer = 0;
        this.scoreMultiplier = 1;
        this.multiplierTimer = 0;
        this.particles = [];
    }

    jump() {
        if (this.jumpsLeft > 0) {
            this.vy = this.jumpForce;
            this.isOnGround = false;
            this.isDucking = false;
            if (this.jumpsLeft === 2) {
                this.state = 'jump';
                window.GameAudio.jump();
            } else {
                this.state = 'doubleJump';
                window.GameAudio.doubleJump();
                for (let i = 0; i < 6; i++) {
                    this.particles.push({
                        x: this.x + this.width / 2,
                        y: this.y,
                        vx: (Math.random() - 0.5) * 5,
                        vy: Math.random() * 3 + 1,
                        life: 22, maxLife: 22,
                        color: '#FFD700', size: 4
                    });
                }
            }
            this.jumpsLeft--;
        }
    }

    duck(active) {
        if (active && this.isOnGround) {
            this.isDucking = true;
            this.state = 'duck';
            this.height = 35;
        } else {
            this.isDucking = false;
            if (this.isOnGround) this.state = 'run';
            this.height = 65;
        }
    }

    hit() {
        if (this.isInvincible || this.isBoosted) return false;
        if (this.hasShield) {
            this.hasShield = false;
            this.isInvincible = true;
            this.invincibleTimer = 60;
            window.GameAudio.shieldBreak();
            for (let i = 0; i < 12; i++) {
                this.particles.push({
                    x: this.x + this.width / 2,
                    y: this.y - this.height / 2,
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 0.5) * 8,
                    life: 30, maxLife: 30,
                    color: '#00BFFF', size: 5
                });
            }
            return false;
        }
        this.state = 'hit';
        window.GameAudio.hit();
        return true;
    }

    activatePowerUp(type) {
        window.GameAudio.powerUp();
        switch (type) {
            case 'shield':  this.hasShield = true; break;
            case 'boost':
                this.isBoosted = true;
                this.boostTimer = 300;
                this.isInvincible = true;
                this.invincibleTimer = 300;
                window.GameAudio.boost();
                break;
            case 'magnet':
                this.hasMagnet = true;
                this.magnetTimer = 480;
                break;
            case 'multiplier':
                this.scoreMultiplier = 2;
                this.multiplierTimer = 600;
                break;
        }
    }

    getHitbox() {
        const s = 10;
        return {
            x: this.x + s,
            y: this.y - this.height + s,
            w: this.width - s * 2,
            h: this.height - s * 2
        };
    }

    getMagnetRange() {
        return this.hasMagnet ? 150 : 0;
    }

    update() {
        if (!this.isOnGround) {
            this.vy += this.gravity;
            this.y += this.vy;
            if (this.isDucking) this.vy += this.gravity * 0.5;
            if (this.y >= this.GROUND_Y) {
                this.y = this.GROUND_Y;
                this.vy = 0;
                this.isOnGround = true;
                this.jumpsLeft = 2;
                if (!this.isDucking) this.state = 'run';
            }
        }

        if (this.isInvincible) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0 && !this.isBoosted) this.isInvincible = false;
        }
        if (this.isBoosted) {
            this.boostTimer--;
            if (this.boostTimer <= 0) { this.isBoosted = false; this.isInvincible = false; }
        }
        if (this.hasMagnet) {
            this.magnetTimer--;
            if (this.magnetTimer <= 0) this.hasMagnet = false;
        }
        if (this.scoreMultiplier > 1) {
            this.multiplierTimer--;
            if (this.multiplierTimer <= 0) this.scoreMultiplier = 1;
        }

        // 流畅动画相位
        this.animTimer++;
        this.runPhase += 0.18;

        // 粒子：加速火焰
        if (this.isBoosted && this.animTimer % 2 === 0) {
            this.particles.push({
                x: this.x + 10,
                y: this.y - this.height / 2 + (Math.random() - 0.5) * this.height * 0.6,
                vx: -4 - Math.random() * 3, vy: (Math.random() - 0.5) * 2,
                life: 14, maxLife: 14,
                color: Math.random() > 0.5 ? '#FF4500' : '#FFD700', size: 5
            });
        }
        // 粒子：奔跑尘土
        if (this.isOnGround && this.state === 'run' && Math.random() < 0.25) {
            this.particles.push({
                x: this.x + 15, y: this.GROUND_Y,
                vx: -1.5 - Math.random() * 2, vy: -Math.random() * 2,
                life: 18, maxLife: 18,
                color: '#C8B090', size: 3
            });
        }

        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05;
            p.life--;
            return p.life > 0;
        });
    }

    render() {
        const ctx = this.ctx;
        const sk = this.skins[this.skin] || this.skins.red;

        // 无敌闪烁
        if (this.isInvincible && !this.isBoosted && Math.floor(this.invincibleTimer / 3) % 2 === 0) {
            return this.renderParticles();
        }

        ctx.save();

        // 特效光环
        if (this.isBoosted) {
            ctx.fillStyle = 'rgba(255,69,0,0.18)';
            ctx.beginPath();
            ctx.ellipse(this.x + this.width / 2, this.y - this.height / 2, this.width * 0.9, this.height * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        if (this.hasShield) {
            ctx.strokeStyle = 'rgba(0,191,255,0.45)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(this.x + this.width / 2, this.y - this.height / 2, this.width * 0.7, this.height * 0.7, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = 'rgba(0,191,255,0.08)';
            ctx.fill();
        }
        if (this.hasMagnet) {
            ctx.strokeStyle = 'rgba(255,215,0,0.18)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y - this.height / 2, 150, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        if (this.isDucking) {
            this.drawDuck(ctx, sk);
        } else if (!this.isOnGround) {
            this.drawJump(ctx, sk);
        } else {
            this.drawRun(ctx, sk);
        }

        ctx.restore();
        this.renderParticles();
    }

    // ========================================
    //  全新绘制 —— 大比例 Q 版赤兔马
    // ========================================

    drawRun(ctx, sk) {
        const phase = this.runPhase;
        const bounce = Math.sin(phase * 2) * 2.5;

        // 锚点: 身体中心
        const cx = this.x + 44;
        const cy = this.y - 36 + bounce;

        // ── 地面阴影 ──
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.beginPath();
        ctx.ellipse(cx + 4, this.y + 2, 38, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // ── 尾巴（身体后方） ──
        this.drawTail(ctx, cx - 30, cy - 2, sk, phase);

        // ── 远侧腿 (半透明) ──
        this.drawLeg(ctx, cx - 14, cy + 14, phase, sk, true);
        this.drawLeg(ctx, cx + 16, cy + 14, phase + Math.PI, sk, true);

        // ── 身体 ──
        this.drawBodyShape(ctx, cx, cy, 34, 20, 0, sk);

        // ── 近侧腿 ──
        this.drawLeg(ctx, cx - 12, cy + 15, phase + 0.3, sk, false);
        this.drawLeg(ctx, cx + 18, cy + 15, phase + Math.PI + 0.3, sk, false);

        // ── 头颈 ──
        this.drawHead(ctx, cx + 30, cy - 12, 0, bounce * 0.2, sk, false);

        // ── 鬃毛 ──
        this.drawMane(ctx, cx + 18, cy - 22, sk, phase);
    }

    drawJump(ctx, sk) {
        const cx = this.x + 44;
        const cy = this.y - this.height + 26;

        // ── 尾巴上飘 ──
        this.drawTailUp(ctx, cx - 30, cy - 4, sk);

        // ── 远侧收腿 ──
        this.drawTucked(ctx, cx - 14, cy + 14, -0.6, sk, true);
        this.drawTucked(ctx, cx + 12, cy + 14, 0.4, sk, true);

        // ── 身体微仰 ──
        this.drawBodyShape(ctx, cx, cy, 34, 19, -0.06, sk);

        // ── 近侧收腿 ──
        this.drawTucked(ctx, cx - 10, cy + 15, -0.3, sk, false);
        this.drawTucked(ctx, cx + 16, cy + 15, 0.6, sk, false);

        // ── 头颈 (仰起，开心) ──
        this.drawHead(ctx, cx + 30, cy - 14, 0.12, -2, sk, true);

        // ── 鬃毛飞扬 ──
        this.drawManeFlying(ctx, cx + 16, cy - 24, sk);
    }

    drawDuck(ctx, sk) {
        const cx = this.x + 44;
        const cy = this.y - 18;

        // ── 阴影 ──
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.beginPath();
        ctx.ellipse(cx + 4, this.y + 2, 40, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // ── 尾巴 ──
        this.drawTail(ctx, cx - 32, cy, sk, this.runPhase);

        // ── 远侧蹲腿 ──
        this.drawCrouch(ctx, cx - 14, cy + 8, sk, true);
        this.drawCrouch(ctx, cx + 14, cy + 8, sk, true);

        // ── 扁平身体 ──
        this.drawBodyShape(ctx, cx, cy, 36, 13, 0.02, sk);

        // ── 近侧蹲腿 ──
        this.drawCrouch(ctx, cx - 12, cy + 9, sk, false);
        this.drawCrouch(ctx, cx + 16, cy + 9, sk, false);

        // ── 低头 ──
        this.drawHead(ctx, cx + 28, cy + 2, -0.05, 3, sk, false);
    }

    // -------- 身体 --------
    drawBodyShape(ctx, cx, cy, rx, ry, angle, sk) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);

        // 主体径向渐变
        const g = ctx.createRadialGradient(-rx * 0.2, -ry * 0.35, rx * 0.08, 0, 0, rx * 1.05);
        g.addColorStop(0, sk.light);
        g.addColorStop(0.45, sk.body);
        g.addColorStop(1, sk.dark);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();

        // 柔和边线
        ctx.strokeStyle = sk.dark;
        ctx.lineWidth = 0.7;
        ctx.globalAlpha = 0.2;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // 腹部浅色
        ctx.fillStyle = sk.belly;
        ctx.globalAlpha = 0.22;
        ctx.beginPath();
        ctx.ellipse(2, ry * 0.3, rx * 0.55, ry * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // 顶部高光
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.ellipse(-rx * 0.12, -ry * 0.45, rx * 0.5, ry * 0.28, -0.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // -------- 头 + 脖子 --------
    drawHead(ctx, baseX, baseY, neckTilt, headBob, sk, happy) {
        // 脖子
        const nLen = 22;
        const hx = baseX + Math.cos(neckTilt) * nLen * 0.6;
        const hy = baseY - Math.sin(0.5 + neckTilt) * nLen + headBob;

        ctx.fillStyle = sk.body;
        ctx.beginPath();
        ctx.moveTo(baseX - 8, baseY + 5);
        ctx.quadraticCurveTo(baseX, baseY - 10, hx - 6, hy + 8);
        ctx.lineTo(hx + 6, hy + 4);
        ctx.quadraticCurveTo(baseX + 10, baseY - 6, baseX + 6, baseY + 7);
        ctx.closePath();
        ctx.fill();

        // 头 —— 大而圆
        const headRX = 16;
        const headRY = 14;
        const headCX = hx + 10;
        const headCY = hy;

        // 头部渐变
        const hg = ctx.createRadialGradient(headCX - 4, headCY - 5, 2, headCX, headCY, headRX * 1.1);
        hg.addColorStop(0, sk.light);
        hg.addColorStop(0.5, sk.body);
        hg.addColorStop(1, sk.dark);
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.ellipse(headCX, headCY, headRX, headRY, 0.15, 0, Math.PI * 2);
        ctx.fill();

        // 头部高光
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.beginPath();
        ctx.ellipse(headCX - 3, headCY - 5, headRX * 0.5, headRY * 0.35, -0.1, 0, Math.PI * 2);
        ctx.fill();

        // 鼻吻浅色
        ctx.fillStyle = sk.belly;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.ellipse(headCX + 10, headCY + 3, 7, 6, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // ── 耳朵 ──
        this.drawEar(ctx, headCX - 4, headCY - headRY + 2, -0.35, sk);
        this.drawEar(ctx, headCX + 5, headCY - headRY + 1, 0.2, sk);

        // ── 大眼睛 ──
        const ex = headCX + 5;
        const ey = headCY - 1;
        // 眼白
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(ex, ey, 5.5, 6, 0.08, 0, Math.PI * 2);
        ctx.fill();
        // 眼眶淡线
        ctx.strokeStyle = sk.dark;
        ctx.lineWidth = 0.6;
        ctx.globalAlpha = 0.3;
        ctx.stroke();
        ctx.globalAlpha = 1;
        // 虹膜
        ctx.fillStyle = sk.eye;
        ctx.beginPath();
        ctx.ellipse(ex + 1, ey + 0.5, 3.8, 4.5, 0.08, 0, Math.PI * 2);
        ctx.fill();
        // 瞳孔
        ctx.fillStyle = '#0A0A0A';
        ctx.beginPath();
        ctx.ellipse(ex + 1.5, ey + 0.8, 2, 2.8, 0.08, 0, Math.PI * 2);
        ctx.fill();
        // 高光 (大)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ex + 3, ey - 1.8, 1.8, 0, Math.PI * 2);
        ctx.fill();
        // 高光 (小)
        ctx.beginPath();
        ctx.arc(ex - 0.8, ey + 2, 1, 0, Math.PI * 2);
        ctx.fill();

        // ── 鼻孔 ──
        ctx.fillStyle = sk.dark;
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.ellipse(headCX + 15, headCY + 5, 1.5, 1.2, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // ── 嘴巴 ──
        if (happy) {
            ctx.strokeStyle = sk.dark;
            ctx.globalAlpha = 0.5;
            ctx.lineWidth = 1.3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(headCX + 11, headCY + 3, 4, 0.1, Math.PI - 0.1);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // ── 腮红 ──
        ctx.fillStyle = 'rgba(255,130,110,0.22)';
        ctx.beginPath();
        ctx.ellipse(ex + 7, ey + 6, 5, 3, 0.1, 0, Math.PI * 2);
        ctx.fill();
    }

    // -------- 耳朵 --------
    drawEar(ctx, ex, ey, angle, sk) {
        ctx.save();
        ctx.translate(ex, ey);
        ctx.rotate(angle);
        // 外轮廓
        ctx.fillStyle = sk.body;
        ctx.beginPath();
        ctx.moveTo(-3.5, 1);
        ctx.quadraticCurveTo(-2, -14, 2.5, -12);
        ctx.quadraticCurveTo(5, -8, 3.5, 1);
        ctx.closePath();
        ctx.fill();
        // 内耳粉色
        ctx.fillStyle = 'rgba(230,160,140,0.55)';
        ctx.beginPath();
        ctx.moveTo(-2, 0);
        ctx.quadraticCurveTo(-0.5, -11, 1.8, -10);
        ctx.quadraticCurveTo(3.5, -7, 2.5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // -------- 鬃毛（奔跑） --------
    drawMane(ctx, mx, my, sk, phase) {
        const w1 = Math.sin(phase) * 5;
        const w2 = Math.sin(phase + 0.8) * 4;
        const w3 = Math.sin(phase + 1.6) * 3;
        const strands = [
            { dx: -2, dy: 2, cx: -14 + w1, cy: -6, ex: -18 + w1 * 0.5, ey: 6, w: 7, c: sk.mane },
            { dx: 2, dy: -2, cx: -16 + w2, cy: -10, ex: -22 + w2 * 0.4, ey: 0, w: 6, c: sk.mane2 },
            { dx: 6, dy: -5, cx: -12 + w3, cy: -12, ex: -16 + w3 * 0.3, ey: -2, w: 5, c: sk.mane3 },
            { dx: -4, dy: 5, cx: -10 + w2, cy: -3, ex: -14 + w2 * 0.5, ey: 8, w: 5.5, c: sk.mane },
        ];
        strands.forEach(s => {
            ctx.strokeStyle = s.c;
            ctx.lineWidth = s.w;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(mx + s.dx, my + s.dy);
            ctx.quadraticCurveTo(mx + s.cx, my + s.cy, mx + s.ex, my + s.ey);
            ctx.stroke();
        });
    }

    // -------- 鬃毛（跳跃飞扬） --------
    drawManeFlying(ctx, mx, my, sk) {
        const strands = [
            { dx: 0, dy: 0, w: 7, c: sk.mane },
            { dx: 4, dy: -4, w: 6, c: sk.mane2 },
            { dx: 8, dy: -1, w: 5, c: sk.mane3 },
            { dx: -3, dy: 3, w: 5.5, c: sk.mane2 },
        ];
        strands.forEach((s, i) => {
            ctx.strokeStyle = s.c;
            ctx.lineWidth = s.w;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(mx + s.dx, my + s.dy);
            ctx.bezierCurveTo(
                mx + s.dx - 18, my + s.dy - 10 - i * 2,
                mx + s.dx - 26, my + s.dy - 4 + i,
                mx + s.dx - 30, my + s.dy + 6 + i * 2
            );
            ctx.stroke();
        });
    }

    // -------- 尾巴（奔跑） --------
    drawTail(ctx, tx, ty, sk, phase) {
        const w1 = Math.sin(phase) * 7;
        const w2 = Math.sin(phase + 0.7) * 6;
        [
            { w: 7, c: sk.mane, off: 0 },
            { w: 5.5, c: sk.mane2, off: 2 },
            { w: 4, c: sk.mane3, off: -2 },
        ].forEach(s => {
            ctx.strokeStyle = s.c;
            ctx.lineWidth = s.w;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(tx, ty + s.off);
            ctx.bezierCurveTo(
                tx - 14, ty - 8 + w1 + s.off,
                tx - 24, ty - 3 + w2 + s.off,
                tx - 28, ty + 10 + w1 * 0.4 + s.off
            );
            ctx.stroke();
        });
    }

    // -------- 尾巴（跳跃上飘） --------
    drawTailUp(ctx, tx, ty, sk) {
        [
            { w: 7, c: sk.mane, off: 0 },
            { w: 5, c: sk.mane2, off: 2 },
        ].forEach(s => {
            ctx.strokeStyle = s.c;
            ctx.lineWidth = s.w;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(tx, ty + s.off);
            ctx.bezierCurveTo(tx - 16, ty - 18 + s.off, tx - 10, ty - 26 + s.off, tx - 20, ty - 22 + s.off);
            ctx.stroke();
        });
    }

    // -------- 腿（奔跑） --------
    drawLeg(ctx, lx, ly, phase, sk, far) {
        const swing = Math.sin(-phase) * 0.75;
        const uLen = 13;
        const dLen = 14;

        const kx = lx + Math.sin(swing) * uLen;
        const ky = ly + Math.cos(swing) * uLen * 0.85;
        const fx = kx + Math.sin(swing * 0.35) * dLen * 0.25;
        const fy = Math.min(ky + dLen, this.GROUND_Y);

        ctx.globalAlpha = far ? 0.55 : 1;
        const col = far ? sk.dark : sk.body;

        // 大腿
        ctx.strokeStyle = col;
        ctx.lineWidth = far ? 6 : 7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(kx, ky);
        ctx.stroke();
        // 小腿
        ctx.lineWidth = far ? 5 : 6;
        ctx.beginPath();
        ctx.moveTo(kx, ky);
        ctx.lineTo(fx, fy);
        ctx.stroke();
        // 蹄
        ctx.fillStyle = sk.hoof;
        ctx.beginPath();
        ctx.ellipse(fx, fy, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
    }

    // -------- 腿（收起） --------
    drawTucked(ctx, lx, ly, angle, sk, far) {
        ctx.globalAlpha = far ? 0.5 : 1;
        ctx.strokeStyle = far ? sk.dark : sk.body;
        ctx.lineWidth = far ? 5.5 : 6.5;
        ctx.lineCap = 'round';

        const kx = lx + Math.sin(angle) * 9;
        const ky = ly + 9;
        const fx = kx + Math.sin(angle * 0.4) * 5;
        const fy = ky + 7;

        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(kx, ky);
        ctx.lineTo(fx, fy);
        ctx.stroke();

        ctx.fillStyle = sk.hoof;
        ctx.beginPath();
        ctx.ellipse(fx, fy, 3.5, 2.5, angle * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // -------- 腿（蹲伏） --------
    drawCrouch(ctx, lx, ly, sk, far) {
        ctx.globalAlpha = far ? 0.5 : 1;
        ctx.strokeStyle = far ? sk.dark : sk.body;
        ctx.lineWidth = far ? 5.5 : 6.5;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx + 3, ly + 5);
        ctx.lineTo(lx + 1, ly + 10);
        ctx.stroke();

        ctx.fillStyle = sk.hoof;
        ctx.beginPath();
        ctx.ellipse(lx + 1, ly + 10, 3.5, 2.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // -------- 粒子 --------
    renderParticles() {
        const ctx = this.ctx;
        this.particles.forEach(p => {
            const a = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.globalAlpha = a;
            ctx.beginPath();
            ctx.arc(p.x, p.y, (p.size || 3) * a, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }
}

window.Player = Player;
