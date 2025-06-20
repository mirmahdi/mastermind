// scripts/ui/gameplay/gameplay-modeAC.js
// Handles UI Setup and Event Handling for Modes A & C (Player Guessing)

import { GameState } from '../../game-state.js';
// CORRECTED: Import only recordWin, recordLoss from start-game
import { recordWin, recordLoss } from '../../start-game.js';
// CORRECTED: Import lockGameUI from ui/global
import { lockGameUI } from '../global.js';
// Corrected import path for scorer functions
import { calculateScores, validateScores } from '../../game-logic/scorer.js';
// CORRECTED import path for isValidGuess
import { isValidGuess } from '../../utils/word-generator.js';
// Corrected import path for history manager
import { addGuessToHistory } from '../../game-logic/history-manager.js';
import { refreshGuessHistory } from '../history.js';

/** Sets up the UI for Modes A and C (Player Guessing) */
export function setupModeACUI(container) {
    // Use a single column layout for player guessing modes
    container.innerHTML = `
    <div class="game-container" style="grid-template-columns: 1fr;">
      <div class="column">
        <div class="column-header">Player Guessing</div>
        <div class="player-guess-container">
          <div class="guess-input">
            <label for="guess-input">Enter ${GameState.wordLength}-Letter Guess (Unique):</label>
            <input type="text" id="guess-input" maxlength="${GameState.wordLength}"
                   pattern="[a-zA-Z]{${GameState.wordLength}}"
                   title="Enter ${GameState.wordLength} unique letters"
                   autocomplete="off" autocapitalize="characters" spellcheck="false"
                   class="uppercase-input">
            <button id="submit-guess-btn" class="primary-btn">Submit</button>
          </div>

          ${/* Conditionally add manual score inputs for Mode C */ ''}
          ${GameState.mode === 'modeC' && !GameState.autoScoring ? `
            <div class="score-inputs">
              <div class="input-group">
                <label for="score-a">a</label>
                <input type="number" id="score-a" min="0" max="${GameState.wordLength}" inputmode="numeric" pattern="[0-9]*">
              </div>
              <div class="input-group">
                <label for="score-b">b</label>
                <input type="number" id="score-b" min="0" max="${GameState.wordLength}" inputmode="numeric" pattern="[0-9]*">
              </div>
            </div>
            <div class="score-help">
              <p>Enter scores provided by the other player.</p>
              <p><strong>a</strong>: # of correct letters (any position)</p>
              <p><strong>b</strong>: # of letters in correct position (b ≤ a)</p>
            </div>
          ` : ''}

          <div class="history-section" style="margin-top: 20px;">
            <div class="column-header">Guess History</div>
							<div class="history-header">
								<div class="time-header">User Time</div>
								<div>#</div>
                <div>Guess</div>
                <div>Score</div>
                <div></div>
							</div>
							<div id="guess-history"></div>
						</div>
					</div>
      </div>
   </div>`;

    attachModeACEventHandlers(); // Attach listeners

    refreshGuessHistory(); // Display any existing history
    document.getElementById('guess-input')?.focus(); // Focus input
}

/** Attaches event listeners for Mode A/C UI elements */
function attachModeACEventHandlers() {
    const guessInput = document.getElementById('guess-input');
    const submitBtn = document.getElementById('submit-guess-btn');
    const scoreAInput = document.getElementById('score-a'); // Might be null
    const scoreBInput = document.getElementById('score-b'); // Might be null

    if (!guessInput || !submitBtn) {
        console.warn("[gameplay-modeAC.js] Guess input or submit button missing!");
        return;
    }

    submitBtn.addEventListener('click', handleModeACSubmit);
    guessInput.addEventListener('keypress', (e) => {
        // Allow submit on Enter only if input is full length
        if (e.key === 'Enter' && guessInput.value.length === GameState.wordLength) {
             e.preventDefault();
             // If manual scoring, check if scores are entered before submitting
             if (GameState.mode === 'modeC' && !GameState.autoScoring) {
                  if (scoreAInput?.value !== '' && scoreBInput?.value !== '') {
                     submitBtn.click();
                  } else {
                      // Focus on the first empty score input
                      if (scoreAInput?.value === '') scoreAInput.focus(); else scoreBInput?.focus();
                  }
             } else {
                 submitBtn.click();
             }
        }
    });

    // Add basic navigation/validation for manual score inputs
    if (scoreAInput && scoreBInput) {
        scoreAInput.addEventListener('input', () => { /* Optional validation */ });
        scoreBInput.addEventListener('input', () => { /* Optional validation */ });
        scoreAInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); scoreBInput.focus(); }});
        scoreBInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); submitBtn.click(); }});
    }
}

/** Handles the logic when the player submits a guess in Mode A or C */
function handleModeACSubmit() {
    const guessInput = document.getElementById('guess-input');
    const guess = guessInput.value.toLowerCase().trim();

    // Use imported isValidGuess
    if (!isValidGuess(guess, GameState.wordLength)) {
        alert(`Invalid guess: Must be ${GameState.wordLength} unique letters.`);
        guessInput.select(); // Select text for easy correction
        return;
    }

    let a = 0, b = 0; // Scores

    // Determine scoring method
    if (GameState.mode === 'modeA' || (GameState.mode === 'modeC' && GameState.autoScoring)) {
        // Auto scoring
        if (!GameState.chosenWord) {
             alert("Game Error: Cannot score automatically (secret word missing). Please restart.");
             lockGameUI(); // Use imported lockGameUI
             return;
         }
        // Use imported calculateScores
        ({ a, b } = calculateScores(GameState.chosenWord, guess));
    } else {
        // Manual scoring (Mode C without auto-score)
        const scoreAInput = document.getElementById('score-a');
        const scoreBInput = document.getElementById('score-b');
        if (!scoreAInput || !scoreBInput) {
             alert("Game Error: Manual score inputs missing. Please restart.");
             lockGameUI(); // Use imported lockGameUI
             return;
         }
        a = parseInt(scoreAInput.value);
        b = parseInt(scoreBInput.value);
        if (isNaN(a) || isNaN(b)) {
             alert("Please enter valid numeric scores (a and b) provided by the other player.");
             if (isNaN(a)) scoreAInput.focus(); else scoreBInput.focus();
             return;
        }
        // Use imported validateScores
        if (!validateScores(a, b, GameState.wordLength)) {
             alert(`Invalid scores provided:\n- Must be 0-${GameState.wordLength}\n- 'b' cannot be greater than 'a'.`);
             if (b > a) scoreBInput.focus(); else scoreAInput.focus();
             return;
        }
    }

    // Prevent guessing the same word twice
    if (GameState.guessHistory.some(entry => entry.word === guess)) {
        alert(`You already guessed "${guess.toUpperCase()}". Try a different word.`);
        guessInput.select();
        return;
    }

    // Use imported addGuessToHistory
    addGuessToHistory(guess, a, b); // Add to state and refresh display

    // Check win/loss conditions
    if (b === GameState.wordLength) {
        alert("🎉 You guessed the word correctly!");
        recordWin(); // Use imported function
        lockGameUI(); // Use imported function
    } else if (GameState.guessHistory.length >= GameState.maxGuesses) {
        alert(`❌ Max guesses (${GameState.maxGuesses}) reached. ${GameState.chosenWord ? 'The word was: ' + GameState.chosenWord.toUpperCase() : 'Game over.'}`);
        recordLoss(); // Use imported function
        lockGameUI(); // Use imported function
    } else {
        // Continue game: Clear inputs for next guess
        guessInput.value = '';
        guessInput.focus();
        // Clear manual score inputs if they exist
        if (GameState.mode === 'modeC' && !GameState.autoScoring) {
            const scoreAInput = document.getElementById('score-a');
            const scoreBInput = document.getElementById('score-b');
            if (scoreAInput) scoreAInput.value = '';
            if (scoreBInput) scoreBInput.value = '';
        }
    }
}