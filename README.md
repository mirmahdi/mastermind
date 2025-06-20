# Mastermind for Words

A browser-based “Mastermind”-style word game in which the computer and/or human players take turns guessing a secret word of **4–8 unique letters**. It supports three modes:

1. **User vs. Computer**: You choose a secret word, the computer tries to guess it.  
2. **Computer vs. User**: The computer picks a random word, you try to guess it.  
3. **User vs. User**: Two humans take turns guessing each other’s words.

## 🔑 Features

- **Dynamic word-length**: Play with 4–8 letter words, no repeated letters.  
- **Dictionary phase**: Computer starts by showing real dictionary words for a smooth UX.  
- **Computational phase**: Once enough information is gathered, the computer switches to algorithmic filtering (and, if needed, constraint-driven generation or brute-force) to guarantee it never misses the secret.  
- **Score feedback**: Each guess reports:
  - **A**: Number of letters in common (any position)
  - **B**: Number of letters in the correct position  
- **History & validation**: Guess history panel; if the computer can’t find a word, you can validate your scores or reveal the secret to diagnose scoring errors.  
- **Lightweight**: Pure HTML/CSS/JS, no build step.

## 🚀 Getting Started

1. **Clone the repo**
   ```bash
   git clone https://github.com/your-username/mastermind-for-words.git
   cd mastermind-for-words

## 🚀 Getting Started

1. **Clone the repo**
   ```bash
   git clone https://github.com/your-username/mastermind-for-words.git
   cd mastermind-for-words

2. **Serve the files
- You can simply open index.html in your browser, or
- Use a static server (recommended for full feature support):

   ```bash
	 npx http-server .
	 # then visit http://localhost:8080

3. Play!
- From the setup screen, select your mode and word length.
- Follow the on-screen prompts to enter guesses or scores.

** 📁 Project Structure

/
├── index.html
├── dictionary.json          # Word-list by length / sets
├── scripts/
│   ├── main.js              # Entry point & mode routing
│   ├── ui.js                # Modal manager & shared UI helpers
│   ├── game-state.js        # Global game state singleton
│   ├── start-game.js        # Mode selection & initialization
│   ├── gameplay/            # Mode-specific UI handlers
│   │   ├── gameplay-main.js
│   │   ├── gameplay-modeB.js    # Computer-guesses (User vs. Comp)
│   │   └── ...  
│   ├── game-logic/          # Core AI & scoring
│   │   ├── computer-player.js   # ComputerPlayer class
│   │   ├── scorer.js             # A/B scoring function
│   │   └── history-manager.js
│   └── utils/               # Word generation & persistence
│       ├── word-generator.js
│       └── storage.js
└── styles/                  # CSS for components & pages
    ├── components/
    └── pages/

** 🔧 How It Works

1. **Dictionary Phase (Modes B & C):
The computer shows real dictionary words (from dictionary.json) in random “word sets” to gather raw A‐scores. Each shown letter is recorded in a usedLetters set so we never skip any letter.

2. **Switch to Computational Phase:
Once there are fewer unseen letters in the alphabet than the word length, the AI switches to algorithmic filtering:

-Filter the full initial word list by every past A/B score.
-Recover via exact‐match scan (tryFindExactWord()), constraint‐driven generation (generateWordFromConstraints()), or brute‐force fallback.

3. **User Interface:
Built with plain JS, renders a letter‐grid, score inputs, and a history list. All logic lives in scripts/, styles in styles/.

** 🛠 Development
-Linting & formatting: N/A (plain JS/CSS).
-Add a new word length: Extend dictionary.json under "9-letter", then update UI’s length selector.
-Tweaking AI:
  --Update computer-player.js for alternate heuristics.
  --Tests can be run by simulating a secret and feeding A/B scores programmatically.

** ❓ FAQ
-Q: Why no repeats?
For simplicity of scoring and search space.

-Q: Computer sometimes “gives up”?
If that ever happens, it indicates inconsistent scores. You’ll be prompted to validate or reveal the secret.

** 📜 License
MIT License © 2025 Mahdi MN

Feel free to fork, file issues, and submit PRs!