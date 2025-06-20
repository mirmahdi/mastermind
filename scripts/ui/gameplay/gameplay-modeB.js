/**
 * Project: Mastermind for Words
 * File: scripts/ui/gameplay/gameplay-modeB.js
 * Description: Handles UI Setup and Event Handling for Mode B.
 */
import { GameState } from '../../game-state.js';
import { recordWin } from '../../start-game.js';
import { validateScores } from '../../game-logic/scorer.js';
import { refreshGuessHistory } from '../history.js';
import { showScoreValidationDialog } from '../../modal-manager.js';
import { lockGameUI, showProcessingIndicator, hideProcessingIndicator } from '../global.js';
import { addGuessToHistory } from '../../game-logic/history-manager.js';
import { displayComputerGuess, createLetterGridHTML } from '../components/letter-grid.js';
import { handleScoreAInput, handleScoreBInput } from '../components/score-input.js';

export function setupModeBNormalUI(container) {
    const guessNumber = GameState.guessHistory.length + 1;
    const initialGrid = createLetterGridHTML(null);

    // This template now has the CORRECT two-column structure.
    container.innerHTML = `
        <div class="game-container">
          <div class="column">
            <div id="guess-column-header" class="column-header">Computer's Guess #${guessNumber}</div>
            <div class="guess-section">
              <div class="computer-guess">
                <div id="comp-guess-display">${initialGrid}</div>
              </div>
              
              <div class="session-stats-panel">
                  <div title="Total CPU time spent searching">
                      <span>🖥️</span>
                      <strong id="cumulative-cpu-time">0ms</strong>
                  </div>
              </div>
              <div id="live-assessment-display" class="assessment-panel">
                  <span>Assessing: <strong id="assessing-word-placeholder">---</strong></span>
                  <span>Checked: <strong id="assessed-count-placeholder">0</strong> words</span>
              </div>

              <div id="processing-indicator" class="processing-indicator"></div>

			  <div class="score-submission-area">
				  <div class="score-inputs">
					   <div class="input-group">
						 <label for="score-a" title="Total correct letters">A</label>
						 <input type="number" id="score-a" min="0" max="${GameState.wordLength}" value="" inputmode="numeric" pattern="[0-9]*">
					   </div>
					   <div class="input-group">
						 <label for="score-b" title="Correct position">B</label>
						 <input type="number" id="score-b" min="0" max="${GameState.wordLength}" value="" inputmode="numeric" pattern="[0-9]*">
					   </div>
				  </div>
				  <button id="submit-score-btn" class="primary-btn small-btn" disabled>Submit</button>
			  </div>
            </div>
          </div>
          <div class="column">
            <div id="history-column-header" class="column-header">Guess History</div>
            <div class="history-section">
              <div class="history-header">
								<div id="cumulative-user-time" class="time-header">👤 </div>
                <div>#</div>
                <div>Guess</div>
                <div>Score</div>
                <div></div>
              </div>
              <div id="guess-history"></div>
            </div>
          </div>
          </div>`;

    attachModeBEventHandlers();
    refreshGuessHistory();
    const liveAssessmentDisplay = document.getElementById('live-assessment-display');
    const assessingWordPlaceholder = document.getElementById('assessing-word-placeholder');
    const assessedCountPlaceholder = document.getElementById('assessed-count-placeholder');

    // Set onProgressUpdate callback here, for continuous listening
    // This ensures the UI updates are connected to the ComputerPlayer's progress.
    if (GameState.computer) {
        const liveAssessmentDisplay = document.getElementById('live-assessment-display');
        const assessingWordPlaceholder = document.getElementById('assessing-word-placeholder');
        const assessedCountPlaceholder = document.getElementById('assessed-count-placeholder');

        GameState.computer.onProgressUpdate = ({ currentWord, checkedCount, isSearching }) => {
            if (liveAssessmentDisplay) {
                // Always keep the assessment display visible once the game is in progress
                liveAssessmentDisplay.style.display = 'flex';

                if (isSearching) {
                    // During active search, show the word being assessed
                    if (assessingWordPlaceholder) assessingWordPlaceholder.textContent = currentWord.toUpperCase();
                    if (assessedCountPlaceholder) assessedCountPlaceholder.textContent = checkedCount.toLocaleString();
                } else {
                    // When search is finished (isSearching is false),
                    // display the word that the computer *just guessed* (from GameState.currentComputerGuess)
                    // This state occurs when the user is prompted for scores.
                    if (assessingWordPlaceholder) assessingWordPlaceholder.textContent = GameState.currentComputerGuess ? GameState.currentComputerGuess.toUpperCase() : '---';
                    if (assessedCountPlaceholder) assessedCountPlaceholder.textContent = checkedCount.toLocaleString();
                }
            }
        };
    }
		
    // Initial display state for assessment panel (hide unless actively searching or displaying a guess)
    if (liveAssessmentDisplay) liveAssessmentDisplay.style.display = 'none'; // Hide initially unless immediately shown below
    if (assessingWordPlaceholder) assessingWordPlaceholder.textContent = GameState.currentComputerGuess ? GameState.currentComputerGuess.toUpperCase() : '---'; // Show current guess or initial state
    if (assessedCountPlaceholder) assessedCountPlaceholder.textContent = '0';

    if (GameState.currentComputerGuess) {
        displayComputerGuess(GameState.currentComputerGuess);
    } else {
        // Show the assessment panel only if computer is *about* to start searching
        if (liveAssessmentDisplay) liveAssessmentDisplay.style.display = 'flex';
        triggerFirstComputerGuess();
    }
}

function attachModeBEventHandlers() {
    const scoreAInput = document.getElementById('score-a');
    const scoreBInput = document.getElementById('score-b');
    const submitBtn = document.getElementById('submit-score-btn');

    if (!scoreAInput || !scoreBInput || !submitBtn) return;

    scoreAInput.addEventListener('input', handleScoreAInput);
    scoreBInput.addEventListener('input', handleScoreBInput);

    scoreAInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); scoreBInput.focus(); }
    });
    scoreBInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); submitBtn.click(); }
    });

    submitBtn.addEventListener('click', handleModeBSubmit);
}

/**
 * Handles score submission with full timer and counter logic.
 */
// Replace the existing handleModeBSubmit function in your gameplay-modeB.js file

function handleModeBSubmit() {
    // Stop the live timer and calculate final User Time for this turn
    if (GameState.liveUserTimerId) clearInterval(GameState.liveUserTimerId);
    GameState.liveUserTimerId = null;
    const userTime = GameState.userActionStartTime > 0 ? (Date.now() - GameState.userActionStartTime) : 0;
    GameState.cumulativeUserTime += userTime;
    GameState.userActionStartTime = 0;

    const scoreAInput = document.getElementById('score-a');
    const scoreBInput = document.getElementById('score-b');
    const a = parseInt(scoreAInput.value);
    const b = parseInt(scoreBInput.value);
    const guess = GameState.currentComputerGuess;

    if (!guess) { lockGameUI(); return; }
    if (isNaN(a) || isNaN(b) || !validateScores(a, b, GameState.wordLength)) {
        alert(`Invalid scores provided.`);
        scoreAInput?.focus();
        return;
    }

    const liveAssessmentDisplay = document.getElementById('live-assessment-display'); // Get reference here
    const assessingWordPlaceholder = document.getElementById('assessing-word-placeholder');
    const assessedCountPlaceholder = document.getElementById('assessed-count-placeholder');

    // Show processing indicator and progress UI when computer is calculating
    showProcessingIndicator("Computer is thinking...");
    if (liveAssessmentDisplay) liveAssessmentDisplay.style.display = 'flex'; // Ensure progress panel is visible

    //const showIndicator = GameState.computer?.computationalGuessing && GameState.computer.possibleWords.length > 200;
    //if (showIndicator) showProcessingIndicator("Computer is thinking...");

    setTimeout(async () => {
        try {
            const cpuStartTime = performance.now();
            // This logic is from your original file, it is correct.
            await GameState.computer.processNewScore(guess, a, b);

						// Trigger progress update for the *next* search, before calling getNextGuess
						if (GameState.computer && typeof GameState.computer.onProgressUpdate === 'function') {
								GameState.computer.onProgressUpdate({
										currentWord: 'Searching...', // General message while waiting for first candidate
										checkedCount: 0, // Reset count for the new search
										isSearching: true
								});
						}
            const nextGuess = GameState.computer.getNextGuess();

            const cpuTime = Math.round(performance.now() - cpuStartTime);
            GameState.cumulativeCpuTime += cpuTime;
            document.getElementById('cumulative-cpu-time').textContent = `${GameState.cumulativeCpuTime}ms`;

            // Pass the calculated userTime to the history manager
            addGuessToHistory(guess, a, b, userTime);

            if (b === GameState.wordLength) {
                alert("🤖 Computer guessed it!");
                recordWin();
                lockGameUI();
                if (liveAssessmentDisplay) liveAssessmentDisplay.style.display = 'none'; // Hide on win
                return;
            }

            if (nextGuess) {
                displayComputerGuess(nextGuess);
            } else {
                showScoreValidationDialog();
            }
        } catch (error) {
            alert("An unexpected computer error occurred: " + error.message);
            lockGameUI();
        } finally {
						hideProcessingIndicator();
						// Ensure assessment display is updated with the guessed word when computation finishes
						if (liveAssessmentDisplay && GameState.currentComputerGuess) {
								if (assessingWordPlaceholder) assessingWordPlaceholder.textContent = GameState.currentComputerGuess.toUpperCase();
								// Assessed count remains from the last progress report
						}
        }
    }, 50);
}

function triggerFirstComputerGuess() {
    if (!GameState.computer) {
         alert("Game Error: Computer player failed to load properly.");
         lockGameUI();
         return;
    }
    try {
        const firstGuess = GameState.computer.getNextGuess();
        if (firstGuess) {
            displayComputerGuess(firstGuess);
        } else {
             alert("Error starting game: Computer could not make an initial guess.");
             lockGameUI();
        }
    } catch (err) {
         alert("Error getting first computer guess: " + err.message);
         lockGameUI();
    }
}