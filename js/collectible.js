// ==========================================
// collectible.js - 收集物与道具系统
// ==========================================
class CollectibleManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.W = canvas.width;
        this.H = canvas.height;
        this.GROUND_Y = this.H * 0.78;

        this.items = [];
        this.floatingTexts = [];
        this.spawnTimer = 0;
        this.spawnInterval = 60;

        // 收集物类型定义
        this.types = {
            redPacket:  { score: 10, color: '#FF0000', name: '红包', weight: 35 },
            fu:         { score: 20, color: '#FF4444', name: '福', weight: 25 },
            firecracker:{ score: 5,  color: '#FF6600', name: '鞭炮', weight: 20 },
            goldIngot:  { score: 50, color: '#FFD700', name: '元宝', weight: 10 },
            zodiac:     { score: 100,color: '#FF00FF', name: '令牌', weight: 2 },
            // 道具
            shield:     { score: 0, color: '#00BFFF', name: '护盾', weight: 3, powerUp: 'shield' },
            boost:      { score: 0, color: '#FF4500', name: '风火轮', weight: 2, powerUp: 'boost' },
            magnet:     { score: 0, color: '#FFD700', name: '磁铁', weight: 2, powerUp: 'magnet' },
            multiplier: { score: 0, color: '#FF69B4', name: '翻倍', weight: 1, powerUp: 'multiplier' }
        };

        this.weightedTypes = [];
        this.buildWeightedList();
    }

    buildWeightedList() {
        for (const [key, val] of Object.entries(this.types)) {
            for (let i = 0; i < val.weight; i++) {
                this.weightedTypes.push(key);
            }
        }
    }

    reset() {
        this.items = [];
        this.floatingTexts = [];
        this.spawnTimer = 0;
    }

    update(speed, playerHitbox, magnetRange) {
        this.spawnTimer++;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawn();
        }

        const collected = [];
        const playerCenterX = playerHitbox.x + playerHitbox.w / 2;
        const playerCenterY = playerHitbox.y + playerHitbox.h / 2;

        this.items.forEach(item => {
            // 磁铁吸附
            if (magnetRange > 0 && !item.powerUp) {
                const dx = playerCenterX - item.x;
                const dy = playerCenterY - item.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < magnetRange) {
                    const force = (magnetRange - dist) / magnetRange * 8;
                    item.x += (dx / dist) * force;
                    item.y += (dy / dist) * force;
                }
            }

            item.x -= speed;
            item.animTimer = (item.animTimer || 0) + 1;
            item.floatY = Math.sin(item.animTimer * 0.06) * 5;

            // 碰撞检测
            if (this.checkCollision(item, playerHitbox)) {
                item.collected = true;
                collected.push(item);

                // 浮动文字
                if (item.score > 0) {
                    this.floatingTexts.push({
                        x: item.x,
                        y: item.y - 10,
                        text: '+' + item.score,
                        color: item.color,
                        life: 40,
                        vy: -1.5
                    });
                }
            }
        });

        // 移除已收集或超出屏幕的
        this.items = this.items.filter(i => !i.collected && i.x > -30);

        // 更新浮动文字
        this.floatingTexts = this.floatingTexts.filter(t => {
            t.y += t.vy;
            t.life--;
            return t.life > 0;
        });

        return collected;
    }

    spawn() {
        const typeKey = this.weightedTypes[Math.floor(Math.random() * this.weightedTypes.length)];
        const typeDef = this.types[typeKey];

        // 高度变化：地面附近或空中
        const heights = [
            this.GROUND_Y - 20,   // 地面
            this.GROUND_Y - 60,   // 低空
            this.GROUND_Y - 110,  // 高空
        ];
        const y = heights[Math.floor(Math.random() * heights.length)];

        this.items.push({
            x: this.W + 30 + Math.random() * 100,
            y: y,
            baseY: y,
            w: 32,
            h: 32,
            type: typeKey,
            score: typeDef.score,
            color: typeDef.color,
            name: typeDef.name,
            powerUp: typeDef.powerUp || null,
            collected: false,
            animTimer: Math.random() * 100,
            floatY: 0
        });
    }

    checkCollision(item, hitbox) {
        return item.x < hitbox.x + hitbox.w &&
               item.x + item.w > hitbox.x &&
               item.y + item.floatY < hitbox.y + hitbox.h &&
               item.y + item.h + item.floatY > hitbox.y;
    }

    render() {
        const ctx = this.ctx;

        this.items.forEach(item => {
            const x = item.x;
            const y = item.y + item.floatY;

            ctx.save();
            // 微微旋转动画
            const rot = Math.sin(item.animTimer * 0.03) * 0.1;
            ctx.translate(x + item.w / 2, y + item.h / 2);
            ctx.rotate(rot);
            ctx.translate(-(x + item.w / 2), -(y + item.h / 2));

            switch (item.type) {
                case 'redPacket':
                    this.drawRedPacket(ctx, x, y, item);
                    break;
                case 'fu':
                    this.drawFu(ctx, x, y, item);
                    break;
                case 'firecracker':
                    this.drawSmallFirecracker(ctx, x, y, item);
                    break;
                case 'goldIngot':
                    this.drawGoldIngot(ctx, x, y, item);
                    break;
                case 'zodiac':
                    this.drawZodiac(ctx, x, y, item);
                    break;
                case 'shield':
                    this.drawShieldItem(ctx, x, y, item);
                    break;
                case 'boost':
                    this.drawBoostItem(ctx, x, y, item);
                    break;
                case 'magnet':
                    this.drawMagnetItem(ctx, x, y, item);
                    break;
                case 'multiplier':
                    this.drawMultiplierItem(ctx, x, y, item);
                    break;
            }

            ctx.restore();
        });

        // 渲染浮动文字 - 更大更醒目
        this.floatingTexts.forEach(t => {
            const alpha = t.life / 40;
            ctx.globalAlpha = alpha;
            // 文字描边
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.strokeText(t.text, t.x, t.y);
            // 文字填充
            ctx.fillStyle = t.color;
            ctx.fillText(t.text, t.x, t.y);
        });
        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';
    }

    // === 绘制收集物 ===

    drawRedPacket(ctx, x, y, item) {
        const w = 28, h = 34;
        const cx = x + w / 2, cy = y + h / 2;

        // 外发光
        const glow = 0.2 + Math.sin(item.animTimer * 0.1) * 0.12;
        const glowGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 28);
        glowGrad.addColorStop(0, `rgba(255,215,0,${glow})`);
        glowGrad.addColorStop(1, 'rgba(255,215,0,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, 28, 0, Math.PI * 2);
        ctx.fill();

        // 红包体
        const grad = ctx.createLinearGradient(x, y, x, y + h);
        grad.addColorStop(0, '#EE1111');
        grad.addColorStop(1, '#BB0000');
        ctx.fillStyle = grad;
        this.roundRect(ctx, x, y, w, h, 4);
        ctx.fill();

        // 金边
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        this.roundRect(ctx, x, y, w, h, 4);
        ctx.stroke();

        // 封口圆
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(cx, y + h * 0.35, 8, 0, Math.PI * 2);
        ctx.fill();

        // ¥符号
        ctx.fillStyle = '#CC0000';
        ctx.font = 'bold 10px serif';
        ctx.textAlign = 'center';
        ctx.fillText('¥', cx, y + h * 0.4);
        ctx.textAlign = 'left';
    }

    drawFu(ctx, x, y, item) {
        const s = 30;
        const cx = x + s / 2, cy = y + s / 2;

        // 外发光
        const glow = 0.2 + Math.sin(item.animTimer * 0.08) * 0.12;
        const glowGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 28);
        glowGrad.addColorStop(0, `rgba(255,50,0,${glow})`);
        glowGrad.addColorStop(1, 'rgba(255,0,0,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, 28, 0, Math.PI * 2);
        ctx.fill();

        // 红色菱形底
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(Math.PI / 4);
        const boxSize = s / 2.3;
        const grad = ctx.createLinearGradient(-boxSize, -boxSize, boxSize, boxSize);
        grad.addColorStop(0, '#EE0000');
        grad.addColorStop(1, '#BB0000');
        ctx.fillStyle = grad;
        ctx.fillRect(-boxSize, -boxSize, boxSize * 2, boxSize * 2);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(-boxSize, -boxSize, boxSize * 2, boxSize * 2);
        ctx.restore();

        // 福字 - 更大
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 17px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#FF8800';
        ctx.shadowBlur = 4;
        ctx.fillText('福', cx, cy + 1);
        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }

    drawSmallFirecracker(ctx, x, y, item) {
        const w = 12, h = 24;
        const fx = x + 10;
        const cy = y + h / 2 + 3;

        // 外发光
        const glow = 0.15 + Math.sin(item.animTimer * 0.12) * 0.1;
        ctx.fillStyle = `rgba(255,100,0,${glow})`;
        ctx.beginPath();
        ctx.arc(fx + w / 2, cy, 22, 0, Math.PI * 2);
        ctx.fill();

        // 鞭炮体
        const grad = ctx.createLinearGradient(fx, y + 3, fx + w, y + 3);
        grad.addColorStop(0, '#DD0000');
        grad.addColorStop(0.5, '#FF2222');
        grad.addColorStop(1, '#DD0000');
        ctx.fillStyle = grad;
        ctx.fillRect(fx, y + 3, w, h);

        // 金色装饰
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(fx, y + 3, w, 4);
        ctx.fillRect(fx, y + 3 + h - 4, w, 4);
        ctx.fillRect(fx, y + 3 + h / 2 - 1, w, 3);

        // 轮廓
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1;
        ctx.strokeRect(fx, y + 3, w, h);

        // 引线
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(fx + w / 2, y + 3);
        ctx.quadraticCurveTo(fx + w / 2 + 6, y - 3, fx + w / 2, y - 5);
        ctx.stroke();

        // 火花 - 更明亮
        const spark = Math.sin(item.animTimer * 0.2) * 2;
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.arc(fx + w / 2, y - 5, 3 + spark, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FF8800';
        ctx.beginPath();
        ctx.arc(fx + w / 2, y - 5, 5 + spark, 0, Math.PI * 2);
        ctx.fill();
    }

    drawGoldIngot(ctx, x, y, item) {
        const w = 34, h = 22;
        const cx = x + w / 2, cy = y + h / 2;

        // 强烈金光
        const glow = 0.25 + Math.sin(item.animTimer * 0.12) * 0.15;
        const glowGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 30);
        glowGrad.addColorStop(0, `rgba(255,215,0,${glow})`);
        glowGrad.addColorStop(0.5, `rgba(255,180,0,${glow * 0.5})`);
        glowGrad.addColorStop(1, 'rgba(255,215,0,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, 30, 0, Math.PI * 2);
        ctx.fill();

        // 元宝形状（船形）- 更大
        const ingotGrad = ctx.createLinearGradient(x, y, x, y + h);
        ingotGrad.addColorStop(0, '#FFE44D');
        ingotGrad.addColorStop(0.4, '#FFD700');
        ingotGrad.addColorStop(1, '#DAA520');
        ctx.fillStyle = ingotGrad;
        ctx.beginPath();
        ctx.moveTo(x + 4, y + h);
        ctx.lineTo(x - 1, y + h * 0.45);
        ctx.quadraticCurveTo(x + w * 0.2, y - 2, x + w * 0.35, y + h * 0.18);
        ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.32, x + w * 0.65, y + h * 0.18);
        ctx.quadraticCurveTo(x + w * 0.8, y - 2, x + w + 1, y + h * 0.45);
        ctx.lineTo(x + w - 4, y + h);
        ctx.closePath();
        ctx.fill();

        // 金色轮廓
        ctx.strokeStyle = '#FFE44D';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 高光
        ctx.fillStyle = 'rgba(255,255,230,0.6)';
        ctx.beginPath();
        ctx.ellipse(cx, y + h * 0.3, w * 0.2, h * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // 底部高光线
        ctx.strokeStyle = 'rgba(255,255,200,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 8, y + h - 3);
        ctx.lineTo(x + w - 8, y + h - 3);
        ctx.stroke();
    }

    drawZodiac(ctx, x, y, item) {
        const r = 16;
        const cx = x + r;
        const cy = y + r;

        // 强力外发光 - 彩虹色脉冲
        const glow = Math.sin(item.animTimer * 0.08);
        const glowGrad = ctx.createRadialGradient(cx, cy, r, cx, cy, r + 18);
        glowGrad.addColorStop(0, `rgba(255,0,255,${0.3 + glow * 0.2})`);
        glowGrad.addColorStop(0.5, `rgba(255,100,255,${0.15 + glow * 0.1})`);
        glowGrad.addColorStop(1, 'rgba(255,0,255,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 18, 0, Math.PI * 2);
        ctx.fill();

        // 令牌底 - 渐变
        const tokenGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
        tokenGrad.addColorStop(0, '#A0622D');
        tokenGrad.addColorStop(1, '#6B3A1F');
        ctx.fillStyle = tokenGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        // 金边 - 更粗
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
        ctx.stroke();

        // 马字 - 更大
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 15px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#FF8800';
        ctx.shadowBlur = 4;
        ctx.fillText('马', cx, cy + 1);
        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';

        // 旋转光效 - 更多射线
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(item.animTimer * 0.05);
        for (let i = 0; i < 6; i++) {
            ctx.rotate(Math.PI / 3);
            ctx.fillStyle = `rgba(255,215,0,${0.4 + glow * 0.2})`;
            ctx.fillRect(-1.5, r + 2, 3, 6);
        }
        ctx.restore();
    }

    drawShieldItem(ctx, x, y, item) {
        const s = 24;
        // 盾牌形状
        ctx.fillStyle = '#00BFFF';
        ctx.beginPath();
        ctx.moveTo(x + s / 2, y);
        ctx.lineTo(x + s, y + s * 0.3);
        ctx.lineTo(x + s * 0.85, y + s * 0.7);
        ctx.quadraticCurveTo(x + s / 2, y + s + 2, x + s * 0.15, y + s * 0.7);
        ctx.lineTo(x, y + s * 0.3);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 马鞍图标
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('盾', x + s / 2, y + s * 0.55);
        ctx.textAlign = 'left';

        this.drawItemGlow(ctx, x + s / 2, y + s / 2, '#00BFFF', item);
    }

    drawBoostItem(ctx, x, y, item) {
        const s = 24;
        const cx = x + s / 2;
        const cy = y + s / 2;

        // 风火轮
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(item.animTimer * 0.1);

        // 轮子
        ctx.strokeStyle = '#FF4500';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.stroke();

        // 火焰
        for (let i = 0; i < 4; i++) {
            ctx.rotate(Math.PI / 2);
            ctx.fillStyle = i % 2 === 0 ? '#FF4500' : '#FFD700';
            ctx.beginPath();
            ctx.moveTo(8, -3);
            ctx.lineTo(14, 0);
            ctx.lineTo(8, 3);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();

        this.drawItemGlow(ctx, cx, cy, '#FF4500', item);
    }

    drawMagnetItem(ctx, x, y, item) {
        const s = 24;
        // 铜钱形状的磁铁
        const cx = x + s / 2;
        const cy = y + s / 2;

        ctx.fillStyle = '#DAA520';
        ctx.beginPath();
        ctx.arc(cx, cy, 11, 0, Math.PI * 2);
        ctx.fill();

        // 方孔
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(cx - 4, cy - 4, 8, 8);

        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, 11, 0, Math.PI * 2);
        ctx.stroke();

        // 磁力线
        ctx.strokeStyle = `rgba(255,215,0,${0.3 + Math.sin(item.animTimer * 0.1) * 0.2})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(cx, cy, 14 + i * 3, 0, Math.PI * 0.5);
            ctx.stroke();
        }

        this.drawItemGlow(ctx, cx, cy, '#FFD700', item);
    }

    drawMultiplierItem(ctx, x, y, item) {
        const s = 24;
        const cx = x + s / 2;
        const cy = y + s / 2;

        // 春联卷轴
        ctx.fillStyle = '#CC0000';
        ctx.fillRect(x + 3, y + 3, s - 6, s - 6);

        ctx.fillStyle = '#FFD700';
        ctx.fillRect(x + 2, y + 2, s - 4, 4);
        ctx.fillRect(x + 2, y + s - 6, s - 4, 4);

        // x2 文字
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('x2', cx, cy + 1);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';

        this.drawItemGlow(ctx, cx, cy, '#FF69B4', item);
    }

    drawItemGlow(ctx, cx, cy, color, item) {
        const glow = 0.25 + Math.sin(item.animTimer * 0.1) * 0.15;
        // 径向渐变光晕
        ctx.save();
        ctx.globalAlpha = glow;
        const grad = ctx.createRadialGradient(cx, cy, 3, cx, cy, 26);
        grad.addColorStop(0, color);
        grad.addColorStop(0.5, color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
}

window.CollectibleManager = CollectibleManager;
