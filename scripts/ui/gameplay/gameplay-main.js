// scripts/ui/gameplay/gameplay-main.js
// Main router for setting up the gameplay UI based on mode and edit state.

import { GameState } from '../../game-state.js';
import { setupModeBNormalUI } from './gameplay-modeB.js';
import { setupModeBEditUI } from './gameplay-modeB-edit.js';
import { setupModeACUI } from './gameplay-modeAC.js';
// Updated import path
import { attachGameControlListeners, hideProcessingIndicator } from '../global.js';

/**
 * Main function to set up the gameplay UI based on mode and edit state.
 * Acts as a router, calling the appropriate setup function.
 */
export function setupGameplayUI() {
    const inputSection = document.getElementById('input-section');
    if (!inputSection) {
        console.error("setupGameplayUI: Critical 'input-section' element missing!");
        // Optionally display an error message to the user
        document.body.innerHTML = '<p style="color: red; text-align: center; margin-top: 50px;">Critical UI Error. Please refresh the page.</p>';
        return;
    }
    inputSection.innerHTML = ''; // Clear previous UI
    hideProcessingIndicator(); // Ensure indicator hidden initially

    // Delegate UI setup based on current game mode and editing state
    try {
        if (GameState.mode === 'modeB') {
            if (GameState.editingGuess) {
                setupModeBEditUI(inputSection); // Setup UI for editing a past score
            } else {
                setupModeBNormalUI(inputSection); // Setup UI for normal computer guessing
            }
        } else if (GameState.mode === 'modeA' || GameState.mode === 'modeC') {
            setupModeACUI(inputSection); // Setup UI for player guessing modes
        } else {
            // Handle unknown mode gracefully
            console.error("setupGameplayUI: Unknown game mode:", GameState.mode);
            inputSection.innerHTML = '<p style="color: red;">Error: Unknown game mode selected. Please start a new game.</p>';
            // Lock game controls, allow New Game
            document.getElementById('concede-btn')?.setAttribute('disabled', 'true');
            document.getElementById('new-game-btn')?.removeAttribute('disabled');

        }
    } catch (error) {
        console.error("Error during gameplay UI setup:", error);
        inputSection.innerHTML = `<p style="color: red;">Error setting up game interface: ${error.message}. Please try starting a new game.</p>`;
         // Lock game controls, allow New Game
         document.getElementById('concede-btn')?.setAttribute('disabled', 'true');
         document.getElementById('new-game-btn')?.removeAttribute('disabled');
    }


    // Attach listeners for common game controls (Concede, New Game)
    // These buttons are outside the inputSection, so listeners need to be attached
    // each time the gameplay UI is potentially rendered/re-rendered.
    attachGameControlListeners();
}