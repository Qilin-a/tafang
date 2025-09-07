// 现代塔防游戏 - JavaScript核心逻辑
class ModernTowerDefense {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            console.error('Canvas element not found!');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            console.error('Canvas context not available!');
            return;
        }
        console.log('Canvas initialized:', this.canvas.width, 'x', this.canvas.height);
        this.overlay = document.getElementById('game-overlay');
        
        // 游戏状态
        this.gameState = 'menu';
        this.isRunning = false;
        this.animationId = null;
        this.gameSpeed = 1;
        this.lastTime = 0;
        
        // 游戏设置
        this.tileSize = 40;
        this.mapWidth = 20;
        this.mapHeight = 15;
        
        // 游戏数据
        this.gold = 500;
        this.lives = 20;
        this.score = 0;
        this.currentWave = 1;
        
        // 游戏对象
        this.map = [];
        this.path = [];
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.effects = [];
        
        // 波次系统
        this.waveData = [];
        this.currentWaveEnemies = [];
        this.enemiesSpawned = 0;
        this.enemiesKilled = 0;
        this.waveInProgress = false;
        this.spawnTimer = 0;
        
        // 选择状态
        this.selectedTowerType = null;
        this.selectedTower = null;
        this.hoveredTile = { x: -1, y: -1 };
        
        // 塔类型定义
        this.towerTypes = {
            basic: { name: '基础塔', cost: 50, damage: 25, range: 80, fireRate: 1000, color: '#00d4ff' },
            cannon: { name: '加农炮', cost: 100, damage: 60, range: 100, fireRate: 2000, color: '#ff6b35', splashRadius: 50 },
            laser: { name: '激光塔', cost: 80, damage: 15, range: 90, fireRate: 200, color: '#00ff88' },
            freeze: { name: '冰冻塔', cost: 60, damage: 10, range: 70, fireRate: 1500, color: '#87ceeb', slowEffect: 0.5 },
            sniper: { name: '狙击塔', cost: 120, damage: 150, range: 200, fireRate: 3000, color: '#ffd700' },
            poison: { name: '毒气塔', cost: 90, damage: 20, range: 80, fireRate: 1000, color: '#9932cc' }
        };
        
        // 敌人类型定义
        this.enemyTypes = {
            basic: { name: '基础敌人', health: 100, speed: 50, reward: 10, color: '#ff4757', size: 15 },
            fast: { name: '快速敌人', health: 60, speed: 80, reward: 15, color: '#ffa502', size: 12 },
            heavy: { name: '重装敌人', health: 300, speed: 30, reward: 25, color: '#2f3542', size: 20 },
            flying: { name: '飞行敌人', health: 80, speed: 70, reward: 20, color: '#3742fa', size: 14, flying: true },
            boss: { name: 'Boss敌人', health: 1000, speed: 25, reward: 100, color: '#8b0000', size: 30 }
        };
        
        // 系统将在DOMContentLoaded后初始化
    }
    
    init() {
        console.log('初始化游戏逻辑...');
        
        // 强制设置canvas尺寸
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.tileSize = 40;
        console.log('Canvas强制设置为:', this.canvas.width, 'x', this.canvas.height);
        
        this.setupEventListeners();
        this.generateMap();
        this.generateWaveData();
        this.waveKillCount = 0;
        this.updateUI();
        
        // 直接开始游戏
        this.gameState = 'playing';
        this.isRunning = true;
        
        // 立即渲染一帧
        this.render();
        
        // 开始游戏循环
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
        
        console.log('游戏初始化完成');
    }
    
    setupEventListeners() {
        // 菜单按钮
        document.getElementById('start-game').addEventListener('click', () => this.startGame());
        document.getElementById('start-wave').addEventListener('click', () => this.startWave());
        document.getElementById('show-achievements').addEventListener('click', () => this.achievementSystem.showAchievementPanel());
        document.getElementById('show-leaderboard').addEventListener('click', () => this.leaderboardSystem.showLeaderboard());
        document.getElementById('open-level-editor').addEventListener('click', () => this.levelEditor.openEditor());
        
        // 模态框关闭按钮
        document.getElementById('close-achievements').addEventListener('click', () => this.closeModal('achievements-modal'));
        document.getElementById('close-leaderboard').addEventListener('click', () => this.closeModal('leaderboard-modal'));
        
        // 排行榜操作
        document.getElementById('export-scores').addEventListener('click', () => this.leaderboardSystem.exportLeaderboard());
        document.getElementById('clear-scores').addEventListener('click', () => {
            if (confirm('确定要清空所有排行榜记录吗？')) {
                this.leaderboardSystem.clearLeaderboard();
                this.leaderboardSystem.showLeaderboard();
            }
        });
        
        // 音量控制
        document.getElementById('sound-volume').addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            this.audioSystem.soundVolume = volume;
        });
        
        document.getElementById('music-volume').addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            this.audioSystem.musicVolume = volume;
        });
        
        // 塔选择
        document.querySelectorAll('.tower-type').forEach(towerElement => {
            towerElement.addEventListener('click', (e) => {
                const towerType = e.currentTarget.dataset.type;
                this.selectTowerType(towerType);
            });
        });
        
        // 画布交互
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => {
            this.hoveredTile = { x: -1, y: -1 };
        });
        
        // 速度控制按钮
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const speed = parseFloat(e.target.dataset.speed);
                this.setGameSpeed(speed);
            });
        });
        
        // 升级和出售按钮
        document.getElementById('upgrade-tower').addEventListener('click', () => this.upgradeTower());
        document.getElementById('sell-tower').addEventListener('click', () => this.sellTower());
        
        // 暂停/继续按钮
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.gameState === 'playing') {
                e.preventDefault();
                this.togglePause();
            }
        });
    }
    
    generateMap() {
        this.map = [];
        for (let y = 0; y < this.mapHeight; y++) {
            this.map[y] = [];
            for (let x = 0; x < this.mapWidth; x++) {
                this.map[y][x] = { type: 'grass', buildable: true };
            }
        }
        this.generatePath();
    }
    
    generatePath() {
        this.path = [];
        const pathPoints = [
            { x: 0, y: 7 }, { x: 4, y: 7 }, { x: 4, y: 3 }, { x: 10, y: 3 },
            { x: 10, y: 11 }, { x: 16, y: 11 }, { x: 16, y: 7 }, { x: 19, y: 7 }
        ];
        
        for (let i = 0; i < pathPoints.length - 1; i++) {
            const start = pathPoints[i];
            const end = pathPoints[i + 1];
            
            if (start.x === end.x) {
                const minY = Math.min(start.y, end.y);
                const maxY = Math.max(start.y, end.y);
                for (let y = minY; y <= maxY; y++) {
                    this.path.push({ x: start.x, y: y });
                    this.map[y][start.x] = { type: 'path', buildable: false };
                }
            } else {
                const minX = Math.min(start.x, end.x);
                const maxX = Math.max(start.x, end.x);
                for (let x = minX; x <= maxX; x++) {
                    this.path.push({ x: x, y: start.y });
                    this.map[start.y][x] = { type: 'path', buildable: false };
                }
            }
        }
    }
    
    generateWaveData() {
        this.waveData = [];
        for (let wave = 1; wave <= 20; wave++) {
            const waveEnemies = [];
            const enemyCount = 5 + Math.floor(wave * 1.5);
            
            for (let i = 0; i < enemyCount; i++) {
                let type = 'basic';
                if (wave > 5) type = Math.random() < 0.3 ? 'fast' : 'basic';
                if (wave > 10) {
                    const rand = Math.random();
                    if (rand < 0.4) type = 'basic';
                    else if (rand < 0.7) type = 'fast';
                    else type = 'heavy';
                }
                waveEnemies.push({ type: type, delay: i * 800 });
            }
            this.waveData.push(waveEnemies);
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.isRunning = true;
        this.resetGame();
        this.hideOverlay();
    }
    
    resetGame() {
        this.gold = 500;
        this.lives = 20;
        this.score = 0;
        this.currentWave = 1;
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.effects = [];
        this.updateUI();
    }
    
    startWave() {
        if (this.waveInProgress) return;
        this.waveInProgress = true;
        this.currentWaveEnemies = [...this.waveData[this.currentWave - 1]];
        this.enemiesSpawned = 0;
        this.spawnTimer = 0;
        document.getElementById('start-wave').disabled = true;
    }
    
    selectTowerType(type) {
        this.selectedTowerType = type;
        this.selectedTower = null;
        this.hideTowerInfo();
        
        // 更新UI选择状态
        document.querySelectorAll('.tower-type').forEach(el => el.classList.remove('selected'));
        document.querySelector(`[data-type="${type}"]`).classList.add('selected');
    }
    
    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.tileSize);
        const y = Math.floor((e.clientY - rect.top) / this.tileSize);
        
        if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) return;
        
        // 检查是否点击了现有塔
        const tower = this.towers.find(t => t.gridX === x && t.gridY === y);
        if (tower) {
            this.selectTower(tower);
            return;
        }
        
        // 建造新塔
        if (this.selectedTowerType && this.canBuildTower(x, y)) {
            this.buildTower(x, y, this.selectedTowerType);
        }
    }
    
    handleCanvasMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.tileSize);
        const y = Math.floor((e.clientY - rect.top) / this.tileSize);
        this.hoveredTile = { x, y };
    }
    
    canBuildTower(x, y) {
        if (!this.map[y] || !this.map[y][x]) return false;
        if (!this.map[y][x].buildable) return false;
        if (this.towers.some(t => t.gridX === x && t.gridY === y)) return false;
        
        const towerType = this.towerTypes[this.selectedTowerType];
        return this.gold >= towerType.cost;
    }
    
    buildTower(x, y, type) {
        const towerType = this.towerTypes[type];
        if (this.gold < towerType.cost) return;
        
        const tower = {
            gridX: x,
            gridY: y,
            x: x * this.tileSize + this.tileSize / 2,
            y: y * this.tileSize + this.tileSize / 2,
            type: type,
            level: 1,
            damage: towerType.damage,
            range: towerType.range,
            fireRate: towerType.fireRate,
            color: towerType.color,
            cooldown: 0,
            splashRadius: towerType.splashRadius,
            slowEffect: towerType.slowEffect,
            projectileSpeed: 300
        };
        
        this.towers.push(tower);
        this.gold -= towerType.cost;
        
        // 更新成就统计
        this.achievementSystem.incrementStat('towersBuilt');
        this.achievementSystem.incrementStat('totalGold', towerType.cost);
        if (type === 'sniper') {
            this.achievementSystem.incrementStat('sniperTowers');
        }
        
        this.audioSystem.playSound('build');
        this.updateUI();
    }

    // ...

    showTowerInfo(tower) {
        const panel = document.getElementById('tower-info');
        document.getElementById('tower-name').textContent = this.towerTypes[tower.type].name;
        document.getElementById('tower-damage').textContent = tower.damage;
        document.getElementById('tower-range').textContent = tower.range;
        document.getElementById('tower-speed').textContent = (1000 / tower.fireRate).toFixed(1) + '/s';
        
        // 更新升级和出售按钮
        const upgradeCost = Math.floor(this.towerTypes[tower.type].cost * 0.75);
        const sellValue = Math.floor(this.towerTypes[tower.type].cost * 0.7);
        
        document.getElementById('upgrade-cost').textContent = upgradeCost;
        document.getElementById('sell-value').textContent = sellValue;
        
        // 检查是否可以升级
        const upgradeBtn = document.getElementById('upgrade-tower');
        if (tower.level >= 3 || this.gold < upgradeCost) {
            upgradeBtn.disabled = true;
            upgradeBtn.classList.add('disabled');
        } else {
            upgradeBtn.disabled = false;
            upgradeBtn.classList.remove('disabled');
        }
        
        panel.classList.remove('hidden');
    }
    
    hideTowerInfo() {
        document.getElementById('tower-info').classList.add('hidden');
    }
    
    setGameSpeed(speed) {
        this.gameSpeed = speed;
        document.querySelectorAll('.speed-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-speed="${speed}"]`).classList.add('active');
    }
    
    togglePause() {
        this.isRunning = !this.isRunning;
        const btn = document.getElementById('pause-btn');
        btn.innerHTML = this.isRunning ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
    }
    
    selectTowerType(type) {
        this.selectedTowerType = type;
        this.selectedTower = null;
        this.hideTowerInfo();
        
        document.querySelectorAll('.tower-type').forEach(el => el.classList.remove('selected'));
        document.querySelector(`[data-type="${type}"]`).classList.add('selected');
    }
    
    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.tileSize);
        const y = Math.floor((e.clientY - rect.top) / this.tileSize);
        
        if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) return;
        
        const tower = this.towers.find(t => t.gridX === x && t.gridY === y);
        if (tower) {
            this.selectTower(tower);
            return;
        }
        
        if (this.selectedTowerType && this.canBuildTower(x, y)) {
            this.buildTower(x, y, this.selectedTowerType);
        }
    }
    
    handleCanvasMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.tileSize);
        const y = Math.floor((e.clientY - rect.top) / this.tileSize);
        this.hoveredTile = { x, y };
    }
    
    canBuildTower(x, y) {
        if (!this.map[y] || !this.map[y][x]) return false;
        if (!this.map[y][x].buildable) return false;
        if (this.towers.some(t => t.gridX === x && t.gridY === y)) return false;
        
        const towerType = this.towerTypes[this.selectedTowerType];
        return this.gold >= towerType.cost;
    }
    
    selectTower(tower) {
        this.selectedTower = tower;
        this.selectedTowerType = null;
        this.showTowerInfo(tower);
    }
    
    gameLoop(currentTime) {
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
        
        const deltaTime = (currentTime - this.lastTime) * this.gameSpeed;
        this.lastTime = currentTime;
        
        // 始终渲染画面，即使游戏暂停
        this.render();
        
        // 只有在游戏运行时才更新逻辑
        if (this.isRunning) {
            this.update(deltaTime);
        }
    }
    
    update(deltaTime) {
        this.updateWaveSpawning(deltaTime);
        this.updateEnemies(deltaTime);
        this.updateTowers(deltaTime);
        this.updateProjectiles(deltaTime);
        this.checkWaveComplete();
        this.checkGameOver();
    }
    
    updateWaveSpawning(deltaTime) {
        if (!this.waveInProgress || this.enemiesSpawned >= this.currentWaveEnemies.length) return;
        
        this.spawnTimer += deltaTime;
        
        while (this.enemiesSpawned < this.currentWaveEnemies.length) {
            const enemyData = this.currentWaveEnemies[this.enemiesSpawned];
            if (this.spawnTimer >= enemyData.delay) {
                this.spawnEnemy(enemyData.type);
                this.enemiesSpawned++;
            } else {
                break;
            }
        }
    }

    spawnEnemy(type) {
        const enemyType = this.enemyTypes[type];
        const enemy = {
            type: type,
            health: enemyType.health,
            maxHealth: enemyType.health,
            speed: enemyType.speed,
            reward: enemyType.reward,
            color: enemyType.color,
            size: enemyType.size,
            x: this.path[0].x * this.tileSize + this.tileSize / 2,
            y: this.path[0].y * this.tileSize + this.tileSize / 2,
            pathIndex: 0,
            effects: {}
        };
        this.enemies.push(enemy);
    }
    
    moveEnemy(enemy, deltaTime) {
        if (enemy.pathIndex >= this.path.length - 1) return;
        
        const target = this.path[enemy.pathIndex + 1];
        const targetX = target.x * this.tileSize + this.tileSize / 2;
        const targetY = target.y * this.tileSize + this.tileSize / 2;
        
        const dx = targetX - enemy.x;
        const dy = targetY - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 5) {
            enemy.pathIndex++;
            return;
        }
        
        const speed = enemy.speed * (deltaTime / 1000);
        enemy.x += (dx / distance) * speed;
        enemy.y += (dy / distance) * speed;
    }
    
    findTarget(tower) {
        let bestTarget = null;
        let bestDistance = tower.range + 1;
        
        this.enemies.forEach(enemy => {
            const distance = Math.sqrt((tower.x - enemy.x) ** 2 + (tower.y - enemy.y) ** 2);
            if (distance <= tower.range && distance < bestDistance) {
                bestTarget = enemy;
                bestDistance = distance;
            }
        });
        
        return bestTarget;
    }
    
    updateProjectiles(deltaTime) {
        this.projectiles.forEach((projectile, index) => {
            const dx = projectile.targetX - projectile.x;
            const dy = projectile.targetY - projectile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 5) {
                this.projectileHit(projectile);
                this.projectiles.splice(index, 1);
            } else {
                const speed = projectile.speed * (deltaTime / 1000);
                projectile.x += (dx / distance) * speed;
                projectile.y += (dy / distance) * speed;
            }
        });
    }
    
    projectileHit(projectile) {
        if (projectile.splashRadius) {
            this.enemies.forEach(enemy => {
                const distance = Math.sqrt((projectile.targetX - enemy.x) ** 2 + (projectile.targetY - enemy.y) ** 2);
                if (distance <= projectile.splashRadius) {
                    enemy.health -= projectile.damage;
                }
            });
        } else if (projectile.target && projectile.target.health > 0) {
            projectile.target.health -= projectile.damage;
        }
    }
    
    checkGameOver() {
        if (this.lives <= 0) {
            this.gameOver();
        }
    }
    
    gameWin() {
        this.gameState = 'win';
        this.isRunning = false;
        this.showWinScreen();
    }
    
    restartGame() {
        this.gameState = 'playing';
        this.isRunning = true;
        this.resetGame();
        this.hideOverlay();
        document.getElementById('game-over-menu').classList.add('hidden');
    }
    
    showGameOverScreen(result) {
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-wave').textContent = this.currentWave - 1;
        
        if (result && result.isNewRecord) {
            document.getElementById('new-record').classList.remove('hidden');
        }
        
        document.getElementById('game-over-menu').classList.remove('hidden');
        this.showOverlay();
    }
    
    showMenu() {
        this.gameState = 'menu';
        this.isRunning = false;
        document.getElementById('menu-screen').classList.remove('hidden');
        document.getElementById('game-over-menu').classList.add('hidden');
        this.showOverlay();
    }

    updateEnemies(deltaTime) {
        this.enemies.forEach((enemy, index) => {
            this.moveEnemy(enemy, deltaTime);
            
            // 检查是否到达终点
            if (enemy.pathIndex >= this.path.length - 1) {
                this.lives--;
                this.enemies.splice(index, 1);
                this.audioSystem.playSound('hit');
                this.updateUI();
                return;
            }
            
            // 检查是否死亡
            if (enemy.health <= 0) {
                this.gold += enemy.reward;
                this.score += enemy.reward * 10;
                this.enemies.splice(index, 1);
                this.enemiesKilled++;
                this.waveKillCount++;
                
                this.achievementSystem.incrementStat('totalKills');
                this.achievementSystem.incrementStat('totalGold', enemy.reward);
                
                this.audioSystem.playSound('hit');
                this.updateUI();
            }
        });
    }

    // ...

    updateTowers(deltaTime) {
        this.towers.forEach(tower => {
            tower.cooldown = Math.max(0, tower.cooldown - deltaTime);
            
            if (tower.cooldown === 0) {
                const target = this.findTarget(tower);
                if (target) {
                    this.towerShoot(tower, target);
                    tower.cooldown = tower.fireRate;
                }
            }
        });
    }

    towerShoot(tower, target) {
        const projectile = {
            x: tower.x,
            y: tower.y,
            targetX: target.x,
            targetY: target.y,
            target: target,
            damage: tower.damage,
            speed: tower.projectileSpeed,
            color: tower.color,
            splashRadius: tower.splashRadius
        };
        this.projectiles.push(projectile);
        this.audioSystem.playSound('shoot');
    }

    // ...

    checkWaveComplete() {
        if (this.waveInProgress && this.enemiesSpawned >= this.currentWaveEnemies.length && this.enemies.length === 0) {
            this.waveInProgress = false;
            const waveReward = 50 + (this.currentWave * 5);
            this.gold += waveReward;
            
            // 检查满血完成波次
            if (this.lives === 20) {
                this.achievementSystem.incrementStat('perfectWaves');
            }
            
            // 更新成就统计
            this.achievementSystem.updateStats('wavesCompleted', this.currentWave);
            this.achievementSystem.updateStats('maxWaveKills', Math.max(this.achievementSystem.gameStats.maxWaveKills || 0, this.enemiesKilled));
            this.achievementSystem.incrementStat('totalGold', waveReward);
            
            this.currentWave++;
            document.getElementById('start-wave').disabled = false;
            this.audioSystem.playSound('waveStart');
            this.updateUI();
            
            // 检查游戏胜利
            if (this.currentWave > this.waveData.length) {
                this.gameWin();
            }
        }
    }

    // ...

    gameOver() {
        this.gameState = 'gameOver';
        this.isRunning = false;
        this.audioSystem.playSound('gameOver');
        
        // 保存分数到排行榜
        const result = this.leaderboardSystem.addScore(this.score, this.currentWave - 1);
        
        this.showGameOverScreen(result);
    }

    // ...

    showWinScreen() {
        document.getElementById('win-score').textContent = this.score;
        document.getElementById('win-screen').classList.remove('hidden');
        this.showOverlay();
    }

    // ...

    upgradeTower() {
        if (!this.selectedTower || this.selectedTower.level >= 3) return;
        
        const upgradeCost = Math.floor(this.towerTypes[this.selectedTower.type].cost * 0.75);
        
        if (this.gold >= upgradeCost) {
            this.gold -= upgradeCost;
            this.selectedTower.level++;
            this.selectedTower.damage = Math.floor(this.selectedTower.damage * 1.5);
            this.selectedTower.range = Math.floor(this.selectedTower.range * 1.1);
            this.selectedTower.fireRate = Math.floor(this.selectedTower.fireRate * 0.9);
            
            this.achievementSystem.incrementStat('totalGold', upgradeCost);
            this.audioSystem.playSound('upgrade');
            this.updateUI();
            this.showTowerInfo(this.selectedTower);
        }
    }

    // ...

    sellTower() {
        if (!this.selectedTower) return;
        
        const sellPrice = Math.floor(this.towerTypes[this.selectedTower.type].cost * 0.7);
        this.gold += sellPrice;
        
        const index = this.towers.indexOf(this.selectedTower);
        if (index > -1) {
            this.towers.splice(index, 1);
        }
        
        this.selectedTower = null;
        this.hideTowerInfo();
        this.updateUI();
    }
    
    generateMap() {
        console.log('开始生成地图...');
        this.map = [];
        for (let y = 0; y < this.mapHeight; y++) {
            this.map[y] = [];
            for (let x = 0; x < this.mapWidth; x++) {
                this.map[y][x] = { type: 'grass', buildable: true };
            }
        }
        console.log('基础地图生成完成，尺寸:', this.mapWidth, 'x', this.mapHeight);
        
        // 生成S形路径
        this.path = [];
        
        // 第一段：从左到右
        for (let x = 0; x < 8; x++) {
            this.path.push({ x: x, y: 2 });
            if (this.map[2] && this.map[2][x]) {
                this.map[2][x] = { type: 'path', buildable: false };
            }
        }
        
        // 第二段：向下
        for (let y = 3; y < 6; y++) {
            this.path.push({ x: 7, y: y });
            if (this.map[y] && this.map[y][7]) {
                this.map[y][7] = { type: 'path', buildable: false };
            }
        }
        
        // 第三段：向左
        for (let x = 6; x >= 2; x--) {
            this.path.push({ x: x, y: 5 });
            if (this.map[5] && this.map[5][x]) {
                this.map[5][x] = { type: 'path', buildable: false };
            }
        }
        
        // 第四段：向下
        for (let y = 6; y < 9; y++) {
            this.path.push({ x: 2, y: y });
            if (this.map[y] && this.map[y][2]) {
                this.map[y][2] = { type: 'path', buildable: false };
            }
        }
        
        // 第五段：向右到终点
        for (let x = 3; x < this.mapWidth; x++) {
            this.path.push({ x: x, y: 8 });
            if (this.map[8] && this.map[8][x]) {
                this.map[8][x] = { type: 'path', buildable: false };
            }
        }
        
        console.log('路径生成完成，路径点数:', this.path.length);
        console.log('起点:', this.path[0], '终点:', this.path[this.path.length - 1]);
    }
    
    generateWaveData() {
        this.waveData = [];
        for (let wave = 1; wave <= 20; wave++) {
            const enemies = [];
            const baseEnemyCount = 5 + wave * 2;
            
            for (let i = 0; i < baseEnemyCount; i++) {
                let type = 'basic';
                if (wave > 5 && Math.random() < 0.3) type = 'fast';
                if (wave > 10 && Math.random() < 0.2) type = 'heavy';
                if (wave > 15 && Math.random() < 0.15) type = 'flying';
                if (wave % 5 === 0) type = 'boss';
                
                enemies.push({
                    type: type,
                    delay: i * 1000 + Math.random() * 500
                });
            }
            
            this.waveData.push(enemies);
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.isRunning = true;
        this.resetGame();
        this.hideOverlay();
        document.getElementById('menu-screen').classList.add('hidden');
    }
    
    resetGame() {
        this.gold = 500;
        this.lives = 20;
        this.score = 0;
        this.currentWave = 1;
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.effects = [];
        this.waveInProgress = false;
        this.enemiesSpawned = 0;
        this.enemiesKilled = 0;
        this.selectedTower = null;
        this.selectedTowerType = null;
        this.updateUI();
    }
    
    startWave() {
        if (this.waveInProgress || this.currentWave > 20) return;
        
        this.currentWaveEnemies = [...this.waveData[this.currentWave - 1]];
        this.waveInProgress = true;
        this.enemiesSpawned = 0;
        this.spawnTimer = 0;
        this.waveKillCount = 0;
        
        this.audioSystem.playSound('waveStart');
        this.updateUI();
    }
    
    checkWaveComplete() {
        if (this.waveInProgress && this.enemies.length === 0 && this.enemiesSpawned >= this.currentWaveEnemies.length) {
            this.waveInProgress = false;
            this.currentWave++;
            this.gold += 50 + this.currentWave * 10;
            
            // 检查成就
            this.achievementSystem.incrementStat('wavesCompleted');
            if (this.waveKillCount >= 50) {
                this.achievementSystem.incrementStat('efficientWaves');
            }
            if (this.lives === 20) {
                this.achievementSystem.incrementStat('perfectWaves');
            }
            
            if (this.currentWave > 20) {
                this.gameWin();
            } else {
                this.updateUI();
            }
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.isRunning = false;
        
        // 保存分数到排行榜
        const result = this.leaderboardSystem.addScore({
            playerName: 'Player',
            score: this.score,
            wave: this.currentWave - 1,
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString()
        });
        
        this.audioSystem.playSound('gameOver');
        this.showGameOverScreen(result);
    }
    
    updateTowers(deltaTime) {
        this.towers.forEach(tower => {
            if (tower.cooldown > 0) {
                tower.cooldown -= deltaTime;
            }
            
            if (tower.cooldown <= 0) {
                const target = this.findTarget(tower);
                if (target) {
                    this.createProjectile(tower, target);
                    tower.cooldown = tower.fireRate;
                    this.audioSystem.playSound('shoot');
                }
            }
        });
    }
    
    createProjectile(tower, target) {
        const projectile = {
            x: tower.x,
            y: tower.y,
            targetX: target.x,
            targetY: target.y,
            target: target,
            damage: tower.damage,
            speed: tower.projectileSpeed || 300,
            color: tower.color,
            splashRadius: tower.splashRadius,
            slowEffect: tower.slowEffect
        };
        
        this.projectiles.push(projectile);
    }
    
    drawEffects() {
        // 绘制特效（如果有的话）
    }
    
    closeModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    }
    
    loadCustomLevel(levelData) {
        this.map = levelData.map;
        this.path = levelData.path;
        this.waveData = levelData.waves || this.waveData;
    }
    
    render() {
        // 强制清除画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景
        this.ctx.fillStyle = '#2a3f5f';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 直接绘制地图，不依赖复杂逻辑
        this.drawSimpleMap();
        this.drawTowers();
        this.drawEnemies();
        this.drawProjectiles();
        this.drawEffects();
    }
    
    drawSimpleMap() {
        // 绘制草地背景
        this.ctx.fillStyle = '#4a7c59';
        for (let x = 0; x < 20; x++) {
            for (let y = 0; y < 15; y++) {
                this.ctx.fillRect(x * 40, y * 40, 40, 40);
                this.ctx.strokeStyle = '#666';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x * 40, y * 40, 40, 40);
            }
        }
        
        // 绘制S形路径
        this.ctx.fillStyle = '#d4a574';
        const pathPoints = [
            // 第一段：从左到右
            [0,2], [1,2], [2,2], [3,2], [4,2], [5,2], [6,2], [7,2],
            // 第二段：向下
            [7,3], [7,4], [7,5],
            // 第三段：向左
            [6,5], [5,5], [4,5], [3,5], [2,5],
            // 第四段：向下
            [2,6], [2,7], [2,8],
            // 第五段：向右到终点
            [3,8], [4,8], [5,8], [6,8], [7,8], [8,8], [9,8], [10,8], [11,8], [12,8], [13,8], [14,8], [15,8], [16,8], [17,8], [18,8], [19,8]
        ];
        
        pathPoints.forEach(([x, y]) => {
            this.ctx.fillRect(x * 40, y * 40, 40, 40);
            this.ctx.strokeStyle = '#666';
            this.ctx.strokeRect(x * 40, y * 40, 40, 40);
        });
        
        // 绘制起点和终点
        this.ctx.fillStyle = '#00ff00';
        this.ctx.beginPath();
        this.ctx.arc(0 * 40 + 20, 2 * 40 + 20, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#ff0000';
        this.ctx.beginPath();
        this.ctx.arc(19 * 40 + 20, 8 * 40 + 20, 8, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawMap() {
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                if (!this.map[y] || !this.map[y][x]) {
                    continue;
                }
                
                const tile = this.map[y][x];
                const tileX = x * this.tileSize;
                const tileY = y * this.tileSize;
                
                if (tile.type === 'path') {
                    // 路径使用明亮的棕色
                    this.ctx.fillStyle = '#d4a574';
                } else {
                    // 草地使用明亮的绿色
                    this.ctx.fillStyle = '#4a7c59';
                }
                
                this.ctx.fillRect(tileX, tileY, this.tileSize, this.tileSize);
                
                // 明亮的网格线
                this.ctx.strokeStyle = '#666';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(tileX, tileY, this.tileSize, this.tileSize);
            }
        }
        
        // 绘制起点和终点标记
        if (this.path.length > 0) {
            // 起点
            const start = this.path[0];
            this.ctx.fillStyle = '#00ff00';
            this.ctx.beginPath();
            this.ctx.arc(start.x * this.tileSize + this.tileSize/2, start.y * this.tileSize + this.tileSize/2, 8, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 终点
            const end = this.path[this.path.length - 1];
            this.ctx.fillStyle = '#ff0000';
            this.ctx.beginPath();
            this.ctx.arc(end.x * this.tileSize + this.tileSize/2, end.y * this.tileSize + this.tileSize/2, 8, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // 高亮悬停格子
        if (this.hoveredTile.x >= 0 && this.hoveredTile.y >= 0) {
            const canBuild = this.selectedTowerType && this.canBuildTower(this.hoveredTile.x, this.hoveredTile.y);
            this.ctx.fillStyle = canBuild ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
            this.ctx.fillRect(this.hoveredTile.x * this.tileSize, this.hoveredTile.y * this.tileSize, this.tileSize, this.tileSize);
        }
        
        // 显示选中塔的预览范围
        if (this.selectedTowerType && this.hoveredTile.x >= 0 && this.hoveredTile.y >= 0 && this.canBuildTower(this.hoveredTile.x, this.hoveredTile.y)) {
            const towerType = this.towerTypes[this.selectedTowerType];
            const centerX = this.hoveredTile.x * this.tileSize + this.tileSize/2;
            const centerY = this.hoveredTile.y * this.tileSize + this.tileSize/2;
            
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, towerType.range, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }
    
    drawTowers() {
        this.towers.forEach(tower => {
            // 绘制射程（如果选中）
            if (tower === this.selectedTower) {
                this.ctx.beginPath();
                this.ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                this.ctx.fill();
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
            
            // 绘制塔基座
            this.ctx.fillStyle = tower.color;
            this.ctx.beginPath();
            this.ctx.arc(tower.x, tower.y, 18, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 绘制塔边框
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // 绘制塔中心
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(tower.x, tower.y, 10, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 绘制等级指示器
            if (tower.level > 1) {
                this.ctx.fillStyle = '#ffd700';
                this.ctx.font = 'bold 12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(tower.level.toString(), tower.x, tower.y - 25);
            }
        });
    }
    
    drawEnemies() {
        this.enemies.forEach(enemy => {
            // 绘制敌人
            this.ctx.fillStyle = enemy.color;
            this.ctx.beginPath();
            this.ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 绘制敌人边框
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            
            // 绘制血条
            const barWidth = enemy.size * 2.5;
            const barHeight = 5;
            const barX = enemy.x - barWidth / 2;
            const barY = enemy.y - enemy.size - 12;
            
            // 血条背景
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // 血条前景
            const healthPercent = enemy.health / enemy.maxHealth;
            this.ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
            this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
            
            // 血条边框
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(barX, barY, barWidth, barHeight);
        });
    }
    
    drawProjectiles() {
        this.projectiles.forEach(projectile => {
            // 绘制子弹
            this.ctx.fillStyle = projectile.color;
            this.ctx.beginPath();
            this.ctx.arc(projectile.x, projectile.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 绘制子弹边框
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        });
    }
    
    drawEffects() {
        this.effects.forEach(effect => {
            this.ctx.save();
            this.ctx.globalAlpha = effect.alpha || 1;
            this.ctx.fillStyle = effect.color || '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(effect.x, effect.y, effect.size || 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }
    
    updateUI() {
        document.getElementById('gold').textContent = this.gold;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('score').textContent = this.score;
        document.getElementById('current-wave').textContent = this.currentWave;
        
        // 更新塔类型可用性
        Object.keys(this.towerTypes).forEach(type => {
            const element = document.querySelector(`[data-type="${type}"]`);
            const cost = this.towerTypes[type].cost;
            if (this.gold < cost) {
                element.classList.add('disabled');
            } else {
                element.classList.remove('disabled');
            }
        });
    }
    
    hideOverlay() {
        this.overlay.classList.add('hidden');
    }
    
    showOverlay() {
        this.overlay.classList.remove('hidden');
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const maxWidth = container.clientWidth;
        const maxHeight = container.clientHeight;
        
        console.log('调整Canvas尺寸，容器:', maxWidth, 'x', maxHeight);
        
        this.canvas.width = maxWidth;
        this.canvas.height = maxHeight;
        this.tileSize = Math.min(maxWidth / this.mapWidth, maxHeight / this.mapHeight);
        
        console.log('Canvas尺寸设置为:', this.canvas.width, 'x', this.canvas.height);
        console.log('计算的tileSize:', this.tileSize);
        
        // 确保canvas有足够的尺寸
        if (this.canvas.width < 400 || this.canvas.height < 300) {
            this.canvas.width = Math.max(this.canvas.width, 800);
            this.canvas.height = Math.max(this.canvas.height, 600);
            this.tileSize = Math.min(this.canvas.width / this.mapWidth, this.canvas.height / this.mapHeight);
            console.log('强制设置最小Canvas尺寸:', this.canvas.width, 'x', this.canvas.height);
        }
    }
}

// 全局变量
let game;
let audioSystem;
let achievementSystem;
let leaderboardSystem;
let levelEditor;

// 简化的游戏初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('页面加载完成，开始初始化游戏...');
    
    // 创建简化的游戏对象
    try {
        game = new ModernTowerDefense();
        
        // 创建简化的系统对象（避免依赖错误）
        game.audioSystem = { playSound: () => {}, playMusic: () => {}, stopMusic: () => {} };
        game.achievementSystem = { incrementStat: () => {}, checkAchievements: () => {} };
        game.leaderboardSystem = { updateScore: () => {} };
        game.levelEditor = { openEditor: () => {} };
        
        // 初始化游戏
        game.init();
        
        console.log('游戏初始化成功');
    } catch (error) {
        console.error('游戏初始化失败:', error);
        
        // 备用初始化方案
        setTimeout(() => {
            const canvas = document.getElementById('game-canvas');
            if (canvas) {
                const ctx = canvas.getContext('2d');
                canvas.width = 800;
                canvas.height = 600;
                
                // 直接绘制测试内容
                ctx.fillStyle = '#2a3f5f';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                ctx.fillStyle = '#4a7c59';
                for (let x = 0; x < 20; x++) {
                    for (let y = 0; y < 15; y++) {
                        ctx.fillRect(x * 40, y * 40, 40, 40);
                        ctx.strokeStyle = '#666';
                        ctx.strokeRect(x * 40, y * 40, 40, 40);
                    }
                }
                
                // 绘制路径
                ctx.fillStyle = '#d4a574';
                const path = [
                    {x: 0, y: 2}, {x: 1, y: 2}, {x: 2, y: 2}, {x: 3, y: 2}, {x: 4, y: 2}, {x: 5, y: 2}, {x: 6, y: 2}, {x: 7, y: 2},
                    {x: 7, y: 3}, {x: 7, y: 4}, {x: 7, y: 5},
                    {x: 6, y: 5}, {x: 5, y: 5}, {x: 4, y: 5}, {x: 3, y: 5}, {x: 2, y: 5},
                    {x: 2, y: 6}, {x: 2, y: 7}, {x: 2, y: 8},
                    {x: 3, y: 8}, {x: 4, y: 8}, {x: 5, y: 8}, {x: 6, y: 8}, {x: 7, y: 8}, {x: 8, y: 8}, {x: 9, y: 8}
                ];
                
                path.forEach(p => {
                    ctx.fillRect(p.x * 40, p.y * 40, 40, 40);
                });
                
                console.log('备用渲染完成');
            }
        }, 100);
    }
    
    // 创建背景粒子效果
    const particleContainer = document.getElementById('particles');
    if (particleContainer) {
        setInterval(() => {
            if (particleContainer.children.length < 20) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * window.innerWidth + 'px';
                particle.style.top = window.innerHeight + 'px';
                particle.style.animationDuration = (Math.random() * 3 + 3) + 's';
                
                particleContainer.appendChild(particle);
                
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }, 6000);
            }
        }, 500);
    }
});
