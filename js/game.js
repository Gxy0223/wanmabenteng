// ==========================================
// game.js - 游戏主逻辑控制器
// ==========================================
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // 画布尺寸
        this.BASE_W = 800;
        this.BASE_H = 450;
        this.canvas.width = this.BASE_W;
        this.canvas.height = this.BASE_H;

        // 游戏状态
        this.state = 'menu'; // menu, nameInput, playing, paused, gameOver, ranking
        this.score = 0;
        this.distance = 0;
        this.speed = 5;
        this.baseSpeed = 5;
        this.maxSpeed = 12;
        this.difficulty = 0;
        this.frameCount = 0;

        // 玩家信息
        this.playerName = window.GameStorage.getPlayerName() || '';
        this.currentRank = 0; // 本局排名

        // 初始化子系统
        this.scene = new window.Scene(this.canvas);
        this.player = new window.Player(this.canvas);
        this.obstacles = new window.ObstacleManager(this.canvas);
        this.collectibles = new window.CollectibleManager(this.canvas);
        this.ui = new window.UI(this.canvas);

        // 屏幕震动
        this.shakeIntensity = 0;
        this.shakeDuration = 0;

        // 烟花粒子（生肖令牌特效）
        this.fireworks = [];

        // 绑定事件
        this.bindEvents();

        // 自适应尺寸
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // 启动游戏循环
        this.lastTime = performance.now();
        this.loop();
    }

    resize() {
        const container = this.canvas.parentElement;
        const maxW = container.clientWidth;
        const maxH = container.clientHeight || window.innerHeight;
        const ratio = this.BASE_W / this.BASE_H;

        let w = maxW;
        let h = w / ratio;
        if (h > maxH) {
            h = maxH;
            w = h * ratio;
        }

        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        this.scaleX = this.BASE_W / w;
        this.scaleY = this.BASE_H / h;
    }

    bindEvents() {
        // 键盘事件
        const keys = {};
        window.addEventListener('keydown', (e) => {
            if (keys[e.code]) return;
            keys[e.code] = true;
            this.handleKeyDown(e.code);
        });
        window.addEventListener('keyup', (e) => {
            keys[e.code] = false;
            this.handleKeyUp(e.code);
        });

        // 鼠标/触摸事件
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });

        this.touchStartY = 0;
        this.touchStartTime = 0;

        // 名字输入相关DOM
        this.nameOverlay = document.getElementById('name-input-overlay');
        this.nameInput = document.getElementById('player-name-input');
        this.nameError = document.getElementById('name-error');
        this.nameConfirmBtn = document.getElementById('name-confirm-btn');
        this.nameCancelBtn = document.getElementById('name-cancel-btn');

        this.nameConfirmBtn.addEventListener('click', () => this.confirmName());
        this.nameCancelBtn.addEventListener('click', () => this.cancelNameInput());
        this.nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.confirmName();
            if (e.key === 'Escape') this.cancelNameInput();
            e.stopPropagation();
        });
        this.nameInput.addEventListener('keyup', (e) => e.stopPropagation());
    }

    handleKeyDown(code) {
        if (this.state === 'menu') {
            window.GameAudio.init();
            window.GameAudio.click();
            this.tryStartGame();
            return;
        }

        if (this.state === 'nameInput' || this.state === 'ranking') {
            return; // 由DOM处理
        }

        if (this.state === 'gameOver') {
            return; // 由按钮处理
        }

        if (this.state === 'paused') {
            if (code === 'Escape' || code === 'KeyP') {
                this.state = 'playing';
            }
            return;
        }

        if (this.state === 'playing') {
            switch (code) {
                case 'Space':
                case 'ArrowUp':
                case 'KeyW':
                    this.player.jump();
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.player.duck(true);
                    break;
                case 'Escape':
                case 'KeyP':
                    this.state = 'paused';
                    break;
            }
        }
    }

    handleKeyUp(code) {
        if (this.state === 'playing') {
            if (code === 'ArrowDown' || code === 'KeyS') {
                this.player.duck(false);
            }
        }
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * this.scaleX;
        const y = (e.clientY - rect.top) * this.scaleY;

        if (this.state === 'menu') {
            window.GameAudio.init();

            // 音效开关检测
            if (x > this.BASE_W - 60 && y < 50) {
                window.GameAudio.toggle();
                return;
            }

            const cx = this.BASE_W / 2;
            // 排行榜按钮
            if (this.ui.rankBtnY && this.ui.isClickOnButton(x, y, cx, this.ui.rankBtnY, 180, 42)) {
                window.GameAudio.click();
                this.state = 'ranking';
                this.currentRank = 0;
                return;
            }

            // 开始按钮或其它区域
            window.GameAudio.click();
            this.tryStartGame();
            return;
        }

        if (this.state === 'ranking') {
            const cx = this.BASE_W / 2;
            if (this.ui.rankBackBtnY && this.ui.isClickOnButton(x, y, cx, this.ui.rankBackBtnY, 140, 38)) {
                window.GameAudio.click();
                this.state = this._rankReturnState || 'menu';
                return;
            }
            return;
        }

        if (this.state === 'gameOver') {
            if (this.ui.gameOverAnim >= 1) {
                const cx = this.BASE_W / 2;
                // 再来一局
                if (this.ui.restartBtnY && this.ui.isClickOnButton(x, y, cx, this.ui.restartBtnY, 160, 42)) {
                    window.GameAudio.click();
                    this.restartGame();
                    return;
                }
                // 排行榜
                if (this.ui.goRankBtnY && this.ui.isClickOnButton(x, y, cx - 85, this.ui.goRankBtnY, 120, 36)) {
                    window.GameAudio.click();
                    this._rankReturnState = 'gameOver';
                    this.state = 'ranking';
                    return;
                }
                // 返回主页
                if (this.ui.homeBtnY && this.ui.isClickOnButton(x, y, cx + 85, this.ui.homeBtnY, 120, 36)) {
                    window.GameAudio.click();
                    this.goToMenu();
                    return;
                }
            }
            return;
        }

        if (this.state === 'paused') {
            const cx = this.BASE_W / 2;
            // 继续游戏
            if (this.ui.resumeBtnY && this.ui.isClickOnButton(x, y, cx, this.ui.resumeBtnY, 180, 42)) {
                window.GameAudio.click();
                this.state = 'playing';
                return;
            }
            // 结束游戏
            if (this.ui.endBtnY && this.ui.isClickOnButton(x, y, cx, this.ui.endBtnY, 180, 42)) {
                window.GameAudio.click();
                this.gameOver();
                return;
            }
            return;
        }

        if (this.state === 'playing') {
            // 暂停按钮点击检测
            const pbx = this.ui.pauseBtnX;
            const pby = this.ui.pauseBtnY;
            const pbr = this.ui.pauseBtnR;
            if (pbx && Math.hypot(x - pbx, y - pby) <= pbr + 4) {
                window.GameAudio.click();
                this.state = 'paused';
                return;
            }
            // 音效开关
            if (x > this.BASE_W - 40 && y > this.BASE_H - 35) {
                window.GameAudio.toggle();
                return;
            }
            this.player.jump();
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.touchStartY = touch.clientY;
        this.touchStartTime = Date.now();

        if (this.state === 'menu') {
            window.GameAudio.init();
            const rect = this.canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left) * this.scaleX;
            const y = (touch.clientY - rect.top) * this.scaleY;
            if (x > this.BASE_W - 60 && y < 50) {
                window.GameAudio.toggle();
                return;
            }
            const cx = this.BASE_W / 2;
            if (this.ui.rankBtnY && this.ui.isClickOnButton(x, y, cx, this.ui.rankBtnY, 180, 42)) {
                window.GameAudio.click();
                this.state = 'ranking';
                this.currentRank = 0;
                return;
            }
            window.GameAudio.click();
            this.tryStartGame();
            return;
        }

        if (this.state === 'ranking') {
            const rect = this.canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left) * this.scaleX;
            const y = (touch.clientY - rect.top) * this.scaleY;
            const cx = this.BASE_W / 2;
            if (this.ui.rankBackBtnY && this.ui.isClickOnButton(x, y, cx, this.ui.rankBackBtnY, 140, 38)) {
                window.GameAudio.click();
                this.state = this._rankReturnState || 'menu';
                return;
            }
            return;
        }

        if (this.state === 'gameOver') {
            if (this.ui.gameOverAnim >= 1) {
                const rect = this.canvas.getBoundingClientRect();
                const x = (touch.clientX - rect.left) * this.scaleX;
                const y = (touch.clientY - rect.top) * this.scaleY;
                const cx = this.BASE_W / 2;
                if (this.ui.restartBtnY && this.ui.isClickOnButton(x, y, cx, this.ui.restartBtnY, 160, 42)) {
                    window.GameAudio.click();
                    this.restartGame();
                    return;
                }
                if (this.ui.goRankBtnY && this.ui.isClickOnButton(x, y, cx - 85, this.ui.goRankBtnY, 120, 36)) {
                    window.GameAudio.click();
                    this._rankReturnState = 'gameOver';
                    this.state = 'ranking';
                    return;
                }
                if (this.ui.homeBtnY && this.ui.isClickOnButton(x, y, cx + 85, this.ui.homeBtnY, 120, 36)) {
                    window.GameAudio.click();
                    this.goToMenu();
                    return;
                }
            }
            return;
        }

        if (this.state === 'paused') {
            const rect = this.canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left) * this.scaleX;
            const y = (touch.clientY - rect.top) * this.scaleY;
            const cx = this.BASE_W / 2;
            if (this.ui.resumeBtnY && this.ui.isClickOnButton(x, y, cx, this.ui.resumeBtnY, 180, 42)) {
                window.GameAudio.click();
                this.state = 'playing';
                return;
            }
            if (this.ui.endBtnY && this.ui.isClickOnButton(x, y, cx, this.ui.endBtnY, 180, 42)) {
                window.GameAudio.click();
                this.gameOver();
                return;
            }
            return;
        }
    }

    handleTouchEnd(e) {
        e.preventDefault();
        if (this.state !== 'playing') return;

        const touch = e.changedTouches[0];
        const deltaY = touch.clientY - this.touchStartY;
        const deltaTime = Date.now() - this.touchStartTime;

        if (deltaTime < 300) {
            if (deltaY > 30) {
                // 下滑 -> 下蹲
                this.player.duck(true);
                setTimeout(() => this.player.duck(false), 500);
            } else if (deltaY < -30) {
                // 上滑 -> 跳跃
                this.player.jump();
            } else {
                // 点击 -> 跳跃
                this.player.jump();
            }
        }
    }

    // === 名字输入 ===
    tryStartGame() {
        // 已有名字，直接开始；否则弹出输入框
        if (this.playerName) {
            this.startGame();
        } else {
            this.showNameInput();
        }
    }

    showNameInput() {
        this.state = 'nameInput';
        this.nameOverlay.classList.add('active');
        this.nameInput.value = this.playerName;
        this.nameError.textContent = '';
        setTimeout(() => this.nameInput.focus(), 100);
    }

    confirmName() {
        const name = this.nameInput.value.trim();
        // 验证: 1-6位汉字或字母
        const valid = /^[a-zA-Z\u4e00-\u9fff]{1,6}$/.test(name);
        if (!valid) {
            this.nameError.textContent = '请输入1-6位汉字或字母';
            this.nameInput.focus();
            return;
        }
        this.playerName = name;
        window.GameStorage.setPlayerName(name);
        this.nameOverlay.classList.remove('active');
        this.startGame();
    }

    cancelNameInput() {
        this.nameOverlay.classList.remove('active');
        this.state = 'menu';
    }

    startGame() {
        this.state = 'playing';
        this.score = 0;
        this.distance = 0;
        this.speed = this.baseSpeed;
        this.difficulty = 0;
        this.frameCount = 0;
        this.fireworks = [];
        this.currentRank = 0;
        this.player.reset();
        this.obstacles.reset();
        this.collectibles.reset();
        this.ui.resetGameOver();
        this.ui.resetCombo();
    }

    restartGame() {
        // 已有名字，直接重新开始
        if (this.playerName) {
            this.startGame();
        } else {
            this.showNameInput();
        }
    }

    goToMenu() {
        this.state = 'menu';
        this.ui.resetGameOver();
        this.player.reset();
        this.obstacles.reset();
        this.collectibles.reset();
        this.fireworks = [];
    }

    // === 游戏主循环 ===
    loop() {
        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 16.67, 2); // 标准化到60fps
        this.lastTime = now;

        this.update(dt);
        this.render();

        requestAnimationFrame(() => this.loop());
    }

    update(dt) {
        if (this.state !== 'playing') return;

        this.frameCount++;

        // 难度递增
        this.difficulty = Math.floor(this.frameCount / 600); // 每10秒增加难度
        this.speed = Math.min(this.maxSpeed, this.baseSpeed + this.difficulty * 0.5);

        // 加速道具
        const effectiveSpeed = this.player.isBoosted ? this.speed * 2 : this.speed;

        // 距离
        this.distance += effectiveSpeed * 0.05 * dt;

        // 更新各系统
        this.scene.update(effectiveSpeed, dt);
        this.player.update();
        this.obstacles.update(effectiveSpeed, this.difficulty);

        // 收集物更新与碰撞
        const playerHitbox = this.player.getHitbox();
        const magnetRange = this.player.getMagnetRange();
        const collected = this.collectibles.update(effectiveSpeed, playerHitbox, magnetRange);

        // 处理收集
        collected.forEach(item => {
            if (item.powerUp) {
                this.player.activatePowerUp(item.powerUp);
            } else {
                const points = item.score * this.player.scoreMultiplier;
                this.score += points;
                this.ui.addCombo();

                // 播放收集音效
                switch (item.type) {
                    case 'redPacket': window.GameAudio.collectRedPacket(); break;
                    case 'fu': window.GameAudio.collectFu(); break;
                    case 'firecracker': window.GameAudio.collectFirecracker(); break;
                    case 'goldIngot': window.GameAudio.collectGold(); break;
                    case 'zodiac':
                        window.GameAudio.collectZodiac();
                        this.spawnFireworks(item.x, item.y);
                        break;
                }
            }
        });

        // 障碍物碰撞检测（加速无敌时跳过）
        if (!this.player.isBoosted) {
            const obsHitboxes = this.obstacles.getHitboxes();
            const pHit = this.player.getHitbox();

            for (const obs of obsHitboxes) {
                if (obs.ref.passed) continue;
                if (this.rectIntersect(pHit, obs)) {
                    const dead = this.player.hit();
                    if (dead) {
                        this.gameOver();
                        return;
                    }
                    obs.ref.passed = true;
                }
            }
        } else {
            // 加速中销毁碰到的障碍
            const obsHitboxes = this.obstacles.getHitboxes();
            const pHit = this.player.getHitbox();
            for (const obs of obsHitboxes) {
                if (this.rectIntersect(pHit, obs)) {
                    obs.ref.passed = true;
                    this.score += 5;
                    // 销毁特效
                    for (let i = 0; i < 6; i++) {
                        this.player.particles.push({
                            x: obs.ref.x + obs.ref.w / 2,
                            y: obs.ref.y - obs.ref.h / 2,
                            vx: (Math.random() - 0.5) * 6,
                            vy: (Math.random() - 0.5) * 6,
                            life: 20,
                            maxLife: 20,
                            color: '#FF4500'
                        });
                    }
                }
            }
            this.obstacles.obstacles = this.obstacles.obstacles.filter(o => !o.passed);
        }

        // 加分：跳过障碍
        this.obstacles.obstacles.forEach(o => {
            if (!o.passed && o.x + o.w < this.player.x) {
                o.passed = true;
                this.score += 3;
            }
        });

        // 屏幕震动
        if (this.shakeDuration > 0) {
            this.shakeDuration--;
        }

        // 烟花更新
        this.fireworks = this.fireworks.filter(f => {
            f.x += f.vx;
            f.y += f.vy;
            f.vy += 0.05;
            f.life--;
            return f.life > 0;
        });
    }

    gameOver() {
        this.state = 'gameOver';
        this.shakeDuration = 15;
        this.shakeIntensity = 8;

        // 保存分数
        this.isNewRecord = window.GameStorage.setHighScore(this.score);
        window.GameStorage.addToTotalScore(this.score);

        // 保存排名
        if (this.playerName && this.score > 0) {
            this.currentRank = window.GameStorage.addRanking(this.playerName, this.score, this.distance);
        }

        if (this.isNewRecord) {
            window.GameAudio.newRecord();
        } else {
            window.GameAudio.gameOver();
        }
    }

    render() {
        const ctx = this.ctx;

        ctx.save();

        // 屏幕震动
        if (this.shakeDuration > 0) {
            const intensity = this.shakeIntensity * (this.shakeDuration / 15);
            ctx.translate(
                (Math.random() - 0.5) * intensity,
                (Math.random() - 0.5) * intensity
            );
        }

        // 清屏
        ctx.clearRect(0, 0, this.BASE_W, this.BASE_H);

        // 渲染场景背景
        this.scene.render();

        // 渲染收集物（在角色后面）
        this.collectibles.render();

        // 渲染障碍物
        this.obstacles.render();

        // 渲染玩家
        this.player.render();

        // 渲染烟花
        this.renderFireworks();

        ctx.restore();

        // UI层（不受震动影响）
        switch (this.state) {
            case 'menu':
                this.scene.update(1, 0); // 菜单背景缓慢移动
                this.ui.renderStartScreen();
                break;
            case 'nameInput':
                this.scene.update(1, 0);
                this.ui.renderStartScreen();
                break;
            case 'playing':
                this.ui.renderHUD(this.score, this.distance, this.player);
                break;
            case 'paused':
                this.ui.renderHUD(this.score, this.distance, this.player);
                this.ui.renderPause();
                break;
            case 'gameOver':
                this.ui.renderHUD(this.score, this.distance, this.player);
                this.ui.renderGameOverWithRank(this.score, this.distance, this.isNewRecord, this.playerName, this.currentRank);
                break;
            case 'ranking':
                this.scene.update(1, 0);
                this.ui.renderStartScreen();
                this.ui.renderRanking(window.GameStorage.getRankings(), this.currentRank);
                break;
        }
    }

    spawnFireworks(x, y) {
        const colors = ['#FF0000', '#FFD700', '#FF4500', '#FF69B4', '#00FF7F', '#00BFFF'];
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            this.fireworks.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                life: 30 + Math.random() * 30,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 2 + Math.random() * 3
            });
        }
    }

    renderFireworks() {
        const ctx = this.ctx;
        this.fireworks.forEach(f => {
            const alpha = f.life / 60;
            ctx.fillStyle = f.color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }

    rectIntersect(a, b) {
        return a.x < b.x + b.w &&
               a.x + a.w > b.x &&
               a.y < b.y + b.h &&
               a.y + a.h > b.y;
    }
}

// 启动游戏
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
