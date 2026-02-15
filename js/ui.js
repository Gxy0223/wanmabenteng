// ==========================================
// ui.js - 界面管理
// ==========================================
class UI {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.W = canvas.width;
        this.H = canvas.height;

        // HUD状态
        this.displayScore = 0;
        this.comboCount = 0;
        this.comboTimer = 0;

        // 动画状态
        this.titleAnim = 0;
        this.gameOverAnim = 0;
        this.newRecordFlash = 0;
    }

    // === 开始画面 ===
    renderStartScreen() {
        const ctx = this.ctx;
        const W = this.W;
        const H = this.H;

        // 半透明遮罩
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, W, H);

        this.titleAnim += 0.02;

        // 标题装饰框
        const titleY = H * 0.22 + Math.sin(this.titleAnim) * 5;
        this.drawTitleBox(ctx, W / 2, titleY);

        // 游戏标题
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 42px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#FF4500';
        ctx.shadowBlur = 10;
        ctx.fillText('万马奔腾', W / 2, titleY);
        ctx.shadowBlur = 0;

        // 副标题
        ctx.fillStyle = '#FFE4B5';
        ctx.font = '16px serif';
        ctx.fillText('马年贺岁 · 横版跑酷', W / 2, titleY + 35);

        // 最高分
        const highScore = window.GameStorage.getHighScore();
        if (highScore > 0) {
            ctx.fillStyle = '#FFA500';
            ctx.font = '14px Arial';
            ctx.fillText('最高分: ' + highScore, W / 2, titleY + 60);
        }

        // 开始按钮
        this.startBtnY = H * 0.52;
        this.drawButton(ctx, W / 2, this.startBtnY, 180, 50, '开始游戏', '#CC0000', '#FFD700');

        // 排行榜按钮
        this.rankBtnY = H * 0.65;
        this.drawButton(ctx, W / 2, this.rankBtnY, 180, 42, '排行榜', '#B8860B', '#FFFFFF');

        // 操作说明
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '13px Arial';
        const instructions = [
            '⬆ / 空格  跳跃 (可二段跳)',
            '⬇  下蹲 / 快速下落',
            '收集红包福字，躲避年兽障碍'
        ];
        instructions.forEach((text, i) => {
            ctx.fillText(text, W / 2, H * 0.78 + i * 20);
        });

        // 触屏提示
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '12px Arial';
        ctx.fillText('触屏: 点击跳跃 | 下滑下蹲', W / 2, H * 0.94);

        // 音效开关
        const soundOn = window.GameAudio.enabled;
        ctx.fillStyle = soundOn ? 'rgba(255,255,255,0.6)' : 'rgba(255,100,100,0.6)';
        ctx.font = '20px Arial';
        ctx.fillText(soundOn ? '🔊' : '🔇', W - 40, 30);

        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }

    drawTitleBox(ctx, cx, cy) {
        const w = 280, h = 55;
        // 外框
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        this.roundRectStroke(ctx, cx - w / 2, cy - h / 2, w, h, 8);

        // 内框
        ctx.strokeStyle = 'rgba(255,215,0,0.4)';
        ctx.lineWidth = 1;
        this.roundRectStroke(ctx, cx - w / 2 + 5, cy - h / 2 + 5, w - 10, h - 10, 5);

        // 角装饰
        ctx.fillStyle = '#FFD700';
        const corners = [
            [cx - w / 2, cy - h / 2],
            [cx + w / 2, cy - h / 2],
            [cx - w / 2, cy + h / 2],
            [cx + w / 2, cy + h / 2]
        ];
        corners.forEach(([x, y]) => {
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    drawButton(ctx, cx, cy, w, h, text, bgColor, textColor) {
        // 按钮底色
        const grad = ctx.createLinearGradient(cx - w / 2, cy - h / 2, cx - w / 2, cy + h / 2);
        grad.addColorStop(0, bgColor);
        // 自动生成较暗的底部颜色
        grad.addColorStop(1, this.darkenColor(bgColor, 0.4));
        ctx.fillStyle = grad;
        this.roundRectFill(ctx, cx - w / 2, cy - h / 2, w, h, 10);

        // 金边
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        this.roundRectStroke(ctx, cx - w / 2, cy - h / 2, w, h, 10);

        // 文字
        ctx.fillStyle = textColor;
        ctx.font = 'bold 20px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, cx, cy);
    }

    // === 游戏HUD ===
    renderHUD(score, distance, player) {
        const ctx = this.ctx;

        // 平滑分数显示
        this.displayScore += (score - this.displayScore) * 0.1;
        const showScore = Math.round(this.displayScore);

        // 分数面板
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        this.roundRectFill(ctx, 10, 10, 160, 55, 8);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(showScore, 20, 38);

        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '12px Arial';
        ctx.fillText(Math.floor(distance) + ' m', 20, 55);

        // 暂停按钮（右上角）
        this.pauseBtnX = this.W - 30;
        this.pauseBtnY = 25;
        this.pauseBtnR = 16;
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.arc(this.pauseBtnX, this.pauseBtnY, this.pauseBtnR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,215,0,0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(this.pauseBtnX, this.pauseBtnY, this.pauseBtnR, 0, Math.PI * 2);
        ctx.stroke();
        // 暂停图标 ❚❚
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(this.pauseBtnX - 5, this.pauseBtnY - 7, 4, 14);
        ctx.fillRect(this.pauseBtnX + 2, this.pauseBtnY - 7, 4, 14);

        // 道具状态图标
        let iconX = this.W - 65;
        const iconY = 25;

        if (player.hasShield) {
            this.drawStatusIcon(ctx, iconX, iconY, '🛡', '#00BFFF');
            iconX -= 35;
        }
        if (player.isBoosted) {
            this.drawStatusIcon(ctx, iconX, iconY, '🔥', '#FF4500');
            this.drawTimerBar(ctx, iconX - 12, iconY + 15, 24, player.boostTimer, 300);
            iconX -= 35;
        }
        if (player.hasMagnet) {
            this.drawStatusIcon(ctx, iconX, iconY, '🧲', '#FFD700');
            this.drawTimerBar(ctx, iconX - 12, iconY + 15, 24, player.magnetTimer, 480);
            iconX -= 35;
        }
        if (player.scoreMultiplier > 1) {
            this.drawStatusIcon(ctx, iconX, iconY, 'x2', '#FF69B4');
            this.drawTimerBar(ctx, iconX - 12, iconY + 15, 24, player.multiplierTimer, 600);
            iconX -= 35;
        }

        // 连击
        if (this.comboTimer > 0) {
            this.comboTimer--;
            const alpha = Math.min(1, this.comboTimer / 30);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#FF4500';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('连击 x' + this.comboCount, this.W / 2, 40);
            ctx.globalAlpha = 1;
            ctx.textAlign = 'left';
        }

        // 音效开关
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '16px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(window.GameAudio.enabled ? '🔊' : '🔇', this.W - 10, this.H - 15);
        ctx.textAlign = 'left';
    }

    drawStatusIcon(ctx, x, y, icon, color) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.font = icon.length > 1 ? 'bold 12px Arial' : '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, x, y);
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'left';
    }

    drawTimerBar(ctx, x, y, w, current, max) {
        const ratio = current / max;
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(x, y, w, 3);
        ctx.fillStyle = ratio > 0.3 ? '#4CAF50' : '#FF5722';
        ctx.fillRect(x, y, w * ratio, 3);
    }

    addCombo() {
        this.comboCount++;
        this.comboTimer = 60;
    }

    resetCombo() {
        this.comboCount = 0;
    }

    // === 游戏结束画面 ===
    renderGameOver(score, distance, isNewRecord) {
        const ctx = this.ctx;
        const W = this.W;
        const H = this.H;

        this.gameOverAnim = Math.min(1, this.gameOverAnim + 0.03);
        const anim = this.easeOutBack(this.gameOverAnim);

        // 遮罩
        ctx.fillStyle = `rgba(0,0,0,${0.5 * this.gameOverAnim})`;
        ctx.fillRect(0, 0, W, H);

        const panelY = H * 0.15 + (1 - anim) * 50;

        // 结算面板
        ctx.fillStyle = 'rgba(40,10,10,0.9)';
        this.roundRectFill(ctx, W / 2 - 150, panelY, 300, 280, 15);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        this.roundRectStroke(ctx, W / 2 - 150, panelY, 300, 280, 15);

        ctx.textAlign = 'center';

        // 标题
        ctx.fillStyle = '#FF4444';
        ctx.font = 'bold 28px serif';
        ctx.fillText('游戏结束', W / 2, panelY + 40);

        // 新纪录
        if (isNewRecord) {
            this.newRecordFlash += 0.1;
            ctx.fillStyle = `rgba(255,215,0,${0.5 + Math.sin(this.newRecordFlash) * 0.5})`;
            ctx.font = 'bold 16px Arial';
            ctx.fillText('🎉 新纪录！ 🎉', W / 2, panelY + 65);
        }

        // 分数
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 36px Arial';
        ctx.fillText(score, W / 2, panelY + 105);

        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '14px Arial';
        ctx.fillText('距离: ' + Math.floor(distance) + 'm', W / 2, panelY + 130);

        // 最高分
        ctx.fillStyle = '#FFA500';
        ctx.font = '14px Arial';
        ctx.fillText('最高分: ' + window.GameStorage.getHighScore(), W / 2, panelY + 155);

        // 按钮
        if (this.gameOverAnim >= 1) {
            // 再来一局
            this.restartBtnY = panelY + 195;
            this.drawButton(ctx, W / 2, this.restartBtnY, 160, 42, '再来一局', '#CC0000', '#FFD700');

            // 返回主页
            this.homeBtnY = panelY + 250;
            this.drawButton(ctx, W / 2, this.homeBtnY, 160, 42, '返回主页', '#555555', '#FFFFFF');
        }

        ctx.textAlign = 'left';
    }

    resetGameOver() {
        this.gameOverAnim = 0;
        this.newRecordFlash = 0;
        this.displayScore = 0;
    }

    // === 暂停画面 ===
    renderPause() {
        const ctx = this.ctx;
        const W = this.W;
        const H = this.H;

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, W, H);

        // 暂停面板
        ctx.fillStyle = 'rgba(40,10,10,0.9)';
        this.roundRectFill(ctx, W / 2 - 130, H / 2 - 90, 260, 180, 15);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        this.roundRectStroke(ctx, W / 2 - 130, H / 2 - 90, 260, 180, 15);

        ctx.textAlign = 'center';

        // 标题
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 30px serif';
        ctx.fillText('暂停', W / 2, H / 2 - 50);

        // 继续游戏按钮
        this.resumeBtnY = H / 2 + 5;
        this.drawButton(ctx, W / 2, this.resumeBtnY, 180, 42, '继续游戏', '#CC0000', '#FFD700');

        // 结束游戏按钮
        this.endBtnY = H / 2 + 60;
        this.drawButton(ctx, W / 2, this.endBtnY, 180, 42, '结束游戏', '#555555', '#FFFFFF');

        // 提示
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.font = '12px Arial';
        ctx.fillText('按 ESC / P 继续', W / 2, H / 2 + 95);

        ctx.textAlign = 'left';
    }

    // === 辅助方法 ===
    roundRectFill(ctx, x, y, w, h, r) {
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
        ctx.fill();
    }

    roundRectStroke(ctx, x, y, w, h, r) {
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
        ctx.stroke();
    }

    darkenColor(hex, factor) {
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);
        r = Math.floor(r * (1 - factor));
        g = Math.floor(g * (1 - factor));
        b = Math.floor(b * (1 - factor));
        return `rgb(${r},${g},${b})`;
    }

    easeOutBack(t) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    // === 排行榜画面 ===
    renderRanking(rankings, currentRank) {
        const ctx = this.ctx;
        const W = this.W;
        const H = this.H;

        // 遮罩
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, W, H);

        // 面板
        const pw = 380, ph = 360;
        const px = W / 2 - pw / 2, py = H / 2 - ph / 2;
        ctx.fillStyle = 'rgba(30,8,8,0.95)';
        this.roundRectFill(ctx, px, py, pw, ph, 15);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        this.roundRectStroke(ctx, px, py, pw, ph, 15);

        ctx.textAlign = 'center';

        // 标题
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 26px serif';
        ctx.fillText('排行榜', W / 2, py + 35);

        // 表头
        const tableTop = py + 58;
        ctx.fillStyle = 'rgba(255,215,0,0.3)';
        this.roundRectFill(ctx, px + 15, tableTop, pw - 30, 24, 4);

        ctx.fillStyle = '#FFE4B5';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('排名', px + 25, tableTop + 16);
        ctx.fillText('玩家', px + 75, tableTop + 16);
        ctx.textAlign = 'right';
        ctx.fillText('分数', px + pw - 120, tableTop + 16);
        ctx.fillText('距离', px + pw - 50, tableTop + 16);

        // 排行数据（最多显示10条）
        const showCount = Math.min(rankings.length, 10);
        for (let i = 0; i < showCount; i++) {
            const r = rankings[i];
            const rowY = tableTop + 28 + i * 24;

            // 当前玩家高亮
            if (currentRank && i === currentRank - 1) {
                ctx.fillStyle = 'rgba(255,215,0,0.12)';
                this.roundRectFill(ctx, px + 15, rowY - 4, pw - 30, 22, 3);
            }

            // 排名
            ctx.textAlign = 'left';
            if (i < 3) {
                const medals = ['#FFD700', '#C0C0C0', '#CD7F32'];
                ctx.fillStyle = medals[i];
                ctx.font = 'bold 13px Arial';
            } else {
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.font = '13px Arial';
            }
            ctx.fillText(i + 1, px + 30, rowY + 12);

            // 名字
            ctx.fillStyle = i < 3 ? '#FFE4B5' : 'rgba(255,255,255,0.75)';
            ctx.font = '13px Arial';
            ctx.fillText(r.name, px + 75, rowY + 12);

            // 分数
            ctx.textAlign = 'right';
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 13px Arial';
            ctx.fillText(r.score, px + pw - 120, rowY + 12);

            // 距离
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '12px Arial';
            ctx.fillText(r.distance + 'm', px + pw - 50, rowY + 12);
        }

        // 无数据提示
        if (rankings.length === 0) {
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '15px Arial';
            ctx.fillText('暂无排名记录', W / 2, H / 2 + 10);
            ctx.fillText('开始游戏创造纪录吧！', W / 2, H / 2 + 35);
        }

        // 返回按钮
        ctx.textAlign = 'center';
        this.rankBackBtnY = py + ph - 32;
        this.drawButton(ctx, W / 2, this.rankBackBtnY, 140, 38, '返回', '#555555', '#FFFFFF');

        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }

    // === 游戏结束 - 含排名信息 ===
    renderGameOverWithRank(score, distance, isNewRecord, playerName, rank) {
        const ctx = this.ctx;
        const W = this.W;
        const H = this.H;

        this.gameOverAnim = Math.min(1, this.gameOverAnim + 0.03);
        const anim = this.easeOutBack(this.gameOverAnim);

        // 遮罩
        ctx.fillStyle = `rgba(0,0,0,${0.5 * this.gameOverAnim})`;
        ctx.fillRect(0, 0, W, H);

        const panelY = H * 0.1 + (1 - anim) * 50;

        // 结算面板（加高以容纳排名信息）
        ctx.fillStyle = 'rgba(40,10,10,0.9)';
        this.roundRectFill(ctx, W / 2 - 155, panelY, 310, 330, 15);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        this.roundRectStroke(ctx, W / 2 - 155, panelY, 310, 330, 15);

        ctx.textAlign = 'center';

        // 标题
        ctx.fillStyle = '#FF4444';
        ctx.font = 'bold 28px serif';
        ctx.fillText('游戏结束', W / 2, panelY + 38);

        // 新纪录
        if (isNewRecord) {
            this.newRecordFlash += 0.1;
            ctx.fillStyle = `rgba(255,215,0,${0.5 + Math.sin(this.newRecordFlash) * 0.5})`;
            ctx.font = 'bold 16px Arial';
            ctx.fillText('🎉 新纪录！ 🎉', W / 2, panelY + 60);
        }

        // 玩家名
        ctx.fillStyle = '#FFE4B5';
        ctx.font = '15px Arial';
        ctx.fillText(playerName, W / 2, panelY + 82);

        // 分数
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 36px Arial';
        ctx.fillText(score, W / 2, panelY + 120);

        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '14px Arial';
        ctx.fillText('距离: ' + Math.floor(distance) + 'm', W / 2, panelY + 145);

        // 排名信息
        if (rank > 0) {
            ctx.fillStyle = rank <= 3 ? '#FFD700' : '#FFA500';
            ctx.font = 'bold 16px Arial';
            ctx.fillText('排名 第 ' + rank + ' 名', W / 2, panelY + 175);
        }

        // 最高分
        ctx.fillStyle = '#FFA500';
        ctx.font = '13px Arial';
        ctx.fillText('最高分: ' + window.GameStorage.getHighScore(), W / 2, panelY + 198);

        // 按钮
        if (this.gameOverAnim >= 1) {
            // 再来一局
            this.restartBtnY = panelY + 235;
            this.drawButton(ctx, W / 2, this.restartBtnY, 160, 42, '再来一局', '#CC0000', '#FFD700');

            // 排行榜
            this.goRankBtnY = panelY + 280;
            this.drawButton(ctx, W / 2 - 85, this.goRankBtnY, 120, 36, '排行榜', '#B8860B', '#FFFFFF');

            // 返回主页
            this.homeBtnY = panelY + 280;
            this.drawButton(ctx, W / 2 + 85, this.homeBtnY, 120, 36, '返回主页', '#555555', '#FFFFFF');
        }

        ctx.textAlign = 'left';
    }

    // 点击检测
    isClickOnButton(x, y, btnCx, btnCy, btnW, btnH) {
        return x >= btnCx - btnW / 2 && x <= btnCx + btnW / 2 &&
               y >= btnCy - btnH / 2 && y <= btnCy + btnH / 2;
    }
}

window.UI = UI;
