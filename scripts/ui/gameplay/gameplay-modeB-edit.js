// scripts/ui/gameplay/gameplay-modeB-edit.js
// Handles UI Setup and Event Handling for Mode B (Edit Score)

import { GameState } from '../../game-state.js';
import { validateScores } from '../../game-logic/scorer.js';
import { refreshGuessHistory } from '../history.js';
import { setupGameplayUI } from './gameplay-main.js';
// Import the specific function needed
import { createLetterGridHTML } from '../components/letter-grid.js';
import { handleScoreAInput, handleScoreBInput } from '../components/score-input.js';
import { confirmScoreUpdate } from '../../game-logic/history-manager.js';

/** Sets up the UI for editing a past score in Mode B */
export function setupModeBEditUI(container) {
    const editInfo = GameState.editingGuess;
    // Ensure editInfo exists AND has a valid word string before proceeding
    if (!editInfo || typeof editInfo.word !== 'string' || editInfo.word.length !== GameState.wordLength) {
        console.error("setupModeBEditUI called without valid GameState.editingGuess data.", editInfo);
        alert("Error entering edit mode. Returning to game."); // Inform user
        // Clear potentially bad state and revert UI
        GameState.editingGuess = null;
        setupGameplayUI();
        return;
    }

    const wordToEdit = editInfo.word; // Get the word reliably

    // Generate the static letter grid HTML for the specific word being edited
    const staticLetterGridHTML = createLetterGridHTML(wordToEdit, true);

    // --- DEBUGGING LOG: Check the generated HTML ---
    // console.log(`Generated Static Grid HTML for ${wordToEdit}:`, staticLetterGridHTML);
    // ---

    // Assign the complete, clean HTML structure to the container
    container.innerHTML = `
    <div class="game-container">
      <div class="column">
        <div id="edit-mode-header" class="column-header edit-mode-header">Fix Score for: ${wordToEdit.toUpperCase()}</div>
        <div class="guess-section">

          <div class="computer-guess">
              <div id="comp-guess-display">
                  ${staticLetterGridHTML}
              </div>
          </div>

          <div class="score-inputs">
            <div class="input-group">
                <label for="edit-score-a" title="Total correct letters">a</label>
                <input type="number" id="edit-score-a" min="0" max="${GameState.wordLength}" value="${editInfo.scoreA}" inputmode="numeric" pattern="[0-9]*">
            </div>
            <div class="input-group">
                 <label for="edit-score-b" title="Correct position">b</label>
                 <input type="number" id="edit-score-b" min="0" max="${GameState.wordLength}" value="${editInfo.scoreB}" inputmode="numeric" pattern="[0-9]*">
            </div>
          </div>

          <div class="score-help">
              <p>Enter the CORRECT scores for the word displayed above.</p>
              <p><strong>a</strong>: # of correct letters (any position)</p>
              <p><strong>b</strong>: # of letters in correct position (b ≤ a)</p>
          </div>

          <div id="processing-indicator" class="processing-indicator"></div>

          <div class="button-group" style="margin-top: 15px;">
              <button id="confirm-update-score-btn" class="primary-btn">Update Score</button>
              <button id="cancel-edit-score-btn" class="secondary-btn">Cancel Edit</button>
          </div>

        </div>
      </div>

      <div class="column">
        <div id="history-column-header" class="column-header">Guess History</div>
        <div class="history-section">
            <div class="history-header">
                <div>Guess</div>
                <div>Score</div>
                <div></div>
            </div>
            <div id="guess-history"></div>
        </div>
      </div>
    </div>`;

    attachModeBEditEventHandlers(editInfo); // Attach listeners after HTML is set

    refreshGuessHistory(); // Display history
    document.getElementById('edit-score-a')?.focus(); // Focus first edit input
}

/** Attaches event listeners for the score edit UI elements */
function attachModeBEditEventHandlers(editInfo) {
    const scoreAInput = document.getElementById('edit-score-a');
    const scoreBInput = document.getElementById('edit-score-b');
    const confirmBtn = document.getElementById('confirm-update-score-btn');
    const cancelBtn = document.getElementById('cancel-edit-score-btn');

    if (!scoreAInput || !scoreBInput || !confirmBtn || !cancelBtn) {
        console.error("[gameplay-modeB-edit.js] Edit mode UI elements missing for handlers!");
        return;
    }

    scoreAInput.addEventListener('input', handleScoreAInput);
    scoreBInput.addEventListener('input', handleScoreBInput);

    if (editInfo.scoreA === 0) {
        scoreBInput.disabled = true;
    }

    confirmBtn.addEventListener('click', () => handleModeBEditConfirm(editInfo));
    cancelBtn.addEventListener('click', handleModeBCancelEdit);

    scoreAInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
             e.preventDefault();
             if (scoreAInput.value === '0') confirmBtn.focus(); else scoreBInput.focus();
        }
    });
     scoreBInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); confirmBtn.click(); }
    });
}

/** Handles the logic when "Update Score" is clicked in edit mode */
function handleModeBEditConfirm(editInfo) {
    const scoreAInput = document.getElementById('edit-score-a');
    const scoreBInput = document.getElementById('edit-score-b');
    const confirmBtn = document.getElementById('confirm-update-score-btn');
    const cancelBtn = document.getElementById('cancel-edit-score-btn');

    const newA = parseInt(scoreAInput.value);
    const newB = parseInt(scoreBInput.value);

    if (isNaN(newA) || isNaN(newB)) {
        alert("Please enter valid numeric scores.");
        return;
    }
    if (!validateScores(newA, newB, GameState.wordLength)) {
        alert(`Invalid scores:\n- Must be 0-${GameState.wordLength}\n- b cannot be > a.`);
        return;
    }

    if (newA === editInfo.scoreA && newB === editInfo.scoreB) {
        console.log("Scores unchanged during edit.");
        handleModeBCancelEdit();
        return;
    }

    if (confirmBtn) confirmBtn.disabled = true;
    if (cancelBtn) cancelBtn.disabled = true;

    const updateStarted = confirmScoreUpdate(editInfo, newA, newB);

    if (!updateStarted) {
        if (confirmBtn) confirmBtn.disabled = false;
        if (cancelBtn) cancelBtn.disabled = false;
    }
}

/** Handles the logic when "Cancel Edit" is clicked */
function handleModeBCancelEdit() {
    GameState.editingGuess = null;
    setupGameplayUI();
}