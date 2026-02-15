// ==========================================
// storage.js - 本地存储管理
// ==========================================
class Storage {
    constructor() {
        this.prefix = 'wmbт_'; // 万马奔腾前缀
    }

    get(key, defaultValue = null) {
        try {
            const val = localStorage.getItem(this.prefix + key);
            return val !== null ? JSON.parse(val) : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    }

    set(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
        } catch (e) {
            console.warn('Storage save failed:', e);
        }
    }

    getHighScore() {
        return this.get('highScore', 0);
    }

    setHighScore(score) {
        const current = this.getHighScore();
        if (score > current) {
            this.set('highScore', score);
            return true;
        }
        return false;
    }

    getUnlockedSkins() {
        return this.get('unlockedSkins', ['white']);
    }

    unlockSkin(skinId) {
        const skins = this.getUnlockedSkins();
        if (!skins.includes(skinId)) {
            skins.push(skinId);
            this.set('unlockedSkins', skins);
        }
    }

    getSelectedSkin() {
        return this.get('selectedSkin', 'red');
    }

    setSelectedSkin(skinId) {
        this.set('selectedSkin', skinId);
    }

    getTotalScore() {
        return this.get('totalScore', 0);
    }

    addToTotalScore(score) {
        const total = this.getTotalScore() + score;
        this.set('totalScore', total);
        return total;
    }

    getSoundEnabled() {
        return this.get('soundEnabled', true);
    }

    setSoundEnabled(enabled) {
        this.set('soundEnabled', enabled);
    }

    getLevelProgress() {
        return this.get('levelProgress', 1);
    }

    setLevelProgress(level) {
        this.set('levelProgress', level);
    }

    // === 玩家名字 ===
    getPlayerName() {
        return this.get('playerName', '');
    }

    setPlayerName(name) {
        this.set('playerName', name);
    }

    // === 排行榜 ===
    getRankings() {
        return this.get('rankings', []);
    }

    addRanking(name, score, distance) {
        const rankings = this.getRankings();
        rankings.push({
            name: name,
            score: score,
            distance: Math.floor(distance),
            date: new Date().toLocaleDateString('zh-CN')
        });
        // 按分数降序排列，只保留前20名
        rankings.sort((a, b) => b.score - a.score);
        if (rankings.length > 20) rankings.length = 20;
        this.set('rankings', rankings);
        // 返回当前排名
        return rankings.findIndex(r => r.score === score && r.name === name) + 1;
    }

    clearRankings() {
        this.set('rankings', []);
    }
}

window.GameStorage = new Storage();
