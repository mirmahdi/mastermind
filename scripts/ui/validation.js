// scripts/ui/validation.js
// Validation logic, including automatic score fixing.

import { GameState } from '../game-state.js';
// Updated import from game-logic/scorer.js
import { calculateScores } from '../game-logic/scorer.js';
// Updated import from utils/word-generator.js
import { isValidGuess } from '../utils/word-generator.js';
// Updated import from game-logic/computer-player.js
import { ComputerPlayer } from '../game-logic/computer-player.js';
// Updated import from ui/global.js
import { lockGameUI, hideProcessingIndicator } from './global.js';
import { recordWin } from '../start-game.js';
import { closeActiveModal } from '../modal-manager.js';
import { refreshGuessHistory, highlightScoreErrors } from './history.js';


/**
 * Fix all scoring errors automatically based on the provided word.
 * Called directly from modal-manager when validation finds errors and user confirms fix.
 * Updates GameState history, re-initializes computer state, refreshes UI,
 * closes the validation modal, and returns the computer's next guess.
 * @param {string} chosenWord - The actual chosen word provided by the user.
 * @param {Array} errors - List of detected errors [{ guessNumber, guess, reported, actual }]
 * @returns {Promise<string|null|undefined>} Resolves with:
 *   - next guess string: If fix successful and game continues.
 *   - null: If fix leads to win or computer gets stuck after fix.
 *   - undefined: If fixing process fails critically.
 */
export async function fixAllScoringErrors(chosenWord, errors) {
    console.log(`[ui/validation.js] Auto-fixing ${errors.length} errors based on word: ${chosenWord}`);
    if (!chosenWord || !errors || !Array.isArray(errors) || errors.length === 0) {
         console.warn("[ui/validation.js] fixAllScoringErrors called with invalid arguments.");
         closeActiveModal(); // Close modal even if args invalid
         return undefined; // Indicate failure
    }

    // REMOVED Confirmation prompt - Fixing is now automatic when this function is called

    try {
        // Find the index of the first error (0-based)
        const firstErrorIndex = errors.reduce((minIndex, error) => {
            // Ensure guessNumber is valid before using it
            const index = (error.guessNumber ?? GameState.guessHistory.length + 1) - 1;
            return Math.min(minIndex, index);
        }, GameState.guessHistory.length); // Start with index beyond history

        if (firstErrorIndex >= GameState.guessHistory.length) {
             console.warn("[ui/validation.js] Could not determine valid first error index.");
             // This might happen if error objects are malformed
             throw new Error("Could not identify the first scoring error to fix.");
        }

        // Keep guesses & state before the error
        const historyBeforeError = GameState.guessHistory.slice(0, firstErrorIndex);
        const stateBeforeError = firstErrorIndex > 0 ? historyBeforeError[firstErrorIndex - 1]?.computerState : null;

        // Initialize corrected history with the valid part
        let correctedHistory = [...historyBeforeError];

        // Re-initialize computer player to state before error
        if (!GameState.computer) { throw new Error("Computer player instance is missing during score fixing!"); }
        const initialWords = GameState.computer.getAllWords();
        const dictionaryData = GameState.computer.dictionaryData;
        // Create a new instance to ensure clean state
        GameState.computer = new ComputerPlayer(initialWords, dictionaryData);

        // Restore state or replay history up to the error point
        if (stateBeforeError) {
            GameState.computer.setState(stateBeforeError);
        } else if (firstErrorIndex > 0) { // Only replay if there's history before error
             console.log("[ui/validation.js] No state saved, replaying historyBeforeError...");
             for(let i=0; i < firstErrorIndex; i++) {
                const entry=historyBeforeError[i]; if(!entry) continue;
                // Use internal sync update (ensure it exists on ComputerPlayer)
                 if (typeof GameState.computer.updatePossibleWordsInternal === 'function') {
                    GameState.computer.updatePossibleWordsInternal(entry.word, entry.scores.a, entry.scores.b);
                    // Save replayed state back into the valid history part
                    if(correctedHistory[i]) correctedHistory[i].computerState = GameState.computer.getState();
                } else {
                     console.error("updatePossibleWordsInternal missing! Cannot accurately replay for fix.");
                     // Proceeding may lead to incorrect state
                }
             }
        }

        // Re-process guesses from the error onwards with correct scores
        let correctionLedToWin = false;
        for (let i = firstErrorIndex; i < GameState.guessHistory.length; i++) {
            const originalGuessEntry = GameState.guessHistory[i];
            if (!originalGuessEntry || !originalGuessEntry.word) {
                console.warn(`[ui/validation.js] Skipping invalid original history entry at index ${i}`);
                continue; // Skip potentially corrupted entries
            }
            const guessWord = originalGuessEntry.word;
            const correctScores = calculateScores(chosenWord, guessWord); // Calculate correct score

            // Create new entry with corrected scores
            const correctedEntry = { word: guessWord, scores: correctScores, computerState: null };
            correctedHistory.push(correctedEntry); // Add corrected entry to our new history list

            // Update computer player with CORRECTED score using internal sync method
            if (typeof GameState.computer.updatePossibleWordsInternal === 'function') {
                GameState.computer.updatePossibleWordsInternal(guessWord, correctScores.a, correctScores.b);
                correctedEntry.computerState = GameState.computer.getState(); // Store new state
            } else {
                 console.error("updatePossibleWordsInternal missing! Cannot update computer state during fix.");
                 // Computer state will be inaccurate
            }

             // Check if this correction leads to an immediate win
             if (correctScores.b === GameState.wordLength) {
                 console.log(`[ui/validation.js] Correction @ index ${i} resulted in a win!`);
                 correctionLedToWin = true;
                 // Stop processing further guesses, the game is won
                 break;
             }
        }

        // Update the main game state history with the fully corrected list
        GameState.guessHistory = correctedHistory;

        // --- Refresh UI and Notify User ---
        refreshGuessHistory(); // Update history display to show corrected scores
        highlightScoreErrors([]); // Clear any red error highlights (optional, could leave corrected)
        alert(`Scores automatically corrected based on the word "${chosenWord.toUpperCase()}".`); // Notify user

        closeActiveModal(); // Close the validation modal BEFORE proceeding

        // --- Handle Game Outcome ---
        if (correctionLedToWin) {
             // The corrected history now reflects the win
             // recordWin() might have already been called if refresh updated gameActive? Double check.
             if (GameState.gameActive) recordWin(); // Ensure win is recorded
             lockGameUI(); // Lock UI for win
             return null; // Signal win state
        } else {
            // Get the NEXT guess based on the fully corrected state
            console.log("[ui/validation.js] Requesting next computer guess after corrections...");
            if (!GameState.computer) {
                 // Should not happen if initialization worked
                 throw new Error("Computer instance lost after score correction.");
            }
            const nextGuess = GameState.computer.getNextGuess();

            if (nextGuess === null) {
                 // Computer got stuck even after correction
                 console.warn("[ui/validation.js] Computer stuck even after score correction.");
                 alert("Scores corrected, but the computer still cannot determine the next valid guess. The game may be locked due to inconsistency.");
                 lockGameUI(); // Lock the game as computer cannot proceed
                 return null; // Signal stuck state
            }
            // Return the next guess string for the caller (modal-manager) to handle display
            return nextGuess;
        }

    } catch (error) {
        console.error("[ui/validation.js] Error during fixAllScoringErrors:", error);
        alert("An error occurred while trying to fix scores: " + error.message);
        hideProcessingIndicator(); // Ensure indicator hidden on error
        closeActiveModal(); // Ensure modal closes on error
        lockGameUI(); // Lock game on critical error
        return undefined; // Indicate failure
    }
}

/**
 * Validates all scores currently in the game history against a proposed chosen word.
 * Returns an array of errors found.
 * @param {string} chosenWord - The word to validate against.
 * @param {Array} guessHistory - The GameState.guessHistory array.
 * @returns {Array} Array of error objects [{ guessNumber, guess, reported, actual }]
 */
export function validateAllScores(chosenWord, guessHistory) {
    const errors = [];
    if (!guessHistory || !Array.isArray(guessHistory)) return errors; // Handle invalid history

    guessHistory.forEach((guessEntry, index) => {
        // Basic validation of the history entry itself
        if (!guessEntry || !guessEntry.word || typeof guessEntry.scores?.a !== 'number' || typeof guessEntry.scores?.b !== 'number') {
            console.warn(`[ui/validation.js] Skipping invalid history entry at index ${index}:`, guessEntry);
            return; // Skip malformed entries
        }

        try {
            const actualScores = calculateScores(chosenWord, guessEntry.word);
            if (actualScores.a !== guessEntry.scores.a || actualScores.b !== guessEntry.scores.b) {
                errors.push({
                    guessNumber: index + 1, // 1-based for display
                    guess: guessEntry.word.toUpperCase(),
                    reported: { a: guessEntry.scores.a, b: guessEntry.scores.b },
                    actual: actualScores
                });
            }
        } catch (calcError) {
            // This might happen if chosenWord and guessEntry.word have different lengths
            console.error(`[ui/validation.js] Error calculating score for word "${guessEntry.word}" against "${chosenWord}" at index ${index}:`, calcError);
            // Optionally add a different type of error object?
             errors.push({
                 guessNumber: index + 1,
                 guess: guessEntry.word.toUpperCase(),
                 reported: { a: guessEntry.scores.a, b: guessEntry.scores.b },
                 actual: {a: '?', b: '?'}, // Indicate calculation error
                 error: calcError.message
             });
        }
    });
    return errors;
}