// scripts/ui/components/letter-grid.js
// Handles rendering the letter grid and displaying computer guesses

import { GameState } from '../../game-state.js';
import { hideProcessingIndicator } from '../global.js'; // Corrected path

/**
 * Generates HTML string for a grid of styled letter squares.
 * @param {string | null} word - The word to display, or null for placeholders.
 * @param {boolean} [isStatic=false] - If true, renders letters directly for edit mode.
 * @returns {string} HTML string for the letter grid.
 */
export function createLetterGridHTML(word, isStatic = false) {
    // If no word provided, render placeholder squares
    if (!word) {
        const len = GameState.wordLength || 5;
        const placeholderSquares = Array(len).fill('<div class="letter-square empty"></div>').join('');
        return `<div class="letter-grid">${placeholderSquares}</div>`;
    }

    // Ensure word is treated as a string
    const wordStr = String(word);
    const letters = [...wordStr.toUpperCase()];

    if (isStatic) {
        // --- Static version ---
        // Map each letter to its own static square div.
        // The letter itself becomes the direct text content of the div.
        return `
            <div class="letter-grid">
                ${letters.map(letter => `
                    <div class="letter-square static">
                        ${letter ? letter : ' '}
                    </div>
                `).join('')}
            </div>`;
    } else {
        // Animated version for guess display: Front and Back faces
        return `
            <div class="letter-grid">
                ${letters.map(letter => `
                    <div class="letter-square">
                        <div class="letter-square-inner">
                            <div class="letter-square-front">?</div>
                            <div class="letter-square-back">${letter ? letter : ' '}</div>
                        </div>
                    </div>
                `).join('')}
            </div>`;
    }
}


/**
 * Displays the computer's next guess and STARTS the user timer.
 * @param {string} guess - The computer's guess word.
 */

export function displayComputerGuess(guess) {
    // Guard clause
    if (!guess) {
        console.error("[letter-grid.js] displayComputerGuess called with no guess.");
        const displayContainer = document.getElementById('comp-guess-display');
        if (displayContainer) displayContainer.innerHTML = createLetterGridHTML(null);
        return;
    };

    // Variable declarations
    const displayContainer = document.getElementById('comp-guess-display');
    const guessHeader = document.getElementById('guess-column-header');
    const scoreAInput = document.getElementById('score-a');
    const scoreBInput = document.getElementById('score-b');
    const submitBtn = document.getElementById('submit-score-btn');
    const cumulativeUserTimeEl = document.getElementById('cumulative-user-time');

    const liveAssessmentDisplay = document.getElementById('live-assessment-display');
    const assessingWordPlaceholder = document.getElementById('assessing-word-placeholder');
    const assessedCountPlaceholder = document.getElementById('assessed-count-placeholder');

    // Initial state for assessment display
    if (liveAssessmentDisplay) liveAssessmentDisplay.style.display = 'flex'; // Keep visible
    if (assessingWordPlaceholder && guess) assessingWordPlaceholder.textContent = guess.toUpperCase(); // Show the new guess
    // No need to reset count here, it should reflect the count from the last search that found this word
    // if (assessedCountPlaceholder) assessedCountPlaceholder.textContent = '0'; // REMOVE THIS LINE IF PRESENT

    if (!displayContainer) {
        console.error("[letter-grid.js] comp-guess-display element missing.");
        return;
    }

    GameState.currentComputerGuess = guess;

    if (guessHeader) {
         const guessNumber = GameState.guessHistory.length + 1;
         guessHeader.textContent = `Computer's Guess #${guessNumber}`;
    }

    displayContainer.innerHTML = createLetterGridHTML(guess, false);

    const squares = displayContainer.querySelectorAll('.letter-square');
    squares.forEach((square, index) => {
        setTimeout(() => {
            square.classList.add('flip');
        }, 10 + (150 * index));
    });

    if (scoreAInput) scoreAInput.value = '';
    if (scoreBInput) { 
			scoreBInput.value = ''; 
			scoreBInput.disabled = false; 
		}

    const animationDuration = 600;
    const staggerDelay = 150;
    const totalAnimationTime = animationDuration + (staggerDelay * (squares.length - 1));
    const focusDelay = totalAnimationTime + 100;

    setTimeout(() => {
        scoreAInput?.focus();
        hideProcessingIndicator();
        if (submitBtn && GameState.gameActive) {
            // Your original logic for the submit button is preserved
            submitBtn.disabled = false;
        }

        // --- START LIVE USER TIMER ---
        GameState.userActionStartTime = Date.now();
        // Clear any previous timer to be safe
        if (GameState.liveUserTimerId) clearInterval(GameState.liveUserTimerId);
        
				// Inside the setInterval callback in displayComputerGuess function
				GameState.liveUserTimerId = setInterval(() => {
						if (GameState.gameActive && GameState.userActionStartTime > 0) {
								const elapsed = Date.now() - GameState.userActionStartTime;
								// Restore totalTime calculation here, within the correct scope
								const totalTime = GameState.cumulativeUserTime + elapsed; // <-- RESTORE THIS LINE

								const cumulativeUserTimeEl = document.getElementById('cumulative-user-time');
								if (cumulativeUserTimeEl) {
										const h = Math.floor(totalTime / 3600000);
										const m = Math.floor((totalTime % 3600000) / 60000);
										const s = Math.floor((totalTime % 60000) / 1000);

										let parts = [];

										if (h > 0) {
												parts.push(String(h));
												parts.push(String(m).padStart(2, '0'));
										} else if (m > 0) {
												parts.push(String(m));
										}

										// Handle seconds based on what's already in parts
										// If parts is empty (meaning h=0 and m=0), then seconds is the primary unit.
										if (parts.length === 0) {
												// Only seconds should be shown. If seconds is 0, show "0", otherwise just the number.
												parts.push(String(s));
										} else {
												// If hours or minutes are visible, seconds should be padded.
												parts.push(String(s).padStart(2, '0'));
										}

										cumulativeUserTimeEl.textContent = parts.join(':');
								}
						}
				}, 1000);
    }, focusDelay);
}