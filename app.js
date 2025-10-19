// State Management
let currentState = {
    result: 'score',     // 'score' or 'miss'
    team: 'against',     // 'player' or 'against'
    selectedPlayer: null // player name or null
};

let shots = [];
let shotIdCounter = 0;
let players = []; // Array of player names
let gameName = ''; // Current game name
let attackDirection = 'left'; // 'right' or 'left' - default to left
let currentPeriod = 1; // 1, 2, 3, or 'all'

// Stats tracking
let statsGameName = '';
let goals = []; // Array of goal objects {id, goal, assist1, assist2, timestamp}
let goalIdCounter = 0;
let activeAssignmentButton = null; // Which button is active: 'goal', 'assist1', 'assist2'
let currentAssignments = {
    goal: null,
    assist1: null,
    assist2: null
};

// Lineup +/- tracking
let plusMinusEvents = []; // Array of +/- events
let plusMinusIdCounter = 0;
let activePositionButton = null; // Which position button is active
let currentLineup = {
    leftWing: null,
    center: null,
    rightWing: null,
    leftDefence: null,
    rightDefence: null
};

// Faceoffs tracking
let faceoffStats = []; // Array of {playerName, taken, won}
let activeFaceoffAddButton = false; // Whether "Add Player" button is active

// Canvas setup
const canvas = document.getElementById('rinkCanvas');
const ctx = canvas.getContext('2d');

// DOM Elements
const rinkTab = document.getElementById('rinkTab');
const playersTab = document.getElementById('playersTab');
const statsTab = document.getElementById('statsTab');
const rinkView = document.getElementById('rinkView');
const playersView = document.getElementById('playersView');
const statsView = document.getElementById('statsView');

const scoreBtn = document.getElementById('scoreBtn');
const missBtn = document.getElementById('missBtn');
const againstBtn = document.getElementById('againstBtn');
const playerButtonsContainer = document.getElementById('playerButtons');

const undoBtn = document.getElementById('undoBtn');
const resetBtn = document.getElementById('resetBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const fileInput = document.getElementById('fileInput');

const statusDisplay = document.getElementById('statusDisplay');
const statusText = document.getElementById('statusText');

const forShotsEl = document.getElementById('forShots');
const forScoresEl = document.getElementById('forScores');
const forMissesEl = document.getElementById('forMisses');
const againstShotsEl = document.getElementById('againstShots');
const againstScoresEl = document.getElementById('againstScores');
const againstMissesEl = document.getElementById('againstMisses');

const playerNameInput = document.getElementById('playerNameInput');
const addPlayerBtn = document.getElementById('addPlayerBtn');
const playersListEl = document.getElementById('playersList');
const exportPlayersBtn = document.getElementById('exportPlayersBtn');
const importPlayersBtn = document.getElementById('importPlayersBtn');
const clearPlayersBtn = document.getElementById('clearPlayersBtn');
const playersFileInput = document.getElementById('playersFileInput');
const shotTooltip = document.getElementById('shotTooltip');
const gameNameInput = document.getElementById('gameNameInput');
const toggleDirectionBtn = document.getElementById('toggleDirectionBtn');

// Period buttons
const period1Btn = document.getElementById('period1Btn');
const period2Btn = document.getElementById('period2Btn');
const period3Btn = document.getElementById('period3Btn');
const periodAllBtn = document.getElementById('periodAllBtn');

// Stats DOM Elements
const statsGameNameInput = document.getElementById('statsGameNameInput');
const exportStatsBtn = document.getElementById('exportStatsBtn');
const importStatsBtn = document.getElementById('importStatsBtn');
const statsFileInput = document.getElementById('statsFileInput');
const statsPlayersList = document.getElementById('statsPlayersList');

// Stats Sub-Tabs
const goalsAssistsSubTab = document.getElementById('goalsAssistsSubTab');
const lineupSubTab = document.getElementById('lineupSubTab');
const faceoffsSubTab = document.getElementById('faceoffsSubTab');
const goalsAssistsSubView = document.getElementById('goalsAssistsSubView');
const lineupSubView = document.getElementById('lineupSubView');
const faceoffsSubView = document.getElementById('faceoffsSubView');

const goalBtn = document.getElementById('goalBtn');
const assist1Btn = document.getElementById('assist1Btn');
const assist2Btn = document.getElementById('assist2Btn');
const goalPlayerName = document.getElementById('goalPlayerName');
const assist1PlayerName = document.getElementById('assist1PlayerName');
const assist2PlayerName = document.getElementById('assist2PlayerName');
const submitGoalBtn = document.getElementById('submitGoalBtn');
const clearAssignmentsBtn = document.getElementById('clearAssignmentsBtn');
const goalsList = document.getElementById('goalsList');

// Lineup +/- DOM Elements
const leftWingBtn = document.getElementById('leftWingBtn');
const centerBtn = document.getElementById('centerBtn');
const rightWingBtn = document.getElementById('rightWingBtn');
const leftDefenceBtn = document.getElementById('leftDefenceBtn');
const rightDefenceBtn = document.getElementById('rightDefenceBtn');
const leftWingPlayerName = document.getElementById('leftWingPlayerName');
const centerPlayerName = document.getElementById('centerPlayerName');
const rightWingPlayerName = document.getElementById('rightWingPlayerName');
const leftDefencePlayerName = document.getElementById('leftDefencePlayerName');
const rightDefencePlayerName = document.getElementById('rightDefencePlayerName');
const plusBtn = document.getElementById('plusBtn');
const minusBtn = document.getElementById('minusBtn');
const clearLineupBtn = document.getElementById('clearLineupBtn');
const plusMinusList = document.getElementById('plusMinusList');

// Faceoffs DOM Elements
const faceoffPlayersList = document.getElementById('faceoffPlayersList');

// Modal elements
const customModal = document.getElementById('customModal');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const modalOkBtn = document.getElementById('modalOkBtn');
const modalCancelBtn = document.getElementById('modalCancelBtn');

// Custom Modal Functions
function showAlert(title, message) {
    return new Promise((resolve) => {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalCancelBtn.classList.add('hidden');
        modalOkBtn.textContent = 'OK';
        customModal.classList.add('show');
        
        const handleOk = () => {
            customModal.classList.remove('show');
            modalOkBtn.removeEventListener('click', handleOk);
            resolve(true);
        };
        
        modalOkBtn.addEventListener('click', handleOk);
    });
}

function showConfirm(title, message) {
    return new Promise((resolve) => {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalCancelBtn.classList.remove('hidden');
        modalOkBtn.textContent = 'OK';
        customModal.classList.add('show');
        
        const handleOk = () => {
            customModal.classList.remove('show');
            modalOkBtn.removeEventListener('click', handleOk);
            modalCancelBtn.removeEventListener('click', handleCancel);
            resolve(true);
        };
        
        const handleCancel = () => {
            customModal.classList.remove('show');
            modalOkBtn.removeEventListener('click', handleOk);
            modalCancelBtn.removeEventListener('click', handleCancel);
            resolve(false);
        };
        
        modalOkBtn.addEventListener('click', handleOk);
        modalCancelBtn.addEventListener('click', handleCancel);
    });
}

// Initialize
function init() {
    loadPlayersFromStorage();
    loadShotsFromStorage();
    loadStatsFromStorage();
    renderPlayerButtons();
    renderPlayersList();
    renderStatsPlayersList();
    renderGoalsList();
    renderPlusMinusList();
    renderFaceoffStats();
    updateLineupDisplay(); // Initialize lineup display
    updateDirectionButton(); // Initialize direction button display
    updatePeriodButtons(); // Initialize period button display
    drawRink();
    updateUI();
    attachEventListeners();
}

// Tab Switching
function switchTab(tabName) {
    // Remove all active classes
    rinkTab.classList.remove('active');
    playersTab.classList.remove('active');
    statsTab.classList.remove('active');
    rinkView.classList.remove('active');
    playersView.classList.remove('active');
    statsView.classList.remove('active');
    
    // Add active class to selected tab
    if (tabName === 'rink') {
        rinkTab.classList.add('active');
        rinkView.classList.add('active');
    } else if (tabName === 'players') {
        playersTab.classList.add('active');
        playersView.classList.add('active');
        // Refresh player stats when viewing the Players tab
        renderPlayersList();
    } else if (tabName === 'stats') {
        statsTab.classList.add('active');
        statsView.classList.add('active');
        // Refresh stats player list and sync game name
        renderStatsPlayersList();
        syncStatsGameName();
        // Default to Goals & Assists sub-tab
        switchStatsSubTab('goalsAssists');
    }
}

// Stats Sub-Tab Switching
function switchStatsSubTab(subTabName) {
    // Remove all active classes
    goalsAssistsSubTab.classList.remove('active');
    lineupSubTab.classList.remove('active');
    faceoffsSubTab.classList.remove('active');
    goalsAssistsSubView.classList.remove('active');
    lineupSubView.classList.remove('active');
    faceoffsSubView.classList.remove('active');
    
    // Add active class to selected sub-tab
    if (subTabName === 'goalsAssists') {
        goalsAssistsSubTab.classList.add('active');
        goalsAssistsSubView.classList.add('active');
    } else if (subTabName === 'lineup') {
        lineupSubTab.classList.add('active');
        lineupSubView.classList.add('active');
    } else if (subTabName === 'faceoffs') {
        faceoffsSubTab.classList.add('active');
        faceoffsSubView.classList.add('active');
    }
}

// Player Management
function loadPlayersFromStorage() {
    const saved = localStorage.getItem('hockeyTrackerPlayers');
    if (saved) {
        players = JSON.parse(saved);
    }
}

function savePlayersToStorage() {
    localStorage.setItem('hockeyTrackerPlayers', JSON.stringify(players));
}

// Shot Data Management
function loadShotsFromStorage() {
    const saved = localStorage.getItem('hockeyTrackerShots');
    if (saved) {
        const data = JSON.parse(saved);
        shots = data.shots || [];
        shotIdCounter = data.shotIdCounter || 0;
        gameName = data.gameName || '';
        attackDirection = data.attackDirection || 'left';
        currentPeriod = data.currentPeriod || 1;
        gameNameInput.value = gameName;
        updateDirectionButton();
        updatePeriodButtons();
    }
}

function saveShotsToStorage() {
    gameName = gameNameInput.value.trim();
    const data = {
        shots: shots,
        shotIdCounter: shotIdCounter,
        gameName: gameName,
        attackDirection: attackDirection,
        currentPeriod: currentPeriod
    };
    localStorage.setItem('hockeyTrackerShots', JSON.stringify(data));
}

// Attack Direction Management
function toggleAttackDirection() {
    attackDirection = attackDirection === 'right' ? 'left' : 'right';
    
    // Mirror all existing shots
    shots.forEach(shot => {
        shot.x = canvas.width - shot.x;
    });
    
    drawRink();
    updateDirectionButton();
    saveShotsToStorage();
}

function updateDirectionButton() {
    const arrow = toggleDirectionBtn.querySelector('.direction-arrow');
    const text = toggleDirectionBtn.querySelector('.direction-text');
    
    if (attackDirection === 'right') {
        arrow.textContent = '→';
        text.textContent = 'Attacking Right';
    } else {
        arrow.textContent = '←';
        text.textContent = 'Attacking Left';
    }
}

// Period Management
function selectPeriod(period) {
    currentPeriod = period;
    updatePeriodButtons();
    drawRink();
    updateCounters();
    saveShotsToStorage();
}

function updatePeriodButtons() {
    period1Btn.classList.toggle('active', currentPeriod === 1);
    period2Btn.classList.toggle('active', currentPeriod === 2);
    period3Btn.classList.toggle('active', currentPeriod === 3);
    periodAllBtn.classList.toggle('active', currentPeriod === 'all');
}

async function addPlayer() {
    const playerName = playerNameInput.value.trim();
    if (!playerName) {
        await showAlert('Error', 'Please enter a player name');
        return;
    }
    if (players.includes(playerName)) {
        await showAlert('Error', 'Player already exists');
        return;
    }
    if (players.length >= 20) {
        await showAlert('Error', 'Maximum 20 players allowed');
        return;
    }
    
    players.push(playerName);
    savePlayersToStorage();
    renderPlayerButtons();
    renderPlayersList();
    playerNameInput.value = '';
    
    // Auto-select the first player if none selected
    if (!currentState.selectedPlayer && players.length === 1) {
        selectPlayer(playerName);
    }
}

async function removePlayer(playerName) {
    const confirmed = await showConfirm('Confirm Removal', `Remove ${playerName} from the team?`);
    if (confirmed) {
        players = players.filter(p => p !== playerName);
        savePlayersToStorage();
        
        // If removed player was selected, deselect
        if (currentState.selectedPlayer === playerName) {
            currentState.selectedPlayer = null;
            currentState.team = 'against';
        }
        
        // Remove from faceoff stats if present
        faceoffStats = faceoffStats.filter(fs => fs.playerName !== playerName);
        saveStatsToStorage();
        
        renderPlayerButtons();
        renderPlayersList();
        renderFaceoffStats();
        updateUI();
    }
}

function renderPlayerButtons() {
    playerButtonsContainer.innerHTML = '';
    
    if (players.length === 0) {
        playerButtonsContainer.innerHTML = '<p style="color: #666; font-size: 0.8em; font-style: italic;">Add players in the Players tab</p>';
        return;
    }
    
    players.forEach(playerName => {
        const btn = document.createElement('button');
        btn.className = 'player-btn';
        btn.textContent = playerName;
        btn.dataset.player = playerName;
        
        if (currentState.selectedPlayer === playerName) {
            btn.classList.add('active');
        }
        
        btn.addEventListener('click', () => selectPlayer(playerName));
        playerButtonsContainer.appendChild(btn);
    });
}

function renderPlayersList() {
    if (players.length === 0) {
        playersListEl.innerHTML = '<p class="no-players">No players added yet. Add players above to start tracking individual performance.</p>';
        return;
    }
    
    playersListEl.innerHTML = '';
    players.forEach(playerName => {
        // Calculate shot stats
        const playerShots = shots.filter(s => s.playerName === playerName);
        const totalShots = playerShots.length;
        const scores = playerShots.filter(s => s.resultState === 'score').length;
        const misses = playerShots.filter(s => s.resultState === 'miss').length;
        const percentage = totalShots > 0 ? ((scores / totalShots) * 100).toFixed(1) : '0.0';
        
        // Calculate assists
        const assists = goals.filter(g => g.assist1 === playerName || g.assist2 === playerName).length;
        
        // Calculate +/-
        let plusCount = 0;
        let minusCount = 0;
        plusMinusEvents.forEach(event => {
            const isOnIce = Object.values(event.lineup).includes(playerName);
            if (isOnIce) {
                if (event.type === 'plus') {
                    plusCount++;
                } else {
                    minusCount++;
                }
            }
        });
        const plusMinus = plusCount - minusCount;
        const plusMinusDisplay = plusMinus > 0 ? `+${plusMinus}` : plusMinus.toString();
        
        // Get faceoff stats
        const faceoffData = faceoffStats.find(fs => fs.playerName === playerName);
        const faceoffsTaken = faceoffData ? faceoffData.taken : 0;
        const faceoffsWon = faceoffData ? faceoffData.won : 0;
        const faceoffPercentage = faceoffsTaken > 0 ? ((faceoffsWon / faceoffsTaken) * 100).toFixed(1) : '0.0';
        
        const item = document.createElement('div');
        item.className = 'player-item';
        
        // Player info section
        const infoDiv = document.createElement('div');
        infoDiv.className = 'player-info';
        
        const nameSpan = document.createElement('div');
        nameSpan.className = 'player-name';
        nameSpan.textContent = playerName;
        
        const statsDiv = document.createElement('div');
        statsDiv.className = 'player-stats';
        statsDiv.innerHTML = `
            <span class="stat-detail"><strong>Shots:</strong> ${totalShots}</span>
            <span class="stat-detail"><strong>Goals:</strong> ${scores}</span>
            <span class="stat-detail"><strong>Assists:</strong> ${assists}</span>
            <span class="stat-detail"><strong>Misses:</strong> ${misses}</span>
            <span class="stat-detail percentage"><strong>Shot %:</strong> ${percentage}%</span>
            <span class="stat-detail plusminus-stat"><strong>+/-:</strong> ${plusMinusDisplay}</span>
            <span class="stat-detail"><strong>FO Taken:</strong> ${faceoffsTaken}</span>
            <span class="stat-detail"><strong>FO Won:</strong> ${faceoffsWon}</span>
            <span class="stat-detail percentage"><strong>FO %:</strong> ${faceoffPercentage}%</span>
        `;
        
        infoDiv.appendChild(nameSpan);
        infoDiv.appendChild(statsDiv);
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => removePlayer(playerName));
        
        item.appendChild(infoDiv);
        item.appendChild(removeBtn);
        playersListEl.appendChild(item);
    });
}

function selectPlayer(playerName) {
    currentState.selectedPlayer = playerName;
    currentState.team = 'player';
    renderPlayerButtons();
    updateUI();
}

// Export players to JSON
async function exportPlayers() {
    if (players.length === 0) {
        await showAlert('Error', 'No players to export!');
        return;
    }
    
    const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        playerCount: players.length,
        players: players
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `hockey-tracker-players-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}

// Import players from JSON
function importPlayers() {
    playersFileInput.click();
}

// Handle player file selection
function handlePlayerFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validate data structure
            if (!data.players || !Array.isArray(data.players)) {
                throw new Error('Invalid data format: missing or invalid players array');
            }
            
            // Validate each player name
            for (let playerName of data.players) {
                if (typeof playerName !== 'string' || !playerName.trim()) {
                    throw new Error('Invalid player name in file');
                }
            }
            
            // Ask user if they want to replace or merge
            const action = await showConfirm(
                'Import Players',
                `Import ${data.players.length} players.\n\nClick OK to ADD to existing players (${players.length} current).\nClick CANCEL to REPLACE all existing players.`
            );
            
            if (action) {
                // Add to existing (avoid duplicates)
                const newPlayers = data.players.filter(p => !players.includes(p));
                players = [...players, ...newPlayers];
                await showAlert('Success', `Added ${newPlayers.length} new players! Total: ${players.length}`);
            } else {
                // Replace all
                players = [...data.players];
                // Deselect current player if not in new list
                if (!players.includes(currentState.selectedPlayer)) {
                    currentState.selectedPlayer = null;
                    currentState.team = 'against';
                }
                await showAlert('Success', `Replaced with ${players.length} players!`);
            }
            
            savePlayersToStorage();
            renderPlayerButtons();
            renderPlayersList();
            updateUI();
            
        } catch (error) {
            await showAlert('Import Failed', `${error.message}\n\nPlease select a valid Hockey Tracker Players JSON file.`);
        }
    };
    
    reader.readAsText(file);
    
    // Reset file input
    playersFileInput.value = '';
}

// Clear all players
async function clearAllPlayers() {
    if (players.length === 0) {
        await showAlert('Error', 'No players to clear!');
        return;
    }
    
    const confirmed = await showConfirm('Confirm Clear All', `Remove all ${players.length} players from the roster?`);
    if (confirmed) {
        players = [];
        currentState.selectedPlayer = null;
        currentState.team = 'against';
        savePlayersToStorage();
        renderPlayerButtons();
        renderPlayersList();
        updateUI();
        await showAlert('Success', 'All players cleared!');
    }
}

// Stats Management Functions
function loadStatsFromStorage() {
    const saved = localStorage.getItem('hockeyTrackerStats');
    if (saved) {
        const data = JSON.parse(saved);
        goals = data.goals || [];
        goalIdCounter = data.goalIdCounter || 0;
        plusMinusEvents = data.plusMinusEvents || [];
        plusMinusIdCounter = data.plusMinusIdCounter || 0;
        faceoffStats = data.faceoffStats || [];
        statsGameName = data.statsGameName || '';
        statsGameNameInput.value = statsGameName;
    }
}

function saveStatsToStorage() {
    statsGameName = statsGameNameInput.value.trim();
    const data = {
        goals: goals,
        goalIdCounter: goalIdCounter,
        plusMinusEvents: plusMinusEvents,
        plusMinusIdCounter: plusMinusIdCounter,
        faceoffStats: faceoffStats,
        statsGameName: statsGameName
    };
    localStorage.setItem('hockeyTrackerStats', JSON.stringify(data));
}

function syncStatsGameName() {
    // Sync game name from Rink tab if Stats game name is empty
    if (!statsGameNameInput.value.trim() && gameNameInput.value.trim()) {
        statsGameNameInput.value = gameNameInput.value.trim();
        statsGameName = statsGameNameInput.value;
        saveStatsToStorage();
    }
}

function renderStatsPlayersList() {
    if (players.length === 0) {
        statsPlayersList.innerHTML = '<p class="no-players">No players available. Add players in the Players tab.</p>';
        return;
    }
    
    statsPlayersList.innerHTML = '';
    players.forEach(playerName => {
        const btn = document.createElement('button');
        btn.className = 'stats-player-btn';
        btn.textContent = playerName;
        btn.dataset.player = playerName;
        btn.addEventListener('click', () => assignPlayerToPosition(playerName));
        statsPlayersList.appendChild(btn);
    });
}

function activateAssignmentButton(buttonType) {
    // Deactivate all goal/assist buttons first
    goalBtn.classList.remove('active');
    assist1Btn.classList.remove('active');
    assist2Btn.classList.remove('active');
    
    // Deactivate position buttons when goal/assist is selected
    leftWingBtn.classList.remove('active');
    centerBtn.classList.remove('active');
    rightWingBtn.classList.remove('active');
    leftDefenceBtn.classList.remove('active');
    rightDefenceBtn.classList.remove('active');
    activePositionButton = null;
    
    // Set active button
    activeAssignmentButton = buttonType;
    
    if (buttonType === 'goal') {
        goalBtn.classList.add('active');
    } else if (buttonType === 'assist1') {
        assist1Btn.classList.add('active');
    } else if (buttonType === 'assist2') {
        assist2Btn.classList.add('active');
    }
}

function updateAssignmentDisplay() {
    // Update goal display
    if (currentAssignments.goal) {
        goalPlayerName.textContent = currentAssignments.goal;
        goalBtn.classList.add('assigned');
    } else {
        goalPlayerName.textContent = 'Click to assign';
        goalBtn.classList.remove('assigned');
    }
    
    // Update assist 1 display
    if (currentAssignments.assist1) {
        assist1PlayerName.textContent = currentAssignments.assist1;
        assist1Btn.classList.add('assigned');
    } else {
        assist1PlayerName.textContent = 'Click to assign';
        assist1Btn.classList.remove('assigned');
    }
    
    // Update assist 2 display
    if (currentAssignments.assist2) {
        assist2PlayerName.textContent = currentAssignments.assist2;
        assist2Btn.classList.add('assigned');
    } else {
        assist2PlayerName.textContent = 'Click to assign';
        assist2Btn.classList.remove('assigned');
    }
}

async function submitGoal() {
    if (!currentAssignments.goal) {
        await showAlert('Error', 'Please assign a goal scorer');
        return;
    }
    
    const goal = {
        id: goalIdCounter++,
        goal: currentAssignments.goal,
        assist1: currentAssignments.assist1,
        assist2: currentAssignments.assist2,
        timestamp: new Date().toISOString()
    };
    
    goals.push(goal);
    saveStatsToStorage();
    renderGoalsList();
    
    // Update player stats if on Players tab
    if (playersView.classList.contains('active')) {
        renderPlayersList();
    }
    
    // Clear assignments after submit
    clearAssignments();
}

function clearAssignments() {
    currentAssignments = {
        goal: null,
        assist1: null,
        assist2: null
    };
    activeAssignmentButton = null;
    
    goalBtn.classList.remove('active');
    assist1Btn.classList.remove('active');
    assist2Btn.classList.remove('active');
    
    updateAssignmentDisplay();
}

function renderGoalsList() {
    if (goals.length === 0) {
        goalsList.innerHTML = '<p class="no-goals">No goals recorded yet.</p>';
        return;
    }
    
    goalsList.innerHTML = '';
    goals.forEach((goal, index) => {
        const item = document.createElement('div');
        item.className = 'goal-item';
        
        const info = document.createElement('div');
        info.className = 'goal-info';
        
        const scorer = document.createElement('div');
        scorer.className = 'goal-scorer';
        scorer.textContent = `⚽ ${goal.goal}`;
        
        const assists = document.createElement('div');
        assists.className = 'goal-assists';
        let assistsText = '';
        if (goal.assist1) {
            assistsText += `<strong>${goal.assist1}</strong>`;
        }
        if (goal.assist2) {
            if (assistsText) assistsText += ', ';
            assistsText += `<strong>${goal.assist2}</strong>`;
        }
        if (assistsText) {
            assists.innerHTML = `Assists: ${assistsText}`;
        } else {
            assists.textContent = 'Unassisted';
        }
        
        info.appendChild(scorer);
        info.appendChild(assists);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-goal-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteGoal(goal.id));
        
        item.appendChild(info);
        item.appendChild(deleteBtn);
        goalsList.appendChild(item);
    });
}

async function deleteGoal(goalId) {
    const confirmed = await showConfirm('Confirm Delete', 'Delete this goal?');
    if (confirmed) {
        goals = goals.filter(g => g.id !== goalId);
        saveStatsToStorage();
        renderGoalsList();
        
        // Update player stats if on Players tab
        if (playersView.classList.contains('active')) {
            renderPlayersList();
        }
    }
}

// Lineup +/- Functions
function activatePositionButton(position) {
    // Deactivate all position buttons
    leftWingBtn.classList.remove('active');
    centerBtn.classList.remove('active');
    rightWingBtn.classList.remove('active');
    leftDefenceBtn.classList.remove('active');
    rightDefenceBtn.classList.remove('active');
    
    // Deactivate goal/assist buttons when position is selected
    goalBtn.classList.remove('active');
    assist1Btn.classList.remove('active');
    assist2Btn.classList.remove('active');
    activeAssignmentButton = null;
    
    // Set active position
    activePositionButton = position;
    
    const buttonMap = {
        leftWing: leftWingBtn,
        center: centerBtn,
        rightWing: rightWingBtn,
        leftDefence: leftDefenceBtn,
        rightDefence: rightDefenceBtn
    };
    
    if (buttonMap[position]) {
        buttonMap[position].classList.add('active');
    }
}

function assignPlayerToPosition(playerName) {
    // Check if we should add to faceoff tracking
    if (activeFaceoffAddButton) {
        addPlayerToFaceoffs(playerName);
        return;
    }
    
    // Check if we should assign to position or to goal/assist
    if (activePositionButton) {
        currentLineup[activePositionButton] = playerName;
        updateLineupDisplay();
    } else if (activeAssignmentButton) {
        currentAssignments[activeAssignmentButton] = playerName;
        updateAssignmentDisplay();
    } else {
        showAlert('Error', 'Please select a position, goal, or assist button first');
    }
}

function updateLineupDisplay() {
    // Update left wing
    if (currentLineup.leftWing) {
        leftWingPlayerName.textContent = currentLineup.leftWing;
        leftWingBtn.classList.add('assigned');
    } else {
        leftWingPlayerName.textContent = 'Click to assign';
        leftWingBtn.classList.remove('assigned');
    }
    
    // Update center
    if (currentLineup.center) {
        centerPlayerName.textContent = currentLineup.center;
        centerBtn.classList.add('assigned');
    } else {
        centerPlayerName.textContent = 'Click to assign';
        centerBtn.classList.remove('assigned');
    }
    
    // Update right wing
    if (currentLineup.rightWing) {
        rightWingPlayerName.textContent = currentLineup.rightWing;
        rightWingBtn.classList.add('assigned');
    } else {
        rightWingPlayerName.textContent = 'Click to assign';
        rightWingBtn.classList.remove('assigned');
    }
    
    // Update left defence
    if (currentLineup.leftDefence) {
        leftDefencePlayerName.textContent = currentLineup.leftDefence;
        leftDefenceBtn.classList.add('assigned');
    } else {
        leftDefencePlayerName.textContent = 'Click to assign';
        leftDefenceBtn.classList.remove('assigned');
    }
    
    // Update right defence
    if (currentLineup.rightDefence) {
        rightDefencePlayerName.textContent = currentLineup.rightDefence;
        rightDefenceBtn.classList.add('assigned');
    } else {
        rightDefencePlayerName.textContent = 'Click to assign';
        rightDefenceBtn.classList.remove('assigned');
    }
}

async function recordPlusMinus(type) {
    // Check if at least one position is filled
    const hasPlayers = Object.values(currentLineup).some(p => p !== null);
    
    if (!hasPlayers) {
        await showAlert('Error', 'Please assign at least one player to a position');
        return;
    }
    
    const event = {
        id: plusMinusIdCounter++,
        type: type, // 'plus' or 'minus'
        lineup: { ...currentLineup },
        timestamp: new Date().toISOString()
    };
    
    plusMinusEvents.push(event);
    saveStatsToStorage();
    renderPlusMinusList();
    
    // Update player stats if on Players tab
    if (playersView.classList.contains('active')) {
        renderPlayersList();
    }
}

function clearLineup() {
    currentLineup = {
        leftWing: null,
        center: null,
        rightWing: null,
        leftDefence: null,
        rightDefence: null
    };
    activePositionButton = null;
    
    leftWingBtn.classList.remove('active');
    centerBtn.classList.remove('active');
    rightWingBtn.classList.remove('active');
    leftDefenceBtn.classList.remove('active');
    rightDefenceBtn.classList.remove('active');
    
    updateLineupDisplay();
}

function renderPlusMinusList() {
    if (plusMinusEvents.length === 0) {
        plusMinusList.innerHTML = '<p class="no-events">No +/- events recorded yet.</p>';
        return;
    }
    
    plusMinusList.innerHTML = '';
    plusMinusEvents.forEach(event => {
        const item = document.createElement('div');
        item.className = `plusminus-item ${event.type}`;
        
        const info = document.createElement('div');
        info.className = 'plusminus-info';
        
        const typeLabel = document.createElement('div');
        typeLabel.className = 'plusminus-type';
        typeLabel.textContent = event.type === 'plus' ? '+ Goal For' : '- Goal Against';
        
        const lineup = document.createElement('div');
        lineup.className = 'lineup-players';
        let lineupHTML = '';
        
        if (event.lineup.leftWing) lineupHTML += `<span class="position-item"><span class="position-label">LW:</span> ${event.lineup.leftWing}</span>`;
        if (event.lineup.center) lineupHTML += `<span class="position-item"><span class="position-label">C:</span> ${event.lineup.center}</span>`;
        if (event.lineup.rightWing) lineupHTML += `<span class="position-item"><span class="position-label">RW:</span> ${event.lineup.rightWing}</span>`;
        if (event.lineup.leftDefence) lineupHTML += `<span class="position-item"><span class="position-label">LD:</span> ${event.lineup.leftDefence}</span>`;
        if (event.lineup.rightDefence) lineupHTML += `<span class="position-item"><span class="position-label">RD:</span> ${event.lineup.rightDefence}</span>`;
        
        lineup.innerHTML = lineupHTML;
        
        info.appendChild(typeLabel);
        info.appendChild(lineup);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-plusminus-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deletePlusMinusEvent(event.id));
        
        item.appendChild(info);
        item.appendChild(deleteBtn);
        plusMinusList.appendChild(item);
    });
}

async function deletePlusMinusEvent(eventId) {
    const confirmed = await showConfirm('Confirm Delete', 'Delete this +/- event?');
    if (confirmed) {
        plusMinusEvents = plusMinusEvents.filter(e => e.id !== eventId);
        saveStatsToStorage();
        renderPlusMinusList();
        
        // Update player stats if on Players tab
        if (playersView.classList.contains('active')) {
            renderPlayersList();
        }
    }
}

// Faceoffs Functions
function activateFaceoffAddButton() {
    activeFaceoffAddButton = true;
    
    // Deactivate other buttons
    goalBtn.classList.remove('active');
    assist1Btn.classList.remove('active');
    assist2Btn.classList.remove('active');
    leftWingBtn.classList.remove('active');
    centerBtn.classList.remove('active');
    rightWingBtn.classList.remove('active');
    leftDefenceBtn.classList.remove('active');
    rightDefenceBtn.classList.remove('active');
    activeAssignmentButton = null;
    activePositionButton = null;
    
    // Re-render to show active state
    renderFaceoffStats();
}

async function addPlayerToFaceoffs(playerName) {
    if (faceoffStats.find(fs => fs.playerName === playerName)) {
        await showAlert('Error', 'Player already in faceoff tracking');
        activeFaceoffAddButton = false;
        renderFaceoffStats();
        return;
    }
    
    faceoffStats.push({
        playerName: playerName,
        taken: 0,
        won: 0
    });
    
    activeFaceoffAddButton = false;
    saveStatsToStorage();
    renderFaceoffStats();
}

function incrementFaceoff(playerName, won) {
    const player = faceoffStats.find(fs => fs.playerName === playerName);
    if (player) {
        player.taken++;
        if (won) {
            player.won++;
        }
        saveStatsToStorage();
        renderFaceoffStats();
        
        // Update player stats if on Players tab
        if (playersView.classList.contains('active')) {
            renderPlayersList();
        }
    }
}

function renderFaceoffStats() {
    faceoffPlayersList.innerHTML = '';
    
    // Render existing players
    faceoffStats.forEach(player => {
        const row = document.createElement('div');
        row.className = 'faceoff-player-row';
        
        const name = document.createElement('div');
        name.className = 'faceoff-player-name';
        name.textContent = player.playerName;
        
        const taken = document.createElement('div');
        taken.className = 'faceoff-stat';
        taken.textContent = player.taken;
        
        const won = document.createElement('div');
        won.className = 'faceoff-stat';
        won.textContent = player.won;
        
        const actions = document.createElement('div');
        actions.className = 'faceoff-actions';
        
        const plusBtn = document.createElement('button');
        plusBtn.className = 'faceoff-btn faceoff-plus-btn';
        plusBtn.textContent = '+';
        plusBtn.title = 'Won faceoff';
        plusBtn.addEventListener('click', () => incrementFaceoff(player.playerName, true));
        
        const minusBtn = document.createElement('button');
        minusBtn.className = 'faceoff-btn faceoff-minus-btn';
        minusBtn.textContent = '-';
        minusBtn.title = 'Lost faceoff';
        minusBtn.addEventListener('click', () => incrementFaceoff(player.playerName, false));
        
        actions.appendChild(plusBtn);
        actions.appendChild(minusBtn);
        
        const deleteCol = document.createElement('div');
        deleteCol.style.textAlign = 'center';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'faceoff-delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteFaceoffPlayer(player.playerName));
        
        deleteCol.appendChild(deleteBtn);
        
        row.appendChild(name);
        row.appendChild(taken);
        row.appendChild(won);
        row.appendChild(actions);
        row.appendChild(deleteCol);
        
        faceoffPlayersList.appendChild(row);
    });
    
    // Add "Add Player" button row
    const addRow = document.createElement('div');
    addRow.className = 'add-faceoff-row';
    
    const addBtn = document.createElement('button');
    addBtn.className = 'add-faceoff-btn';
    if (activeFaceoffAddButton) {
        addBtn.classList.add('active');
    }
    addBtn.textContent = 'Add Player';
    addBtn.addEventListener('click', activateFaceoffAddButton);
    
    addRow.appendChild(addBtn);
    faceoffPlayersList.appendChild(addRow);
}

async function deleteFaceoffPlayer(playerName) {
    const confirmed = await showConfirm('Confirm Delete', `Remove ${playerName} from faceoff tracking?`);
    if (confirmed) {
        faceoffStats = faceoffStats.filter(fs => fs.playerName !== playerName);
        saveStatsToStorage();
        renderFaceoffStats();
        
        // Update player stats if on Players tab
        if (playersView.classList.contains('active')) {
            renderPlayersList();
        }
    }
}

// Export stats to JSON
async function exportStats() {
    if (goals.length === 0 && plusMinusEvents.length === 0 && faceoffStats.length === 0) {
        await showAlert('Error', 'No stats to export!');
        return;
    }
    
    statsGameName = statsGameNameInput.value.trim();
    
    const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        gameName: statsGameName || 'Unnamed Game',
        totalGoals: goals.length,
        totalPlusMinusEvents: plusMinusEvents.length,
        goals: goals,
        plusMinusEvents: plusMinusEvents,
        faceoffStats: faceoffStats
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    
    // Create filename with game name if available
    let filename = 'hockey-tracker-stats';
    if (statsGameName) {
        const sanitizedName = statsGameName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        filename = `hockey-tracker-stats-${sanitizedName}`;
    }
    filename += `-${Date.now()}.json`;
    
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
}

// Import stats from JSON
function importStats() {
    statsFileInput.click();
}

// Handle stats file selection
function handleStatsFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validate data structure
            if (!data.goals || !Array.isArray(data.goals)) {
                throw new Error('Invalid data format: missing or invalid goals array');
            }
            
            const importGoals = data.goals.length;
            const importPlusMinus = (data.plusMinusEvents || []).length;
            const importFaceoffs = (data.faceoffStats || []).length;
            
            // Ask user if they want to replace or merge
            const action = await showConfirm(
                'Import Stats',
                `Import ${importGoals} goals, ${importPlusMinus} +/- events, and ${importFaceoffs} faceoff players.\n\nClick OK to ADD to existing data.\nClick CANCEL to REPLACE all existing data.`
            );
            
            if (action) {
                // Add to existing
                goals = [...goals, ...data.goals];
                plusMinusEvents = [...plusMinusEvents, ...(data.plusMinusEvents || [])];
                
                // Merge faceoff stats (avoid duplicates, sum stats for same player)
                const importedFaceoffs = data.faceoffStats || [];
                importedFaceoffs.forEach(importedPlayer => {
                    const existing = faceoffStats.find(fs => fs.playerName === importedPlayer.playerName);
                    if (existing) {
                        existing.taken += importedPlayer.taken;
                        existing.won += importedPlayer.won;
                    } else {
                        faceoffStats.push({...importedPlayer});
                    }
                });
                
                await showAlert('Success', `Added ${importGoals} goals, ${importPlusMinus} +/- events, and ${importFaceoffs} faceoff players!`);
            } else {
                // Replace all
                goals = [...data.goals];
                plusMinusEvents = [...(data.plusMinusEvents || [])];
                faceoffStats = [...(data.faceoffStats || [])];
                await showAlert('Success', `Replaced with ${importGoals} goals, ${importPlusMinus} +/- events, and ${importFaceoffs} faceoff players!`);
            }
            
            goalIdCounter = goals.length > 0 ? Math.max(...goals.map(g => g.id), 0) + 1 : 0;
            plusMinusIdCounter = plusMinusEvents.length > 0 ? Math.max(...plusMinusEvents.map(e => e.id), 0) + 1 : 0;
            
            // Import game name if current is empty
            if (data.gameName && !statsGameNameInput.value.trim()) {
                statsGameName = data.gameName;
                statsGameNameInput.value = statsGameName;
            }
            
            saveStatsToStorage();
            renderGoalsList();
            renderPlusMinusList();
            renderFaceoffStats();
            
            // Update player stats if on Players tab
            if (playersView.classList.contains('active')) {
                renderPlayersList();
            }
            
        } catch (error) {
            await showAlert('Import Failed', `${error.message}\n\nPlease select a valid Hockey Tracker Stats JSON file.`);
        }
    };
    
    reader.readAsText(file);
    statsFileInput.value = '';
}

// Draw Hockey Rink
function drawRink() {
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Background (ice)
    ctx.fillStyle = '#e8f4f8';
    ctx.fillRect(0, 0, width, height);

    // Rink outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, width, height);

    // Center line (red)
    ctx.strokeStyle = '#c41e3a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();

    // Blue lines
    ctx.strokeStyle = '#0033a0';
    ctx.lineWidth = 4;
    
    // Left blue line
    ctx.beginPath();
    ctx.moveTo(width * 0.33, 0);
    ctx.lineTo(width * 0.33, height);
    ctx.stroke();
    
    // Right blue line
    ctx.beginPath();
    ctx.moveTo(width * 0.66, 0);
    ctx.lineTo(width * 0.66, height);
    ctx.stroke();

    // Face-off circles
    drawFaceoffCircle(width * 0.2, height * 0.35, 40);
    drawFaceoffCircle(width * 0.2, height * 0.65, 40);
    drawFaceoffCircle(width * 0.8, height * 0.35, 40);
    drawFaceoffCircle(width * 0.8, height * 0.65, 40);

    // Center face-off circle
    drawFaceoffCircle(width * 0.5, height * 0.5, 50);

    // Goal creases
    drawGoalCrease(width * 0.05, height * 0.5);
    drawGoalCrease(width * 0.95, height * 0.5);

    // Filter and redraw shot markers based on selected period
    const shotsToDisplay = currentPeriod === 'all' 
        ? shots 
        : shots.filter(shot => shot.period === currentPeriod);
    
    shotsToDisplay.forEach(shot => drawMarker(shot));
}

// Draw face-off circle
function drawFaceoffCircle(x, y, radius) {
    ctx.strokeStyle = '#c41e3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = '#c41e3a';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
}

// Draw goal crease
function drawGoalCrease(x, y) {
    ctx.strokeStyle = '#c41e3a';
    ctx.fillStyle = 'rgba(196, 30, 58, 0.1)';
    ctx.lineWidth = 2;

    ctx.beginPath();
    if (x < canvas.width / 2) {
        // Left goal
        ctx.arc(x, y, 30, -Math.PI / 2, Math.PI / 2);
    } else {
        // Right goal
        ctx.arc(x, y, 30, Math.PI / 2, -Math.PI / 2);
    }
    ctx.fill();
    ctx.stroke();
}

// Draw shot marker
function drawMarker(shot) {
    const { x, y, resultState, teamState } = shot;
    
    // Treat 'player' teamState as 'for' for visual purposes
    const visualTeam = (teamState === 'player' || teamState === 'for') ? 'for' : 'against';
    
    // Determine marker style based on state
    const stateKey = `${resultState}-${visualTeam}`;
    let fillColor, strokeColor, isFilled;

    switch (stateKey) {
        case 'score-for':
            fillColor = '#38ef7d';
            strokeColor = '#11998e';
            isFilled = true;
            break;
        case 'score-against':
            fillColor = '#ff6a00';
            strokeColor = '#ee0979';
            isFilled = true;
            break;
        case 'miss-for':
            fillColor = 'transparent';
            strokeColor = '#00f2fe';
            isFilled = false;
            break;
        case 'miss-against':
            fillColor = 'transparent';
            strokeColor = '#fa709a';
            isFilled = false;
            break;
    }

    // Draw marker
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    
    if (isFilled) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Add glow effect for scores
    if (resultState === 'score') {
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
}

// Update UI based on current state
function updateUI() {
    let displayTeam = currentState.team === 'player' ? 'for' : 'against';
    const stateClass = `${currentState.result}-${displayTeam}`;
    
    // Update status display
    statusDisplay.className = `status-display ${stateClass}`;
    
    let statusTeamText = currentState.team === 'player' && currentState.selectedPlayer 
        ? currentState.selectedPlayer 
        : currentState.team.toUpperCase();
    
    statusText.textContent = `${currentState.result.toUpperCase()} - ${statusTeamText}`;
    
    // Update body class for background
    document.body.className = `state-${stateClass}`;
    
    // Update button states
    scoreBtn.classList.toggle('active', currentState.result === 'score');
    missBtn.classList.toggle('active', currentState.result === 'miss');
    againstBtn.classList.toggle('active', currentState.team === 'against');
    
    // Update counters
    updateCounters();
}

// Update shot counters
function updateCounters() {
    // Filter shots based on selected period
    const periodShots = currentPeriod === 'all' 
        ? shots 
        : shots.filter(s => s.period === currentPeriod);
    
    // FOR stats (includes all player shots)
    const forShots = periodShots.filter(s => s.teamState === 'for' || s.teamState === 'player');
    forShotsEl.textContent = forShots.length;
    forScoresEl.textContent = forShots.filter(s => s.resultState === 'score').length;
    forMissesEl.textContent = forShots.filter(s => s.resultState === 'miss').length;
    
    // AGAINST stats
    const againstShots = periodShots.filter(s => s.teamState === 'against');
    againstShotsEl.textContent = againstShots.length;
    againstScoresEl.textContent = againstShots.filter(s => s.resultState === 'score').length;
    againstMissesEl.textContent = againstShots.filter(s => s.resultState === 'miss').length;
}

// Handle canvas click
async function handleCanvasClick(event) {
    // Check if a specific period is selected
    if (currentPeriod === 'all') {
        await showAlert('Error', 'Please select a specific period (1, 2, or 3) to add shots');
        return;
    }
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    
    // Create shot object
    const shot = {
        id: shotIdCounter++,
        x: x,
        y: y,
        resultState: currentState.result,
        teamState: currentState.team,
        playerName: currentState.team === 'player' ? currentState.selectedPlayer : null,
        period: currentPeriod,
        timestamp: new Date().toISOString()
    };
    
    shots.push(shot);
    drawMarker(shot);
    updateCounters();
    saveShotsToStorage();
}

// Handle canvas mousemove for tooltip
function handleCanvasMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const mouseX = (event.clientX - rect.left) * scaleX;
    const mouseY = (event.clientY - rect.top) * scaleY;
    
    // Filter shots based on current period (only show tooltip for visible shots)
    const visibleShots = currentPeriod === 'all' 
        ? shots 
        : shots.filter(shot => shot.period === currentPeriod);
    
    // Find shot under mouse (within 12px radius) from visible shots only
    const hoveredShot = visibleShots.find(shot => {
        const distance = Math.sqrt(Math.pow(shot.x - mouseX, 2) + Math.pow(shot.y - mouseY, 2));
        return distance <= 12;
    });
    
    if (hoveredShot) {
        showShotTooltip(hoveredShot, event.clientX, event.clientY);
    } else {
        hideShotTooltip();
    }
}

// Show shot tooltip
function showShotTooltip(shot, clientX, clientY) {
    // Format player/team info
    let playerInfo = '';
    if (shot.playerName) {
        playerInfo = `<span class="player-name">${shot.playerName}</span>`;
    } else if (shot.teamState === 'against') {
        playerInfo = `<span class="against-label">AGAINST</span>`;
    } else {
        playerInfo = `<span class="player-name">FOR</span>`;
    }
    
    // Format result
    const resultIcon = shot.resultState === 'score' ? '⚽' : '❌';
    const resultText = shot.resultState === 'score' ? 'SCORE' : 'MISS';
    
    // Format period
    const periodText = shot.period ? `Period ${shot.period}` : 'Unknown Period';
    
    // Format timestamp
    const date = new Date(shot.timestamp);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Build tooltip content
    shotTooltip.innerHTML = `
        <div>${playerInfo}</div>
        <div class="shot-result">${resultIcon} ${resultText}</div>
        <div class="shot-time">${periodText} • ${timeStr}</div>
    `;
    
    // Position tooltip
    const containerRect = canvas.parentElement.getBoundingClientRect();
    shotTooltip.style.left = `${clientX - containerRect.left + 15}px`;
    shotTooltip.style.top = `${clientY - containerRect.top - 10}px`;
    shotTooltip.classList.add('visible');
}

// Hide shot tooltip
function hideShotTooltip() {
    shotTooltip.classList.remove('visible');
}

// Toggle result state
function toggleResult(result) {
    currentState.result = result;
    updateUI();
}

// Toggle team to against
function toggleAgainst() {
    currentState.team = 'against';
    currentState.selectedPlayer = null;
    renderPlayerButtons(); // Update player button states
    updateUI();
}

// Undo last shot
async function undoLastShot() {
    if (shots.length === 0) {
        await showAlert('Error', 'No shots to undo!');
        return;
    }
    
    shots.pop();
    drawRink();
    updateCounters();
    saveShotsToStorage();
    // Refresh player list if on Players tab
    if (playersView.classList.contains('active')) {
        renderPlayersList();
    }
}

// Reset all shots
async function resetShots() {
    if (shots.length === 0) {
        await showAlert('Error', 'No shots to reset!');
        return;
    }
    
    const confirmed = await showConfirm('Confirm Reset', 'Are you sure you want to clear all shots?');
    if (confirmed) {
        shots = [];
        shotIdCounter = 0;
        drawRink();
        updateCounters();
        saveShotsToStorage();
        // Refresh player list if on Players tab
        if (playersView.classList.contains('active')) {
            renderPlayersList();
        }
    }
}

// Export data to JSON
async function exportData() {
    if (shots.length === 0) {
        await showAlert('Error', 'No shots to export!');
        return;
    }
    
    gameName = gameNameInput.value.trim();
    
    const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        gameName: gameName || 'Unnamed Game',
        attackDirection: attackDirection,
        currentPeriod: currentPeriod,
        totalShots: shots.length,
        shots: shots
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    
    // Create filename with game name if available
    let filename = 'hockey-tracker-shots';
    if (gameName) {
        // Sanitize game name for filename (remove special characters)
        const sanitizedName = gameName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        filename = `hockey-tracker-shots-${sanitizedName}`;
    }
    filename += `-${Date.now()}.json`;
    
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
}

// Import data from JSON
function importData() {
    fileInput.click();
}

// Handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validate data structure
            if (!data.shots || !Array.isArray(data.shots)) {
                throw new Error('Invalid data format: missing or invalid shots array');
            }
            
            // Validate and normalize each shot object
            for (let shot of data.shots) {
                if (!shot.hasOwnProperty('id') || 
                    !shot.hasOwnProperty('x') || 
                    !shot.hasOwnProperty('y') || 
                    !shot.hasOwnProperty('resultState') || 
                    !shot.hasOwnProperty('teamState') || 
                    !shot.hasOwnProperty('timestamp')) {
                    throw new Error('Invalid shot object structure');
                }
                
                // Add playerName field if missing (backward compatibility)
                if (!shot.hasOwnProperty('playerName')) {
                    shot.playerName = null;
                }
                
                // Add period field if missing (backward compatibility)
                if (!shot.hasOwnProperty('period')) {
                    shot.period = 1; // Default to period 1 for old data
                }
                
                // Normalize old 'for' teamState to 'player' if there's no playerName
                if (shot.teamState === 'for' && !shot.playerName) {
                    // Keep as 'for' for backward compatibility
                    shot.teamState = 'for';
                }
            }
            
            // Import successful - add to existing shots instead of replacing
            const importedCount = data.shots.length;
            
            // If imported data has different attack direction, mirror the imported shots
            const importedDirection = data.attackDirection || 'left';
            const needsMirroring = importedDirection !== attackDirection;
            
            if (needsMirroring) {
                data.shots.forEach(shot => {
                    shot.x = canvas.width - shot.x;
                });
            }
            
            shots = [...shots, ...data.shots];
            shotIdCounter = Math.max(...shots.map(s => s.id), 0) + 1;
            
            // If game name is in imported data and current game name is empty, use imported name
            if (data.gameName && !gameNameInput.value.trim()) {
                gameName = data.gameName;
                gameNameInput.value = gameName;
            }
            
            drawRink();
            updateCounters();
            saveShotsToStorage();
            // Refresh player list if on Players tab
            if (playersView.classList.contains('active')) {
                renderPlayersList();
            }
            
            let message = `Successfully imported ${importedCount} shots! Total shots: ${shots.length}`;
            if (data.gameName) {
                message += `\n\nGame: ${data.gameName}`;
            }
            if (needsMirroring) {
                message += `\n\nNote: Shots were mirrored to match current attack direction.`;
            }
            await showAlert('Success', message);
            
        } catch (error) {
            await showAlert('Import Failed', `${error.message}\n\nPlease select a valid Hockey Shot Tracker JSON file.`);
        }
    };
    
    reader.readAsText(file);
    
    // Reset file input
    fileInput.value = '';
}

// Attach event listeners
function attachEventListeners() {
    // Tab switching
    rinkTab.addEventListener('click', () => switchTab('rink'));
    playersTab.addEventListener('click', () => switchTab('players'));
    statsTab.addEventListener('click', () => switchTab('stats'));
    
    // Stats sub-tab switching
    goalsAssistsSubTab.addEventListener('click', () => switchStatsSubTab('goalsAssists'));
    lineupSubTab.addEventListener('click', () => switchStatsSubTab('lineup'));
    faceoffsSubTab.addEventListener('click', () => switchStatsSubTab('faceoffs'));
    
    // Canvas
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousemove', handleCanvasMouseMove);
    canvas.addEventListener('mouseleave', hideShotTooltip);
    
    // Result toggles
    scoreBtn.addEventListener('click', () => toggleResult('score'));
    missBtn.addEventListener('click', () => toggleResult('miss'));
    
    // Team toggle
    againstBtn.addEventListener('click', toggleAgainst);
    
    // Action buttons
    undoBtn.addEventListener('click', undoLastShot);
    resetBtn.addEventListener('click', resetShots);
    exportBtn.addEventListener('click', exportData);
    importBtn.addEventListener('click', importData);
    fileInput.addEventListener('change', handleFileSelect);
    
    // Player management
    addPlayerBtn.addEventListener('click', addPlayer);
    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addPlayer();
    });
    
    // Player list actions
    exportPlayersBtn.addEventListener('click', exportPlayers);
    importPlayersBtn.addEventListener('click', importPlayers);
    clearPlayersBtn.addEventListener('click', clearAllPlayers);
    playersFileInput.addEventListener('change', handlePlayerFileSelect);
    
    // Game name auto-save
    gameNameInput.addEventListener('change', saveShotsToStorage);
    gameNameInput.addEventListener('blur', saveShotsToStorage);
    
    // Attack direction toggle
    toggleDirectionBtn.addEventListener('click', toggleAttackDirection);
    
    // Period selection
    period1Btn.addEventListener('click', () => selectPeriod(1));
    period2Btn.addEventListener('click', () => selectPeriod(2));
    period3Btn.addEventListener('click', () => selectPeriod(3));
    periodAllBtn.addEventListener('click', () => selectPeriod('all'));
    
    // Stats tab
    statsGameNameInput.addEventListener('change', saveStatsToStorage);
    statsGameNameInput.addEventListener('blur', saveStatsToStorage);
    goalBtn.addEventListener('click', () => activateAssignmentButton('goal'));
    assist1Btn.addEventListener('click', () => activateAssignmentButton('assist1'));
    assist2Btn.addEventListener('click', () => activateAssignmentButton('assist2'));
    submitGoalBtn.addEventListener('click', submitGoal);
    clearAssignmentsBtn.addEventListener('click', clearAssignments);
    exportStatsBtn.addEventListener('click', exportStats);
    importStatsBtn.addEventListener('click', importStats);
    statsFileInput.addEventListener('change', handleStatsFileSelect);
    
    // Lineup +/- buttons
    leftWingBtn.addEventListener('click', () => activatePositionButton('leftWing'));
    centerBtn.addEventListener('click', () => activatePositionButton('center'));
    rightWingBtn.addEventListener('click', () => activatePositionButton('rightWing'));
    leftDefenceBtn.addEventListener('click', () => activatePositionButton('leftDefence'));
    rightDefenceBtn.addEventListener('click', () => activatePositionButton('rightDefence'));
    plusBtn.addEventListener('click', () => recordPlusMinus('plus'));
    minusBtn.addEventListener('click', () => recordPlusMinus('minus'));
    clearLineupBtn.addEventListener('click', clearLineup);
}

// Start the app
init();


