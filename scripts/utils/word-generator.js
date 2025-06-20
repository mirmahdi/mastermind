// scripts/utils/word-generator.js
// Functions for generating words and validating word structure.

/**
 * Generates a random word with unique letters of the specified length.
 * Uses Fisher-Yates shuffle for randomness.
 * @param {number} length - Length of the word to generate (1-26).
 * @returns {string} A random word with unique letters.
 * @throws {Error} If length is invalid.
 */
export function generateRandomWord(length) {
  if (typeof length !== 'number' || length < 1 || length > 26) {
    throw new Error(`Invalid word length specified: ${length}. Must be between 1 and 26.`);
  }

  const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

  // Fisher-Yates (aka Knuth) Shuffle
  for (let i = alphabet.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [alphabet[i], alphabet[j]] = [alphabet[j], alphabet[i]]; // Swap
  }

  // Take the first 'length' characters from the shuffled alphabet
  return alphabet.slice(0, length).join('');
}

/** Calculates factorial of a non-negative integer n */
function factorial(n) {
  if (n < 0) return NaN; // Factorial not defined for negative numbers
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

/** Calculates "n choose k" (combinations) */
function combinations(n, k) {
    if (k < 0 || k > n) {
        return 0;
    }
    if (k === 0 || k === n) {
        return 1;
    }
    // Avoid issues with large factorials if k is large
    if (k > n / 2) {
        k = n - k;
    }
    // Calculate n! / (k! * (n-k)!) efficiently
    let result = 1;
    for (let i = 1; i <= k; i++) {
        result = result * (n - i + 1) / i;
    }
    return Math.round(result); // Round to handle potential floating point inaccuracies
}


/**
 * Generates a list of candidate unique-letter words of the specified length.
 * Aims for variety and includes some deterministic words. Limits size for performance.
 * @param {number} length - Length of words to generate (typically 4-8).
 * @param {number} [maxWords=5000] - Maximum number of words to generate.
 * @returns {string[]} Array of unique-letter words.
 * @throws {Error} If length is invalid.
 */
export function generateAllUniqueLetterWords(length, maxWords = 5000) {
  // Validate length (adjust max if needed, 10 is high for combinations)
  if (typeof length !== 'number' || length < 1 || length > 10) {
    throw new Error(`Invalid word length for generation: ${length}. Must be 1-10.`);
  }

  const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const result = new Set(); // Use Set for automatic uniqueness

  // Calculate theoretical maximum for logging/limiting
  const maxTheoretical = combinations(26, length);

  // Limit target count based on maxWords and theoretical max
  const targetCount = Math.min(maxWords, maxTheoretical);

  // Add some deterministic words first to ensure basic coverage/variety
  addDeterministicWords(result, alphabet, length);

  // Add random combinations until target count is reached or timeout
  const startTime = Date.now();
  const timeoutMs = 1000; // 1 second generation limit

  while (result.size < targetCount && (Date.now() - startTime) < timeoutMs) {
    // Generate random word using shuffle method
    const word = generateRandomWord(length);
    result.add(word);
  }

  // Ensure at least one word is returned if generation failed/timed out
  if (result.size === 0) {
      console.warn(`Word generation failed to produce results for length ${length}, returning single random word.`);
      result.add(generateRandomWord(length));
  }

  // Convert Set to Array and shuffle final list
  const finalArray = Array.from(result);
  for (let i = finalArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [finalArray[i], finalArray[j]] = [finalArray[j], finalArray[i]];
  }

  // console.log(`Generated ${finalArray.length} unique words of length ${length} (target: ${targetCount}, theoretical max: ${maxTheoretical})`);
  return finalArray;
}


/** Helper function to add deterministic words for initial variety */
function addDeterministicWords(resultSet, alphabet, length) {
  // Add words spanning the alphabet
  const sectionSize = Math.floor(26 / length);
  if (sectionSize < 1) return; // Avoid issues if length > 26

  for (let i = 0; i < length; i++) { // Starting offset
    let word = '';
    const currentLetters = new Set();
    for (let j = 0; j < length; j++) {
      let index = (i + j * sectionSize) % 26;
      // Avoid duplicate letters if sectionSize is small relative to length
      while (currentLetters.has(alphabet[index])) {
          index = (index + 1) % 26;
      }
      word += alphabet[index];
      currentLetters.add(alphabet[index]);
    }
    if(word.length === length) resultSet.add(word); // Add if successfully formed
  }

  // Add some vowel/consonant mixed words (ensure unique letters)
  const vowels = ['a', 'e', 'i', 'o', 'u'];
  const consonants = alphabet.filter(letter => !vowels.includes(letter));

  for (let i = 0; i < 3; i++) { // Add a few variants
     let word = '';
     const lettersUsed = new Set();
     let v_idx = i % vowels.length;
     let c_idx = i % consonants.length;

     for(let j=0; j < length; j++) {
         // Prioritize vowels, then consonants, ensuring uniqueness
         if (j < vowels.length && !lettersUsed.has(vowels[v_idx])) {
             word += vowels[v_idx];
             lettersUsed.add(vowels[v_idx]);
             v_idx = (v_idx + 1) % vowels.length; // Cycle through vowels
         } else {
             // Find next available consonant
             while(lettersUsed.has(consonants[c_idx])) {
                 c_idx = (c_idx + 1) % consonants.length;
             }
             if (word.length < length) { // Check if space left
                 word += consonants[c_idx];
                 lettersUsed.add(consonants[c_idx]);
                 c_idx = (c_idx + 1) % consonants.length;
             }
         }
     }
     // Add if valid length and unique letters confirmed (should be by logic)
     if (word.length === length && new Set(word).size === length) {
         resultSet.add(word);
     }
  }
}

// NOTE: generateUniqueLetterWord helper removed as generateRandomWord achieves the same

/**
 * Validates if a guess word has the correct length and only unique letters.
 * Case-insensitive check.
 * @param {string} word - Word to validate.
 * @param {number} length - Expected length.
 * @returns {boolean} True if the word is valid, false otherwise.
 */
export function isValidGuess(word, length) {
  // Check for null/undefined, correct type, and exact length
  if (typeof word !== 'string' || !word || word.length !== length) {
    return false;
  }
  // Use a Set to efficiently check for unique characters (case-insensitive)
  const lowerWord = word.toLowerCase();
  const uniqueLetters = new Set(lowerWord);
  // Ensure Set size matches expected length and contains only letters a-z
  return uniqueLetters.size === length && /^[a-z]+$/.test(lowerWord);
}