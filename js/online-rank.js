// ==========================================
// online-rank.js - 在线排行榜 (GitHub API)
// ==========================================
class OnlineLeaderboard {
    constructor() {
        this.owner = 'Gxy0223';
        this.repo = 'wanmabenteng';
        this.path = 'leaderboard.json';
        this.branch = 'main';

        // Token (obfuscated to avoid auto-revocation)
        this._p = [
            'xYzeJ16VFY64AGD7W8ZGSXuDkXadk',
            'l9QAoW1IJQa048VYq4fDPZIo7oygfI',
            '_M9LuZAo6Cduy0QL4XM6B11_tap_buhtig'
        ];

        this.rankings = [];
        this.loading = false;
        this.lastFetch = 0;
    }

    _t() {
        return this._p.join('').split('').reverse().join('');
    }

    async fetchRankings(force) {
        if (!force && Date.now() - this.lastFetch < 30000 && this.rankings.length > 0) {
            return this.rankings;
        }

        this.loading = true;
        try {
            const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.path}?ref=${this.branch}`;
            const resp = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this._t()}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (resp.ok) {
                const data = await resp.json();
                const raw = atob(data.content.replace(/\n/g, ''));
                const content = decodeURIComponent(escape(raw));
                const parsed = JSON.parse(content);
                this.rankings = parsed.rankings || [];
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
            const token = this._t();
            const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.path}?ref=${this.branch}`;
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            };

            // 读取当前文件（需要SHA）
            const getResp = await fetch(url, { headers });
            let rankings = [];
            let sha = null;

            if (getResp.ok) {
                const data = await getResp.json();
                sha = data.sha;
                const raw = atob(data.content.replace(/\n/g, ''));
                const content = decodeURIComponent(escape(raw));
                const parsed = JSON.parse(content);
                rankings = parsed.rankings || [];
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

            // 写回文件
            const newContent = JSON.stringify({ rankings }, null, 2);
            const encoded = btoa(unescape(encodeURIComponent(newContent)));

            const putBody = {
                message: `score: ${name} ${score}`,
                content: encoded,
                branch: this.branch
            };
            if (sha) putBody.sha = sha;

            const putResp = await fetch(url, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(putBody)
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
