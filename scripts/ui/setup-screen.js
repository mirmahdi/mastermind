// scripts/ui/setup-screen.js
// Handles the UI logic for the initial game setup screen.

import { GameState } from '../game-state.js';
import { startGame } from '../start-game.js'; // Needed for start button
import { isValidGuess } from '../utils/word-generator.js'; // Needed for Mode C validation
import { hideProcessingIndicator } from './global.js'; // Import from new global file

/**
 * Sets up the UI elements based on the selected game mode.
 * Creates input fields and start button dynamically within #player-options.
 * @param {string | null} mode - Selected game mode ('modeA', 'modeB', 'modeC') or null.
 */
export function setupUIForMode(mode) {
    const playerOptions = document.getElementById('player-options');
    const gamePanel = document.getElementById('game-panel');
    const setupPanel = document.getElementById('game-setup');

    // Ensure critical elements exist
    if (!playerOptions || !gamePanel || !setupPanel) {
        console.error("[setup-screen.js] Critical UI setup elements missing.");
        return;
    }

    // Clear previous mode-specific options
    playerOptions.innerHTML = '';
    // Ensure correct panel visibility for setup phase
    gamePanel.style.display = 'none';
    setupPanel.style.display = 'block';
    hideProcessingIndicator(); // Ensure indicator is hidden during setup

    if (!mode) {
        // If "-- Select a mode --" is chosen, just clear options and return
        return;
    }

    let htmlContent = '';
    // Use GameState default or current input value for initial display
    // IMPORTANT: This relies on word-length input potentially existing *before* this runs
    // It might be safer to just use GameState.wordLength or a default.
    const currentLength = GameState.wordLength || 5;

    // Build HTML based on selected mode
    switch (mode) {
        case 'modeA': // Computer picks word
            htmlContent = `
                <div class="input-group">
                    <label for="word-length">Word Length:</label>
                    <input type="number" id="word-length" min="4" max="8" value="${currentLength}">
                    <span class="hint">(4-8 letters)</span>
                </div>
                <button id="start-btn" class="primary-btn">Start Game</button>
            `;
            break;
        case 'modeB': // Computer guesses
            htmlContent = `
                <div class="input-group">
                    <label for="word-length">Word Length:</label>
                    <input type="number" id="word-length" min="4" max="8" value="${currentLength}">
                    <span class="hint">(4-8 letters)</span>
                </div>
                <p class="hint-text">
                    Think of a word with <span id="length-display">${currentLength}</span> unique letters. Computer will try to guess it.
                </p>
                <button id="start-btn" class="primary-btn">Start Game</button>
            `;
            break;
        case 'modeC': // Player vs Player
            htmlContent = `
                <div class="input-group input-group-checkbox">
                    <input type="checkbox" id="auto-scoring" checked>
                    <label for="auto-scoring">Auto Score Guesses?</label>
                </div>
                <div class="input-group">
                    <label for="word-length">Word Length:</label>
                    <input type="number" id="word-length" min="4" max="8" value="${currentLength}">
                    <span class="hint">(4-8 letters)</span>
                </div>
                <div class="input-group" id="chosen-word-group">
                    <label for="chosen-word">Secret Word (for Auto Score):</label>
                    <input type="text" id="chosen-word" class="uppercase-input" placeholder="Enter secret word here..." autocomplete="off" spellcheck="false">
                    <span class="hint">Must be ${currentLength} unique letters if Auto Score checked.</span>
                </div>
                <button id="start-btn" class="primary-btn">Start PvP Game</button>
            `;
            break;
        default:
            console.warn("[setup-screen.js] Unknown mode selected:", mode);
            return; // Don't proceed for unknown modes
    }

    playerOptions.innerHTML = htmlContent; // Inject the mode-specific HTML

    // --- Add Event Listeners Specific to Controls Just Added ---

    const wordLengthInput = document.getElementById('word-length');
    if (wordLengthInput) {
        wordLengthInput.addEventListener('input', updateSetupHints); // Attach listener
        updateSetupHints(); // Trigger initial update after injecting HTML
    }

    const autoScoringCheckbox = document.getElementById('auto-scoring');
    if (autoScoringCheckbox) {
        autoScoringCheckbox.addEventListener('change', updateSetupHints); // Update on change
        // Initial update handled by wordLengthInput's listener if it exists,
        // or called explicitly after injecting HTML.
        updateSetupHints(); // Ensure initial state correct even if no length input listener fired yet
    }

    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.addEventListener('click', handleStartGameClick);
    }
}

/** Helper function to update dynamic hints and input attributes in setup UI */
function updateSetupHints() {
    const wordLengthInput = document.getElementById('word-length');
    // Use a safe default if input doesn't exist or has no value yet
    const length = parseInt(wordLengthInput?.value || GameState.wordLength || 5);

    // Update Mode B length display hint
    const lengthDisplay = document.getElementById('length-display');
    if (lengthDisplay) {
        lengthDisplay.textContent = length;
    }

    // Update Mode C chosen word hint and input properties
    const chosenWordGroup = document.getElementById('chosen-word-group');
    const chosenWordInput = document.getElementById('chosen-word');
    const chosenWordHint = chosenWordGroup?.querySelector('.hint');
    const autoScoringCheckbox = document.getElementById('auto-scoring');

    if (chosenWordGroup && chosenWordInput && chosenWordHint && autoScoringCheckbox) {
        if (autoScoringCheckbox.checked) {
            chosenWordGroup.style.display = 'block'; // Show group
            chosenWordHint.textContent = `Must be ${length} unique letters if Auto Score checked.`;
            chosenWordInput.maxLength = length; // Set maxLength dynamically
            chosenWordInput.placeholder = `Enter ${length}-letter secret word`;
            chosenWordInput.required = true; // Make required when visible
        } else {
            chosenWordGroup.style.display = 'none'; // Hide group
            chosenWordInput.required = false; // Not required when hidden
            // Clear value if hidden? Optional. chosenWordInput.value = '';
        }
    }
}

/** Event handler for the Start Game button click */
function handleStartGameClick() {
    const wlInput = document.getElementById('word-length');
    const currentMode = GameState.mode; // Read mode from state

    // --- Word Length Validation ---
    if (!wlInput) {
        alert("Error: Word length input missing. Cannot start game.");
        return;
    }
    const wordLength = parseInt(wlInput.value);
    if (isNaN(wordLength) || wordLength < 4 || wordLength > 8) {
        alert("Please enter a valid word length between 4 and 8.");
        wlInput.focus();
        return;
    }
    GameState.wordLength = wordLength; // Set word length in global state

    // --- Mode C Specific Validation ---
    if (currentMode === 'modeC') {
        const autoCheck = document.getElementById('auto-scoring');
        const chosenWordInput = document.getElementById('chosen-word');
        GameState.autoScoring = autoCheck ? autoCheck.checked : true; // Default to true if checkbox missing

        if (GameState.autoScoring) {
            // Ensure input exists before accessing value
            if (!chosenWordInput) {
                alert("Error: Secret word input missing for Mode C Auto Score.");
                return;
            }
            const chosenWord = chosenWordInput.value.toLowerCase().trim();
            if (!chosenWord) {
                alert("Auto Score is checked, please enter the Secret Word.");
                chosenWordInput.focus();
                return;
            }
            if (!isValidGuess(chosenWord, wordLength)) {
                alert(`Invalid Secret Word. Must be ${wordLength} unique letters.`);
                chosenWordInput.focus();
                return;
            }
            GameState.chosenWord = chosenWord; // Store valid secret word
        } else {
            GameState.chosenWord = ''; // Ensure empty for manual scoring
        }
    } else {
        // Ensure chosenWord and autoScoring are reset/default for Mode A/B
        GameState.chosenWord = '';
        GameState.autoScoring = false; // Not relevant for A/B
    }

    // --- Start Game ---
    // Basic check if GameState thinks config is valid now
    if (!GameState.isValid()) {
         alert("Game configuration is invalid. Please check settings.");
         return;
    }

    try {
        startGame(); // Call the main start game function from start-game.js
    } catch (error) {
        console.error("[setup-screen.js] Error calling startGame():", error);
        alert(`Failed to start game: ${error.message}`);
        // Optionally reset UI or GameState here if start fails
    }
}