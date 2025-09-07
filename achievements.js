// 成就系统模块
class AchievementSystem {
    constructor() {
        this.achievements = {
            firstWave: { 
                name: '新手指挥官', 
                description: '完成第1波', 
                unlocked: false, 
                condition: 'wave', 
                value: 1,
                icon: '🎖️'
            },
            tenthWave: { 
                name: '防御专家', 
                description: '完成第10波', 
                unlocked: false, 
                condition: 'wave', 
                value: 10,
                icon: '🛡️'
            },
            masterDefender: { 
                name: '塔防大师', 
                description: '完成所有20波', 
                unlocked: false, 
                condition: 'wave', 
                value: 20,
                icon: '👑'
            },
            economist: { 
                name: '经济学家', 
                description: '累积1000金币', 
                unlocked: false, 
                condition: 'totalGold', 
                value: 1000,
                icon: '💰'
            },
            architect: { 
                name: '建筑师', 
                description: '建造10座塔', 
                unlocked: false, 
                condition: 'towersBuilt', 
                value: 10,
                icon: '🏗️'
            },
            survivor: { 
                name: '幸存者', 
                description: '以满血完成一波', 
                unlocked: false, 
                condition: 'fullHealth', 
                value: 1,
                icon: '❤️'
            },
            efficiency: { 
                name: '效率专家', 
                description: '单波击杀50个敌人', 
                unlocked: false, 
                condition: 'waveKills', 
                value: 50,
                icon: '⚡'
            },
            sniper: {
                name: '神枪手',
                description: '建造5座狙击塔',
                unlocked: false,
                condition: 'sniperTowers',
                value: 5,
                icon: '🎯'
            },
            destroyer: {
                name: '毁灭者',
                description: '击杀1000个敌人',
                unlocked: false,
                condition: 'totalKills',
                value: 1000,
                icon: '💀'
            },
            perfectionist: {
                name: '完美主义者',
                description: '零伤亡完成5波',
                unlocked: false,
                condition: 'perfectWaves',
                value: 5,
                icon: '✨'
            }
        };
        
        this.gameStats = {
            totalGold: 0,
            towersBuilt: 0,
            enemiesKilled: 0,
            wavesCompleted: 0,
            maxWaveKills: 0,
            sniperTowers: 0,
            totalKills: 0,
            perfectWaves: 0
        };
        
        this.loadAchievements();
    }
    
    loadAchievements() {
        const saved = localStorage.getItem('towerDefenseAchievements');
        if (saved) {
            const savedAchievements = JSON.parse(saved);
            Object.keys(savedAchievements).forEach(key => {
                if (this.achievements[key]) {
                    this.achievements[key].unlocked = savedAchievements[key].unlocked;
                }
            });
        }
        
        const savedStats = localStorage.getItem('towerDefenseStats');
        if (savedStats) {
            this.gameStats = { ...this.gameStats, ...JSON.parse(savedStats) };
        }
    }
    
    saveAchievements() {
        localStorage.setItem('towerDefenseAchievements', JSON.stringify(this.achievements));
        localStorage.setItem('towerDefenseStats', JSON.stringify(this.gameStats));
    }
    
    updateStats(statName, value) {
        this.gameStats[statName] = value;
        this.checkAchievements();
    }
    
    incrementStat(statName, amount = 1) {
        this.gameStats[statName] = (this.gameStats[statName] || 0) + amount;
        this.checkAchievements();
    }
    
    checkAchievements() {
        let newAchievements = [];
        
        Object.keys(this.achievements).forEach(key => {
            const achievement = this.achievements[key];
            if (!achievement.unlocked) {
                let unlocked = false;
                
                switch (achievement.condition) {
                    case 'wave':
                        unlocked = this.gameStats.wavesCompleted >= achievement.value;
                        break;
                    case 'totalGold':
                        unlocked = this.gameStats.totalGold >= achievement.value;
                        break;
                    case 'towersBuilt':
                        unlocked = this.gameStats.towersBuilt >= achievement.value;
                        break;
                    case 'fullHealth':
                        unlocked = this.gameStats.perfectWaves >= achievement.value;
                        break;
                    case 'waveKills':
                        unlocked = this.gameStats.maxWaveKills >= achievement.value;
                        break;
                    case 'sniperTowers':
                        unlocked = this.gameStats.sniperTowers >= achievement.value;
                        break;
                    case 'totalKills':
                        unlocked = this.gameStats.totalKills >= achievement.value;
                        break;
                    case 'perfectWaves':
                        unlocked = this.gameStats.perfectWaves >= achievement.value;
                        break;
                }
                
                if (unlocked) {
                    achievement.unlocked = true;
                    newAchievements.push(achievement);
                    this.showAchievementNotification(achievement);
                }
            }
        });
        
        if (newAchievements.length > 0) {
            this.saveAchievements();
        }
        
        return newAchievements;
    }
    
    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-text">
                <div class="achievement-title">成就解锁！</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.description}</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
    
    getUnlockedAchievements() {
        return Object.values(this.achievements).filter(a => a.unlocked);
    }
    
    getAchievementProgress() {
        const total = Object.keys(this.achievements).length;
        const unlocked = this.getUnlockedAchievements().length;
        return { unlocked, total, percentage: Math.round((unlocked / total) * 100) };
    }
    
    showAchievementPanel() {
        const modal = document.getElementById('achievements-modal');
        const list = document.getElementById('achievements-list');
        
        list.innerHTML = '';
        
        Object.values(this.achievements).forEach(achievement => {
            const item = document.createElement('div');
            item.className = `achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`;
            item.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-desc">${achievement.description}</div>
                    ${achievement.unlocked ? '<div class="achievement-status">✅ 已解锁</div>' : '<div class="achievement-status">🔒 未解锁</div>'}
                </div>
            `;
            list.appendChild(item);
        });
        
        const progress = this.getAchievementProgress();
        document.getElementById('achievement-progress-text').textContent = `${progress.unlocked}/${progress.total} (${progress.percentage}%)`;
        document.getElementById('achievement-progress-bar').style.width = progress.percentage + '%';
        
        modal.classList.remove('hidden');
    }
}
