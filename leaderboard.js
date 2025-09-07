// 排行榜系统模块
class LeaderboardSystem {
    constructor() {
        this.maxEntries = 10;
        this.loadLeaderboard();
    }
    
    loadLeaderboard() {
        const saved = localStorage.getItem('towerDefenseLeaderboard');
        this.scores = saved ? JSON.parse(saved) : [];
    }
    
    saveLeaderboard() {
        localStorage.setItem('towerDefenseLeaderboard', JSON.stringify(this.scores));
    }
    
    addScore(score, wave, playerName = '匿名玩家') {
        if (score <= 0) return false;
        
        const newEntry = {
            score: score,
            wave: wave,
            playerName: playerName,
            date: new Date().toLocaleDateString('zh-CN'),
            time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
            timestamp: Date.now()
        };
        
        this.scores.push(newEntry);
        this.scores.sort((a, b) => b.score - a.score);
        
        if (this.scores.length > this.maxEntries) {
            this.scores = this.scores.slice(0, this.maxEntries);
        }
        
        this.saveLeaderboard();
        
        // 检查是否是新纪录
        const rank = this.scores.findIndex(entry => entry.timestamp === newEntry.timestamp) + 1;
        return { rank, isNewRecord: rank === 1 };
    }
    
    getLeaderboard() {
        return this.scores.slice(0, this.maxEntries);
    }
    
    getHighScore() {
        return this.scores.length > 0 ? this.scores[0].score : 0;
    }
    
    getRank(score) {
        const higherScores = this.scores.filter(entry => entry.score > score);
        return higherScores.length + 1;
    }
    
    clearLeaderboard() {
        this.scores = [];
        this.saveLeaderboard();
    }
    
    showLeaderboard() {
        const modal = document.getElementById('leaderboard-modal');
        const tbody = document.getElementById('leaderboard-tbody');
        
        tbody.innerHTML = '';
        
        if (this.scores.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="no-scores">暂无记录</td></tr>';
        } else {
            this.scores.forEach((entry, index) => {
                const row = document.createElement('tr');
                row.className = index < 3 ? `rank-${index + 1}` : '';
                
                const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`;
                
                row.innerHTML = `
                    <td class="rank">${rankIcon}</td>
                    <td class="player-name">${entry.playerName}</td>
                    <td class="score">${entry.score.toLocaleString()}</td>
                    <td class="wave">第${entry.wave}波</td>
                    <td class="date">${entry.date}</td>
                `;
                
                tbody.appendChild(row);
            });
        }
        
        modal.classList.remove('hidden');
    }
    
    exportLeaderboard() {
        const data = {
            exportDate: new Date().toISOString(),
            scores: this.scores
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `tower-defense-leaderboard-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }
    
    importLeaderboard(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.scores && Array.isArray(data.scores)) {
                        this.scores = data.scores.slice(0, this.maxEntries);
                        this.scores.sort((a, b) => b.score - a.score);
                        this.saveLeaderboard();
                        resolve(this.scores.length);
                    } else {
                        reject(new Error('无效的排行榜文件格式'));
                    }
                } catch (error) {
                    reject(new Error('文件解析失败'));
                }
            };
            
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsText(file);
        });
    }
}
