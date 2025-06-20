// scripts/utils/storage.js
// Utility functions for interacting with localStorage (Stats, Learned Words)

const STATS_KEY = 'mm-stats';
const LEARNED_WORDS_KEY = 'mm-learned-words';

// --- Game Statistics ---

/**
 * Loads game statistics from localStorage.
 * @returns {{gamesPlayed: number, gamesWon: number}} Game statistics object.
 */
export function loadStats() {
  try {
    const statsJson = localStorage.getItem(STATS_KEY);
    if (statsJson) {
        const stats = JSON.parse(statsJson);
        // Basic validation of loaded stats structure
        if (typeof stats.gamesPlayed === 'number' && typeof stats.gamesWon === 'number') {
             return stats;
        } else {
            console.warn("Loaded stats have incorrect format, resetting.");
            localStorage.removeItem(STATS_KEY); // Remove malformed data
        }
    }
  } catch (error) {
    console.error("Error loading stats from localStorage:", error);
    // Attempt to remove potentially corrupted data
    try { localStorage.removeItem(STATS_KEY); } catch (_) {}
  }
  // Return default stats if loading fails or no stats found
  return { gamesPlayed: 0, gamesWon: 0 };
}

/**
 * Saves game statistics to localStorage.
 * @param {{gamesPlayed: number, gamesWon: number}} stats - Game statistics object to save.
 */
export function saveStats(stats) {
  // Basic validation before saving
  if (stats && typeof stats.gamesPlayed === 'number' && typeof stats.gamesWon === 'number') {
      try {
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
      } catch (error) {
        console.error("Error saving stats to localStorage:", error);
        // Handle potential storage quota errors?
      }
  } else {
      console.warn("Attempted to save invalid stats object:", stats);
  }
}


// --- Learned Words ---

/**
 * Loads the learned words dictionary from localStorage.
 * Structure: { wordLength: [word1, word2, ...], ... }
 * @returns {Object<number, string[]>} Dictionary of learned words by length.
 */
export function loadLearnedWords() {
    let learnedWords = {};
    try {
      const wordsJson = localStorage.getItem(LEARNED_WORDS_KEY);
      if (wordsJson) {
        const parsed = JSON.parse(wordsJson);
        // Validate structure - ensure keys are numbers and values are arrays of strings
        if (typeof parsed === 'object' && parsed !== null) {
            Object.keys(parsed).forEach(key => {
                const numKey = parseInt(key);
                if (!isNaN(numKey) && Array.isArray(parsed[key]) && parsed[key].every(item => typeof item === 'string')) {
                    learnedWords[numKey] = parsed[key];
                } else {
                    console.warn(`Invalid data found in learned words for key "${key}", skipping.`);
                }
            });
        } else {
             console.warn("Learned words data retrieved from storage is not a valid object.");
             localStorage.removeItem(LEARNED_WORDS_KEY); // Remove malformed data
        }
      }
    } catch (e) {
      console.error("Could not load or parse learned words from localStorage:", e);
      // Attempt to remove potentially corrupted data
      try { localStorage.removeItem(LEARNED_WORDS_KEY); } catch (_) {}
      learnedWords = {}; // Reset to empty on error
    }
    return learnedWords;
}

/**
 * Saves the learned words dictionary to localStorage.
 * @param {Object<number, string[]>} learnedWords - Dictionary of learned words by length.
 */
function saveLearnedWords(learnedWords) {
    // Basic validation before saving
    if (typeof learnedWords !== 'object' || learnedWords === null) {
         console.warn("Attempted to save invalid learnedWords data (not an object):", learnedWords);
         return;
    }
    // Optional: further validation of internal structure?
    try {
      localStorage.setItem(LEARNED_WORDS_KEY, JSON.stringify(learnedWords));
    } catch (e) {
      console.error("Could not save learned words to localStorage:", e);
      // Handle potential storage quota errors?
    }
}

/**
 * Adds a word to the learned words dictionary and persists it.
 * Ensures words are lowercase and meet basic length criteria.
 * @param {string} word - The word to learn (case-insensitive).
 */
export function learnWord(word) {
    if (!word || typeof word !== 'string' || word.length < 4 || word.length > 8) {
        console.warn(`Attempted to learn invalid word: "${word}"`);
        return; // Basic validation
    }
    const lowerWord = word.toLowerCase();
    const length = lowerWord.length;

    // Load current dictionary
    const learnedWords = loadLearnedWords();

    // Initialize array for this word length if needed
    if (!learnedWords[length]) {
      learnedWords[length] = [];
    }

    // Add word if not already present
    if (!learnedWords[length].includes(lowerWord)) {
      learnedWords[length].push(lowerWord);
      // Persist the updated dictionary
      saveLearnedWords(learnedWords);
      console.log(`Learned new word: "${lowerWord}"`);
    } else {
        // console.log(`Word "${lowerWord}" already learned.`);
    }
}