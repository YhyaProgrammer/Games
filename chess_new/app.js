// ===== Chess Master — Glassmorphic Edition v3 =====
// Blob Worker AI + tons of features

// ===== PIECE URLS =====
const PIECE_URLS = {
    wK: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
    wQ: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
    wR: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
    wB: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
    wN: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
    wP: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
    bK: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg',
    bQ: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
    bR: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
    bB: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
    bN: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
    bP: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg'
};
const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

// ===== AI WORKER CODE (inlined as string, created as Blob) =====
// This pattern works even with file:// protocol!
const AI_WORKER_CODE = `
importScripts('https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js');

class ChessAI {
    constructor(difficulty) {
        this.difficulty = difficulty;
        this.pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
        this.pst = {
            p: [0,0,0,0,0,0,0,0,50,50,50,50,50,50,50,50,10,10,20,30,30,20,10,10,5,5,10,25,25,10,5,5,0,0,0,20,20,0,0,0,5,-5,-10,0,0,-10,-5,5,5,10,10,-20,-20,10,10,5,0,0,0,0,0,0,0,0],
            n: [-50,-40,-30,-30,-30,-30,-40,-50,-40,-20,0,0,0,0,-20,-40,-30,0,10,15,15,10,0,-30,-30,5,15,20,20,15,5,-30,-30,0,15,20,20,15,0,-30,-30,5,10,15,15,10,5,-30,-40,-20,0,5,5,0,-20,-40,-50,-40,-30,-30,-30,-30,-40,-50],
            b: [-20,-10,-10,-10,-10,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,10,10,5,0,-10,-10,5,5,10,10,5,5,-10,-10,0,10,10,10,10,0,-10,-10,10,10,10,10,10,10,-10,-10,5,0,0,0,0,5,-10,-20,-10,-10,-10,-10,-10,-10,-20],
            r: [0,0,0,0,0,0,0,0,5,10,10,10,10,10,10,5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,0,0,0,5,5,0,0,0],
            q: [-20,-10,-10,-5,-5,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,5,5,5,0,-10,-5,0,5,5,5,5,0,-5,0,0,5,5,5,5,0,-5,-10,5,5,5,5,5,0,-10,-10,0,5,0,0,0,0,-10,-20,-10,-10,-5,-5,-10,-10,-20],
            k: [-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-20,-30,-30,-40,-40,-30,-30,-20,-10,-20,-20,-20,-20,-20,-20,-10,20,20,0,0,0,0,20,20,20,30,10,0,0,10,30,20]
        };
    }
    getDepth() {
        switch(this.difficulty) {
            case 'easy': return 1; case 'medium': return 2;
            case 'hard': return 3; case 'absolute': return 4; default: return 2;
        }
    }
    evaluate(chess) {
        if (chess.in_checkmate()) return chess.turn() === 'w' ? -99999 : 99999;
        if (chess.in_draw() || chess.in_stalemate()) return 0;
        let score = 0;
        const board = chess.board();
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if (!p) continue;
                const idx = r * 8 + c;
                const fidx = (7 - r) * 8 + c;
                const val = this.pieceValues[p.type] + (this.pst[p.type]?.[p.color === 'w' ? idx : fidx] || 0);
                score += p.color === 'w' ? val : -val;
            }
        }
        return score;
    }
    minimax(chess, depth, alpha, beta, maximizing) {
        if (depth === 0 || chess.game_over()) return this.evaluate(chess);
        const moves = chess.moves();
        moves.sort((a, b) => (b.includes('x') ? 1 : 0) - (a.includes('x') ? 1 : 0));
        if (maximizing) {
            let best = -Infinity;
            for (const m of moves) { chess.move(m); best = Math.max(best, this.minimax(chess, depth-1, alpha, beta, false)); chess.undo(); alpha = Math.max(alpha, best); if (beta <= alpha) break; }
            return best;
        } else {
            let best = Infinity;
            for (const m of moves) { chess.move(m); best = Math.min(best, this.minimax(chess, depth-1, alpha, beta, true)); chess.undo(); beta = Math.min(beta, best); if (beta <= alpha) break; }
            return best;
        }
    }
    getMove(chess) {
        const moves = chess.moves();
        if (moves.length === 0) return null;
        if (this.difficulty === 'easy') {
            const caps = moves.filter(m => m.includes('x'));
            if (caps.length > 0 && Math.random() < 0.4) return caps[Math.floor(Math.random() * caps.length)];
            return moves[Math.floor(Math.random() * moves.length)];
        }
        const depth = this.getDepth();
        const maximizing = chess.turn() === 'w';
        let bestMove = moves[0], bestScore = maximizing ? -Infinity : Infinity;
        const shuffled = [...moves].sort(() => Math.random() - 0.5);
        for (const m of shuffled) {
            chess.move(m);
            const score = this.minimax(chess, depth-1, -Infinity, Infinity, !maximizing);
            chess.undo();
            if (maximizing ? score > bestScore : score < bestScore) { bestScore = score; bestMove = m; }
        }
        return bestMove;
    }
    quickEval(chess) {
        return this.evaluate(chess);
    }
}

self.onmessage = function(e) {
    const { fen, difficulty, type } = e.data;
    const chess = new Chess(fen);
    const ai = new ChessAI(difficulty || 'hard');
    if (type === 'getMove') {
        const move = ai.getMove(chess);
        self.postMessage({ type: 'move', move });
    } else if (type === 'getHint') {
        const moveSan = ai.getMove(chess);
        if (moveSan) {
            const obj = chess.move(moveSan);
            self.postMessage({ type: 'hint', from: obj.from, to: obj.to, san: obj.san });
        } else {
            self.postMessage({ type: 'hint', from: null, to: null });
        }
    } else if (type === 'eval') {
        const score = ai.quickEval(chess);
        self.postMessage({ type: 'eval', score });
    } else if (type === 'bestMove') {
        const bestSan = ai.getMove(chess);
        self.postMessage({ type: 'bestMove', bestSan, playedSan: e.data.playedSan, moverColor: e.data.moverColor });
    }
};
`;

// ===== SOUND ENGINE =====
class SoundEngine {
    constructor() { this.ctx = null; this.enabled = true; }
    init() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    play(type) {
        if (!this.enabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain); gain.connect(this.ctx.destination);
        const now = this.ctx.currentTime;
        const presets = {
            move: { freq: 440, vol: 0.12, dur: 0.08 },
            capture: { freq: 280, vol: 0.18, dur: 0.12 },
            check: { freq: 660, vol: 0.2, dur: 0.18 },
            click: { freq: 900, vol: 0.08, dur: 0.04 },
            clink: { freq: 1200, vol: 0.12, dur: 0.08 },
            victory: { freq: 880, vol: 0.2, dur: 0.4 },
            defeat: { freq: 200, vol: 0.2, dur: 0.5 },
            hint: { freq: 600, vol: 0.1, dur: 0.15 },
            brilliant: { freq: 1047, vol: 0.18, dur: 0.25 }
        };
        const p = presets[type] || presets.click;
        osc.frequency.value = p.freq;
        gain.gain.setValueAtTime(p.vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + p.dur);
        osc.start(now); osc.stop(now + p.dur);
    }
    toggle() { this.enabled = !this.enabled; return this.enabled; }
}

// ===== PARTICLE SYSTEM =====
class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.animating = false;
    }
    resize(w, h) { this.canvas.width = w; this.canvas.height = h; }
    spawn(x, y, color = [255, 80, 80]) {
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x, y, vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.5) * 12,
                life: 1, decay: 0.012 + Math.random() * 0.02, size: 2 + Math.random() * 5, color
            });
        }
        if (!this.animating) this.animate();
    }
    animate() {
        this.animating = true;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles = this.particles.filter(p => {
            p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.vx *= 0.97; p.life -= p.decay;
            if (p.life <= 0) return false;
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = `rgb(${p.color[0]},${p.color[1]},${p.color[2]})`;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            this.ctx.fill();
            return true;
        });
        this.ctx.globalAlpha = 1;
        if (this.particles.length > 0) requestAnimationFrame(() => this.animate());
        else this.animating = false;
    }
}

// ===== TOAST =====
function showToast(msg, duration = 2000) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), duration);
}

// ===== MAIN GAME =====
class ChessGame {
    constructor() {
        this.chess = new Chess();
        this.sound = new SoundEngine();
        this.particles = null;
        this.aiWorker = null;
        this.useAI = false;

        // State
        this.playerColor = 'w';
        this.viewColor = 'w';
        this.difficulty = 'easy';
        this.timeLimit = 0;
        this.whiteTime = 0;
        this.blackTime = 0;
        this.lastTimeUpdate = null;
        this.timerInterval = null;
        this.gameOver = false;
        this.gameOverTimer = null;

        // Interaction
        this.selectedSquare = null;
        this.legalMoves = [];
        this.draggingFrom = null;
        this.dragElement = null;
        this.originalPieceEl = null;
        this.hintMove = null;
        this.aiThinking = false;

        // Resources — infinite hints, 15 undos
        this.undosLeft = 15;

        // Stats
        this.checksGiven = 0;
        this.captureCount = 0;
        this.moveStartTime = 0;
        this.totalThinkTime = 0;
        this.brilliantMoves = 0;

        // Themes
        this.themes = [
            { cls: '', name: 'Classic' },
            { cls: 'theme-midnight', name: 'Midnight' },
            { cls: 'theme-emerald', name: 'Emerald' },
            { cls: 'theme-arctic', name: 'Arctic' },
            { cls: 'theme-sunset', name: 'Sunset' },
            { cls: 'theme-blood', name: 'Blood' },
            { cls: 'theme-lavender', name: 'Lavender' },
            { cls: 'theme-neon', name: 'Neon' },
            { cls: 'theme-gold', name: 'Gold' }
        ];
        this.currentThemeIdx = 0;

        // Captured
        this.capturedByWhite = [];
        this.capturedByBlack = [];

        this.init();
    }

    init() {
        this.setupMenuListeners();
        this.setupGameListeners();
        this.setupKeyboardShortcuts();
    }

    // ===== AI WORKER (Blob-based — works with file://) =====
    createAIWorker() {
        if (this.aiWorker) this.aiWorker.terminate();
        const blob = new Blob([AI_WORKER_CODE], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        this.aiWorker = new Worker(url);
        URL.revokeObjectURL(url);
        this.aiWorker.onmessage = (e) => {
            const d = e.data;
            if (d.type === 'move') this.handleAIResponse(d.move);
            else if (d.type === 'hint') this.handleHintResponse(d.from, d.to, d.san);
            else if (d.type === 'eval') this.handleEvalResponse(d.score);
        };
        this.aiWorker.onerror = (err) => {
            console.error('AI Worker error:', err);
            this.aiThinking = false;
            this.updateUI();
        };
    }

    // ===== SCREENS =====
    showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    }
    showOverlay(id) { document.getElementById(id).classList.add('active'); }
    hideOverlay(id) { document.getElementById(id).classList.remove('active'); }

    // ===== MENU =====
    setupMenuListeners() {
        document.querySelectorAll('#difficulty-buttons .glass-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.sound.init();
                this.sound.play('click');
                this.difficulty = btn.dataset.difficulty;
                this.showScreen('screen-time');
            });
        });

        document.querySelectorAll('#time-buttons .glass-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.sound.play('click');
                this.timeLimit = parseInt(btn.dataset.time);
                if (this.difficulty === 'friend') {
                    this.playerColor = 'w';
                    this.startGame();
                } else {
                    this.showScreen('screen-side');
                }
            });
        });

        document.getElementById('time-back').addEventListener('click', () => {
            this.sound.play('click');
            this.showScreen('screen-menu');
        });

        document.querySelectorAll('[data-side]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.sound.play('click');
                const side = btn.dataset.side;
                if (side === 'random') {
                    this.playerColor = Math.random() < 0.5 ? 'w' : 'b';
                    showToast(`You are playing as ${this.playerColor === 'w' ? 'White ♔' : 'Black ♚'}`);
                } else {
                    this.playerColor = side === 'white' ? 'w' : 'b';
                }
                this.startGame();
            });
        });

        document.getElementById('side-back').addEventListener('click', () => {
            this.sound.play('click');
            this.showScreen('screen-time');
        });

        document.getElementById('btn-play-again').addEventListener('click', () => {
            this.sound.play('click');
            this.hideOverlay('overlay-gameover');
            this.cleanupGame();
            this.showScreen('screen-menu');
        });

        document.getElementById('resign-white').addEventListener('click', () => {
            this.sound.play('click');
            this.hideOverlay('overlay-resign');
            this.endGame('Black Wins!', 'White Resigned', '🏳️');
        });
        document.getElementById('resign-black').addEventListener('click', () => {
            this.sound.play('click');
            this.hideOverlay('overlay-resign');
            this.endGame('White Wins!', 'Black Resigned', '🏳️');
        });
    }

    // ===== START GAME =====
    startGame() {
        this.chess = new Chess();
        this.gameOver = false;
        this.selectedSquare = null;
        this.legalMoves = [];
        this.hintMove = null;
        this.aiThinking = false;
        this.capturedByWhite = [];
        this.capturedByBlack = [];
        this.checksGiven = 0;
        this.captureCount = 0;
        this.totalThinkTime = 0;
        this.brilliantMoves = 0;
        this.moveStartTime = Date.now();
        this.cleanupGame();
        this.viewColor = this.playerColor;

        if (this.difficulty === 'friend') {
            this.useAI = false;
            this.undosLeft = 15;
        } else {
            this.useAI = true;
            this.createAIWorker();
            this.undosLeft = 15;
        }

        if (this.timeLimit > 0) {
            this.whiteTime = this.timeLimit;
            this.blackTime = this.timeLimit;
            this.lastTimeUpdate = Date.now();
            this.startTimer();
        } else {
            this.whiteTime = 0; this.blackTime = 0;
        }

        this.updatePlayerNames();
        this.showScreen('screen-game');
        this.buildBoard();
        this.updateUI();

        // Particles
        const canvas = document.getElementById('particles-canvas');
        const boardEl = document.getElementById('board-container');
        this.particles = new ParticleSystem(canvas);
        setTimeout(() => this.particles.resize(boardEl.offsetWidth, boardEl.offsetHeight), 100);

        // Move history
        document.getElementById('move-list').innerHTML = '';
        document.getElementById('move-counter').textContent = '0 moves';

        // Clear arrows
        this.clearArrows();

        // Request initial eval
        this.requestEval();

        // AI first move if player is black
        if (this.useAI && this.playerColor === 'b') {
            this.aiThinking = true;
            this.updateUI();
            setTimeout(() => this.requestAIMove(), 400);
        }
    }

    updatePlayerNames() {
        const isFlipped = this.viewColor === 'b';
        if (this.difficulty === 'friend') {
            document.getElementById('opponent-name').textContent = isFlipped ? 'White' : 'Black';
            document.getElementById('player-name').textContent = isFlipped ? 'Black' : 'White';
        } else {
            const aiColor = this.playerColor === 'w' ? 'Black' : 'White';
            const youColor = this.playerColor === 'w' ? 'White' : 'Black';
            if (isFlipped) {
                document.getElementById('opponent-name').textContent = `${aiColor === 'Black' ? 'White' : 'Black'} (AI)`;
                document.getElementById('player-name').textContent = `${youColor === 'White' ? 'Black' : 'White'} (You)`;
            }
            // Regular orientation
            if (!isFlipped) {
                document.getElementById('opponent-name').textContent = `${aiColor} (AI)`;
                document.getElementById('player-name').textContent = `${youColor} (You)`;
            }
        }
    }

    // ===== BOARD =====
    buildBoard() {
        const board = document.getElementById('chess-board');
        board.innerHTML = '';
        const flipped = this.viewColor === 'b';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const dr = flipped ? 7 - row : row;
                const dc = flipped ? 7 - col : col;
                const file = String.fromCharCode(97 + dc);
                const rank = 8 - dr;
                const sqId = file + rank;
                const sq = document.createElement('div');
                sq.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                sq.dataset.square = sqId;
                const piece = this.chess.get(sqId);
                if (piece) {
                    const img = document.createElement('img');
                    img.className = 'piece';
                    img.src = this.getPieceUrl(piece);
                    img.alt = piece.color + piece.type;
                    img.draggable = false;
                    sq.appendChild(img);
                }
                board.appendChild(sq);
            }
        }
        this.buildLabels();
    }

    buildLabels() {
        const flipped = this.viewColor === 'b';
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
        const fileEl = document.getElementById('file-labels');
        const rankEl = document.getElementById('rank-labels');
        fileEl.innerHTML = ''; rankEl.innerHTML = '';
        for (let i = 0; i < 8; i++) {
            const fi = flipped ? 7 - i : i;
            const ri = flipped ? 7 - i : i;
            fileEl.innerHTML += `<span>${files[fi]}</span>`;
            rankEl.innerHTML += `<span>${ranks[ri]}</span>`;
        }
    }

    getPieceUrl(piece) {
        return PIECE_URLS[(piece.color === 'w' ? 'w' : 'b') + piece.type.toUpperCase()] || '';
    }

    refreshBoard() {
        const flipped = this.viewColor === 'b';
        const squares = document.querySelectorAll('.square');
        const history = this.chess.history({ verbose: true });
        const lastMove = history.length > 0 ? history[history.length - 1] : null;
        const inCheck = this.chess.in_check();
        let idx = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const dr = flipped ? 7 - row : row;
                const dc = flipped ? 7 - col : col;
                const file = String.fromCharCode(97 + dc);
                const rank = 8 - dr;
                const sqId = file + rank;
                const sq = squares[idx];
                sq.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                sq.dataset.square = sqId;
                if (lastMove && (sqId === lastMove.from || sqId === lastMove.to)) sq.classList.add('last-move');
                if (this.selectedSquare === sqId) sq.classList.add('selected');
                if (inCheck) {
                    const p = this.chess.get(sqId);
                    if (p && p.type === 'k' && p.color === this.chess.turn()) sq.classList.add('check-glow');
                }
                if (this.hintMove) {
                    if (sqId === this.hintMove.from) sq.classList.add('hint-from');
                    if (sqId === this.hintMove.to) sq.classList.add('hint-to');
                }
                sq.innerHTML = '';
                const piece = this.chess.get(sqId);
                if (piece) {
                    const img = document.createElement('img');
                    img.className = 'piece';
                    img.src = this.getPieceUrl(piece);
                    img.alt = piece.color + piece.type;
                    img.draggable = false;
                    sq.appendChild(img);
                }
                if (this.selectedSquare) {
                    const isLegal = this.legalMoves.some(m => m.to === sqId);
                    if (isLegal) {
                        if (piece) {
                            const ring = document.createElement('div');
                            ring.className = 'capture-ring';
                            sq.appendChild(ring);
                        } else {
                            const dot = document.createElement('div');
                            dot.className = 'move-dot';
                            sq.appendChild(dot);
                        }
                    }
                }
                idx++;
            }
        }
        // Draw arrows
        this.drawArrows(lastMove);
    }

    // ===== ARROWS (SVG overlay) =====
    getSquareCenter(sqId) {
        const flipped = this.viewColor === 'b';
        const file = sqId.charCodeAt(0) - 97;
        const rank = 8 - parseInt(sqId[1]);
        const col = flipped ? 7 - file : file;
        const row = flipped ? 7 - rank : rank;
        const sqSize = document.getElementById('board-container').offsetWidth / 8;
        return { x: col * sqSize + sqSize / 2, y: row * sqSize + sqSize / 2 };
    }

    drawArrows(lastMove) {
        const svg = document.getElementById('arrow-svg');
        svg.innerHTML = '';
        // Defs for arrowheads
        svg.innerHTML = `
            <defs>
                <marker id="arrowhead-last" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="var(--arrow-color)"/>
                </marker>
                <marker id="arrowhead-hint" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="var(--arrow-hint)"/>
                </marker>
            </defs>
        `;
        // Last move arrow
        if (lastMove) {
            const from = this.getSquareCenter(lastMove.from);
            const to = this.getSquareCenter(lastMove.to);
            svg.innerHTML += `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="var(--arrow-color)" stroke-width="5" stroke-opacity="0.5" stroke-linecap="round" marker-end="url(#arrowhead-last)"/>`;
        }
        // Hint arrow
        if (this.hintMove) {
            const from = this.getSquareCenter(this.hintMove.from);
            const to = this.getSquareCenter(this.hintMove.to);
            svg.innerHTML += `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="var(--arrow-hint)" stroke-width="6" stroke-opacity="0.7" stroke-linecap="round" marker-end="url(#arrowhead-hint)"/>`;
        }
    }

    clearArrows() {
        const svg = document.getElementById('arrow-svg');
        if (svg) svg.innerHTML = '';
    }

    // ===== INTERACTION =====
    setupGameListeners() {
        const board = document.getElementById('chess-board');

        board.addEventListener('mousedown', (e) => {
            if (this.gameOver || this.aiThinking) return;
            const sq = e.target.closest('.square');
            if (!sq) return;
            const sqId = sq.dataset.square;
            const piece = this.chess.get(sqId);
            if (this.useAI && this.chess.turn() !== this.playerColor) return;
            if (piece && piece.color === this.chess.turn()) {
                this.selectSquare(sqId);
                const pieceEl = sq.querySelector('.piece');
                if (pieceEl) this.startDrag(pieceEl, e, sqId);
            } else if (this.selectedSquare) {
                this.tryMove(this.selectedSquare, sqId);
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (this.dragElement) {
                this.dragElement.style.left = (e.clientX - 28) + 'px';
                this.dragElement.style.top = (e.clientY - 28) + 'px';
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (!this.dragElement) return;
            const el = document.elementFromPoint(e.clientX, e.clientY);
            const sq = el?.closest('.square');
            if (sq && this.selectedSquare) {
                this.tryMove(this.selectedSquare, sq.dataset.square);
            }
            this.endDrag();
        });

        // ===== BUTTONS =====
        document.getElementById('btn-resign').addEventListener('click', () => {
            this.sound.play('click');
            if (this.gameOver) return;
            if (this.difficulty === 'friend') {
                this.showOverlay('overlay-resign');
            } else {
                this.endGame('Opponent Wins!', 'You Resigned', '🏳️');
            }
        });

        document.getElementById('btn-hint').addEventListener('click', () => this.requestHint());

        document.getElementById('btn-undo').addEventListener('click', () => this.doUndo());

        document.getElementById('btn-flip').addEventListener('click', () => {
            this.sound.play('click');
            this.viewColor = this.viewColor === 'w' ? 'b' : 'w';
            this.updatePlayerNames();
            this.buildBoard();
            this.refreshBoard();
            this.updateCapturedDisplay();
            this.updateTurnIndicator();
        });

        document.getElementById('btn-theme').addEventListener('click', () => this.cycleTheme());

        document.getElementById('btn-sound').addEventListener('click', () => {
            const on = this.sound.toggle();
            const icon = document.getElementById('sound-icon');
            if (on) {
                icon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>';
                this.sound.play('click');
                showToast('🔊 Sound On');
            } else {
                icon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>';
                showToast('🔇 Sound Off');
            }
        });

        document.getElementById('btn-copy-fen').addEventListener('click', () => {
            navigator.clipboard.writeText(this.chess.fen()).then(() => {
                showToast('📋 FEN copied to clipboard!');
                this.sound.play('click');
            }).catch(() => showToast('Failed to copy FEN'));
        });

        document.getElementById('btn-copy-pgn').addEventListener('click', () => {
            navigator.clipboard.writeText(this.chess.pgn()).then(() => {
                showToast('📋 PGN copied to clipboard!');
                this.sound.play('click');
            }).catch(() => showToast('Failed to copy PGN'));
        });

        document.getElementById('btn-new-game').addEventListener('click', () => {
            this.sound.play('click');
            if (!this.gameOver) {
                if (!confirm('Abandon current game and start a new one?')) return;
            }
            this.cleanupGame();
            this.showScreen('screen-menu');
        });
    }

    // ===== KEYBOARD SHORTCUTS =====
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only when game screen is active
            if (!document.getElementById('screen-game').classList.contains('active')) return;
            // Don't trigger if overlay is open
            if (document.querySelector('.overlay.active')) return;

            switch (e.key.toLowerCase()) {
                case 'h': this.requestHint(); break;
                case 'f': document.getElementById('btn-flip').click(); break;
                case 't': this.cycleTheme(); break;
                case 's': document.getElementById('btn-sound').click(); break;
                case 'n': document.getElementById('btn-new-game').click(); break;
                case 'z':
                    if (e.ctrlKey || e.metaKey) { e.preventDefault(); this.doUndo(); }
                    break;
                case 'escape':
                    this.selectedSquare = null; this.legalMoves = [];
                    this.refreshBoard();
                    break;
            }
        });
    }

    cycleTheme() {
        this.sound.play('click');
        this.currentThemeIdx = (this.currentThemeIdx + 1) % this.themes.length;
        document.body.className = this.themes[this.currentThemeIdx].cls;
        document.getElementById('theme-label').textContent = this.themes[this.currentThemeIdx].name;
        showToast(`🎨 Theme: ${this.themes[this.currentThemeIdx].name}`);
    }

    // ===== HINT (infinite, uses worker) =====
    requestHint() {
        if (this.gameOver || this.aiThinking) return;
        this.sound.play('hint');

        // Create a temporary worker for hint (always works, even in friend mode)
        const blob = new Blob([AI_WORKER_CODE], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        const hintWorker = new Worker(url);
        URL.revokeObjectURL(url);

        showToast('🔮 Calculating best move...');

        hintWorker.onmessage = (e) => {
            if (e.data.type === 'hint') {
                this.handleHintResponse(e.data.from, e.data.to, e.data.san);
            }
            hintWorker.terminate();
        };
        hintWorker.onerror = () => {
            showToast('Hint failed — try again');
            hintWorker.terminate();
        };
        hintWorker.postMessage({ type: 'getHint', fen: this.chess.fen(), difficulty: 'hard' });
    }

    handleHintResponse(from, to, san) {
        if (!from || !to) { showToast('No hints available'); return; }
        this.hintMove = { from, to };
        this.refreshBoard();
        showToast(`💡 Suggested: ${san || (from + ' → ' + to)}`);
        setTimeout(() => {
            this.hintMove = null;
            this.refreshBoard();
        }, 4000);
    }

    // ===== UNDO (15 available) =====
    doUndo() {
        if (this.undosLeft <= 0 || this.gameOver || this.aiThinking) return;
        if (this.chess.history().length === 0) return;
        this.sound.play('click');
        this.undosLeft--;
        const count = this.useAI ? 2 : 1;
        for (let i = 0; i < count; i++) {
            if (this.chess.history().length > 0) {
                const undone = this.chess.undo();
                if (undone && undone.captured) this.removeCaptured(undone);
            }
        }
        this.selectedSquare = null; this.legalMoves = []; this.hintMove = null;
        this.rebuildMoveHistory();
        this.updateUI();
        this.refreshBoard();
        this.requestEval();
        showToast(`↩️ Undo! (${this.undosLeft} left)`);
    }

    selectSquare(sqId) {
        this.selectedSquare = sqId;
        this.hintMove = null;
        this.legalMoves = this.chess.moves({ square: sqId, verbose: true });
        this.refreshBoard();
    }

    startDrag(pieceEl, e, fromSquare) {
        this.draggingFrom = fromSquare;
        this.dragElement = pieceEl.cloneNode(true);
        this.dragElement.classList.add('dragging');
        this.dragElement.style.width = '56px';
        this.dragElement.style.height = '56px';
        this.dragElement.style.left = (e.clientX - 28) + 'px';
        this.dragElement.style.top = (e.clientY - 28) + 'px';
        document.body.appendChild(this.dragElement);
        pieceEl.style.opacity = '0.25';
        this.originalPieceEl = pieceEl;
    }

    endDrag() {
        if (this.dragElement) { this.dragElement.remove(); this.dragElement = null; }
        if (this.originalPieceEl) { this.originalPieceEl.style.opacity = '1'; this.originalPieceEl = null; }
    }

    tryMove(from, to) {
        const move = this.legalMoves.find(m => m.from === from && m.to === to);
        if (!move) {
            this.selectedSquare = null; this.legalMoves = [];
            this.refreshBoard();
            return;
        }
        if (move.flags.includes('p')) {
            this.showPromotionUI(from, to);
            return;
        }
        this.executeMove(from, to);
    }

    executeMove(from, to, promotion = null) {
        // Save FEN before the move for brilliant check
        const preFen = this.chess.fen();

        const moveObj = { from, to };
        if (promotion) moveObj.promotion = promotion;
        const result = this.chess.move(moveObj);
        if (!result) return;

        // Track think time
        const thinkTime = Date.now() - this.moveStartTime;
        this.totalThinkTime += thinkTime;
        this.moveStartTime = Date.now();

        if (result.captured) {
            this.trackCapture(result);
            this.sound.play('capture');
            this.captureCount++;
            this.triggerCaptureEffects(to);
        } else {
            this.sound.play('move');
        }
        if (this.chess.in_check()) {
            this.sound.play('check');
            this.checksGiven++;
        }

        this.selectedSquare = null; this.legalMoves = []; this.hintMove = null;
        this.refreshBoard();
        this.updateMoveHistory(result);
        this.updateUI();
        this.requestEval();

        // Check for brilliant move (only for eligible time controls)
        this.checkBrilliantMove(preFen, result.san, result.color);

        if (this.chess.game_over()) { this.handleGameOver(); return; }
        if (this.useAI && this.chess.turn() !== this.playerColor) {
            this.aiThinking = true;
            this.updateUI();
            setTimeout(() => this.requestAIMove(), 200);
        }
    }

    // ===== AI =====
    requestAIMove() {
        if (this.gameOver || !this.useAI || !this.aiWorker) {
            this.aiThinking = false; this.updateUI(); return;
        }
        this.aiThinking = true;
        this.updateUI();
        this.aiWorker.postMessage({
            type: 'getMove', fen: this.chess.fen(), difficulty: this.difficulty
        });
    }

    handleAIResponse(moveSan) {
        if (this.gameOver) { this.aiThinking = false; this.updateUI(); return; }
        if (!moveSan) { this.aiThinking = false; this.updateUI(); return; }

        // Save FEN before AI move for brilliant check
        const preFen = this.chess.fen();

        const result = this.chess.move(moveSan);
        if (!result) { this.aiThinking = false; this.updateUI(); return; }

        this.moveStartTime = Date.now();

        if (result.captured) {
            this.trackCapture(result);
            this.sound.play('capture');
            this.captureCount++;
            this.triggerCaptureEffects(result.to);
        } else {
            this.sound.play('move');
        }
        if (this.chess.in_check()) { this.sound.play('check'); this.checksGiven++; }

        this.refreshBoard();
        this.updateMoveHistory(result);
        this.aiThinking = false;
        this.updateUI();
        this.requestEval();

        // Check for brilliant move (AI can get bonus too)
        this.checkBrilliantMove(preFen, result.san, result.color);

        if (this.chess.game_over()) this.handleGameOver();
    }

    // ===== BRILLIANT MOVE CHECK =====
    checkBrilliantMove(preFen, playedSan, moverColor) {
        // Only award bonus for 1/5/15 minute time controls
        if (this.timeLimit <= 0 || this.timeLimit > 900) return;

        try {
            const blob = new Blob([AI_WORKER_CODE], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            const bw = new Worker(url);
            URL.revokeObjectURL(url);
            bw.onmessage = (e) => {
                if (e.data.type === 'bestMove') {
                    this.handleBrilliantResult(e.data.bestSan, e.data.playedSan, e.data.moverColor);
                }
                bw.terminate();
            };
            bw.onerror = () => bw.terminate();
            bw.postMessage({ type: 'bestMove', fen: preFen, difficulty: 'hard', playedSan, moverColor });
        } catch (e) { /* brilliant check is optional */ }
    }

    handleBrilliantResult(bestSan, playedSan, moverColor) {
        if (!bestSan || !playedSan) return;
        if (bestSan !== playedSan) return;
        if (this.gameOver) return;

        // It's a brilliant move! Award +20s
        const bonus = 20;
        if (moverColor === 'w') this.whiteTime += bonus;
        else this.blackTime += bonus;

        this.brilliantMoves++;
        this.sound.play('brilliant');
        this.updateTimerDisplay();

        // Golden particles on the board center as celebration
        if (this.particles) {
            const boardEl = document.getElementById('board-container');
            const w = boardEl.offsetWidth, h = boardEl.offsetHeight;
            this.particles.spawn(w / 2, h / 2, [255, 215, 0]); // gold
            this.particles.spawn(w / 2 - 40, h / 2 + 20, [255, 200, 50]);
            this.particles.spawn(w / 2 + 40, h / 2 - 20, [255, 230, 80]);
        }

        const who = this.useAI
            ? (moverColor === this.playerColor ? 'You' : 'AI')
            : (moverColor === 'w' ? 'White' : 'Black');
        showToast(`✨ Brilliant Move by ${who}! +${bonus}s`, 3000);
    }

    // ===== EVAL BAR =====
    requestEval() {
        // Create a temporary worker for eval
        try {
            const blob = new Blob([AI_WORKER_CODE], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            const evalWorker = new Worker(url);
            URL.revokeObjectURL(url);
            evalWorker.onmessage = (e) => {
                if (e.data.type === 'eval') this.handleEvalResponse(e.data.score);
                evalWorker.terminate();
            };
            evalWorker.onerror = () => evalWorker.terminate();
            evalWorker.postMessage({ type: 'eval', fen: this.chess.fen(), difficulty: 'medium' });
        } catch (e) { /* eval is optional */ }
    }

    handleEvalResponse(score) {
        // score is in centipawns from white's perspective
        const cp = score / 100;
        const clamped = Math.max(-10, Math.min(10, cp));
        const pct = 50 + (clamped / 10) * 50; // 0-100%
        document.getElementById('eval-white').style.height = pct + '%';
        const display = cp > 0 ? `+${cp.toFixed(1)}` : cp.toFixed(1);
        document.getElementById('eval-score').textContent = display;
    }

    // ===== CAPTURED PIECES =====
    trackCapture(move) {
        const capturedPiece = { type: move.captured, color: move.color === 'w' ? 'b' : 'w' };
        if (move.color === 'w') this.capturedByWhite.push(capturedPiece);
        else this.capturedByBlack.push(capturedPiece);
        this.updateCapturedDisplay();
    }

    removeCaptured(move) {
        const list = move.color === 'w' ? this.capturedByWhite : this.capturedByBlack;
        const idx = list.findIndex(p => p.type === move.captured);
        if (idx !== -1) list.splice(idx, 1);
        this.updateCapturedDisplay();
    }

    updateCapturedDisplay() {
        const isFlipped = this.viewColor === 'b';
        const topCap = isFlipped ? this.capturedByWhite : this.capturedByBlack;
        const botCap = isFlipped ? this.capturedByBlack : this.capturedByWhite;
        const render = (arr) => [...arr].sort((a, b) => PIECE_VALUES[b.type] - PIECE_VALUES[a.type])
            .map(p => `<img src="${PIECE_URLS[(p.color === 'w' ? 'w' : 'b') + p.type.toUpperCase()]}" alt="${p.type}">`).join('');
        document.getElementById('opponent-captured').innerHTML = render(topCap);
        document.getElementById('player-captured').innerHTML = render(botCap);

        const wMat = this.capturedByWhite.reduce((s, p) => s + PIECE_VALUES[p.type], 0);
        const bMat = this.capturedByBlack.reduce((s, p) => s + PIECE_VALUES[p.type], 0);
        const diff = wMat - bMat;
        const pEl = document.getElementById('player-material');
        const oEl = document.getElementById('opponent-material');
        if (diff > 0) {
            if (isFlipped) { oEl.textContent = ''; pEl.textContent = `+${diff}`; }
            else { pEl.textContent = `+${diff}`; oEl.textContent = ''; }
        } else if (diff < 0) {
            if (isFlipped) { pEl.textContent = ''; oEl.textContent = `+${Math.abs(diff)}`; }
            else { oEl.textContent = `+${Math.abs(diff)}`; pEl.textContent = ''; }
        } else { pEl.textContent = ''; oEl.textContent = ''; }
    }

    // ===== MOVE HISTORY =====
    updateMoveHistory(move) {
        const history = this.chess.history();
        const moveList = document.getElementById('move-list');
        const total = history.length;
        // Remove 'move-latest' from all
        moveList.querySelectorAll('.move-latest').forEach(el => el.classList.remove('move-latest'));
        if (total % 2 === 1) {
            const row = document.createElement('div');
            row.className = 'move-row';
            row.innerHTML = `<span class="move-num">${Math.ceil(total / 2)}.</span><span class="move-white move-latest">${move.san}</span><span class="move-black"></span>`;
            moveList.appendChild(row);
        } else {
            const rows = moveList.querySelectorAll('.move-row');
            const last = rows[rows.length - 1];
            if (last) {
                const blackSpan = last.querySelector('.move-black');
                if (blackSpan) { blackSpan.textContent = move.san; blackSpan.classList.add('move-latest'); }
            }
        }
        document.getElementById('move-counter').textContent = `${total} moves`;
        moveList.scrollTop = moveList.scrollHeight;
    }

    rebuildMoveHistory() {
        const history = this.chess.history();
        const moveList = document.getElementById('move-list');
        moveList.innerHTML = '';
        for (let i = 0; i < history.length; i += 2) {
            const row = document.createElement('div');
            row.className = 'move-row';
            const num = Math.floor(i / 2) + 1;
            const w = history[i] || '';
            const b = history[i + 1] || '';
            const isLast = i + 2 >= history.length;
            row.innerHTML = `<span class="move-num">${num}.</span><span class="move-white ${isLast && !b ? 'move-latest' : ''}">${w}</span><span class="move-black ${isLast && b ? 'move-latest' : ''}">${b}</span>`;
            moveList.appendChild(row);
        }
        document.getElementById('move-counter').textContent = `${history.length} moves`;
        // Rebuild captured from scratch
        this.capturedByWhite = [];
        this.capturedByBlack = [];
        const full = this.chess.history({ verbose: true });
        for (const m of full) { if (m.captured) this.trackCapture(m); }
    }

    // ===== PROMOTION =====
    showPromotionUI(from, to) {
        this.endDrag();
        const div = document.getElementById('promotion-options');
        div.innerHTML = '';
        const color = this.chess.turn();
        ['q', 'r', 'b', 'n'].forEach(p => {
            const btn = document.createElement('button');
            btn.className = 'glass-btn';
            const key = (color === 'w' ? 'w' : 'b') + p.toUpperCase();
            btn.innerHTML = `<img src="${PIECE_URLS[key]}" alt="${p}" style="width:44px;height:44px">`;
            btn.addEventListener('click', () => {
                this.sound.play('clink');
                this.hideOverlay('overlay-promotion');
                this.executeMove(from, to, p);
            });
            div.appendChild(btn);
        });
        this.showOverlay('overlay-promotion');
    }

    // ===== EFFECTS =====
    triggerCaptureEffects(sqId) {
        const wrapper = document.getElementById('board-container');
        wrapper.classList.remove('shake');
        void wrapper.offsetWidth;
        wrapper.classList.add('shake');
        setTimeout(() => wrapper.classList.remove('shake'), 400);
        if (this.particles) {
            const sq = document.querySelector(`.square[data-square="${sqId}"]`);
            if (sq) {
                const rect = sq.getBoundingClientRect();
                const boardRect = wrapper.getBoundingClientRect();
                this.particles.spawn(
                    rect.left - boardRect.left + rect.width / 2,
                    rect.top - boardRect.top + rect.height / 2,
                    [255, 80, 80]
                );
            }
        }
    }

    // ===== TIMER =====
    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.lastTimeUpdate = Date.now();
        this.timerInterval = setInterval(() => {
            if (this.gameOver) return;
            const now = Date.now();
            const dt = (now - this.lastTimeUpdate) / 1000;
            this.lastTimeUpdate = now;
            if (this.chess.turn() === 'w') this.whiteTime -= dt;
            else this.blackTime -= dt;
            if (this.whiteTime <= 0) { this.whiteTime = 0; this.endGame('Black Wins!', 'White ran out of time', '⏰'); }
            else if (this.blackTime <= 0) { this.blackTime = 0; this.endGame('White Wins!', 'Black ran out of time', '⏰'); }
            this.updateTimerDisplay();
        }, 100);
    }

    updateTimerDisplay() {
        const fmt = (s) => {
            if (!s || s <= 0) return '00:00';
            return `${Math.floor(s / 60).toString().padStart(2, '0')}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
        };
        const isFlipped = this.viewColor === 'b';
        const top = document.getElementById('timer-opponent');
        const bot = document.getElementById('timer-player');
        if (this.timeLimit > 0) {
            if (isFlipped) {
                top.textContent = fmt(this.whiteTime); bot.textContent = fmt(this.blackTime);
                top.classList.toggle('timer-low', this.whiteTime < 30);
                bot.classList.toggle('timer-low', this.blackTime < 30);
            } else {
                top.textContent = fmt(this.blackTime); bot.textContent = fmt(this.whiteTime);
                top.classList.toggle('timer-low', this.blackTime < 30);
                bot.classList.toggle('timer-low', this.whiteTime < 30);
            }
        } else { top.textContent = '--:--'; bot.textContent = '--:--'; }
    }

    // ===== TURN INDICATOR =====
    updateTurnIndicator() {
        const isFlipped = this.viewColor === 'b';
        const turn = this.chess.turn();
        const topBar = document.getElementById('opponent-bar');
        const botBar = document.getElementById('player-bar');

        // Determine which color is on top vs bottom
        const topColor = isFlipped ? 'w' : 'b';
        const botColor = isFlipped ? 'b' : 'w';

        topBar.classList.toggle('active-turn', turn === topColor);
        botBar.classList.toggle('active-turn', turn === botColor);
    }

    // ===== GAME OVER =====
    handleGameOver() {
        let title = 'Game Over', reason = '', icon = '🤝';
        if (this.chess.in_checkmate()) {
            const loser = this.chess.turn();
            if (this.useAI) {
                if (loser === this.playerColor) {
                    title = 'Defeat'; reason = 'Checkmate'; icon = '💀';
                    this.sound.play('defeat');
                } else {
                    title = 'Victory!'; reason = 'Checkmate'; icon = '👑';
                    this.sound.play('victory');
                }
            } else {
                title = `${loser === 'w' ? 'Black' : 'White'} Wins!`; reason = 'Checkmate'; icon = '👑';
            }
        } else if (this.chess.in_stalemate()) {
            title = 'Draw'; reason = 'Stalemate'; icon = '🤝';
        } else if (this.chess.in_draw()) {
            title = 'Draw'; reason = 'Insufficient Material'; icon = '🤝';
        }
        this.endGame(title, reason, icon);
    }

    endGame(title, reason, icon = '🏁') {
        this.gameOver = true;
        if (this.timerInterval) clearInterval(this.timerInterval);

        document.getElementById('gameover-icon').textContent = icon;
        document.getElementById('gameover-title').textContent = title;
        document.getElementById('gameover-reason').textContent = reason;
        document.getElementById('gameover-rounds').textContent = `Total Moves: ${this.chess.history().length}`;

        // Game stats
        const statsEl = document.getElementById('gameover-stats');
        const avgTime = this.chess.history().length > 0
            ? (this.totalThinkTime / this.chess.history().length / 1000).toFixed(1) + 's'
            : '0s';
        statsEl.innerHTML = `
            <div class="stat"><span class="stat-val">${this.captureCount}</span>Captures</div>
            <div class="stat"><span class="stat-val">${this.checksGiven}</span>Checks</div>
            <div class="stat"><span class="stat-val">${this.brilliantMoves}</span>✨ Brilliant</div>
            <div class="stat"><span class="stat-val">${avgTime}</span>Avg/Move</div>
        `;

        document.getElementById('gameover-timer-fill').style.width = '100%';
        document.getElementById('gameover-countdown').textContent = '5';
        this.showOverlay('overlay-gameover');

        const start = Date.now();
        this.gameOverTimer = setInterval(() => {
            const elapsed = (Date.now() - start) / 1000;
            const remaining = Math.max(0, 5 - elapsed);
            document.getElementById('gameover-countdown').textContent = Math.ceil(remaining);
            document.getElementById('gameover-timer-fill').style.width = `${(remaining / 5) * 100}%`;
            if (remaining <= 0) {
                this.cleanupGame();
                this.hideOverlay('overlay-gameover');
                this.showScreen('screen-menu');
            }
        }, 50);
    }

    cleanupGame() {
        if (this.gameOverTimer) { clearInterval(this.gameOverTimer); this.gameOverTimer = null; }
        if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
        if (this.aiWorker) { this.aiWorker.terminate(); this.aiWorker = null; }
    }

    // ===== UI UPDATE =====
    updateUI() {
        document.getElementById('undos-count').textContent = this.undosLeft;
        this.updateTimerDisplay();
        this.updateCapturedDisplay();
        this.updateTurnIndicator();

        // Show/hide hint & undo based on mode
        const hintBtn = document.getElementById('btn-hint');
        const undoBtn = document.getElementById('btn-undo');
        hintBtn.style.display = 'inline-flex'; // Always show hints now
        undoBtn.style.display = 'inline-flex';

        // Status
        const status = document.getElementById('game-status');
        if (this.chess.in_check() && !this.gameOver) {
            status.textContent = '⚠ CHECK!';
            status.className = 'status-bar';
        } else if (this.aiThinking) {
            status.textContent = '🤔 AI is thinking...';
            status.className = 'status-bar thinking';
        } else {
            status.textContent = '';
            status.className = 'status-bar';
        }
    }
}

// ===== LAUNCH =====
window.addEventListener('DOMContentLoaded', () => {
    window.game = new ChessGame();
});
