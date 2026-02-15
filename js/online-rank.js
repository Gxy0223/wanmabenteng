// ==========================================
// online-rank.js - 在线排行榜 (JSONBlob)
// ==========================================
class OnlineLeaderboard {
    constructor() {
        this.blobId = '019c60e0-8ef9-7afa-a507-9cd948130d13';
        this.apiUrl = `https://jsonblob.com/api/jsonBlob/${this.blobId}`;

        this.rankings = [];
        this.loading = false;
        this.lastFetch = 0;
    }

    async fetchRankings(force) {
        if (!force && Date.now() - this.lastFetch < 15000 && this.rankings.length > 0) {
            return this.rankings;
        }

        this.loading = true;
        try {
            const resp = await fetch(this.apiUrl, {
                headers: { 'Accept': 'application/json' }
            });

            if (resp.ok) {
                const data = await resp.json();
                this.rankings = data.rankings || [];
                this.lastFetch = Date.now();
            }
        } catch (e) {
            console.warn('获取在线排行榜失败:', e);
        }
        this.loading = false;
        return this.rankings;
    }

    async submitScore(name, score, distance) {
        try {
            // 先读取最新数据
            const getResp = await fetch(this.apiUrl, {
                headers: { 'Accept': 'application/json' }
            });

            let rankings = [];
            if (getResp.ok) {
                const data = await getResp.json();
                rankings = data.rankings || [];
            }

            // 同名只保留最高分
            const existing = rankings.find(r => r.name === name);
            if (existing) {
                if (score > existing.score) {
                    existing.score = score;
                    existing.distance = Math.floor(distance);
                    existing.date = new Date().toLocaleDateString('zh-CN');
                }
            } else {
                rankings.push({
                    name: name,
                    score: score,
                    distance: Math.floor(distance),
                    date: new Date().toLocaleDateString('zh-CN')
                });
            }

            rankings.sort((a, b) => b.score - a.score);
            if (rankings.length > 50) rankings.length = 50;

            // 写回
            const putResp = await fetch(this.apiUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rankings })
            });

            if (putResp.ok) {
                this.rankings = rankings;
                this.lastFetch = Date.now();
                return rankings.findIndex(r => r.name === name) + 1;
            }

            return -1;
        } catch (e) {
            console.warn('提交在线分数失败:', e);
            return -1;
        }
    }
}

window.OnlineLeaderboard = new OnlineLeaderboard();
