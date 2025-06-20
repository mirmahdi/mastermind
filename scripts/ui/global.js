// scripts/ui/global.js
// Global UI functions: Stats display, UI locking, indicator, global controls.

import { GameState } from '../game-state.js';
import { resetGame, recordLoss } from '../start-game.js'; // Needed for buttons
import { loadStats } from '../utils/storage.js'; // Import from new location

/**
 * Updates the statistics display in the footer.
 */
export function updateStatsDisplay() {
  try {
      // Load latest stats each time display is updated
      const stats = loadStats();
      // Update GameState.stats as well for runtime consistency if needed elsewhere
      GameState.stats = stats;
      const gamesPlayedEl = document.getElementById('games-played');
      const gamesWonEl = document.getElementById('games-won');
      // Use '?? 0' to handle cases where stats might be null or properties missing
      if (gamesPlayedEl) gamesPlayedEl.textContent = stats.gamesPlayed ?? 0;
      if (gamesWonEl) gamesWonEl.textContent = stats.gamesWon ?? 0;
  } catch (error) {
      console.error("[global.js] Error updating stats display:", error);
      // Set to default on error
      const gamesPlayedEl = document.getElementById('games-played');
      const gamesWonEl = document.getElementById('games-won');
      if (gamesPlayedEl) gamesPlayedEl.textContent = '0';
      if (gamesWonEl) gamesWonEl.textContent = '0';
  }
}

/**
 * Disables inputs and buttons when the game ends or encounters a critical error.
 * Enables the 'New Game' button. Also hides the processing indicator.
 */
export function lockGameUI() {
  // Disable setup controls if they are somehow still visible/active
  document.querySelectorAll('#game-setup input, #game-setup select, #game-setup button')
    .forEach(el => { if(el) el.disabled = true; });

  // Disable gameplay inputs/buttons within the dynamic section
  document.querySelectorAll('#input-section input, #input-section button')
    .forEach(el => { if(el) el.disabled = true; });

  // Disable the Concede button specifically
  const concedeBtn = document.getElementById('concede-btn');
  if (concedeBtn) concedeBtn.disabled = true;


  // Ensure New Game button is explicitly ENABLED
  const newGameBtn = document.getElementById('new-game-btn');
  if (newGameBtn) {
      newGameBtn.disabled = false;
  }

  hideProcessingIndicator(); // Ensure indicator is hidden
  GameState.gameActive = false; // Update game state
}

/**
 * Shows the processing indicator. Handles finding it in main UI or modal.
 * @param {string} [message='Computer thinking...'] - Message to display.
 */
export function showProcessingIndicator(message = 'Computer thinking...') {
    const indicator = document.getElementById('processing-indicator') || document.querySelector('.modal-content #processing-indicator');
    if (indicator) {
        indicator.textContent = message;
        indicator.classList.add('visible');
        // CSS should handle display: block via .visible class
    } else {
        console.warn("[global.js] Processing indicator element not found.");
    }
}

/**
 * Hides the processing indicator. Handles finding it in main UI or modal.
 */
export function hideProcessingIndicator() {
    const indicator = document.getElementById('processing-indicator') || document.querySelector('.modal-content #processing-indicator');
    if (indicator) {
        indicator.classList.remove('visible');
        // CSS should handle display: none via lack of .visible class
    }
}


// --- Global Game Controls (Concede, New Game) ---

/** Attaches listeners to the Concede and New Game buttons */
export function attachGameControlListeners() {
    const concedeBtn = document.getElementById('concede-btn');
    const newGameBtn = document.getElementById('new-game-btn');

    // Remove potentially existing listeners first to prevent duplicates
    // Use specific function references for removal
    concedeBtn?.removeEventListener('click', handleConcede);
    newGameBtn?.removeEventListener('click', handleNewGame);

    // Add listeners
    concedeBtn?.addEventListener('click', handleConcede);
    newGameBtn?.addEventListener('click', handleNewGame);

    // Set initial button states based on game activity
    if (concedeBtn) concedeBtn.disabled = !GameState.gameActive;
    // New Game button is generally always enabled
    if (newGameBtn) newGameBtn.disabled = false;
}

/** Handles Concede button click */
function handleConcede() {
    // Prevent conceding if game not active
    if (!GameState.gameActive) return;

    if (confirm("Are you sure you want to concede?")) {
        let message = "Game conceded.";
            if ((GameState.mode === 'modeA' || (GameState.mode === 'modeC' && GameState.autoScoring)) && GameState.chosenWord) {
                message = `You conceded. The correct word was: ${GameState.chosenWord.toUpperCase()}`;
            } else if (GameState.mode === 'modeB') {
                // Provide a neutral message for Mode B concede
                message = `Game ended.`;
            }
            alert(message);
            recordLoss(); // Conceding counts as a loss
            lockGameUI(); // Lock UI after conceding
        }
}

/** Handles New Game button click */
function handleNewGame() {
    resetGame(); // Trigger the game reset process from start-game.js
}