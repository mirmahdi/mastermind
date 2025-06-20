// scripts/ui/components/score-input.js
// Shared handler functions for score A and B inputs.

import { GameState } from '../../game-state.js'; // Needed for wordLength validation

/**
 * Shared handler for input event on Score A input field.
 * Manages Score B disabling/focus and validates range.
 * @param {Event} event - The input event object.
 */
export function handleScoreAInput(event) {
    const scoreAInput = event.target;
    // Find corresponding 'b' input (normal or edit mode)
    const scoreBInput = document.getElementById('score-b') || document.getElementById('edit-score-b');
    // Find submit button (normal or edit mode)
    const submitBtn = document.getElementById('submit-score-btn') || document.getElementById('confirm-update-score-btn');

    if (!scoreBInput || !submitBtn) return; // Exit if critical elements missing

    const valueA = scoreAInput.value; // Read string value from A input
    const valueAInt = parseInt(valueA);
    const currentBInt = parseInt(scoreBInput.value); // Get current 'b' value

    // Basic range check - allow empty string
    if (valueA !== '' && !isNaN(valueAInt) && (valueAInt < 0 || valueAInt > GameState.wordLength)) {
        scoreAInput.value = ''; // Clear invalid input outside 0-wordLength range
        scoreBInput.disabled = false; // Ensure B is enabled if A is cleared
        submitBtn.disabled = true; // Disable submit if A is invalid
        return;
    }

    // Logic based on value '0'
    if (valueA === '0') {
        scoreBInput.value = '0';
        scoreBInput.disabled = true;
        submitBtn.disabled = false; // Allow submit for 0+0
    } else {
        scoreBInput.disabled = false; // Ensure B is enabled if A is not '0'
        // If A was reduced and is now less than current B, clear B
        if (!isNaN(currentBInt) && !isNaN(valueAInt) && valueAInt < currentBInt) {
            scoreBInput.value = '';
        }
        // Enable submit only if both scores seem plausible (B can be empty initially)
        submitBtn.disabled = !(valueA !== '' && !isNaN(valueAInt) &&
                               (scoreBInput.value === '' ||
                               (!isNaN(parseInt(scoreBInput.value)) && parseInt(scoreBInput.value) <= valueAInt && parseInt(scoreBInput.value) >= 0)));

        // Auto-focus 'b' if 'a' is a valid single digit > 0 and B is empty
        if (valueA.length > 0 && !isNaN(valueAInt) && valueAInt > 0 && valueAInt <= GameState.wordLength && scoreBInput.value === '') {
             // Only focus if B is currently empty to avoid disrupting user typing B
            scoreBInput.focus();
        }
    }
}

/**
 * Shared handler for input event on Score B input field.
 * Validates b <= a and range.
 * @param {Event} event - The input event object.
 */
export function handleScoreBInput(event) {
    const scoreBInput = event.target;
    // Find corresponding 'a' input (normal or edit mode)
    const scoreAInput = document.getElementById('score-a') || document.getElementById('edit-score-a');
     // Find submit button (normal or edit mode)
    const submitBtn = document.getElementById('submit-score-btn') || document.getElementById('confirm-update-score-btn');

    if (!scoreAInput || !submitBtn) return; // Exit if critical elements missing

    const valueB = scoreBInput.value;
    const valueBInt = parseInt(valueB);
    // --- FIX: Read valueA inside this function ---
    const valueA = scoreAInput.value;
    const valueAInt = parseInt(valueA);
    // --- End FIX ---

    // Basic range check - allow empty string
    if (valueB !== '' && !isNaN(valueBInt) && (valueBInt < 0 || valueBInt > GameState.wordLength)) {
        scoreBInput.value = ''; // Clear invalid input outside 0-wordLength range
        submitBtn.disabled = true; // Disable submit if B is invalid
        return;
    }

    // Check if B is greater than A (only if A has a valid value)
    // Use valueA variable that was just read
    if (!isNaN(valueAInt) && valueA !== '' && !isNaN(valueBInt) && valueBInt > valueAInt) {
        alert("Score 'b' (correct position) cannot be greater than score 'a' (total correct letters).");
        scoreBInput.value = valueAInt; // Set 'b' to 'a' as fallback
        scoreBInput.focus(); // Keep focus for correction
        // Submit should be enabled after this correction
        submitBtn.disabled = false;
    } else {
        // Enable submit only if both scores seem valid and A is not empty
        // Use valueA variable that was just read
        submitBtn.disabled = !(valueA !== '' && !isNaN(valueAInt) &&
                               valueB !== '' && !isNaN(valueBInt) &&
                               valueBInt <= valueAInt); // Ensure B <= A check included here
    }
}