// ==========================================
// audio.js - 音效系统 (Web Audio API 合成)
// ==========================================
class AudioManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            this.enabled = window.GameStorage.getSoundEnabled();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        window.GameStorage.setSoundEnabled(this.enabled);
        return this.enabled;
    }

    // 播放音符
    playTone(freq, duration, type = 'sine', volume = 0.3, delay = 0) {
        if (!this.enabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume, this.ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + delay);
        osc.stop(this.ctx.currentTime + delay + duration);
    }

    // 播放噪音
    playNoise(duration, volume = 0.2, delay = 0) {
        if (!this.enabled || !this.ctx) return;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        source.buffer = buffer;
        filter.type = 'lowpass';
        filter.frequency.value = 2000;
        gain.gain.setValueAtTime(volume, this.ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + duration);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        source.start(this.ctx.currentTime + delay);
    }

    // === 游戏音效 ===

    // 跳跃 - 上升音调
    jump() {
        this.playTone(300, 0.15, 'sine', 0.25);
        this.playTone(500, 0.15, 'sine', 0.2, 0.05);
    }

    // 二段跳 - 更高音调
    doubleJump() {
        this.playTone(500, 0.12, 'sine', 0.25);
        this.playTone(800, 0.15, 'sine', 0.2, 0.05);
    }

    // 下蹲
    duck() {
        this.playTone(200, 0.1, 'square', 0.15);
    }

    // 收集红包
    collectRedPacket() {
        this.playTone(800, 0.08, 'sine', 0.3);
        this.playTone(1000, 0.08, 'sine', 0.25, 0.06);
        this.playTone(1200, 0.12, 'sine', 0.2, 0.12);
    }

    // 收集福字
    collectFu() {
        this.playTone(600, 0.1, 'triangle', 0.3);
        this.playTone(900, 0.15, 'triangle', 0.25, 0.08);
    }

    // 收集金元宝
    collectGold() {
        this.playTone(1000, 0.08, 'sine', 0.3);
        this.playTone(1200, 0.08, 'sine', 0.3, 0.06);
        this.playTone(1500, 0.08, 'sine', 0.25, 0.12);
        this.playTone(2000, 0.2, 'sine', 0.2, 0.18);
    }

    // 收集鞭炮
    collectFirecracker() {
        this.playNoise(0.15, 0.3);
        this.playTone(300, 0.05, 'square', 0.3, 0.05);
    }

    // 收集生肖令牌
    collectZodiac() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((f, i) => {
            this.playTone(f, 0.2, 'sine', 0.3, i * 0.1);
            this.playTone(f * 1.5, 0.2, 'sine', 0.15, i * 0.1);
        });
    }

    // 获得道具
    powerUp() {
        this.playTone(400, 0.1, 'square', 0.25);
        this.playTone(600, 0.1, 'square', 0.25, 0.1);
        this.playTone(800, 0.2, 'square', 0.3, 0.2);
    }

    // 碰撞
    hit() {
        this.playTone(150, 0.3, 'sawtooth', 0.3);
        this.playNoise(0.2, 0.25, 0.05);
    }

    // 游戏结束
    gameOver() {
        this.playTone(400, 0.3, 'sine', 0.3);
        this.playTone(300, 0.3, 'sine', 0.3, 0.3);
        this.playTone(200, 0.5, 'sine', 0.25, 0.6);
    }

    // 新纪录
    newRecord() {
        const melody = [523, 659, 784, 1047, 784, 1047];
        melody.forEach((f, i) => {
            this.playTone(f, 0.15, 'sine', 0.3, i * 0.12);
        });
    }

    // 按钮点击
    click() {
        this.playTone(600, 0.05, 'sine', 0.2);
    }

    // 切换车道
    switchLane() {
        this.playTone(400, 0.05, 'sine', 0.15);
    }

    // 护盾破碎
    shieldBreak() {
        this.playNoise(0.3, 0.3);
        this.playTone(500, 0.1, 'sine', 0.25);
        this.playTone(300, 0.2, 'sine', 0.2, 0.1);
    }

    // 加速冲刺
    boost() {
        for (let i = 0; i < 10; i++) {
            this.playTone(300 + i * 50, 0.05, 'sawtooth', 0.15, i * 0.03);
        }
    }
}

window.GameAudio = new AudioManager();
