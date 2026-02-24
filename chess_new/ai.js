// ===== Chess AI Engine =====
// Mirrors the Python ChessBot logic: random (easy), minimax (medium/hard/absolute)

class ChessAI {
    constructor(difficulty) {
        this.difficulty = difficulty;
        this.pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

        // Piece-square tables for positional evaluation
        this.pst = {
            p: [
                0, 0, 0, 0, 0, 0, 0, 0,
                50, 50, 50, 50, 50, 50, 50, 50,
                10, 10, 20, 30, 30, 20, 10, 10,
                5, 5, 10, 25, 25, 10, 5, 5,
                0, 0, 0, 20, 20, 0, 0, 0,
                5, -5, -10, 0, 0, -10, -5, 5,
                5, 10, 10, -20, -20, 10, 10, 5,
                0, 0, 0, 0, 0, 0, 0, 0
            ],
            n: [
                -50, -40, -30, -30, -30, -30, -40, -50,
                -40, -20, 0, 0, 0, 0, -20, -40,
                -30, 0, 10, 15, 15, 10, 0, -30,
                -30, 5, 15, 20, 20, 15, 5, -30,
                -30, 0, 15, 20, 20, 15, 0, -30,
                -30, 5, 10, 15, 15, 10, 5, -30,
                -40, -20, 0, 5, 5, 0, -20, -40,
                -50, -40, -30, -30, -30, -30, -40, -50
            ],
            b: [
                -20, -10, -10, -10, -10, -10, -10, -20,
                -10, 0, 0, 0, 0, 0, 0, -10,
                -10, 0, 5, 10, 10, 5, 0, -10,
                -10, 5, 5, 10, 10, 5, 5, -10,
                -10, 0, 10, 10, 10, 10, 0, -10,
                -10, 10, 10, 10, 10, 10, 10, -10,
                -10, 5, 0, 0, 0, 0, 5, -10,
                -20, -10, -10, -10, -10, -10, -10, -20
            ],
            r: [
                0, 0, 0, 0, 0, 0, 0, 0,
                5, 10, 10, 10, 10, 10, 10, 5,
                -5, 0, 0, 0, 0, 0, 0, -5,
                -5, 0, 0, 0, 0, 0, 0, -5,
                -5, 0, 0, 0, 0, 0, 0, -5,
                -5, 0, 0, 0, 0, 0, 0, -5,
                -5, 0, 0, 0, 0, 0, 0, -5,
                0, 0, 0, 5, 5, 0, 0, 0
            ],
            q: [
                -20, -10, -10, -5, -5, -10, -10, -20,
                -10, 0, 0, 0, 0, 0, 0, -10,
                -10, 0, 5, 5, 5, 5, 0, -10,
                -5, 0, 5, 5, 5, 5, 0, -5,
                0, 0, 5, 5, 5, 5, 0, -5,
                -10, 5, 5, 5, 5, 5, 0, -10,
                -10, 0, 5, 0, 0, 0, 0, -10,
                -20, -10, -10, -5, -5, -10, -10, -20
            ],
            k: [
                -30, -40, -40, -50, -50, -40, -40, -30,
                -30, -40, -40, -50, -50, -40, -40, -30,
                -30, -40, -40, -50, -50, -40, -40, -30,
                -30, -40, -40, -50, -50, -40, -40, -30,
                -20, -30, -30, -40, -40, -30, -30, -20,
                -10, -20, -20, -20, -20, -20, -20, -10,
                20, 20, 0, 0, 0, 0, 20, 20,
                20, 30, 10, 0, 0, 10, 30, 20
            ]
        };
    }

    getDepth() {
        switch (this.difficulty) {
            case 'easy': return 1;
            case 'medium': return 2;
            case 'hard': return 3;
            case 'absolute': return 4;
            default: return 2;
        }
    }

    evaluate(chess) {
        if (chess.in_checkmate()) {
            return chess.turn() === 'w' ? -99999 : 99999;
        }
        if (chess.in_draw() || chess.in_stalemate()) return 0;

        let score = 0;
        const board = chess.board();

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (!piece) continue;

                const pstIdx = row * 8 + col;
                const flippedIdx = (7 - row) * 8 + col;
                const val = this.pieceValues[piece.type] + (this.pst[piece.type]?.[piece.color === 'w' ? pstIdx : flippedIdx] || 0);

                score += piece.color === 'w' ? val : -val;
            }
        }
        return score;
    }

    minimax(chess, depth, alpha, beta, maximizing) {
        if (depth === 0 || chess.game_over()) {
            return this.evaluate(chess);
        }

        const moves = chess.moves();

        if (maximizing) {
            let best = -Infinity;
            for (const move of moves) {
                chess.move(move);
                best = Math.max(best, this.minimax(chess, depth - 1, alpha, beta, false));
                chess.undo();
                alpha = Math.max(alpha, best);
                if (beta <= alpha) break;
            }
            return best;
        } else {
            let best = Infinity;
            for (const move of moves) {
                chess.move(move);
                best = Math.min(best, this.minimax(chess, depth - 1, alpha, beta, true));
                chess.undo();
                beta = Math.min(beta, best);
                if (beta <= alpha) break;
            }
            return best;
        }
    }

    getMove(chess) {
        const moves = chess.moves();
        if (moves.length === 0) return null;

        if (this.difficulty === 'easy') {
            // Random with slight bias toward captures
            const captures = moves.filter(m => m.includes('x'));
            if (captures.length > 0 && Math.random() < 0.4) {
                return captures[Math.floor(Math.random() * captures.length)];
            }
            return moves[Math.floor(Math.random() * moves.length)];
        }

        const depth = this.getDepth();
        const maximizing = chess.turn() === 'w';
        let bestMove = moves[0];
        let bestScore = maximizing ? -Infinity : Infinity;

        // Shuffle moves for variety
        const shuffled = [...moves].sort(() => Math.random() - 0.5);

        for (const move of shuffled) {
            chess.move(move);
            const score = this.minimax(chess, depth - 1, -Infinity, Infinity, !maximizing);
            chess.undo();

            if (maximizing ? score > bestScore : score < bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    }
}
