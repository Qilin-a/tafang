// 关卡编辑器模块
class LevelEditor {
    constructor(game) {
        this.game = game;
        this.isEditing = false;
        this.currentTool = 'path';
        this.customLevels = [];
        this.currentLevel = null;
        this.editorMap = [];
        this.editorPath = [];
        this.loadCustomLevels();
        this.initEditor();
    }
    
    initEditor() {
        this.setupEditorEventListeners();
        this.createEditorUI();
    }
    
    setupEditorEventListeners() {
        // 编辑器工具选择
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('editor-tool')) {
                this.selectTool(e.target.dataset.tool);
            }
        });
        
        // 编辑器画布点击
        document.addEventListener('click', (e) => {
            if (this.isEditing && e.target.id === 'game-canvas') {
                this.handleEditorClick(e);
            }
        });
    }
    
    createEditorUI() {
        const editorPanel = document.createElement('div');
        editorPanel.id = 'level-editor-panel';
        editorPanel.className = 'editor-panel hidden';
        editorPanel.innerHTML = `
            <div class="editor-header">
                <h3>关卡编辑器</h3>
                <button id="close-editor" class="btn btn-secondary">关闭</button>
            </div>
            <div class="editor-tools">
                <button class="editor-tool active" data-tool="path">路径</button>
                <button class="editor-tool" data-tool="grass">草地</button>
                <button class="editor-tool" data-tool="water">水域</button>
                <button class="editor-tool" data-tool="rock">岩石</button>
                <button class="editor-tool" data-tool="spawn">起点</button>
                <button class="editor-tool" data-tool="end">终点</button>
            </div>
            <div class="editor-actions">
                <button id="clear-map" class="btn btn-warning">清空地图</button>
                <button id="test-level" class="btn btn-primary">测试关卡</button>
                <button id="save-level" class="btn btn-success">保存关卡</button>
            </div>
            <div class="level-info">
                <input type="text" id="level-name" placeholder="关卡名称" maxlength="20">
                <textarea id="level-description" placeholder="关卡描述" rows="3"></textarea>
                <div class="difficulty-selector">
                    <label>难度：</label>
                    <select id="level-difficulty">
                        <option value="easy">简单</option>
                        <option value="normal" selected>普通</option>
                        <option value="hard">困难</option>
                        <option value="expert">专家</option>
                    </select>
                </div>
            </div>
            <div class="custom-levels">
                <h4>自定义关卡</h4>
                <div id="custom-levels-list"></div>
            </div>
        `;
        
        document.body.appendChild(editorPanel);
        
        // 绑定编辑器按钮事件
        document.getElementById('close-editor').addEventListener('click', () => this.closeEditor());
        document.getElementById('clear-map').addEventListener('click', () => this.clearMap());
        document.getElementById('test-level').addEventListener('click', () => this.testLevel());
        document.getElementById('save-level').addEventListener('click', () => this.saveLevel());
    }
    
    openEditor() {
        this.isEditing = true;
        this.game.isRunning = false;
        this.initializeEditorMap();
        document.getElementById('level-editor-panel').classList.remove('hidden');
        document.getElementById('game-overlay').classList.add('hidden');
        this.updateCustomLevelsList();
    }
    
    closeEditor() {
        this.isEditing = false;
        document.getElementById('level-editor-panel').classList.add('hidden');
        this.game.showMenu();
    }
    
    selectTool(tool) {
        this.currentTool = tool;
        document.querySelectorAll('.editor-tool').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tool="${tool}"]`).classList.add('active');
    }
    
    initializeEditorMap() {
        this.editorMap = [];
        for (let y = 0; y < this.game.mapHeight; y++) {
            this.editorMap[y] = [];
            for (let x = 0; x < this.game.mapWidth; x++) {
                this.editorMap[y][x] = { type: 'grass', buildable: true };
            }
        }
        this.editorPath = [];
        this.game.map = this.editorMap;
        this.game.path = this.editorPath;
    }
    
    handleEditorClick(e) {
        const rect = this.game.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.game.tileSize);
        const y = Math.floor((e.clientY - rect.top) / this.game.tileSize);
        
        if (x < 0 || x >= this.game.mapWidth || y < 0 || y >= this.game.mapHeight) return;
        
        this.placeTile(x, y);
    }
    
    placeTile(x, y) {
        switch (this.currentTool) {
            case 'path':
                this.editorMap[y][x] = { type: 'path', buildable: false };
                if (!this.editorPath.find(p => p.x === x && p.y === y)) {
                    this.editorPath.push({ x, y });
                }
                break;
            case 'grass':
                this.editorMap[y][x] = { type: 'grass', buildable: true };
                this.editorPath = this.editorPath.filter(p => !(p.x === x && p.y === y));
                break;
            case 'water':
                this.editorMap[y][x] = { type: 'water', buildable: false };
                this.editorPath = this.editorPath.filter(p => !(p.x === x && p.y === y));
                break;
            case 'rock':
                this.editorMap[y][x] = { type: 'rock', buildable: false };
                this.editorPath = this.editorPath.filter(p => !(p.x === x && p.y === y));
                break;
            case 'spawn':
                // 移除之前的起点
                this.editorMap.forEach(row => {
                    row.forEach(tile => {
                        if (tile.type === 'spawn') tile.type = 'path';
                    });
                });
                this.editorMap[y][x] = { type: 'spawn', buildable: false };
                // 确保起点在路径开头
                this.editorPath = this.editorPath.filter(p => !(p.x === x && p.y === y));
                this.editorPath.unshift({ x, y });
                break;
            case 'end':
                // 移除之前的终点
                this.editorMap.forEach(row => {
                    row.forEach(tile => {
                        if (tile.type === 'end') tile.type = 'path';
                    });
                });
                this.editorMap[y][x] = { type: 'end', buildable: false };
                // 确保终点在路径末尾
                this.editorPath = this.editorPath.filter(p => !(p.x === x && p.y === y));
                this.editorPath.push({ x, y });
                break;
        }
        
        this.game.map = this.editorMap;
        this.game.path = this.editorPath;
    }
    
    clearMap() {
        if (confirm('确定要清空地图吗？')) {
            this.initializeEditorMap();
        }
    }
    
    testLevel() {
        if (this.validateLevel()) {
            // 临时保存当前关卡用于测试
            const testLevel = this.createLevelData();
            this.game.loadCustomLevel(testLevel);
            this.closeEditor();
            this.game.startGame();
        }
    }
    
    validateLevel() {
        // 检查是否有起点和终点
        const hasSpawn = this.editorMap.some(row => row.some(tile => tile.type === 'spawn'));
        const hasEnd = this.editorMap.some(row => row.some(tile => tile.type === 'end'));
        
        if (!hasSpawn) {
            alert('请设置起点！');
            return false;
        }
        
        if (!hasEnd) {
            alert('请设置终点！');
            return false;
        }
        
        if (this.editorPath.length < 2) {
            alert('路径太短，请添加更多路径点！');
            return false;
        }
        
        return true;
    }
    
    saveLevel() {
        const name = document.getElementById('level-name').value.trim();
        const description = document.getElementById('level-description').value.trim();
        const difficulty = document.getElementById('level-difficulty').value;
        
        if (!name) {
            alert('请输入关卡名称！');
            return;
        }
        
        if (!this.validateLevel()) {
            return;
        }
        
        const levelData = this.createLevelData();
        levelData.name = name;
        levelData.description = description;
        levelData.difficulty = difficulty;
        levelData.id = Date.now().toString();
        levelData.created = new Date().toLocaleDateString('zh-CN');
        
        this.customLevels.push(levelData);
        this.saveCustomLevels();
        this.updateCustomLevelsList();
        
        alert('关卡保存成功！');
        
        // 清空输入框
        document.getElementById('level-name').value = '';
        document.getElementById('level-description').value = '';
    }
    
    createLevelData() {
        return {
            map: JSON.parse(JSON.stringify(this.editorMap)),
            path: JSON.parse(JSON.stringify(this.editorPath)),
            waves: this.generateWavesForDifficulty('normal') // 默认波次
        };
    }
    
    generateWavesForDifficulty(difficulty) {
        const waveCount = { easy: 10, normal: 15, hard: 20, expert: 25 }[difficulty] || 15;
        const waves = [];
        
        for (let wave = 1; wave <= waveCount; wave++) {
            const waveEnemies = [];
            const enemyCount = Math.floor(5 + wave * 1.2);
            
            for (let i = 0; i < enemyCount; i++) {
                let type = 'basic';
                const rand = Math.random();
                
                if (wave > 3 && rand < 0.3) type = 'fast';
                if (wave > 7 && rand < 0.2) type = 'heavy';
                if (wave > 12 && rand < 0.15) type = 'flying';
                if (wave > 18 && rand < 0.05) type = 'boss';
                
                waveEnemies.push({ type, delay: i * 600 });
            }
            
            waves.push(waveEnemies);
        }
        
        return waves;
    }
    
    loadCustomLevels() {
        const saved = localStorage.getItem('towerDefenseCustomLevels');
        this.customLevels = saved ? JSON.parse(saved) : [];
    }
    
    saveCustomLevels() {
        localStorage.setItem('towerDefenseCustomLevels', JSON.stringify(this.customLevels));
    }
    
    updateCustomLevelsList() {
        const list = document.getElementById('custom-levels-list');
        list.innerHTML = '';
        
        if (this.customLevels.length === 0) {
            list.innerHTML = '<p class="no-levels">暂无自定义关卡</p>';
            return;
        }
        
        this.customLevels.forEach(level => {
            const item = document.createElement('div');
            item.className = 'custom-level-item';
            item.innerHTML = `
                <div class="level-info">
                    <div class="level-name">${level.name}</div>
                    <div class="level-meta">
                        <span class="difficulty ${level.difficulty}">${this.getDifficultyText(level.difficulty)}</span>
                        <span class="created">${level.created}</span>
                    </div>
                    <div class="level-description">${level.description || '无描述'}</div>
                </div>
                <div class="level-actions">
                    <button class="btn btn-sm btn-primary" onclick="levelEditor.playLevel('${level.id}')">游玩</button>
                    <button class="btn btn-sm btn-secondary" onclick="levelEditor.editLevel('${level.id}')">编辑</button>
                    <button class="btn btn-sm btn-danger" onclick="levelEditor.deleteLevel('${level.id}')">删除</button>
                </div>
            `;
            list.appendChild(item);
        });
    }
    
    getDifficultyText(difficulty) {
        const texts = { easy: '简单', normal: '普通', hard: '困难', expert: '专家' };
        return texts[difficulty] || '普通';
    }
    
    playLevel(levelId) {
        const level = this.customLevels.find(l => l.id === levelId);
        if (level) {
            this.game.loadCustomLevel(level);
            this.closeEditor();
            this.game.startGame();
        }
    }
    
    editLevel(levelId) {
        const level = this.customLevels.find(l => l.id === levelId);
        if (level) {
            this.currentLevel = level;
            this.editorMap = JSON.parse(JSON.stringify(level.map));
            this.editorPath = JSON.parse(JSON.stringify(level.path));
            this.game.map = this.editorMap;
            this.game.path = this.editorPath;
            
            document.getElementById('level-name').value = level.name;
            document.getElementById('level-description').value = level.description || '';
            document.getElementById('level-difficulty').value = level.difficulty;
        }
    }
    
    deleteLevel(levelId) {
        if (confirm('确定要删除这个关卡吗？')) {
            this.customLevels = this.customLevels.filter(l => l.id !== levelId);
            this.saveCustomLevels();
            this.updateCustomLevelsList();
        }
    }
    
    exportLevel(levelId) {
        const level = this.customLevels.find(l => l.id === levelId);
        if (level) {
            const blob = new Blob([JSON.stringify(level, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${level.name}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
        }
    }
    
    importLevel(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const levelData = JSON.parse(e.target.result);
                    
                    // 验证关卡数据
                    if (!levelData.map || !levelData.path || !levelData.name) {
                        reject(new Error('无效的关卡文件格式'));
                        return;
                    }
                    
                    // 生成新ID避免冲突
                    levelData.id = Date.now().toString();
                    levelData.created = new Date().toLocaleDateString('zh-CN');
                    
                    this.customLevels.push(levelData);
                    this.saveCustomLevels();
                    this.updateCustomLevelsList();
                    
                    resolve(levelData.name);
                } catch (error) {
                    reject(new Error('文件解析失败'));
                }
            };
            
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsText(file);
        });
    }
}
