/**
 * Project: Mastermind for Words
 * File: scripts/ui/history.js
 * Description: Handles displaying the guess history and its metadata.
 */
import { GameState } from '../game-state.js';
import { setupGameplayUI } from './gameplay/gameplay-main.js';

export function refreshGuessHistory() {
    const historyContainer = document.getElementById('guess-history');
    if (!historyContainer) return;
    historyContainer.innerHTML = '';

    if (GameState.guessHistory.length === 0) {
        historyContainer.innerHTML = '<p class="history-empty-message">No guesses made yet.</p>';
        return;
    }

    GameState.guessHistory.forEach((guessEntry, index) => {
        const entry = document.createElement('div');
        entry.className = 'history-entry';
        if (guessEntry.scores.b === GameState.wordLength) {
            entry.classList.add('perfect-match');
        }
        entry.dataset.guessIndex = index;

        // Dynamically display the user's scoring time for this turn.
				const userTimeSeconds = guessEntry.userTime ? Math.round(guessEntry.userTime / 1000) : 0;

        entry.innerHTML = `
          <div class="time-stats" title="User Time">
						<span class="time-user"><span class="time-digit">${userTimeSeconds}</span>s</span>
          </div>
          <div class="guess-counter">${index + 1}.</div>
          <div class="guess" title="${guessEntry.word.toUpperCase()}">${guessEntry.word.toUpperCase()}</div>
          <div class="scores" data-scores="${guessEntry.scores.a} + ${guessEntry.scores.b}">
             <span class="original-scores">${guessEntry.scores.a} + ${guessEntry.scores.b}</span>
          </div>
          <div class="edit-score" title="Fix score">
            <span class="edit-icon">✎</span>
          </div>
        `;
        
        const editButton = entry.querySelector('.edit-score');
        if (editButton && GameState.mode === 'modeB') {
            editButton.style.display = 'flex';
            editButton.addEventListener('click', () => {
                GameState.editingGuess = {
                    index,
                    word: guessEntry.word,
                    scoreA: guessEntry.scores.a,
                    scoreB: guessEntry.scores.b
                };
                setupGameplayUI();
            });
        }
        historyContainer.appendChild(entry);
    });

    historyContainer.scrollTop = historyContainer.scrollHeight;
}

export function highlightScoreErrors(errors) {
    const historyEntries = document.querySelectorAll('#guess-history .history-entry');
    historyEntries.forEach(entry => {
        const scoresElement = entry.querySelector('.scores');
        if (scoresElement) {
            scoresElement.classList.remove('error');
            scoresElement.querySelector('.corrected-score')?.remove(); // Ensure removed from prior runs
            // Restore original-scores visibility and remove custom styling if it was applied
            const originalSpan = scoresElement.querySelector('.original-scores');
            if (originalSpan) {
                originalSpan.style.display = ''; // Ensure it's visible
                originalSpan.classList.remove('incorrect-score-styling'); // Remove custom styling
            }
        }
        const editButton = entry.querySelector('.edit-score');
        if (editButton) editButton.classList.remove('suggested-edit'); // Remove pulse animation
    });

    if (!errors || errors.length === 0) return;

    errors.forEach(error => {
        const entryIndex = error.guessNumber - 1;
        if (entryIndex < 0 || entryIndex >= historyEntries.length) return;

        const entry = historyEntries[entryIndex];
        const scoresElement = entry.querySelector('.scores');
        if (!scoresElement) return;

        scoresElement.classList.add('error'); // Add 'error' class for overall styling

        // Remove any existing corrected spans to prevent duplicates on re-highlight
        scoresElement.querySelector('.corrected-score')?.remove();

        const originalSpan = scoresElement.querySelector('.original-scores');
        if (originalSpan) {
            originalSpan.style.display = ''; // Ensure original score is visible
            originalSpan.classList.add('incorrect-score-styling'); // Add class for red strike-through, bold
        }

        const correctedSpan = document.createElement('span');
        correctedSpan.className = 'corrected-score'; // This will be green and bold
        correctedSpan.textContent = `${error.actual.a} + ${error.actual.b}`;
				// Insert correctedSpan BEFORE originalSpan
				if (originalSpan) {
						scoresElement.insertBefore(correctedSpan, originalSpan); // Insert corrected before original
				} else {
						scoresElement.prepend(correctedSpan); // Fallback if originalSpan is not found
				}

        const editButton = entry.querySelector('.edit-score');
        if (editButton && window.getComputedStyle(editButton).display !== 'none') {
            editButton.classList.add('suggested-edit'); // Add pulse animation
            editButton.title = `Fix score (Correct is ${error.actual.a}+${error.actual.b})`;
        }
    });
}

export function clearHistory() {
    const historyContainer = document.getElementById('guess-history');
    if (historyContainer) {
        historyContainer.innerHTML = '<p class="history-empty-message">No guesses made yet.</p>';
    }
}