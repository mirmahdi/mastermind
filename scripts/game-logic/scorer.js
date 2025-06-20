// scripts/game-logic/scorer.js
// Functions for calculating and validating Mastermind scores

/**
 * Calculate scores ('a' = correct letters, 'b' = correct positions)
 * for a guess against a target word.
 * Assumes target and guess are valid strings of the same length.
 * @param {string} target - The target word (lowercase).
 * @param {string} guess - The guessed word (lowercase).
 * @returns {{a: number, b: number}} Object with 'a' and 'b' scores.
 * @throws {Error} If target or guess are invalid or lengths differ.
 */
export function calculateScores(target, guess) {
  // Input validation
  if (typeof target !== 'string' || typeof guess !== 'string' || !target || !guess) {
    // Log detailed error for debugging
    console.error(`calculateScores Error: Invalid input types. Target: ${typeof target}, Guess: ${typeof guess}`);
    throw new Error("Target and guess must be non-empty strings.");
  }
  if (target.length !== guess.length) {
     console.error(`calculateScores Error: Length mismatch. Target (${target.length}): "${target}", Guess (${guess.length}): "${guess}"`);
    throw new Error(`Target and guess must be the same length.`);
  }
  if (target.length === 0) {
      return { a: 0, b: 0 }; // Score for empty strings is 0,0
  }

  const targetChars = [...target]; // Array copy for modification
  const guessChars = [...guess];   // Array copy
  let correctPosition = 0; // Score 'b'
  let correctLetter = 0;   // Score 'a' (excluding correct position initially)

  // First pass: Count exact matches (score 'b') and nullify used letters
  for (let i = 0; i < guessChars.length; i++) {
    if (guessChars[i] === targetChars[i]) {
      correctPosition++;
      targetChars[i] = null; // Mark target letter as used
      guessChars[i] = null;  // Mark guess letter as used
    }
  }

  // Second pass: Count correct letters in wrong positions
  for (let i = 0; i < guessChars.length; i++) {
    // Skip nullified (already matched in position) guess letters
    if (guessChars[i] === null) continue;

    // Find the first matching *unused* target letter
    const targetIndex = targetChars.indexOf(guessChars[i]);

    if (targetIndex !== -1) {
      correctLetter++;
      targetChars[targetIndex] = null; // Mark target letter as used
      // Optional: Nullify guessChars[i] = null; - prevents double counting same guess letter if target has duplicates
      // but problem constraints usually imply unique letters in target/guess, so often unnecessary.
    }
  }

  // Final score 'a' is sum of correct positions and correct letters (wrong position)
  return {
    a: correctPosition + correctLetter,
    b: correctPosition
  };
}

/**
 * Validate if provided scores 'a' and 'b' are logically possible
 * for a given word length.
 * @param {number} scoreA - Total correct letters score.
 * @param {number} scoreB - Correct position score.
 * @param {number} wordLength - The length of the words being compared.
 * @returns {boolean} True if the scores are valid, false otherwise.
 */
export function validateScores(scoreA, scoreB, wordLength) {
  // Check if scores are numbers and non-negative
  if (typeof scoreA !== 'number' || typeof scoreB !== 'number' || scoreA < 0 || scoreB < 0) {
    return false;
  }
  // Check if scores exceed word length
  if (scoreA > wordLength || scoreB > wordLength) {
    return false;
  }
  // Score 'b' (correct position) cannot be greater than score 'a' (total correct)
  if (scoreB > scoreA) {
    return false;
  }
  // If b == wordLength, then a must also == wordLength
  if (scoreB === wordLength && scoreA !== wordLength) {
      return false;
  }

  // All checks passed
  return true;
}


/**
 * Check if two sets of scores for two different guesses against the *same*
 * unknown target word could potentially be compatible.
 * This is a basic check, not exhaustive. More complex logic could exist.
 * @param {{a: number, b: number}} scores1 - Scores for the first guess.
 * @param {{a: number, b: number}} scores2 - Scores for the second guess.
 * @param {string} guess1 - The first guess word.
 * @param {string} guess2 - The second guess word.
 * @returns {boolean} True if scores *might* be compatible, false if definitely incompatible.
 */
export function areScoresCompatible(scores1, scores2, guess1, guess2) {
  // Basic checks
  if (!scores1 || !scores2 || !guess1 || !guess2 || guess1.length !== guess2.length) {
    return false; // Cannot compare if inputs invalid or lengths differ
  }
  const len = guess1.length;
  if (!validateScores(scores1.a, scores1.b, len) || !validateScores(scores2.a, scores2.b, len)) {
      return false; // Scores themselves must be valid
  }

  // Check 1: Letters present in guess1 but scoring A=0 must not be in guess2 if scoring A>0?
  // This gets complicated quickly with letter positioning.

  // Check 2: Letters matching position in both guesses
  // The number of positions where guess1[i] === guess2[i] AND this letter MUST be
  // part of score 'b' for *both* guesses cannot exceed min(scores1.b, scores2.b).
  // This requires knowing the target word, so it's not useful here.

  // Simpler check: If a letter is definitely ruled out by guess1 (e.g., guess 'APPLE', score A=0),
  // it cannot contribute to score A or B in guess2.
  const guess1Letters = new Set(guess1);
  const guess2Letters = new Set(guess2);

  if (scores1.a === 0) {
      // All letters in guess1 are NOT in the target.
      // Check if any of these letters are in guess2.
      for (const letter of guess1Letters) {
          if (guess2Letters.has(letter)) {
              // If guess2 has non-zero scores, this might be an issue, but depends on positioning.
              // A simple definite incompatibility: If guess2 has a score B > 0 for a letter ruled out by guess1.
              for(let i = 0; i < len; i++) {
                  if(guess2[i] === letter && scores2.b > 0) {
                      // This implies letter is in correct position for guess2,
                      // but guess1 said A=0 (letter not present at all). Incompatible.
                      // This logic is still flawed if guess1 has duplicate letters.
                      // Let's avoid this check for now due to complexity.
                  }
              }
          }
      }
  }
  // Similar logic if scores2.a === 0

  // Due to the complexity of definitively proving incompatibility without the target,
  // this function might return true even for incompatible scores.
  // It's more useful for finding *definite* impossibilities if stronger rules are found.
  // For now, return true as a basic placeholder.
  return true;
}