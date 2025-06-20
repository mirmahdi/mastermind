/**
 * Project: Mastermind for Words
 * File: scripts/game-logic/computer-player.js
 * Description: Implements the final, multi-tiered guessing algorithm, including an
 * optimized "Endgame Solver" that uses differentiating guesses.
 */

import { calculateScores } from './scorer.js';
import { isValidGuess, generateRandomWord } from '../utils/word-generator.js';

export class ComputerPlayer {
    constructor(wordLength, dictionaryData) {
        this.wordLength = wordLength;
        this.dictionaryData = dictionaryData;
        this.usedWords = new Set();
        this.guessHistory = [];
        this.generatorState = null;

        // Initialize dictionary set for Phase 1
        this.selectedWordSet = [];
        this.currentSetIndex = 0;
        this._initializeDictionary();
				this.onProgressUpdate = null;
    }

    // --- State Management ---
    getState() {
        return {
            usedWords: Array.from(this.usedWords),
            guessHistory: [...this.guessHistory],
            generatorState: this.generatorState,
        };
    }

    setState(state) {
        if (!state) return;
        this.usedWords = new Set(state.usedWords ?? []);
        this.guessHistory = [...(state.guessHistory ?? [])];
        this.generatorState = state.generatorState ?? null;
    }

    // --- Core Logic ---
    processNewScore(guess, scoreA, scoreB) {
        this.usedWords.add(guess);
        this.guessHistory.push({ word: guess, scores: { a: scoreA, b: scoreB } });
        // A new score means our previous search is invalid. Reset the generator.
        this.generatorState = null;
    }

    /**
     * Gets the next guess using a tiered strategy, now including an Endgame Solver.
     * @returns {string|null} The next guess word.
     */
    getNextGuess() {
        const lastEntry = this.guessHistory[this.guessHistory.length - 1];
        if (lastEntry && lastEntry.scores.b === this.wordLength) {
            return null; // Game is already won.
        }

        // Tier 1: Endgame Solver for high-information scores (e.g., 4+4)
        if (lastEntry && lastEntry.scores.b === this.wordLength - 1) {
            console.log("[ComputerPlayer] High-information score detected. Engaging Endgame Solver.");
            return this._getEndgameGuess(lastEntry);
        }

        // Tier 2: Dictionary Guessing for initial knowledge gathering
        const dictionaryPhaseDuration = 4;
        if (this.guessHistory.length < dictionaryPhaseDuration) {
            const dictionaryGuess = this._getNextWordFromSet();
            if (dictionaryGuess) return dictionaryGuess;
        }

        // Tier 3: Guaranteed Monotonic Search as the final fallback
        return this._getMonotonicGuess();
    }    

    onProgressUpdate = null;
    
    // --- Helper Methods ---
		_initializeDictionary() {
				const key = `${this.wordLength}-letter`;
				const sets = this.dictionaryData?.wordSets?.[key];
				if (!sets || sets.length === 0) return;
				const randomSetIndex = Math.floor(Math.random() * sets.length);
				
				// Get the word list first
				const wordList = sets[randomSetIndex]?.set?.map(w => w.word.toLowerCase()) || [];

				// --- NEW: Shuffle the word list before storing it ---
				// This is the Fisher-Yates shuffle algorithm.
				for (let i = wordList.length - 1; i > 0; i--) {
						const j = Math.floor(Math.random() * (i + 1));
						[wordList[i], wordList[j]] = [wordList[j], wordList[i]];
				}
				// --- END NEW ---
				
				this.selectedWordSet = wordList;
				this.currentSetIndex = 0;
		}

    _getNextWordFromSet() {
        if (!this.selectedWordSet || this.selectedWordSet.length === 0) return null;
        while (this.currentSetIndex < this.selectedWordSet.length) {
            const word = this.selectedWordSet[this.currentSetIndex++];
            if (isValidGuess(word, this.wordLength) && !this.usedWords.has(word)) {
                return word;
            }
        }
        // Fallback if the dictionary set is exhausted or invalid.
        let attempts = 0;
        let guess;
        do {
            guess = generateRandomWord(this.wordLength);
            attempts++;
        } while (this.usedWords.has(guess) && attempts < 20);
        return guess;
    }

    _getEndgameGuess(lastGuessEntry) {
        const lastGuess = lastGuessEntry.word;
        const lastGuessLetters = new Set(lastGuess);
        const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
        const candidateLetters = alphabet.filter(l => !lastGuessLetters.has(l));
        const consistentCandidates = [];

        // Step 1: Find ALL consistent candidates.
        for (let i = 0; i < this.wordLength; i++) {
            for (const replacement of candidateLetters) {
                const candidateArr = [...lastGuess];
                candidateArr[i] = replacement;
                const candidateWord = candidateArr.join('');

                if (isValidGuess(candidateWord, this.wordLength) && this._isConsistentWithHistory(candidateWord)) {
                    if (!this.usedWords.has(candidateWord)) {
                        consistentCandidates.push(candidateWord);
                    }
                }
            }
        }
        
        // Step 2: Decide action based on number of candidates.
        if (consistentCandidates.length === 0) {
            console.error("[ComputerPlayer] Endgame solver found no candidates. Reverting to monotonic search.");
            return this._getMonotonicGuess();
        }

        if (consistentCandidates.length === 1) {
            console.log("[ComputerPlayer] Endgame solver pinpointed the final answer.");
            return consistentCandidates[0];
        }

        // Step 3: If multiple candidates, craft a "differentiating guess".
        console.log(`[ComputerPlayer] Endgame solver found ${consistentCandidates.length} possibilities. Crafting differentiating guess.`);
        return this._getDifferentiatingGuess(consistentCandidates, lastGuessLetters);
    }
    
    _getDifferentiatingGuess(candidates, knownLetters) {
        const differentiatingLetters = new Set();
        candidates.forEach(word => {
            [...word].forEach(letter => {
                if (!knownLetters.has(letter)) {
                    differentiatingLetters.add(letter);
                }
            });
        });

        let guess = Array.from(differentiatingLetters).slice(0, this.wordLength).join('');

        if (guess.length < this.wordLength) {
            const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
            let i = 0;
            while (guess.length < this.wordLength && i < alphabet.length) {
                if (!guess.includes(alphabet[i])) { guess += alphabet[i]; }
                i++;
            }
        }
        
        guess = guess.slice(0, this.wordLength);
        if (isValidGuess(guess, this.wordLength) && !this.usedWords.has(guess)) {
            return guess;
        }

        // Fallback to just guessing the first candidate if crafting fails.
        return candidates[0];
    }
    
		// In scripts/game-logic/computer-player.js, _getMonotonicGuess function
		_getMonotonicGuess() {
				if (!this.generatorState) {
						console.log("[ComputerPlayer] Engaging Full-Alphabet Monotonic Search.");
						const characterSet = 'abcdefghijklmnopqrstuvwxyz'.split('');
						this.generatorState = {
								generator: this._permutationGenerator(characterSet, this.wordLength),
								checkedCount: 0 // Initialize checkedCount
						};
				}

				let sessionCheckedCount = 0;
				const REPORT_INTERVAL = 100; // Report every 100 checks for smoother updates

				while (true) {
						const next = this.generatorState.generator.next();
						if (next.done) {
								// Search exhausted all possibilities
								if (this.onProgressUpdate) {
										this.onProgressUpdate({
												currentWord: 'NO MATCHES LEFT', // Clear message for exhaustion
												checkedCount: this.generatorState.checkedCount,
												isSearching: false // Search finished, no word found
										});
								}
								return null;
						}
						const candidateWord = next.value;
						this.generatorState.checkedCount++; // Increment total words checked

						// Report progress periodically, and always for the very first word
						if (this.generatorState.checkedCount === 1 || sessionCheckedCount % REPORT_INTERVAL === 0) {
								if (this.onProgressUpdate) {
										this.onProgressUpdate({
												currentWord: candidateWord, // Display the word currently being assessed
												checkedCount: this.generatorState.checkedCount,
												isSearching: true // Actively searching
										});
								}
						}
						sessionCheckedCount++; // Increment for periodic reporting

						if (!this.usedWords.has(candidateWord) && this._isConsistentWithHistory(candidateWord)) {
								// Word found! Report final state
								if (this.onProgressUpdate) {
										this.onProgressUpdate({
												currentWord: candidateWord, // Display the word that was found
												checkedCount: this.generatorState.checkedCount,
												isSearching: false // Search completed, word found
										});
								}
								return candidateWord;
						}
				}
		}
    *_permutationGenerator(chars, k) {
        const n = chars.length;
        if (k > n) return;
        const indices = Array.from({ length: n }, (_, i) => i);
        const cycles = Array.from({ length: k }, (_, i) => n - i);
        yield indices.slice(0, k).map(i => chars[i]).join('');
        while (true) {
            let i = k - 1;
            while (i >= 0) {
                cycles[i]--;
                if (cycles[i] === 0) {
                    const first = indices[i];
                    for (let j = i; j < n - 1; j++) { indices[j] = indices[j + 1]; }
                    indices[n - 1] = first;
                    cycles[i] = n - i;
                } else {
                    const j = cycles[i];
                    [indices[i], indices[n - j]] = [indices[n - j], indices[i]];
                    yield indices.slice(0, k).map(idx => chars[idx]).join('');
                    break; 
                }
                i--;
            }
            if (i < 0) return;
        }
    }
    
    _isConsistentWithHistory(candidateWord) {
        for (const entry of this.guessHistory) {
            const scores = calculateScores(candidateWord, entry.word);
            if (scores.a !== entry.scores.a || scores.b !== entry.scores.b) {
                return false;
            }
        }
        return true;
    }
}