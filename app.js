// Advanced Tower Defense Game - Enhanced UI/UX with Precise Mouse Tracking

class TowerDefenseGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Precise mouse tracking
        this.mousePos = { x: 0, y: 0 };
        this.canvasRect = null;
        
        // Game data from JSON
        this.towerData = {
            kinetic: { id: 1, name: 'Kinetic Tower', cost: 15, damage: 8, range: 100, fireRate: 1.5, description: 'Schnelle kinetische Projektile', icon: '🎯', color: '#ff4757' },
            plasma: { id: 2, name: 'Plasma Tower', cost: 25, damage: 15, range: 80, fireRate: 1.0, description: 'Energiebasierte Strahlenwaffe', icon: '⚡', color: '#3742fa' },
            frost: { id: 3, name: 'Frost Tower', cost: 20, damage: 5, range: 70, fireRate: 0.8, description: 'Verlangsamt Gegner mit Eis', icon: '❄️', color: '#70a1ff' },
            lightning: { id: 4, name: 'Lightning Tower', cost: 35, damage: 12, range: 90, fireRate: 1.2, description: 'Kettenblitze zwischen Gegnern', icon: '⚡', color: '#ffa502' },
            nano: { id: 5, name: 'Nano Tower', cost: 30, damage: 10, range: 60, fireRate: 2.0, description: 'Selbstreparatur und Verstärkung', icon: '🔬', color: '#2ed573' },
            fusion: { id: 6, name: 'Fusion Tower', cost: 50, damage: 25, range: 120, fireRate: 0.6, description: 'Ultimate Energiewaffe', icon: '💥', color: '#ff6b81' }
        };

        this.enemyData = [
            { id: 1, name: 'Scout', health: 20, speed: 2.5, reward: 5, color: '#ff6b81' },
            { id: 2, name: 'Warrior', health: 40, speed: 1.8, reward: 10, color: '#ffa502' },
            { id: 3, name: 'Tank', health: 80, speed: 1.2, reward: 20, color: '#3742fa' },
            { id: 4, name: 'Flyer', health: 30, speed: 3.0, reward: 15, color: '#70a1ff' },
            { id: 5, name: 'Boss', health: 200, speed: 0.8, reward: 50, color: '#ff4757' }
        ];
        
        // Game state
        this.gameStats = {
            gold: 100,
            lives: 20,
            wave: 1,
            maxWaves: 20,
            score: 0
        };
        
        // Game objects
        this.selectedTowerType = null;
        this.selectedTower = null; // For upgrades
        this.placedTowers = [];
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.damageNumbers = [];
        
        // Game settings
        this.gameSpeed = 1;
        this.isPaused = false;
        this.gameRunning = false;
        this.upgradeMode = false;
        this.sellMode = false;
        
        // Grid system
        this.gridSize = 40;
        this.grid = [];
        
        // Enemy path
        this.enemyPath = [];
        this.enemySpawnTimer = 0;
        this.waveTimer = 15;
        this.enemiesInWave = 0;
        this.enemiesSpawned = 0;
        this.waveActive = false;
        
        // Performance
        this.lastTime = 0;
        this.deltaTime = 0;
        this.fpsCounter = 0;
        this.fpsLastTime = 0;
        
        // Object pools for performance
        this.projectilePool = [];
        this.particlePool = [];
        
        this.init();
    }
    
    async init() {
        await this.showLoadingScreen();
        this.setupCanvas();
        this.generateGrid();
        this.generateEnemyPath();
        this.setupEventListeners();
        this.updateUI();
        this.hideLoadingScreen();
        this.startGame();
        
        this.showNotification('🎮 Willkommen beim Tower Defense! Wähle einen Turm zum Platzieren.', 'info');
        
        // Show tutorial after 2 seconds
        setTimeout(() => {
            this.showTutorial();
        }, 2000);
    }
    
    showTutorial() {
        this.showNotification('💡 Tipp: Verwende Tasten 1-6 für schnelle Turm-Auswahl!', 'info');
        setTimeout(() => {
            this.showNotification('⚡ Tipp: Drücke LEERTASTE zum Pausieren!', 'info');
        }, 4000);
    }
    
    async showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.style.display = 'flex';
        
        // Simulate loading time with progress
        return new Promise(resolve => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                if (progress >= 100) {
                    clearInterval(interval);
                    resolve();
                }
            }, 150);
        });
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.classList.add('hidden');
        
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }
    
    setupCanvas() {
        // Get actual container dimensions
        const container = this.canvas.parentElement;
        const containerRect = container.getBoundingClientRect();
        
        // Set canvas size with device pixel ratio for sharp rendering
        const dpr = window.devicePixelRatio || 1;
        const displayWidth = Math.floor(containerRect.width - 32);
        const displayHeight = Math.floor(containerRect.height - 32);
        
        this.canvas.style.width = displayWidth + 'px';
        this.canvas.style.height = displayHeight + 'px';
        this.canvas.width = displayWidth * dpr;
        this.canvas.height = displayHeight * dpr;
        
        // Scale context for high DPI
        this.ctx.scale(dpr, dpr);
        
        // Update canvas rect for precise mouse tracking
        this.updateCanvasRect();
        
        // Recalculate grid
        this.gridCols = Math.floor(displayWidth / this.gridSize);
        this.gridRows = Math.floor(displayHeight / this.gridSize);
    }
    
    updateCanvasRect() {
        // Critical: Update canvas bounding rect for precise mouse positioning
        this.canvasRect = this.canvas.getBoundingClientRect();
    }
    
    generateGrid() {
        this.grid = [];
        for (let row = 0; row < this.gridRows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridCols; col++) {
                this.grid[row][col] = {
                    x: col * this.gridSize + this.gridSize / 2,
                    y: row * this.gridSize + this.gridSize / 2,
                    occupied: false,
                    onPath: false,
                    tower: null
                };
            }
        }
    }
    
    generateEnemyPath() {
        this.enemyPath = [];
        const startRow = Math.floor(this.gridRows / 2);
        let currentRow = startRow;
        
        // Create a more interesting path
        for (let col = 0; col < this.gridCols; col++) {
            this.enemyPath.push({
                x: col * this.gridSize + this.gridSize / 2,
                y: currentRow * this.gridSize + this.gridSize / 2
            });
            
            // Mark grid cells as path
            if (this.grid[currentRow] && this.grid[currentRow][col]) {
                this.grid[currentRow][col].onPath = true;
            }
            
            // Create curves in the path
            if (col < this.gridCols - 5 && Math.random() < 0.3) {
                const direction = Math.random() < 0.5 ? -1 : 1;
                const newRow = currentRow + direction;
                if (newRow >= 1 && newRow < this.gridRows - 1) {
                    currentRow = newRow;
                }
            }
        }
    }
    
    setupEventListeners() {
        // Tower selection
        document.querySelectorAll('.tower-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const towerType = card.dataset.tower;
                const cost = parseInt(card.dataset.cost);
                this.selectTower(towerType, cost);
            });
            
            // Hover effects
            card.addEventListener('mouseenter', (e) => {
                const towerType = card.dataset.tower;
                this.showTowerDetails(towerType);
            });
        });
        
        // Canvas events with precise mouse tracking
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => this.hideRangeIndicator());
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // Game controls
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const speed = parseInt(btn.dataset.speed);
                this.setGameSpeed(speed);
            });
        });
        
        document.getElementById('sellModeBtn').addEventListener('click', () => this.toggleSellMode());
        document.getElementById('upgradeModeBtn').addEventListener('click', () => this.toggleUpgradeMode());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Window events
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('blur', () => this.handleWindowBlur());
        window.addEventListener('focus', () => this.handleWindowFocus());
        
        // Update canvas rect on scroll
        window.addEventListener('scroll', () => this.updateCanvasRect());
    }
    
    handleResize() {
        this.setupCanvas();
        this.generateGrid();
        this.generateEnemyPath();
        this.updateCanvasRect();
    }
    
    handleWindowBlur() {
        if (this.gameRunning && !this.isPaused) {
            this.togglePause();
            this.showNotification('⏸️ Spiel pausiert (Fenster verloren)', 'info');
        }
    }
    
    handleWindowFocus() {
        this.updateCanvasRect();
    }
    
    selectTower(towerType, cost) {
        if (this.sellMode || this.upgradeMode) {
            this.exitSpecialModes();
        }
        
        if (this.gameStats.gold < cost) {
            this.showNotification('❌ Nicht genug Gold!', 'error');
            this.shakeTowerCard(towerType);
            return;
        }
        
        // Toggle selection
        const wasSelected = this.selectedTowerType === towerType;
        this.clearTowerSelection();
        
        if (!wasSelected) {
            this.selectedTowerType = towerType;
            const card = document.querySelector(`[data-tower="${towerType}"]`);
            card.classList.add('selected');
            document.querySelector('.game-area').classList.add('placing-tower', `placing-${towerType}`);
            this.showTowerDetails(towerType);
            this.showNotification(`🎯 ${this.towerData[towerType].name} ausgewählt - Klicke zum Platzieren`, 'success');
        }
    }
    
    clearTowerSelection() {
        this.selectedTowerType = null;
        this.selectedTower = null;
        document.querySelectorAll('.tower-card').forEach(card => card.classList.remove('selected'));
        document.querySelector('.game-area').className = 'game-area';
        this.hideRangeIndicator();
    }
    
    exitSpecialModes() {
        this.sellMode = false;
        this.upgradeMode = false;
        document.getElementById('sellModeBtn').classList.remove('active');
        document.getElementById('upgradeModeBtn').classList.remove('active');
        this.clearTowerSelection();
    }
    
    shakeTowerCard(towerType) {
        const card = document.querySelector(`[data-tower="${towerType}"]`);
        card.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            card.style.animation = '';
        }, 500);
        
        // Add shake animation if not exists
        if (!document.getElementById('shakeStyle')) {
            const style = document.createElement('style');
            style.id = 'shakeStyle';
            style.textContent = `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    showTowerDetails(towerType) {
        const towerData = this.towerData[towerType];
        const detailsSection = document.getElementById('towerDetails');
        
        detailsSection.classList.add('active');
        document.getElementById('towerPreviewIcon').textContent = towerData.icon;
        document.getElementById('towerPreviewName').textContent = towerData.name;
        document.getElementById('towerPreviewDesc').textContent = towerData.description;
        document.getElementById('detailDamage').textContent = towerData.damage;
        document.getElementById('detailRange').textContent = towerData.range;
        document.getElementById('detailFireRate').textContent = towerData.fireRate;
        document.getElementById('detailCost').textContent = `${towerData.cost} 🪙`;
    }
    
    handleCanvasClick(e) {
        e.preventDefault();
        const mousePos = this.getMousePos(e);
        
        if (this.sellMode) {
            this.sellTowerAt(mousePos.x, mousePos.y);
        } else if (this.upgradeMode) {
            this.upgradeTowerAt(mousePos.x, mousePos.y);
        } else if (this.selectedTowerType) {
            this.placeTower(mousePos.x, mousePos.y);
        } else {
            // Select existing tower for details
            this.selectExistingTower(mousePos.x, mousePos.y);
        }
    }
    
    handleCanvasMouseMove(e) {
        const mousePos = this.getMousePos(e);
        this.mousePos = mousePos;
        
        if (this.selectedTowerType) {
            this.showRangeIndicator(mousePos.x, mousePos.y);
        }
    }
    
    // Critical: Precise mouse position calculation with proper scaling
    getMousePos(e) {
        if (!this.canvasRect) {
            this.updateCanvasRect();
        }
        
        const rect = this.canvasRect;
        const scaleX = this.canvas.offsetWidth / this.canvas.width * (window.devicePixelRatio || 1);
        const scaleY = this.canvas.offsetHeight / this.canvas.height * (window.devicePixelRatio || 1);
        
        return {
            x: (e.clientX - rect.left) / scaleX,
            y: (e.clientY - rect.top) / scaleY
        };
    }
    
    // Touch event handlers for mobile
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('click', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.handleCanvasClick(mouseEvent);
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.handleCanvasMouseMove(mouseEvent);
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
    }
    
    showRangeIndicator(x, y) {
        if (!this.selectedTowerType) return;
        
        const towerData = this.towerData[this.selectedTowerType];
        const indicator = document.getElementById('rangeIndicator');
        const range = towerData.range;
        
        // Position indicator relative to canvas position
        const canvasRect = this.canvas.getBoundingClientRect();
        const left = canvasRect.left + x - range;
        const top = canvasRect.top + y - range;
        
        indicator.style.left = left + 'px';
        indicator.style.top = top + 'px';
        indicator.style.width = (range * 2) + 'px';
        indicator.style.height = (range * 2) + 'px';
        indicator.classList.add('active');
    }
    
    hideRangeIndicator() {
        document.getElementById('rangeIndicator').classList.remove('active');
    }
    
    placeTower(x, y) {
        const gridPos = this.getGridPosition(x, y);
        
        if (!gridPos || gridPos.occupied || gridPos.onPath) {
            this.showNotification('❌ Ungültiger Platz für Turm!', 'error');
            this.createErrorParticles(x, y);
            return;
        }
        
        const towerData = this.towerData[this.selectedTowerType];
        
        if (this.gameStats.gold < towerData.cost) {
            this.showNotification('❌ Nicht genug Gold!', 'error');
            return;
        }
        
        // Create tower with immediate visual feedback
        const tower = {
            id: Date.now(),
            type: this.selectedTowerType,
            x: gridPos.x,
            y: gridPos.y,
            data: { ...towerData },
            level: 1,
            kills: 0,
            damage: towerData.damage,
            range: towerData.range,
            fireRate: towerData.fireRate,
            lastShot: 0,
            target: null,
            upgrades: [],
            rotation: 0,
            sellValue: Math.floor(towerData.cost * 0.7)
        };
        
        this.placedTowers.push(tower);
        gridPos.occupied = true;
        gridPos.tower = tower;
        
        this.gameStats.gold -= towerData.cost;
        this.gameStats.score += towerData.cost;
        
        // Immediate UI update for responsiveness
        this.updateUI();
        
        this.showNotification(`✅ ${towerData.name} platziert!`, 'success');
        this.createPlacementParticles(gridPos.x, gridPos.y, towerData.color);
        
        this.clearTowerSelection();
    }
    
    selectExistingTower(x, y) {
        for (let tower of this.placedTowers) {
            const distance = Math.sqrt(Math.pow(x - tower.x, 2) + Math.pow(y - tower.y, 2));
            if (distance <= 25) {
                this.selectedTower = tower;
                this.showTowerUpgradeOptions(tower);
                this.showNotification(`🔧 ${tower.data.name} ausgewählt - Level ${tower.level}`, 'info');
                return;
            }
        }
    }
    
    showTowerUpgradeOptions(tower) {
        const detailsSection = document.getElementById('towerDetails');
        detailsSection.classList.add('active');
        
        document.getElementById('towerPreviewIcon').textContent = tower.data.icon;
        document.getElementById('towerPreviewName').textContent = `${tower.data.name} (Level ${tower.level})`;
        document.getElementById('towerPreviewDesc').textContent = `Kills: ${tower.kills} | Verkaufswert: ${tower.sellValue}🪙`;
        document.getElementById('detailDamage').textContent = Math.floor(tower.damage);
        document.getElementById('detailRange').textContent = Math.floor(tower.range);
        document.getElementById('detailFireRate').textContent = tower.fireRate.toFixed(1);
        document.getElementById('detailCost').textContent = `Upgrade: ${this.getUpgradeCost(tower)}🪙`;
    }
    
    getUpgradeCost(tower) {
        return Math.floor(tower.data.cost * (tower.level + 1) * 0.6);
    }
    
    upgradeTowerAt(x, y) {
        for (let tower of this.placedTowers) {
            const distance = Math.sqrt(Math.pow(x - tower.x, 2) + Math.pow(y - tower.y, 2));
            if (distance <= 25) {
                this.upgradeTower(tower);
                return;
            }
        }
        this.showNotification('❌ Kein Turm zum Upgraden gefunden!', 'error');
    }
    
    upgradeTower(tower) {
        const upgradeCost = this.getUpgradeCost(tower);
        
        if (this.gameStats.gold < upgradeCost) {
            this.showNotification('❌ Nicht genug Gold für Upgrade!', 'error');
            return;
        }
        
        this.gameStats.gold -= upgradeCost;
        tower.level++;
        tower.damage *= 1.3;
        tower.range *= 1.1;
        tower.fireRate *= 1.2;
        tower.sellValue = Math.floor(tower.sellValue * 1.4);
        
        this.createUpgradeParticles(tower.x, tower.y, tower.data.color);
        this.showNotification(`⬆️ ${tower.data.name} auf Level ${tower.level} upgegraded!`, 'success');
        this.updateUI();
    }
    
    sellTowerAt(x, y) {
        for (let i = 0; i < this.placedTowers.length; i++) {
            const tower = this.placedTowers[i];
            const distance = Math.sqrt(Math.pow(x - tower.x, 2) + Math.pow(y - tower.y, 2));
            if (distance <= 25) {
                this.sellTower(tower, i);
                return;
            }
        }
        this.showNotification('❌ Kein Turm zum Verkaufen gefunden!', 'error');
    }
    
    sellTower(tower, index) {
        // Find grid position and clear it
        const gridPos = this.getGridPosition(tower.x, tower.y);
        if (gridPos) {
            gridPos.occupied = false;
            gridPos.tower = null;
        }
        
        this.placedTowers.splice(index, 1);
        this.gameStats.gold += tower.sellValue;
        
        this.createSellParticles(tower.x, tower.y, '#ffa502');
        this.showNotification(`💰 ${tower.data.name} für ${tower.sellValue}🪙 verkauft!`, 'success');
        this.updateUI();
    }
    
    toggleSellMode() {
        this.sellMode = !this.sellMode;
        this.upgradeMode = false;
        
        document.getElementById('sellModeBtn').classList.toggle('active', this.sellMode);
        document.getElementById('upgradeModeBtn').classList.remove('active');
        
        if (this.sellMode) {
            this.clearTowerSelection();
            this.canvas.style.cursor = 'not-allowed';
            this.showNotification('🗑️ Verkaufsmodus aktiv - Klicke auf Türme zum Verkaufen', 'warning');
        } else {
            this.canvas.style.cursor = 'crosshair';
            this.showNotification('✅ Verkaufsmodus deaktiviert', 'info');
        }
    }
    
    toggleUpgradeMode() {
        this.upgradeMode = !this.upgradeMode;
        this.sellMode = false;
        
        document.getElementById('upgradeModeBtn').classList.toggle('active', this.upgradeMode);
        document.getElementById('sellModeBtn').classList.remove('active');
        
        if (this.upgradeMode) {
            this.clearTowerSelection();
            this.canvas.style.cursor = 'pointer';
            this.showNotification('⬆️ Upgrade-Modus aktiv - Klicke auf Türme zum Upgraden', 'warning');
        } else {
            this.canvas.style.cursor = 'crosshair';
            this.showNotification('✅ Upgrade-Modus deaktiviert', 'info');
        }
    }
    
    getGridPosition(x, y) {
        const col = Math.floor(x / this.gridSize);
        const row = Math.floor(y / this.gridSize);
        
        if (row >= 0 && row < this.gridRows && col >= 0 && col < this.gridCols) {
            return this.grid[row][col];
        }
        return null;
    }
    
    startGame() {
        this.gameRunning = true;
        this.waveTimer = 15;
        setTimeout(() => this.spawnWave(), 1000);
        this.gameLoop();
    }
    
    spawnWave() {
        const waveSize = 5 + (this.gameStats.wave * 2);
        this.enemiesInWave = waveSize;
        this.enemiesSpawned = 0;
        this.enemySpawnTimer = 0;
        this.waveActive = true;
        
        this.showNotification(`🌊 Welle ${this.gameStats.wave} beginnt! ${waveSize} Feinde kommen!`, 'warning');
    }
    
    spawnEnemy() {
        if (this.enemiesSpawned >= this.enemiesInWave) return;
        
        const enemyType = this.enemyData[Math.floor(Math.random() * this.enemyData.length)];
        const waveMultiplier = 1 + (this.gameStats.wave - 1) * 0.2;
        
        const enemy = {
            id: Date.now() + Math.random(),
            type: enemyType.name,
            x: this.enemyPath[0].x,
            y: this.enemyPath[0].y,
            pathIndex: 0,
            health: Math.floor(enemyType.health * waveMultiplier),
            maxHealth: Math.floor(enemyType.health * waveMultiplier),
            speed: enemyType.speed,
            reward: Math.floor(enemyType.reward * waveMultiplier),
            color: enemyType.color,
            effects: [],
            isDead: false,
            reachedEnd: false,
            size: 12 + Math.random() * 6
        };
        
        this.enemies.push(enemy);
        this.enemiesSpawned++;
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        const btn = document.getElementById('pauseBtn');
        const icon = btn.querySelector('.btn-icon');
        const label = btn.querySelector('.btn-label');
        
        if (this.isPaused) {
            icon.textContent = '▶️';
            label.textContent = 'Fortsetzen';
            btn.classList.add('active');
        } else {
            icon.textContent = '⏸️';
            label.textContent = 'Pause';
            btn.classList.remove('active');
        }
        
        this.showNotification(this.isPaused ? '⏸️ Spiel pausiert' : '▶️ Spiel fortgesetzt', 'info');
    }
    
    setGameSpeed(speed) {
        this.gameSpeed = speed;
        
        document.querySelectorAll('.speed-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`speed${speed}x`).classList.add('active');
        
        this.showNotification(`⚡ Geschwindigkeit: ${speed}x`, 'info');
    }
    
    handleKeyDown(e) {
        const keyMap = { '1': 'kinetic', '2': 'plasma', '3': 'frost', '4': 'lightning', '5': 'nano', '6': 'fusion' };
        
        if (keyMap[e.key]) {
            const towerType = keyMap[e.key];
            const cost = this.towerData[towerType].cost;
            this.selectTower(towerType, cost);
        }
        
        switch (e.key) {
            case ' ':
                e.preventDefault();
                this.togglePause();
                break;
            case 'Escape':
                this.clearTowerSelection();
                this.exitSpecialModes();
                break;
            case 's':
            case 'S':
                this.toggleSellMode();
                break;
            case 'u':
            case 'U':
                this.toggleUpgradeMode();
                break;
        }
    }
    
    updateGame(deltaTime) {
        if (this.isPaused) return;
        
        // Update timers
        this.enemySpawnTimer += deltaTime;
        if (!this.waveActive && this.waveTimer > 0) {
            this.waveTimer -= deltaTime;
        }
        
        // Spawn enemies
        if (this.waveActive && this.enemySpawnTimer > 1.0 && this.enemiesSpawned < this.enemiesInWave) {
            this.spawnEnemy();
            this.enemySpawnTimer = 0;
        }
        
        // Update game objects
        this.updateEnemies(deltaTime);
        this.updateTowers(deltaTime);
        this.updateProjectiles(deltaTime);
        this.updateParticles(deltaTime);
        this.updateDamageNumbers(deltaTime);
        
        // Check wave completion
        if (this.waveActive && this.enemiesSpawned >= this.enemiesInWave && this.enemies.length === 0) {
            this.completeWave();
        }
        
        // Check game over
        if (this.gameStats.lives <= 0) {
            this.gameOver();
        }
        
        // Auto-start next wave when timer runs out
        if (!this.waveActive && this.waveTimer <= 0) {
            this.spawnWave();
        }
    }
    
    updateEnemies(deltaTime) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            if (enemy.isDead) {
                this.killEnemy(enemy, i);
                continue;
            }
            
            if (enemy.reachedEnd) {
                this.enemies.splice(i, 1);
                this.gameStats.lives--;
                this.showNotification(`💔 Leben verloren! ${this.gameStats.lives} übrig`, 'error');
                continue;
            }
            
            this.moveEnemy(enemy, deltaTime);
            this.updateEnemyEffects(enemy, deltaTime);
        }
    }
    
    moveEnemy(enemy, deltaTime) {
        if (enemy.pathIndex >= this.enemyPath.length - 1) {
            enemy.reachedEnd = true;
            return;
        }
        
        const target = this.enemyPath[enemy.pathIndex + 1];
        const dx = target.x - enemy.x;
        const dy = target.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 5) {
            enemy.pathIndex++;
            return;
        }
        
        let currentSpeed = enemy.speed;
        
        // Apply effects
        for (let effect of enemy.effects) {
            if (effect.type === 'slow') {
                currentSpeed *= effect.multiplier;
            }
        }
        
        const moveSpeed = currentSpeed * deltaTime * 60 * this.gameSpeed;
        enemy.x += (dx / distance) * moveSpeed;
        enemy.y += (dy / distance) * moveSpeed;
    }
    
    updateEnemyEffects(enemy, deltaTime) {
        for (let i = enemy.effects.length - 1; i >= 0; i--) {
            const effect = enemy.effects[i];
            effect.duration -= deltaTime;
            
            if (effect.duration <= 0) {
                enemy.effects.splice(i, 1);
            }
        }
    }
    
    killEnemy(enemy, index) {
        this.enemies.splice(index, 1);
        this.gameStats.gold += enemy.reward;
        this.gameStats.score += enemy.reward * 10;
        this.createDeathParticles(enemy.x, enemy.y, enemy.color);
        
        // Find the tower that killed this enemy
        for (let tower of this.placedTowers) {
            if (tower.target === enemy) {
                tower.kills++;
                tower.target = null;
                break;
            }
        }
    }
    
    updateTowers(deltaTime) {
        for (let tower of this.placedTowers) {
            // Find target
            tower.target = this.findTarget(tower);
            
            // Rotate towards target
            if (tower.target) {
                const dx = tower.target.x - tower.x;
                const dy = tower.target.y - tower.y;
                tower.rotation = Math.atan2(dy, dx);
            }
            
            // Shoot
            if (tower.target && this.canShoot(tower)) {
                this.shootProjectile(tower);
            }
        }
    }
    
    findTarget(tower) {
        let bestTarget = null;
        let bestProgress = -1;
        
        for (let enemy of this.enemies) {
            if (enemy.isDead) continue;
            
            const distance = Math.sqrt(
                Math.pow(enemy.x - tower.x, 2) + Math.pow(enemy.y - tower.y, 2)
            );
            
            if (distance <= tower.range) {
                // Prioritize enemies further along the path
                if (enemy.pathIndex > bestProgress) {
                    bestProgress = enemy.pathIndex;
                    bestTarget = enemy;
                }
            }
        }
        
        return bestTarget;
    }
    
    canShoot(tower) {
        const currentTime = Date.now();
        const cooldown = 1000 / tower.fireRate;
        return (currentTime - tower.lastShot) >= cooldown;
    }
    
    shootProjectile(tower) {
        const projectile = this.getProjectileFromPool();
        
        projectile.active = true;
        projectile.x = tower.x;
        projectile.y = tower.y;
        projectile.targetX = tower.target.x;
        projectile.targetY = tower.target.y;
        projectile.target = tower.target;
        projectile.speed = 400;
        projectile.damage = tower.damage;
        projectile.type = tower.type;
        projectile.color = tower.data.color;
        
        tower.lastShot = Date.now();
        
        // Create muzzle flash
        this.createMuzzleFlash(tower.x, tower.y, tower.data.color);
    }
    
    updateProjectiles(deltaTime) {
        for (let projectile of this.projectiles) {
            if (!projectile.active) continue;
            
            if (!projectile.target || projectile.target.isDead) {
                this.returnProjectileToPool(projectile);
                continue;
            }
            
            // Move towards target
            const dx = projectile.target.x - projectile.x;
            const dy = projectile.target.y - projectile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 8) {
                this.hitTarget(projectile);
                this.returnProjectileToPool(projectile);
            } else {
                const moveSpeed = projectile.speed * deltaTime * this.gameSpeed;
                projectile.x += (dx / distance) * moveSpeed;
                projectile.y += (dy / distance) * moveSpeed;
            }
        }
    }
    
    hitTarget(projectile) {
        const enemy = projectile.target;
        const damage = projectile.damage;
        
        enemy.health -= damage;
        this.createDamageNumber(enemy.x, enemy.y, damage);
        this.createHitParticles(enemy.x, enemy.y, projectile.color);
        
        // Apply special effects
        this.applyTowerEffects(projectile.type, enemy);
        
        if (enemy.health <= 0) {
            enemy.isDead = true;
        }
    }
    
    applyTowerEffects(towerType, enemy) {
        switch (towerType) {
            case 'frost':
                enemy.effects.push({
                    type: 'slow',
                    duration: 2,
                    multiplier: 0.5
                });
                break;
            case 'lightning':
                this.chainLightning(enemy);
                break;
        }
    }
    
    chainLightning(sourceEnemy) {
        const chainRange = 60;
        const chainDamage = 8;
        let chained = 0;
        const maxChains = 3;
        
        for (let enemy of this.enemies) {
            if (enemy === sourceEnemy || enemy.isDead || chained >= maxChains) continue;
            
            const distance = Math.sqrt(
                Math.pow(enemy.x - sourceEnemy.x, 2) + Math.pow(enemy.y - sourceEnemy.y, 2)
            );
            
            if (distance <= chainRange) {
                enemy.health -= chainDamage;
                this.createDamageNumber(enemy.x, enemy.y, chainDamage);
                this.createLightningEffect(sourceEnemy.x, sourceEnemy.y, enemy.x, enemy.y);
                chained++;
                
                if (enemy.health <= 0) {
                    enemy.isDead = true;
                }
            }
        }
    }
    
    completeWave() {
        this.waveActive = false;
        this.gameStats.wave++;
        const bonus = 20 + (this.gameStats.wave * 5);
        this.gameStats.gold += bonus;
        this.gameStats.score += bonus * 5;
        
        this.showNotification(`🎉 Welle ${this.gameStats.wave - 1} abgeschlossen! +${bonus} Gold`, 'success');
        
        if (this.gameStats.wave > this.gameStats.maxWaves) {
            this.gameWin();
        } else {
            this.waveTimer = 15;
            this.showNotification(`⏱️ Nächste Welle in 15 Sekunden...`, 'info');
        }
    }
    
    gameOver() {
        this.gameRunning = false;
        this.isPaused = true;
        this.showNotification(`💀 Spiel vorbei! Endpunktzahl: ${this.gameStats.score.toLocaleString()}`, 'error');
    }
    
    gameWin() {
        this.gameRunning = false;
        this.isPaused = true;
        this.showNotification(`🏆 Sieg! Alle Wellen besiegt! Endpunktzahl: ${this.gameStats.score.toLocaleString()}`, 'success');
    }
    
    // Object pooling for performance
    getProjectileFromPool() {
        for (let projectile of this.projectilePool) {
            if (!projectile.active) {
                return projectile;
            }
        }
        
        // Create new if pool is empty
        const projectile = { active: false, x: 0, y: 0, targetX: 0, targetY: 0, target: null, speed: 0, damage: 0, type: '', color: '' };
        this.projectilePool.push(projectile);
        this.projectiles.push(projectile);
        return projectile;
    }
    
    returnProjectileToPool(projectile) {
        projectile.active = false;
        projectile.target = null;
    }
    
    // Enhanced particle effects
    createPlacementParticles(x, y, color) {
        for (let i = 0; i < 20; i++) {
            this.createParticle(x, y, color, 'burst');
        }
    }
    
    createDeathParticles(x, y, color) {
        for (let i = 0; i < 15; i++) {
            this.createParticle(x, y, color, 'explosion');
        }
    }
    
    createErrorParticles(x, y) {
        for (let i = 0; i < 10; i++) {
            this.createParticle(x, y, '#ff4757', 'error');
        }
    }
    
    createHitParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            this.createParticle(x, y, color, 'hit');
        }
    }
    
    createMuzzleFlash(x, y, color) {
        for (let i = 0; i < 5; i++) {
            this.createParticle(x, y, color, 'muzzle');
        }
    }
    
    createUpgradeParticles(x, y, color) {
        for (let i = 0; i < 25; i++) {
            this.createParticle(x, y, '#ffd700', 'upgrade');
        }
    }
    
    createSellParticles(x, y, color) {
        for (let i = 0; i < 15; i++) {
            this.createParticle(x, y, color, 'sell');
        }
    }
    
    createParticle(x, y, color, type) {
        const particle = {
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            life: 1.0,
            maxLife: 1.0,
            size: Math.random() * 6 + 2,
            color: color,
            type: type
        };
        
        if (type === 'upgrade') {
            particle.vy -= 100; // Upward motion for upgrade
            particle.size *= 1.5;
        }
        
        this.particles.push(particle);
    }
    
    createLightningEffect(x1, y1, x2, y2) {
        // Create lightning visual effect
        const particle = {
            x1: x1, y1: y1, x2: x2, y2: y2,
            life: 0.3,
            maxLife: 0.3,
            type: 'lightning'
        };
        this.particles.push(particle);
    }
    
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.life -= deltaTime;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            
            if (particle.type !== 'lightning') {
                particle.x += particle.vx * deltaTime;
                particle.y += particle.vy * deltaTime;
                particle.vy += 100 * deltaTime; // Gravity
            }
        }
    }
    
    createDamageNumber(x, y, damage) {
        const damageNumber = {
            x: x + (Math.random() - 0.5) * 30,
            y: y - 20,
            damage: Math.floor(damage),
            life: 2.0,
            maxLife: 2.0,
            vy: -50
        };
        
        this.damageNumbers.push(damageNumber);
    }
    
    updateDamageNumbers(deltaTime) {
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const number = this.damageNumbers[i];
            number.life -= deltaTime;
            number.y += number.vy * deltaTime;
            number.vy += 20 * deltaTime; // Slow rise
            
            if (number.life <= 0) {
                this.damageNumbers.splice(i, 1);
            }
        }
    }
    
    updateUI() {
        document.getElementById('goldAmount').textContent = this.gameStats.gold;
        document.getElementById('livesCount').textContent = this.gameStats.lives;
        document.getElementById('scoreAmount').textContent = this.gameStats.score.toLocaleString();
        document.getElementById('currentWave').textContent = this.gameStats.wave;
        document.getElementById('totalWaves').textContent = this.gameStats.maxWaves;
        document.getElementById('nextWaveTimer').textContent = this.waveActive ? 'Aktiv!' : Math.ceil(this.waveTimer) + 's';
        document.getElementById('enemiesLeft').textContent = this.enemies.length;
        
        // Update tower affordability
        document.querySelectorAll('.tower-card').forEach(card => {
            const cost = parseInt(card.dataset.cost);
            if (this.gameStats.gold >= cost) {
                card.classList.add('affordable');
                card.classList.remove('expensive');
            } else {
                card.classList.add('expensive');
                card.classList.remove('affordable');
            }
        });
    }
    
    showNotification(message, type) {
        const container = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        container.appendChild(notification);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideInNotification 0.3s ease-out reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, 4000);
        
        // Limit number of notifications
        if (container.children.length > 5) {
            container.removeChild(container.firstChild);
        }
    }
    
    render() {
        // Clear canvas with proper scaling
        const displayWidth = this.canvas.width / (window.devicePixelRatio || 1);
        const displayHeight = this.canvas.height / (window.devicePixelRatio || 1);
        this.ctx.clearRect(0, 0, displayWidth, displayHeight);
        
        // Draw background
        this.drawBackground();
        
        // Draw path
        this.drawPath();
        
        // Draw placement grid
        if (this.selectedTowerType) {
            this.drawPlacementGrid();
        }
        
        // Draw game objects
        this.drawTowers();
        this.drawEnemies();
        this.drawProjectiles();
        this.drawParticles();
        this.drawDamageNumbers();
        
        // Draw tower preview
        if (this.selectedTowerType && this.mousePos.x && this.mousePos.y) {
            this.drawTowerPreview();
        }
        
        // Draw selected tower highlight
        if (this.selectedTower) {
            this.drawSelectedTowerHighlight();
        }
    }
    
    drawBackground() {
        // Draw subtle grid
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        this.ctx.lineWidth = 1;
        
        const displayWidth = this.canvas.width / (window.devicePixelRatio || 1);
        const displayHeight = this.canvas.height / (window.devicePixelRatio || 1);
        
        for (let x = 0; x <= displayWidth; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, displayHeight);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= displayHeight; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(displayWidth, y);
            this.ctx.stroke();
        }
    }
    
    drawPath() {
        if (this.enemyPath.length < 2) return;
        
        // Draw path background
        this.ctx.strokeStyle = 'rgba(100, 149, 237, 0.3)';
        this.ctx.lineWidth = 35;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.enemyPath[0].x, this.enemyPath[0].y);
        
        for (let i = 1; i < this.enemyPath.length; i++) {
            this.ctx.lineTo(this.enemyPath[i].x, this.enemyPath[i].y);
        }
        this.ctx.stroke();
        
        // Draw path border
        this.ctx.strokeStyle = 'rgba(135, 206, 250, 0.5)';
        this.ctx.lineWidth = 25;
        this.ctx.stroke();
    }
    
    drawPlacementGrid() {
        for (let row = 0; row < this.gridRows; row++) {
            for (let col = 0; col < this.gridCols; col++) {
                const cell = this.grid[row][col];
                
                if (cell.onPath || cell.occupied) continue;
                
                const x = col * this.gridSize;
                const y = row * this.gridSize;
                
                this.ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
                this.ctx.fillRect(x, y, this.gridSize, this.gridSize);
            }
        }
    }
    
    drawTowers() {
        for (let tower of this.placedTowers) {
            // Draw range if targeting or selected
            if (tower.target || tower === this.selectedTower) {
                this.ctx.strokeStyle = tower === this.selectedTower ? 'rgba(255, 255, 0, 0.3)' : 'rgba(255, 255, 255, 0.15)';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
                this.ctx.stroke();
            }
            
            // Draw tower base with level scaling
            const baseSize = 20 + (tower.level - 1) * 3;
            this.ctx.fillStyle = tower.data.color;
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.lineWidth = 3;
            
            this.ctx.beginPath();
            this.ctx.arc(tower.x, tower.y, baseSize, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Draw tower icon
            this.ctx.fillStyle = 'white';
            this.ctx.font = `bold ${24 + (tower.level - 1) * 4}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(tower.data.icon, tower.x, tower.y);
            
            // Draw level indicator
            if (tower.level > 1) {
                this.ctx.fillStyle = '#ffd700';
                this.ctx.font = 'bold 14px Arial';
                this.ctx.fillText(tower.level, tower.x + 15, tower.y - 15);
            }
            
            // Draw barrel (rotated towards target)
            if (tower.target) {
                this.ctx.save();
                this.ctx.translate(tower.x, tower.y);
                this.ctx.rotate(tower.rotation);
                
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                this.ctx.fillRect(baseSize - 5, -3, 15, 6);
                
                this.ctx.restore();
            }
        }
    }
    
    drawSelectedTowerHighlight() {
        if (!this.selectedTower) return;
        
        this.ctx.strokeStyle = '#ffd700';
        this.ctx.lineWidth = 4;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.arc(this.selectedTower.x, this.selectedTower.y, 30, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    drawEnemies() {
        for (let enemy of this.enemies) {
            if (enemy.isDead) continue;
            
            // Draw enemy body with pulsing effect
            const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.1;
            this.ctx.fillStyle = enemy.color;
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.lineWidth = 2;
            
            this.ctx.beginPath();
            this.ctx.arc(enemy.x, enemy.y, enemy.size * pulse, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Draw health bar
            const healthPercent = enemy.health / enemy.maxHealth;
            const barWidth = 30;
            const barHeight = 4;
            const barX = enemy.x - barWidth / 2;
            const barY = enemy.y - enemy.size - 10;
            
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            this.ctx.fillRect(barX, barY, barWidth, barHeight);
            
            this.ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
            this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
            
            // Draw effects
            for (let effect of enemy.effects) {
                if (effect.type === 'slow') {
                    this.ctx.strokeStyle = '#70a1ff';
                    this.ctx.lineWidth = 3;
                    this.ctx.beginPath();
                    this.ctx.arc(enemy.x, enemy.y, enemy.size + 5, 0, Math.PI * 2);
                    this.ctx.stroke();
                }
            }
        }
    }
    
    drawProjectiles() {
        for (let projectile of this.projectiles) {
            if (!projectile.active) continue;
            
            // Draw projectile with glow effect
            this.ctx.fillStyle = projectile.color;
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.lineWidth = 2;
            
            // Glow effect
            this.ctx.shadowColor = projectile.color;
            this.ctx.shadowBlur = 10;
            
            this.ctx.beginPath();
            this.ctx.arc(projectile.x, projectile.y, 5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Reset shadow
            this.ctx.shadowBlur = 0;
        }
    }
    
    drawParticles() {
        for (let particle of this.particles) {
            const alpha = particle.life / particle.maxLife;
            
            if (particle.type === 'lightning') {
                // Enhanced lightning effect
                this.ctx.strokeStyle = `rgba(255, 255, 100, ${alpha})`;
                this.ctx.lineWidth = 3;
                this.ctx.shadowColor = '#ffff00';
                this.ctx.shadowBlur = 10;
                
                this.ctx.beginPath();
                this.ctx.moveTo(particle.x1, particle.y1);
                this.ctx.lineTo(particle.x2, particle.y2);
                this.ctx.stroke();
                
                this.ctx.shadowBlur = 0;
            } else {
                const hexAlpha = Math.floor(alpha * 255).toString(16).padStart(2, '0');
                this.ctx.fillStyle = particle.color + hexAlpha;
                
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }
    
    drawDamageNumbers() {
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.lineWidth = 3;
        
        for (let number of this.damageNumbers) {
            const alpha = number.life / number.maxLife;
            const scale = 1 + (1 - alpha) * 0.5;
            
            this.ctx.save();
            this.ctx.translate(number.x, number.y);
            this.ctx.scale(scale, scale);
            
            this.ctx.strokeText(number.damage, 0, 0);
            this.ctx.fillStyle = `rgba(255, 107, 107, ${alpha})`;
            this.ctx.fillText(number.damage, 0, 0);
            
            this.ctx.restore();
        }
    }
    
    drawTowerPreview() {
        const gridPos = this.getGridPosition(this.mousePos.x, this.mousePos.y);
        if (!gridPos) return;
        
        const canPlace = !gridPos.occupied && !gridPos.onPath;
        const towerData = this.towerData[this.selectedTowerType];
        
        // Draw preview tower
        this.ctx.fillStyle = canPlace ? 'rgba(0, 255, 0, 0.6)' : 'rgba(255, 0, 0, 0.6)';
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.arc(gridPos.x, gridPos.y, 20, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Draw range preview
        this.ctx.strokeStyle = canPlace ? 'rgba(0, 255, 0, 0.4)' : 'rgba(255, 0, 0, 0.4)';
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.arc(gridPos.x, gridPos.y, towerData.range, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Draw icon
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(towerData.icon, gridPos.x, gridPos.y);
    }
    
    gameLoop(timestamp = 0) {
        if (!this.lastTime) this.lastTime = timestamp;
        
        this.deltaTime = Math.min((timestamp - this.lastTime) / 1000, 0.05);
        this.lastTime = timestamp;
        
        if (this.gameRunning) {
            this.updateGame(this.deltaTime * this.gameSpeed);
            
            // Update UI periodically for performance
            if (Math.random() < 0.1) {
                this.updateUI();
            }
        }
        
        this.render();
        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    const game = new TowerDefenseGame();
    window.game = game; // For debugging
});