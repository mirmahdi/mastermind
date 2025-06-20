/**
 * Project: Mastermind for Words
 * File: scripts/game-logic/history-manager.js
 * Description: Manages adding to and updating the game state guess history.
 */
import { GameState } from '../game-state.js';
import { ComputerPlayer } from './computer-player.js';
import { refreshGuessHistory } from '../ui/history.js';
import { setupGameplayUI } from '../ui/gameplay/gameplay-main.js';
import { displayComputerGuess } from '../ui/components/letter-grid.js';
import { showScoreValidationDialog } from '../modal-manager.js';
import { recordWin } from '../start-game.js';
import { lockGameUI, showProcessingIndicator, hideProcessingIndicator } from '../ui/global.js';

/**
 * Adds a guess and its associated metadata (scores, times) to the game state.
 * @param {string} guess - The guessed word.
 * @param {number} scoreA - Total correct letters.
 * @param {number} scoreB - Correct positions.
 * @param {number} userTime - Time the user took for this score (in ms).
 */
export function addGuessToHistory(guess, scoreA, scoreB, userTime) {
    // Duplicate check
    const lastGuess = GameState.guessHistory[GameState.guessHistory.length - 1];
    if (lastGuess && lastGuess.word === guess && lastGuess.scores.a === scoreA && lastGuess.scores.b === scoreB) {
        return;
    }

    // Add to the game state array, now including the new userTime property
    GameState.guessHistory.push({
        word: guess,
        scores: { a: scoreA, b: scoreB },
        userTime: userTime, // NEW: Store user time
        computerState: null
    });

    // Refresh the visual display
    refreshGuessHistory();
}

export function confirmScoreUpdate(editInfo, newA, newB) {
    // This function's content remains unchanged from your working version.
    const idx = editInfo.index;
    const word = editInfo.word;

    if (!confirm(`Update score for ${word.toUpperCase()} from ${editInfo.scoreA}+${editInfo.scoreB} to ${newA}+${newB}? This will discard all subsequent guesses.`)) {
        return false;
    }
    showProcessingIndicator("Updating scores & recalculating...");
    setTimeout(() => {
        let nextGuess = null;
        try {
            updateScoreInternal(idx, word, newA, newB);
            GameState.editingGuess = null;
            setupGameplayUI();
            const editedEntry = GameState.guessHistory[idx];
            if (editedEntry && editedEntry.scores.b === GameState.wordLength) {
                alert("Computer found the word: " + editedEntry.word.toUpperCase());
                recordWin();
                lockGameUI();
                return;
            }
            nextGuess = GameState.computer.getNextGuess();
            if (nextGuess) {
                displayComputerGuess(nextGuess);
            } else {
                hideProcessingIndicator();
                showScoreValidationDialog();
            }
        } catch (err) {
            // Error handling
        }
    }, 50);
    return true;
}

function updateScoreInternal(guessIndex, guessWord, newScoreA, newScoreB) {
    if (guessIndex < 0 || guessIndex >= GameState.guessHistory.length) {
        throw new Error(`[history-manager.js] updateScoreInternal: Invalid guessIndex ${guessIndex}. History length: ${GameState.guessHistory.length}`);
    }

    const historyBeforeEdit = GameState.guessHistory.slice(0, guessIndex);
    const stateToRestore = guessIndex > 0 ? GameState.guessHistory[guessIndex - 1]?.computerState : null;
    const correctedEntry = { word: guessWord, scores: { a: newScoreA, b: newScoreB }, computerState: null };
    const newHistory = [...historyBeforeEdit, correctedEntry];
    GameState.guessHistory = newHistory;

    if (!GameState.computer) {
         console.warn("[history-manager.js] updateScoreInternal: Computer missing, cannot update state.");
         GameState.currentComputerGuess = null;
         return;
    }

    // Create new ComputerPlayer instance for a clean rollback
    GameState.computer = new ComputerPlayer(GameState.wordLength, GameState.computer.dictionaryData);

    // Replay history up to the point of the edit to rebuild the computer's knowledge state
    if (guessIndex > 0) {
       console.log(`[history-manager.js] Replaying ${guessIndex} guess(es) for state rollback...`);
       for(let i=0; i < guessIndex; i++) {
           const entry = historyBeforeEdit[i];
           if (!entry || !entry.word || typeof entry.scores?.a !== 'number' || typeof entry.scores?.b !== 'number') {
                console.warn(`Skipping invalid history entry during replay at index ${i}:`, entry);
                continue;
           }
           if (typeof GameState.computer.processNewScore === 'function') {
               GameState.computer.processNewScore(entry.word, entry.scores.a, entry.scores.b);
               if(GameState.guessHistory[i]) GameState.guessHistory[i].computerState = GameState.computer.getState();
           } else {
               console.error("processNewScore missing! Cannot accurately replay history for rollback.");
           }
       }
    }

    // Apply the *corrected* score to the new state
    if (typeof GameState.computer.processNewScore === 'function') {
        GameState.computer.processNewScore(guessWord, newScoreA, newScoreB);
        const newState = GameState.computer.getState();
        if (GameState.guessHistory[guessIndex]) {
            GameState.guessHistory[guessIndex].computerState = newState;
        } else {
            console.error(`[history-manager.js] Cannot store state: History entry @${guessIndex} missing after update!`);
        }
    } else {
         console.error("processNewScore missing! Cannot apply corrected score synchronously.");
    }

    GameState.currentComputerGuess = null;
}