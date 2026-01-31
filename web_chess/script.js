/* Game Logic & UI Controller */

const PIECE_SYMBOLS = {
    'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚',
    'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔'
};

class AntigravityChess {
    constructor() {
        this.game = new Chess();
        this.boardEl = document.getElementById('board');
        this.statusEl = document.getElementById('status-text');
        this.alertEl = document.getElementById('check-alert');
        this.gameOverOverlay = document.getElementById('game-over-overlay');
        
        this.selectedSquare = null;
        this.legalMoves = [];
        this.difficulty = 'medium';
        this.playerColor = 'w';
        
        this.initUI();
        this.renderBoard();
        this.setupEventListeners();
    }

    initUI() {
        // Generate 64 squares
        this.boardEl.innerHTML = '';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const squareEl = document.createElement('div');
                squareEl.classList.add('square');
                const isLight = (r + c) % 2 === 0;
                squareEl.classList.add(isLight ? 'light' : 'dark');
                
                // standard algebraic notation (a8 top-left)
                // c=0 -> 'a', c=7 -> 'h'
                // r=0 -> '8', r=7 -> '1'
                const file = String.fromCharCode('a'.charCodeAt(0) + c);
                const rank = 8 - r;
                const squareId = `${file}${rank}`;
                squareEl.dataset.square = squareId;
                
                squareEl.addEventListener('click', () => this.handleSquareClick(squareId));
                
                this.boardEl.appendChild(squareEl);
            }
        }
    }

    renderBoard() {
        // Clear highlights and pieces (simple re-render for now)
        document.querySelectorAll('.square').forEach(sq => {
            sq.innerHTML = '';
            sq.classList.remove('selected', 'last-move', 'check');
        });

        // 1. Highlight Last Move
        const history = this.game.history({ verbose: true });
        if (history.length > 0) {
            const lastMove = history[history.length - 1];
            this.getSquareEl(lastMove.from).classList.add('last-move');
            this.getSquareEl(lastMove.to).classList.add('last-move');
        }

        // 2. Highlight Check
        if (this.game.in_check()) {
            this.alertEl.classList.remove('hidden');
            // Find king
            const board = this.game.board();
            const turn = this.game.turn();
            for (let r=0; r<8; r++) {
                for (let c=0; c<8; c++) {
                    const p = board[r][c];
                    if (p && p.type === 'k' && p.color === turn) {
                         const file = String.fromCharCode('a'.charCodeAt(0) + c);
                         const rank = 8 - r;
                         this.getSquareEl(`${file}${rank}`).classList.add('check');
                    }
                }
            }
        } else {
            this.alertEl.classList.add('hidden');
        }

        // 3. Render Pieces
        this.game.board().forEach((row, r) => {
            row.forEach((piece, c) => {
                if (piece) {
                    const file = String.fromCharCode('a'.charCodeAt(0) + c);
                    const rank = 8 - r;
                    const sqId = `${file}${rank}`;
                    const sqEl = this.getSquareEl(sqId);
                    
                    const pDiv = document.createElement('div');
                    pDiv.classList.add('piece');
                    pDiv.classList.add(piece.color === 'w' ? 'white' : 'black');
                    pDiv.textContent = PIECE_SYMBOLS[piece.type] || PIECE_SYMBOLS[piece.type.toUpperCase()]; 
                    // Note: chess.js gives lowercase type. key map has lowercase.
                    // But symbols map has UPPERCASE keys for white pieces usually or logic maps.
                    // Let's standardise: use type as key.
                    
                    // Actually my dict has both. 
                    // chess.js piece: {type: 'p', color: 'w'}
                    const key = piece.color === 'w' ? piece.type.toUpperCase() : piece.type;
                    pDiv.textContent = PIECE_SYMBOLS[key];
                    
                    sqEl.appendChild(pDiv);
                }
            });
        });

        // 4. Render selection & hints
        if (this.selectedSquare) {
            this.getSquareEl(this.selectedSquare).classList.add('selected');
            
            this.legalMoves.forEach(move => {
                const hint = document.createElement('div');
                hint.classList.add('hint-dot');
                this.getSquareEl(move.to).appendChild(hint);
            });
        }
        
        // Status Text
        if (this.game.game_over()) {
            this.statusEl.textContent = "Game Over";
            this.showGameOver();
        } else {
            this.statusEl.textContent = this.game.turn() === 'w' ? "White's Turn" : "Black's Turn";
        }
    }

    getSquareEl(id) {
        return document.querySelector(`.square[data-square="${id}"]`);
    }

    handleSquareClick(squareId) {
        if (this.game.game_over()) return;
        if (this.game.turn() !== this.playerColor && this.difficulty !== 'human') return; // Valid turn check

        // If clicked on a legal move target, MOVE
        const moveObj = this.legalMoves.find(m => m.to === squareId);
        if (moveObj) {
            this.game.move(moveObj);
            this.selectedSquare = null;
            this.legalMoves = [];
            this.renderBoard(); // Update immediately for responsiveness
            
            // Check Game Over or Trigger AI
            if (!this.game.game_over() && this.difficulty !== 'human') {
                setTimeout(() => this.makeAIMove(), 500); // Small delay for UX
            }
            return;
        }

        // Otherwise, select piece
        const piece = this.game.get(squareId);
        if (piece && piece.color === this.game.turn()) {
            this.selectedSquare = squareId;
            this.legalMoves = this.game.moves({ square: squareId, verbose: true });
            this.renderBoard();
        } else {
            // Deselect
            this.selectedSquare = null;
            this.legalMoves = [];
            this.renderBoard();
        }
    }

    makeAIMove() {
        if (this.game.game_over()) return;

        let bestMove = null;

        if (this.difficulty === 'random') {
            const moves = this.game.moves();
            bestMove = moves[Math.floor(Math.random() * moves.length)];
        } else {
            // Minimax Agent
            const depth = this.difficulty === 'medium' ? 2 : 3;
            bestMove = this.getMinimaxMove(depth);
        }

        if (bestMove) {
            this.game.move(bestMove);
            this.renderBoard();
        }
    }

    // --- AI Logic (Port of Python Logic) ---
    getMinimaxMove(depth) {
        let bestVal = -Infinity;
        let bestM = null;
        const moves = this.game.moves({ verbose: true });
        
        // Simple optimization: Sort captures first
        moves.sort((a,b) => {
            if (a.flags.includes('c') && !b.flags.includes('c')) return -1;
            return 0;
        });

        for (let move of moves) {
            this.game.move(move);
            let val = this.minimax(depth - 1, -Infinity, Infinity, false);
            this.game.undo();
            if (val > bestVal) {
                bestVal = val;
                bestM = move;
            }
        }
        return bestM;
    }

    minimax(depth, alpha, beta, isMaximizing) {
        if (depth === 0 || this.game.game_over()) {
            return this.evaluateBoard();
        }

        const moves = this.game.moves({ verbose: true });
        if (isMaximizing) {
            let maxEval = -Infinity;
            for (let move of moves) {
                this.game.move(move);
                let ev = this.minimax(depth - 1, alpha, beta, false);
                this.game.undo();
                maxEval = Math.max(maxEval, ev);
                alpha = Math.max(alpha, ev);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (let move of moves) {
                this.game.move(move);
                let ev = this.minimax(depth - 1, alpha, beta, true);
                this.game.undo();
                minEval = Math.min(minEval, ev);
                beta = Math.min(beta, ev);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    evaluateBoard() {
        // Material values
        const weights = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };
        let score = 0;
        
        // Simple Material Sum
        const board = this.game.board();
        for(let r=0; r<8; r++){
            for(let c=0; c<8; c++){
                const piece = board[r][c];
                if(!piece) continue;
                const val = weights[piece.type] || 0;
                // AI is always Black in this logic?
                // Wait: Python port assumed AI logic calculates valid score.
                // Standard: White positive, Black negative.
                // If `isMaximizing` for AI (Black), we want negative score?
                // Let's standardise: Bot calculates score relative to ITSELF.
                // But my minimax impl above does standard alpha-beta where 'Maximizing' player tries to get high score.
                // Usually we treat the 'Turn' player as maximizing.
                // Let's stick to standard: White +, Black -.
                // AI is Black. So AI 'Maximizing' loop wants to MINIMIZE the standard score?
                // Or AI is Maximizing abstract "AI Score".
                
                // Let's use simpler: White is AI? 
                // In my UI, user is White by default ('w'). AI is Black.
                // So: AI wants to Minimize standard score.
                
                // Fix: My minimax root sets 'isMaximizing=false' for recursive call?
                // No. `getMinimaxMove` is called FOR the AI. The AI wants to maximize ITS outcome.
                // If AI is Black, it wants to find move that leads to Lowest Standard Score.
                
                // To keep it simple: Let's calculate score from Black's perspective if turn is Black.
                // Actually, let's just make 'score' relative to 'side to move'
                // Or stick to standard.
                // Let's rewrite `evaluateBoard` to return score relative to Black (AI).
                
                if (piece.color === 'b') score += val;
                else score -= val;
            }
        }
        return score;
    }

    setupEventListeners() {
        document.getElementById('btn-reset').addEventListener('click', () => {
             this.game.reset();
             this.gameOverOverlay.classList.add('hidden');
             this.renderBoard();
        });
        
        document.getElementById('btn-undo').addEventListener('click', () => {
             this.game.undo(); // Undo AI
             this.game.undo(); // Undo User
             this.renderBoard();
        });

        document.getElementById('btn-play-again').addEventListener('click', () => {
             this.game.reset();
             this.gameOverOverlay.classList.add('hidden');
             this.renderBoard();
        });

        document.querySelectorAll('input[name="difficulty"]').forEach(el => {
            el.addEventListener('change', (e) => {
                this.difficulty = e.target.value;
            });
        });
    }

    showGameOver() {
        this.gameOverOverlay.classList.remove('hidden');
        const title = document.getElementById('game-over-title');
        const winner = document.getElementById('game-over-winner');
        
        if (this.game.in_checkmate()) {
            title.textContent = "CHECKMATE";
            winner.textContent = this.game.turn() === 'w' ? "Black Wins!" : "White Wins!";
        } else if (this.game.in_draw()) {
            title.textContent = "DRAW";
            winner.textContent = "Stalemate / Repetition";
        } else {
             title.textContent = "GAME OVER";
        }
    }
}

// Start Game
window.addEventListener('DOMContentLoaded', () => {
    window.chessGame = new AntigravityChess();
});
