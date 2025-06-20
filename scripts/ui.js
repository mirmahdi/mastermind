// scripts/ui.js
// Central export file for UI modules

// Setup Screen UI functions
export {
  setupUIForMode
} from './ui/setup-screen.js';

// Global UI functions (stats, lock, indicator, global controls)
export {
  updateStatsDisplay,
  lockGameUI,
  showProcessingIndicator,
  hideProcessingIndicator,
  attachGameControlListeners
} from './ui/global.js';

// Gameplay Router function (selects correct mode UI)
export { setupGameplayUI } from './ui/gameplay/gameplay-main.js';

// Specific UI component functions
export { displayComputerGuess, createLetterGridHTML } from './ui/components/letter-grid.js';
export { handleScoreAInput, handleScoreBInput } from './ui/components/score-input.js';

// History Display functions
export {
  refreshGuessHistory,
  highlightScoreErrors,
  clearHistory
} from './ui/history.js';

// Validation UI functions (related to correcting scores)
export {
  validateAllScores,
  fixAllScoringErrors
} from './ui/validation.js';

// Modal functions
export {
    showScoreValidationDialog,
    closeActiveModal
} from './modal-manager.js';