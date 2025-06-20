/**
 * Project: Mastermind for Words
 * File: scripts/start-game.js
 * Description: Handles starting new games, resetting, loading dictionary, and win/loss recording.
 */
import { GameState } from './game-state.js';
import { generateRandomWord, isValidGuess } from './utils/word-generator.js';
import { loadStats, saveStats, loadLearnedWords } from './utils/storage.js';
import { ComputerPlayer } from './game-logic/computer-player.js';
import {
    setupGameplayUI,
    clearHistory,
    lockGameUI,
    updateStatsDisplay,
    hideProcessingIndicator
} from './ui.js';
import { showScoreValidationDialog } from './modal-manager.js';

let dictionaryData = null;
let isDictionaryLoading = false;
let dictionaryLoadPromise = null;

async function loadDictionary() {
    if (dictionaryData) return true;
    if (isDictionaryLoading) return dictionaryLoadPromise;

    console.log("[start-game.js] Loading dictionary...");
    isDictionaryLoading = true;
    dictionaryLoadPromise = new Promise(async (resolve) => {
        try {
            const response = await fetch('./data/dictionary.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            validateDictionaryData(data);
            dictionaryData = data;
            console.log("[start-game.js] Dictionary loaded successfully.");
            resolve(true);
        } catch (error) {
            console.error("[start-game.js] Error loading dictionary:", error);
            dictionaryData = null;
            resolve(false);
        } finally {
            isDictionaryLoading = false;
        }
    });
    return dictionaryLoadPromise;
}

function validateDictionaryData(data) {
    if (!data?.wordSets) {
        console.warn("[start-game.js] validateDictionaryData: Invalid data structure.");
        return;
    }
    let totalInvalid = 0;
    Object.keys(data.wordSets).forEach(category => {
        const wordSets = data.wordSets[category];
        if (!Array.isArray(wordSets)) return;

        const expectedLength = parseInt(category.split('-')[0]);
        if (isNaN(expectedLength)) return;

        wordSets.forEach((wordSet) => {
            if (!wordSet?.set || !Array.isArray(wordSet.set)) {
                wordSet.set = [];
                return;
            };
            let invalidInSet = 0;
            wordSet.set = wordSet.set.filter(wordObj => {
                const word = wordObj?.word?.toLowerCase();
                const isValid = word && word.length === expectedLength && isValidGuess(word, expectedLength);
                if (!isValid) invalidInSet++;
                return isValid;
            });
            totalInvalid += invalidInSet;
        });
        data.wordSets[category] = wordSets.filter(wordSet => wordSet.set.length > 0);
    });
    if (totalInvalid > 0) console.log(`[start-game.js] Total invalid words removed from dictionary during validation: ${totalInvalid}`);
}

export async function startGame() {
    if (!GameState.isValid()) {
        alert("Invalid game configuration. Please select mode and valid length (4-8).");
        return;
    }

    GameState.guessHistory = [];
    GameState.gameActive = true;
    GameState.editingGuess = null;
    GameState.currentComputerGuess = null;
    GameState.computer = null;

    if (GameState.mode === 'modeB') {
        const dictLoaded = await loadDictionary();
        if (!dictLoaded) {
            alert("Failed to load the necessary word dictionary. Cannot start Mode B.");
            GameState.gameActive = false;
            return;
        }
    }

    try {
        switch (GameState.mode) {
            case 'modeA':
                startModeA();
                break;
            case 'modeB':
                startModeB();
                break;
            case 'modeC':
                startModeC();
                break;
            default:
                throw new Error(`Invalid game mode selected: ${GameState.mode}`);
        }

        const gamePanel = document.getElementById('game-panel');
        const setupPanel = document.getElementById('game-setup');
        gamePanel.style.display = 'block';
        setupPanel.style.display = 'none';

        setupGameplayUI();

    } catch (error) {
        console.error("[start-game.js] Error starting game:", error);
        alert(`Error starting game: ${error.message}\nReturning to setup.`);
        resetGame();
    }
}

function startModeA() {
    let wordFound = false;
    if (dictionaryData) {
         const key = `${GameState.wordLength}-letter`;
         const sets = dictionaryData.wordSets?.[key];
         if(sets && Array.isArray(sets) && sets.length > 0) {
            const availableWords = sets.flatMap(s => s?.set?.map(w => w?.word?.toLowerCase()) ?? [])
                                      .filter(w => w && isValidGuess(w, GameState.wordLength));
            if (availableWords.length > 0) {
                 GameState.chosenWord = availableWords[Math.floor(Math.random() * availableWords.length)];
                 wordFound = true;
            }
         }
    }
    if (!wordFound) {
        console.warn("[start-game.js] Mode A falling back to random word generation.");
        GameState.chosenWord = generateRandomWord(GameState.wordLength);
    }
    console.log("[DEBUG] Mode A Computer's word:", GameState.chosenWord);
}

function startModeB() {
    try {
        GameState.computer = new ComputerPlayer(GameState.wordLength, dictionaryData);
    } catch (error) {
        throw new Error(`Failed to start Mode B: ${error.message}`);
    }
}

function startModeC() {
    console.log(`[start-game.js] Starting Mode C. AutoScoring: ${GameState.autoScoring}, Chosen Word: ${GameState.chosenWord || '(None)'}`);
}

export function resetGame() {
    const setupPanel = document.getElementById('game-setup');
    const gamePanel = document.getElementById('game-panel');
    const playerOptions = document.getElementById('player-options');
    const inputSection = document.getElementById('input-section');
    const modeSelect = document.getElementById('mode-select');

    GameState.reset();

    if (playerOptions) playerOptions.innerHTML = '';
    if (inputSection) inputSection.innerHTML = '';
    clearHistory();

    if (setupPanel) setupPanel.style.display = 'block';
    if (gamePanel) gamePanel.style.display = 'none';

    if (modeSelect) {
        modeSelect.value = '';
        modeSelect.disabled = false;
    }

    document.querySelectorAll('#game-setup input, #game-setup select, #game-setup button')
       .forEach(el => { if(el) el.disabled = false; });

    const concedeBtn = document.getElementById('concede-btn');
    if(concedeBtn) concedeBtn.disabled = true;

    hideProcessingIndicator();
    updateStatsDisplay();
}

export function recordWin() {
    if (!GameState.gameActive) return;
    GameState.stats.gamesPlayed++;
    GameState.stats.gamesWon++;
    saveStats(GameState.stats);
    updateStatsDisplay();
    GameState.gameActive = false;
}

export function recordLoss() {
    if (!GameState.gameActive) return;
    GameState.stats.gamesPlayed++;
    saveStats(GameState.stats);
    updateStatsDisplay();
    GameState.gameActive = false;
}