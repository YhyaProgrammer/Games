# Antigravity Chess 🌌♟️

A sleek, modern, and highly interactive Python Chess game powered by `Pygame` and the `python-chess` library. Featuring an advanced AI, multiple visual themes, and an animated undo system.

## ✨ Features

- **Advanced Chess AI:** Choose from Easy to Extra Hard (Absolute) difficulty. The AI uses Minimax with Alpha-Beta pruning, Move Ordering, and Quiescence search for a deep tactical challenge.
- **9 Stunning Themes:** Cycle through unique aesthetics including *Midnight*, *Cyber*, *Sunset*, *Blood*, and *Neon Gold*.
- **Animated Gameplay:** Smooth piece movement animations for both moves and undos.
- **Smart Hints:** Stuck? Use a hint to see the AI's recommended best move highlighted in purple.
- **Resource Management:** Hints and Undos are limited based on your chosen difficulty—use them wisely!
- **Auto-Promotion:** Streamlined gameplay where pawns automatically promote to Queens.
- **Tactical Highlights:** Valid move dots turn **Red** when they result in a capture.
- **Synthesized Audio:** Built-in sound effects for moves, captures, and checks.
- **Time Controls:** Play with various time limits, from Blitz (5 min) to Casual (60 min).

## 🚀 Getting Started

### Prerequisites
Make sure you have Python 3.10+ installed.

### Installation
1. Install the required libraries:
   ```bash
   pip install pygame python-chess numpy
   ```

### Running the Game
Navigate to the project folder and run:
```bash
python main.py
```

## 🎮 How to Play
1. **Menu:** Select your difficulty, time limit, and side (White/Black).
2. **Move:** Click and drag a piece, or click the square and then the destination.
3. **Buttons:**
   - **Resign:** End the game immediately.
   - **Hint:** Highlights the best move (Cost: 1 Hint).
   - **Theme:** Cycle through different color palettes instantly.
   - **Undo:** Revert the last move with animation (Cost: 1 Undo).

## 🛠️ Technology Stack
- **Pygame:** For rendering, animations, and sound.
- **python-chess:** For core move validation and board logic.
- **NumPy:** Used for real-time sound synthesis.

## 📝 License
This project is open-source. Feel free to modify and adapt it for your own use!
