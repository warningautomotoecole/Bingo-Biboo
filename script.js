const state = {
    format: 75,
    mode: 'manual', 
    speed: 5000,
    isRunning: false,
    drawType: null, 
    timer: null,
    drawnNumbers: [],
    weights: {},
    history: [],
    customCounts: {},
    customQueue: [],
    soundEnabled: true,
    maleVoice: null,
    defaultVoice: null
};

const dom = {
    themeToggle: document.getElementById('theme-toggle'),
    soundToggle: document.getElementById('sound-toggle'),
    btnTirer: document.getElementById('btn-tirer'),
    btnCustomTirer: document.getElementById('btn-custom-tirer'),
    drawStatus: document.getElementById('draw-status'),
    ballsContainer: document.getElementById('balls-container'),
    historyBalls: document.getElementById('history-balls'),
    clearHistory: document.getElementById('btn-clear-history'),
    customGrid: document.getElementById('custom-grid'),
    boardWrapper: document.getElementById('board-wrapper')
};

// ==========================================
// THÈME
// ==========================================
function loadTheme() {
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    dom.themeToggle.querySelector('.icon').textContent = saved === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
    const html = document.documentElement;
    const newTheme = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
    dom.themeToggle.querySelector('.icon').textContent = newTheme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', newTheme);
}

// ==========================================
// TEXT-TO-SPEECH (MASCULIN UNIQUEMENT)
// ==========================================
function loadVoices() {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return;

    const frVoices = voices.filter(v => v.lang.startsWith('fr'));
    if (frVoices.length === 0) return;

    const maleNames = ['thomas', 'paul', 'nicolas', 'bernard', 'martin', 'david', 'male', 'homme', 'jacques', 'gabriel'];
    state.maleVoice = frVoices.find(v => maleNames.some(name => v.name.toLowerCase().includes(name)));

    if (!state.maleVoice) {
        state.defaultVoice = frVoices[0];
    }
}

if (window.speechSynthesis) {
    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
    }
}

// ==========================================
// Obtention du préfixe (lettre ou dizaine)
// ==========================================
function getPrefixInfo(number, format) {
    if (format === 75) {
        let letter = '';
        if (number <= 15) letter = 'B';
        else if (number <= 30) letter = 'I';
        else if (number <= 45) letter = 'N';
        else if (number <= 60) letter = 'G';
        else letter = 'O';
        return { prefix: letter, display: letter };
    } else {
        let dizaine = 1;
        if (number >= 10 && number <= 19) dizaine = 2;
        else if (number >= 20 && number <= 29) dizaine = 3;
        else if (number >= 30 && number <= 39) dizaine = 4;
        else if (number >= 40 && number <= 49) dizaine = 5;
        else if (number >= 50 && number <= 59) dizaine = 6;
        else if (number >= 60 && number <= 69) dizaine = 7;
        else if (number >= 70 && number <= 79) dizaine = 8;
        else if (number >= 80 && number <= 90) dizaine = 9;
        return { prefix: dizaine.toString(), display: dizaine.toString() };
    }
}

// ==========================================
// ANNONCE VOCALE
// ==========================================
function speakNumber(number) {
    if (!state.soundEnabled || !('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();

    let announcement = '';
    if (state.format === 75) {
        const info = getPrefixInfo(number, 75);
        announcement = `${info.prefix}${number}`;
    } else {
        const info = getPrefixInfo(number, 90);
        const dizaine = info.prefix;
        announcement = `Dizaine ${dizaine}, le ${number}`;
    }

    const utterance = new SpeechSynthesisUtterance(announcement);
    utterance.lang = 'fr-FR';
    
    if (state.maleVoice) {
        utterance.voice = state.maleVoice;
        utterance.pitch = 1.0;
    } else if (state.defaultVoice) {
        utterance.voice = state.defaultVoice;
        utterance.pitch = 0.7; 
    }
    
    // Ajustement du débit selon la vitesse choisie
    if (state.speed <= 1000) {
        utterance.rate = 1.4;
    } else if (state.speed <= 2000) {
        utterance.rate = 1.0;
    } else {
        utterance.rate = 0.8;
    }
    
    window.speechSynthesis.speak(utterance);
}

// ==========================================
// INITIALISATION
// ==========================================
function init() {
    loadTheme();
    initWeights();
    buildCustomGrid();
    renderBoard();
    bindEvents();
    updateBtnText();
}

function initWeights() {
    state.weights = {};
    for (let i = 1; i <= state.format; i++) state.weights[i] = 1;
}

function resetGame() {
    stopAutoDraw();
    state.drawnNumbers = [];
    state.customQueue = [];
    dom.ballsContainer.innerHTML = '';
    dom.drawStatus.textContent = 'Prêt à tirer';
    initWeights();
    getColumns().forEach(col => state.customCounts[col.id] = 0);
    buildCustomGrid();
    renderBoard();
}

// ==========================================
// GRILLE PERSONNALISÉE (CIBLÉE)
// ==========================================
function getColumns() {
    if (state.format === 75) {
        return [
            { id: 'B', label: 'B', range: [1, 15] },
            { id: 'I', label: 'I', range: [16, 30] },
            { id: 'N', label: 'N', range: [31, 45] },
            { id: 'G', label: 'G', range: [46, 60] },
            { id: 'O', label: 'O', range: [61, 75] }
        ];
    } else {
        return [
            { id: 'S1', label: 'S1', range: [1, 9] },
            { id: 'S2', label: 'S2', range: [10, 18] },
            { id: 'S3', label: 'S3', range: [19, 27] },
            { id: 'S4', label: 'S4', range: [28, 36] },
            { id: 'S5', label: 'S5', range: [37, 45] },
            { id: 'S6', label: 'S6', range: [46, 54] },
            { id: 'S7', label: 'S7', range: [55, 63] },
            { id: 'S8', label: 'S8', range: [64, 72] },
            { id: 'S9', label: 'S9', range: [73, 81] },
            { id: 'S10', label: 'S10', range: [82, 90] }
        ];
    }
}

function buildCustomGrid() {
    const columns = getColumns();
    const fragment = document.createDocumentFragment();
    dom.customGrid.innerHTML = '';
    
    columns.forEach(col => {
        state.customCounts[col.id] = state.customCounts[col.id] || 0;
        
        const item = document.createElement('div');
        item.className = 'custom-item';
        item.innerHTML = `
            <span class="label">${col.label}</span>
            <div class="mini-stepper">
                <button class="custom-minus" data-id="${col.id}">−</button>
                <span class="val" id="custom-val-${col.id}">${state.customCounts[col.id]}</span>
                <button class="custom-plus" data-id="${col.id}">+</button>
            </div>
        `;
        
        item.querySelector('.custom-minus').addEventListener('click', () => {
            if (state.isRunning || state.customCounts[col.id] <= 0) return;
            state.customCounts[col.id]--;
            document.getElementById(`custom-val-${col.id}`).textContent = state.customCounts[col.id];
        });
        
        item.querySelector('.custom-plus').addEventListener('click', () => {
            if (state.isRunning) return;
            const max = col.range[1] - col.range[0] + 1;
            if (state.customCounts[col.id] < max) {
                state.customCounts[col.id]++;
                document.getElementById(`custom-val-${col.id}`).textContent = state.customCounts[col.id];
            }
        });
        
        fragment.appendChild(item);
    });
    dom.customGrid.appendChild(fragment);
}

function buildCustomQueue() {
    let queue = [];
    getColumns().forEach(col => {
        const count = state.customCounts[col.id] || 0;
        for (let i = 0; i < count; i++) queue.push(col);
    });
    return queue.sort(() => Math.random() - 0.5); 
}

// ==========================================
// MOTEUR DE TIRAGE
// ==========================================
function getSerieClass(num) {
    if (state.format === 75) {
        if (num <= 15) return 'serie-1';
        if (num <= 30) return 'serie-2';
        if (num <= 45) return 'serie-3';
        if (num <= 60) return 'serie-4';
        return 'serie-5';
    } else {
        if (num <= 18) return 'serie-1';
        if (num <= 36) return 'serie-2';
        if (num <= 54) return 'serie-3';
        if (num <= 72) return 'serie-4';
        return 'serie-5';
    }
}

function drawBall(chosen) {
    state.drawnNumbers.push(chosen);
    
    speakNumber(chosen); 
    
    const info = getPrefixInfo(chosen, state.format);
    const ball = document.createElement('div');
    ball.className = `ball ${getSerieClass(chosen)}`;
    ball.innerHTML = `
        <span class="ball-letter">${info.display}</span>
        <span class="ball-number">${chosen}</span>
    `;
    dom.ballsContainer.appendChild(ball);

    if (state.weights[chosen] !== undefined) {
        state.weights[chosen] = Math.max(0.01, state.weights[chosen] * 0.45);
    }
    
    state.history.push(chosen);
    renderHistory();
    updateBoard(chosen);
    
    dom.drawStatus.textContent = `Tirage en cours... (${state.drawnNumbers.length}/${state.format})`;
}

function performClassicDraw() {
    if (state.drawnNumbers.length >= state.format) {
        stopAutoDraw();
        dom.drawStatus.textContent = "Tirage terminé !";
        return;
    }

    const available = Object.keys(state.weights).map(Number).filter(n => !state.drawnNumbers.includes(n));
    if (available.length === 0) return stopAutoDraw();

    const totalWeight = available.reduce((acc, num) => acc + (state.weights[num] || 0), 0);
    let rand = Math.random() * totalWeight;
    let chosen = available[available.length - 1];

    for (const num of available) {
        rand -= state.weights[num] || 0;
        if (rand <= 0) { chosen = num; break; }
    }

    drawBall(chosen);
    
    if (state.drawnNumbers.length >= state.format) {
        stopAutoDraw();
        dom.drawStatus.textContent = "Tirage terminé !";
    }
}

function performCustomDraw() {
    if (state.customQueue.length === 0) {
        stopAutoDraw();
        dom.drawStatus.textContent = "Tirage ciblé terminé !";
        return;
    }

    const col = state.customQueue.shift();
    const available = [];
    
    for (let n = col.range[0]; n <= col.range[1]; n++) {
        if (!state.drawnNumbers.includes(n)) available.push(n);
    }

    if (available.length === 0) {
        if (state.customQueue.length > 0) {
           return performCustomDraw();
        } else {
           stopAutoDraw();
           dom.drawStatus.textContent = "Tirage ciblé terminé (colonnes vides) !";
           return;
        }
    }

    const totalWeight = available.reduce((acc, num) => acc + (state.weights[num] || 0), 0);
    let rand = Math.random() * totalWeight;
    let chosen = available[available.length - 1];
    
    for (const num of available) {
        rand -= state.weights[num] || 0;
        if (rand <= 0) { chosen = num; break; }
    }

    drawBall(chosen);

    if (state.customQueue.length === 0) {
        stopAutoDraw();
        dom.drawStatus.textContent = "Tirage ciblé terminé !";
    }
}

// ==========================================
// GESTION MANUEL ET AUTOMATIQUE
// ==========================================
function updateBtnText() {
    if (state.mode === 'manual') {
        dom.btnTirer.textContent = 'Tirer une boule';
        dom.btnCustomTirer.textContent = 'Tirer (Ciblé)';
    } else {
        dom.btnTirer.textContent = (state.isRunning && state.drawType === 'classic') ? 'Arrêter Auto' : 'Lancer Auto';
        dom.btnCustomTirer.textContent = (state.isRunning && state.drawType === 'custom') ? 'Arrêter Auto' : 'Lancer Auto (Ciblé)';
    }
    
    dom.btnTirer.classList.toggle('running', state.isRunning && state.drawType === 'classic');
    dom.btnCustomTirer.classList.toggle('running', state.isRunning && state.drawType === 'custom');
}

function stopAutoDraw() {
    if (state.timer) {
        clearInterval(state.timer);
        state.timer = null;
    }
    state.isRunning = false;
    state.drawType = null;
    updateBtnText();
}

function startAutoDraw(type) {
    if (state.isRunning) stopAutoDraw();
    
    state.isRunning = true;
    state.drawType = type;
    updateBtnText();
    
    type === 'classic' ? performClassicDraw() : performCustomDraw();
    
    if (state.isRunning) {
        state.timer = setInterval(() => {
            type === 'classic' ? performClassicDraw() : performCustomDraw();
        }, state.speed);
    }
}

// ==========================================
// AFFICHAGES SECONDAIRES
// ==========================================
function renderHistory() {
    dom.historyBalls.innerHTML = '';
    if (state.history.length === 0) {
        dom.historyBalls.innerHTML = '<span class="empty-history">Aucun tirage enregistré</span>';
        return;
    }
    
    const fragment = document.createDocumentFragment();
    state.history.slice(-30).forEach(num => {
        const ball = document.createElement('span');
        ball.className = `mini-ball ${getSerieClass(num)}`;
        ball.textContent = num;
        fragment.appendChild(ball);
    });
    dom.historyBalls.appendChild(fragment);
}

// ==========================================
// TABLEAU DE RÉPARTITION
// ==========================================
function renderBoard() {
    const wrapper = dom.boardWrapper;
    wrapper.innerHTML = '';

    const columns = getColumns();
    const table = document.createElement('table');
    table.className = 'board-table';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col.label;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    const maxRows = Math.max(...columns.map(col => col.range[1] - col.range[0] + 1));
    
    for (let i = 0; i < maxRows; i++) {
        const row = document.createElement('tr');
        columns.forEach(col => {
            const td = document.createElement('td');
            const num = col.range[0] + i;
            if (num <= col.range[1]) {
                const span = document.createElement('span');
                span.className = `board-cell ${getSerieClass(num)}`;
                span.textContent = num;
                span.dataset.number = num;
                td.appendChild(span);
            } else {
                td.textContent = '';
            }
            row.appendChild(td);
        });
        tbody.appendChild(row);
    }

    table.appendChild(tbody);
    wrapper.appendChild(table);
}

function updateBoard(number) {
    const cells = document.querySelectorAll('.board-cell');
    cells.forEach(cell => {
        if (parseInt(cell.dataset.number) === number) {
            cell.classList.add('drawn');
        }
    });
}

// ==========================================
// ÉVÉNEMENTS UI
// ==========================================
function setupSegmentedControl(containerId, stateKey, callback) {
    const container = document.getElementById(containerId);
    if (!container) return; 
    
    const buttons = container.querySelectorAll('.segment');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (state.isRunning) stopAutoDraw();
            
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            let val = btn.dataset.value;
            if (!isNaN(val)) val = parseInt(val);
            state[stateKey] = val;
            
            if (callback) callback(val);
        });
    });
}

function bindEvents() {
    dom.themeToggle.addEventListener('click', toggleTheme);
    
    dom.soundToggle.addEventListener('click', () => {
        state.soundEnabled = !state.soundEnabled;
        dom.soundToggle.querySelector('.icon').textContent = state.soundEnabled ? '🔊' : '🔇';
        if (!state.soundEnabled) window.speechSynthesis.cancel();
    });

    setupSegmentedControl('format-control', 'format', () => {
        resetGame();
        renderBoard();
    });
    
    setupSegmentedControl('mode-control', 'mode', (mode) => {
        const speedGroup = document.getElementById('speed-group');
        if (mode === 'auto') {
            speedGroup.classList.add('visible');
        } else {
            speedGroup.classList.remove('visible');
        }
        updateBtnText();
    });
    
    setupSegmentedControl('speed-control', 'speed');

    dom.btnTirer.addEventListener('click', () => {
        if (state.drawnNumbers.length === 0 && state.soundEnabled) {
             const wakeUpUtterance = new SpeechSynthesisUtterance('');
             window.speechSynthesis.speak(wakeUpUtterance);
        }

        if (state.drawnNumbers.length >= state.format) resetGame();
        
        if (state.mode === 'manual') {
            performClassicDraw();
        } else {
            if (state.isRunning && state.drawType === 'classic') stopAutoDraw();
            else startAutoDraw('classic');
        }
    });

    dom.btnCustomTirer.addEventListener('click', () => {
        if (state.drawnNumbers.length === 0 && state.soundEnabled) {
             const wakeUpUtterance = new SpeechSynthesisUtterance('');
             window.speechSynthesis.speak(wakeUpUtterance);
        }

        if (state.drawnNumbers.length >= state.format) resetGame();

        if (state.customQueue.length === 0 && !state.isRunning) {
            state.customQueue = buildCustomQueue();
            if (state.customQueue.length === 0) {
                dom.drawStatus.textContent = "⚠️ Définissez au moins une boule ciblée.";
                return;
            }
        }

        if (state.mode === 'manual') {
            performCustomDraw();
        } else {
            if (state.isRunning && state.drawType === 'custom') stopAutoDraw();
            else startAutoDraw('custom');
        }
    });

    dom.clearHistory.addEventListener('click', () => {
        state.history = [];
        renderHistory();
    });
}

// ==========================================
// GESTION DE L'INSTALLATION PWA
// ==========================================
let deferredPrompt = null;

// Écouteur pour l'événement beforeinstallprompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Afficher le bouton d'installation
  const installBtn = document.getElementById('install-btn');
  if (installBtn) {
    installBtn.style.display = 'block';
  }
});

// Gestion du clic sur le bouton d'installation
document.addEventListener('DOMContentLoaded', () => {
  const installBtn = document.getElementById('install-btn');
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        if (result.outcome === 'accepted') {
          console.log('Application installée !');
          installBtn.style.display = 'none';
        } else {
          console.log('Installation refusée');
        }
        deferredPrompt = null;
      }
    });
  }
});

// Détecter si l'application a déjà été installée
window.addEventListener('appinstalled', () => {
  console.log('Application installée via le navigateur');
  const installBtn = document.getElementById('install-btn');
  if (installBtn) installBtn.style.display = 'none';
});

// Initialisation
init();