// scripts/modal-manager.js
// Manages the SCORE VALIDATION modal ONLY.

// CORRECTED Import Path for GameState
import { GameState } from './game-state.js';
// --- Other imports ---
import { setupGameplayUI } from './ui/gameplay/gameplay-main.js';
import { displayComputerGuess } from './ui/components/letter-grid.js';
import { recordWin } from './start-game.js';
import { lockGameUI, showProcessingIndicator, hideProcessingIndicator } from './ui/global.js';
import { validateAllScores } from './ui/validation.js';
import { highlightScoreErrors } from './ui/history.js';
import { isValidGuess } from './utils/word-generator.js';
import { calculateScores } from './game-logic/scorer.js';


let activeModal = null; // Track the currently open modal

/**
 * Closes any currently active modal dialog.
 */
export function closeActiveModal() {
    if (activeModal) {
        const modalElement = document.getElementById('mastermind-modal');
        if (modalElement?.parentNode) {
             try { modalElement.parentNode.removeChild(modalElement); }
             catch (e) { console.warn("Minor error removing modal element:", e); }
        }
        activeModal = null;
    }
}


/**
 * Shows the Score Validation modal dialog.
 * Logic: Highlights errors and stops, does NOT auto-fix.
 */
export function showScoreValidationDialog() {
    closeActiveModal();

    const modal = document.createElement('div');
    modal.className = 'mastermind-modal';
    modal.id = 'mastermind-modal';

    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
          <h3>Score Validation Required</h3>
          <p>Computer cannot find matching words. Please enter your secret word to check for scoring errors:</p>
          <div class="input-group">
            <label for="chosen-word-validation" class="sr-only">Your Secret Word</label>
            <input type="text" id="chosen-word-validation"
                   maxlength="${GameState.wordLength}"
                   placeholder="Enter your ${GameState.wordLength}-letter word"
                   autocomplete="off" autocapitalize="characters" spellcheck="false"
                   class="uppercase-input">
          </div>
          <div id="processing-indicator" class="processing-indicator"></div>
          <div class="button-group">
              <button id="validate-scores-btn" class="primary-btn">Validate Scores</button>
              <button id="modal-cancel-validation-btn" class="secondary-btn">Cancel</button>
          </div>
        </div>
      `;

    document.body.appendChild(modal);
    activeModal = { type: 'validation' };

    const input = document.getElementById('chosen-word-validation');
    const validateBtn = document.getElementById('validate-scores-btn');
    const cancelBtn = document.getElementById('modal-cancel-validation-btn');
    const overlay = modal.querySelector('.modal-overlay');

    if (!input || !validateBtn || !cancelBtn || !overlay) {
        console.error("[modal-manager.js] Validation modal elements missing!");
        closeActiveModal(); return;
    }

    setTimeout(() => input.focus(), 100);
    input.addEventListener('input', (e) => { e.target.value = e.target.value.toUpperCase(); });
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); validateBtn.click(); } });

    // --- Validate Button Handler (REVISED LOGIC) ---
    validateBtn.addEventListener('click', () => {
        const chosenWord = input.value.toLowerCase().trim();

        if (!isValidGuess(chosenWord, GameState.wordLength)) {
            alert(`Please enter your valid ${GameState.wordLength}-letter word (unique letters only).`);
            input.select();
            return;
        }

        const errors = validateAllScores(chosenWord, GameState.guessHistory);

        if (errors.length > 0) {
            // --- ERRORS FOUND: Highlight and Stop ---
            highlightScoreErrors(errors);
            alert(`Found ${errors.length} scoring error(s). Please review the highlighted scores in the Guess History.`);
            closeActiveModal();
            lockGameUI(); // Lock game

        } else {
            // --- NO ERRORS FOUND (but computer was still stuck) ---
            const computer = GameState.computer;
            let message = `Word "${chosenWord.toUpperCase()}" is valid, and all scores were entered correctly according to this word.\n\n`;
            let wordKnown = false;
            let wordConsistent = true;
            if (computer?.initialWords?.includes(chosenWord)) {
                wordKnown = true;
                for (const entry of GameState.guessHistory) { const { a, b } = calculateScores(chosenWord, entry.word); if (a !== entry.scores.a || b !== entry.scores.b) { wordConsistent = false; break; } }
            }

            if (wordKnown && wordConsistent) {
                message += "The computer confirmed this word matches all provided scores but still cannot proceed. Possible logic/dictionary issue.";
            } else if (wordKnown && !wordConsistent) {
                 message += "However, this word does NOT match the scores you provided earlier. Please review history or use Fix Score (✎).";
            } else {
                message += "This word was not in the computer's dictionary.";
                 // If learning is desired, import and call learnWord from utils/storage.js
                 // import { learnWord } from './utils/storage.js'; learnWord(chosenWord);
                 // message += "\nThe word has been added to the learned words list for future games.";
            }
            alert(message);
            closeActiveModal();
            lockGameUI(); // Lock game
        }
    });

    // --- Cancel Button and Overlay Click Handlers ---
    cancelBtn.addEventListener('click', () => {
        closeActiveModal();
        lockGameUI(); // Lock game if user cancels validation
    });
    overlay.addEventListener('click', () => {
        closeActiveModal();
        lockGameUI(); // Lock game if user clicks overlay to cancel
    });
}