// scripts/game-state.js
// Central object holding the current state of the game.

// Learned words are now managed by utils/storage.js

export const GameState = {
  mode: null,               // 'modeA', 'modeB', 'modeC'
  wordLength: 5,            // Default word length
  maxGuesses: 20,           // Max guesses allowed (relevant for Mode A/C)
  chosenWord: '',           // The secret word (Mode A, or Mode C auto-score)
  autoScoring: true,        // Mode C: whether to auto-score guesses
  guessHistory: [],         // Array of { word: string, scores: {a, b}, computerState: object|null }
  currentComputerGuess: null, // The word the computer just guessed (Mode B)
  computer: null,           // Instance of ComputerPlayer (Mode B)
  gameActive: false,        // Is a game currently in progress?
  editingGuess: null,       // Info object if user is editing a score { index, word, scoreA, scoreB }

  // --- Properties for Timers ---
  userActionStartTime: 0,
  cumulativeUserTime: 0,
  cumulativeCpuTime: 0,
  liveUserTimerId: null, // To hold the setInterval ID for the live timer

  // Stats are loaded/saved via utils/storage.js but stored here during runtime
  stats: {
    gamesPlayed: 0,
    gamesWon: 0,
  },

  /** Resets state for a new game, keeping stats. */
  reset() {
    this.mode = null;
    this.wordLength = 5; // Reset to default or keep previous? Resetting is safer.
    this.chosenWord = '';
    this.autoScoring = true; // Default for Mode C setup
    this.guessHistory = [];
    this.currentComputerGuess = null;
    this.computer = null;
    this.gameActive = false;
    this.editingGuess = null;
    // Reset timer properties
    this.userActionStartTime = 0;
    this.cumulativeUserTime = 0;
    this.cumulativeCpuTime = 0;
    if (this.liveUserTimerId) {
      clearInterval(this.liveUserTimerId);
      this.liveUserTimerId = null;
    }
    // Note: Stats are intentionally NOT reset here.
  },

  /** Checks if the current state represents a valid configuration to start a game. */
  isValid() {
    if (!this.mode || !['modeA', 'modeB', 'modeC'].includes(this.mode)) {
         return false;
    }
    if (typeof this.wordLength !== 'number' || this.wordLength < 4 || this.wordLength > 8) {
         return false;
    }
    // Mode C requires chosenWord if autoScoring is enabled
    if (this.mode === 'modeC' && this.autoScoring && !this.chosenWord) {
        // This check might be better placed in the start button handler,
        // as chosenWord is entered just before starting.
        // However, it ensures state consistency if checked here too.
        // Let's comment it out here and rely on the start button validation.
        // return false;
    }
    // Add other essential checks if needed
    return true;
  }
};