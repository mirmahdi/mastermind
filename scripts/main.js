// scripts/main.js - Entry Point

import { GameState } from './game-state.js';
// Import specific UI functions needed here
import { setupUIForMode } from './ui/setup-screen.js'; // Import from setup-screen
import { updateStatsDisplay } from './ui/global.js';   // Import from global
// Corrected import for loadStats from the new storage utility file
import { loadStats } from './utils/storage.js'; // CORRECTED PATH HERE

document.addEventListener('DOMContentLoaded', () => {
  // Load stats on initial load
  GameState.stats = loadStats(); // This now uses the correct import
  updateStatsDisplay(); // Display initial stats

  const modeSelect = document.getElementById('mode-select');
  const gamePanel = document.getElementById('game-panel');
  const setupPanel = document.getElementById('game-setup');

  // Ensure elements exist
  if (!modeSelect || !gamePanel || !setupPanel) {
      console.error("Main initialization failed: Critical elements (mode-select, game-panel, game-setup) not found.");
      document.body.innerHTML = '<p style="color: red; text-align: center; margin-top: 50px;">Error initializing application. UI elements missing.</p>';
      return;
  }

  // Event listener for mode selection change
  modeSelect.addEventListener('change', (e) => {
    const selectedMode = e.target.value;

    if (!selectedMode) {
      // If "-- Select a mode --" is chosen, show setup, hide game panel
      gamePanel.style.display = 'none';
      setupPanel.style.display = 'block';
      setupUIForMode(null); // Clear options
      return;
    }

    // Set the game mode in state
    GameState.mode = selectedMode;
    // Update the UI based on the selected mode
    setupUIForMode(selectedMode);
  });

});