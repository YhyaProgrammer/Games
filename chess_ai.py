import chess
import random

# --- Piece-Square Tables (Simplified) ---
# Positive values incentivize occupying those squares

PAWN_TABLE = [
    0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
    5,  5, 10, 25, 25, 10,  5,  5,
    0,  0,  0, 20, 20,  0,  0,  0,
    5, -5,-10,  0,  0,-10, -5,  5,
    5, 10, 10,-20,-20, 10, 10,  5,
    0,  0,  0,  0,  0,  0,  0,  0
]

KNIGHT_TABLE = [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50,
]

BISHOP_TABLE = [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20,
]

ROOK_TABLE = [
    0,  0,  0,  0,  0,  0,  0,  0,
    5, 10, 10, 10, 10, 10, 10,  5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    0,  0,  0,  5,  5,  0,  0,  0
]

QUEEN_TABLE = [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5,  5,  5,  5,  0,-10,
    -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
    -10,  5,  5,  5,  5,  5,  0,-10,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20
]

KING_TABLE_MID = [
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
    20, 20,  0,  0,  0,  0, 20, 20,
    20, 30, 10,  0,  0, 10, 30, 20
]

class ChessBot:
    def __init__(self, level="easy"):
        self.level = level
        self.piece_values = {
            chess.PAWN: 100,
            chess.KNIGHT: 320,
            chess.BISHOP: 330,
            chess.ROOK: 500,
            chess.QUEEN: 900,
            chess.KING: 20000
        }

    def get_move(self, board):
        legal_moves = list(board.legal_moves)
        if not legal_moves:
            return None

        # Increase depths for a more challenging experience
        if self.level == "easy":
            return random.choice(legal_moves)
        elif self.level == "medium":
            return self.minimax_root(board, depth=3, is_maximizing=board.turn)
        elif self.level == "hard":
            return self.minimax_root(board, depth=4, is_maximizing=board.turn)
        elif self.level == "absolute":
            # Absolute uses depth 4 but we could try 5 if pruning is aggressive enough
            return self.minimax_root(board, depth=4, is_maximizing=board.turn)
        else:
            return random.choice(legal_moves)

    def evaluate_board(self, board):
        if board.is_checkmate():
            return -99999 if board.turn else 99999
        if board.is_stalemate() or board.is_insufficient_material():
            return 0
        
        score = 0
        piece_map = {
            chess.PAWN: (100, PAWN_TABLE),
            chess.KNIGHT: (320, KNIGHT_TABLE),
            chess.BISHOP: (330, BISHOP_TABLE),
            chess.ROOK: (500, ROOK_TABLE),
            chess.QUEEN: (900, QUEEN_TABLE),
            chess.KING: (20000, KING_TABLE_MID)
        }
        
        for square, piece in board.piece_map().items():
            material, table = piece_map[piece.piece_type]
            rank = chess.square_rank(square)
            file = chess.square_file(square)
            
            if piece.color == chess.WHITE:
                table_index = (7 - rank) * 8 + file
                pos_bonus = table[table_index] if table else 0
                score += (material + pos_bonus)
            else:
                mirrored_sq = chess.square_mirror(square)
                m_rank = chess.square_rank(mirrored_sq)
                m_file = chess.square_file(mirrored_sq)
                table_index = (7 - m_rank) * 8 + m_file
                pos_bonus = table[table_index] if table else 0
                score -= (material + pos_bonus)

        # Mobility Bonus
        mobility = board.legal_moves.count()
        if board.turn == chess.WHITE:
            score += mobility * 2
        else:
            score -= mobility * 2
            
        return score

    def move_ordering_score(self, board, move):
        score = 0
        piece_type = board.piece_at(move.from_square).piece_type
        
        # MVV-LVA: capturing a high value piece with a low value one
        if board.is_capture(move):
            victim = board.piece_at(move.to_square)
            if victim:
                score += 100 * self.piece_values[victim.piece_type] - self.piece_values[piece_type]
            else: # En passant
                score += 100
        
        # Promotion is good
        if move.promotion:
            score += 900
            
        if board.gives_check(move):
            score += 50
            
        return score

    def minimax_root(self, board, depth, is_maximizing):
        best_move = None
        best_eval = -float('inf') if is_maximizing else float('inf')
        
        alpha = -float('inf')
        beta = float('inf')
        
        moves = list(board.legal_moves)
        moves.sort(key=lambda m: self.move_ordering_score(board, m), reverse=True)
        
        for move in moves:
            board.push(move)
            value = self.minimax(board, depth - 1, alpha, beta, not is_maximizing)
            board.pop()
            
            if is_maximizing:
                if value > best_eval:
                    best_eval = value
                    best_move = move
                alpha = max(alpha, value)
            else:
                if value < best_eval:
                    best_eval = value
                    best_move = move
                beta = min(beta, value)
                
            if beta <= alpha:
                break
        
        return best_move if best_move else (random.choice(moves) if moves else None)

    def quiescence(self, board, alpha, beta, is_maximizing):
        # Tactical search for captures to avoid the horizon effect
        stand_pat = self.evaluate_board(board)
        
        if is_maximizing:
            if stand_pat >= beta: return beta
            if alpha < stand_pat: alpha = stand_pat
        else:
            if stand_pat <= alpha: return alpha
            if beta > stand_pat: beta = stand_pat

        # Only search captures in quiescence
        moves = [m for m in board.legal_moves if board.is_capture(m)]
        moves.sort(key=lambda m: self.move_ordering_score(board, m), reverse=True)
        
        for move in moves:
            board.push(move)
            score = self.quiescence(board, alpha, beta, not is_maximizing)
            board.pop()
            
            if is_maximizing:
                if score >= beta: return beta
                if score > alpha: alpha = score
            else:
                if score <= alpha: return alpha
                if score < beta: beta = score
        
        return alpha if is_maximizing else beta

    def minimax(self, board, depth, alpha, beta, is_maximizing):
        if board.is_game_over():
            return self.evaluate_board(board)
        
        if depth == 0:
            return self.quiescence(board, alpha, beta, is_maximizing)

        moves = list(board.legal_moves)
        # Sorting at every level significantly improves alpha-beta pruning efficiency
        moves.sort(key=lambda m: self.move_ordering_score(board, m), reverse=True)
        
        if is_maximizing:
            max_eval = -float('inf')
            for move in moves:
                board.push(move)
                eval = self.minimax(board, depth - 1, alpha, beta, False)
                board.pop()
                max_eval = max(max_eval, eval)
                alpha = max(alpha, eval)
                if beta <= alpha:
                    break
            return max_eval
        else:
            min_eval = float('inf')
            for move in moves:
                board.push(move)
                eval = self.minimax(board, depth - 1, alpha, beta, True)
                board.pop()
                min_eval = min(min_eval, eval)
                beta = min(beta, eval)
                if beta <= alpha:
                    break
            return min_eval
