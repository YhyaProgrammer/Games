import pygame
import sys
import chess
import random
from chess_ai import ChessBot

# --- Constants ---
WIDTH, HEIGHT = 500, 600  # More compact window
BOARD_SIZE = 400          # Slightly smaller board to fit screen
SQUARE_SIZE = BOARD_SIZE // 8
OFFSET_X = (WIDTH - BOARD_SIZE) // 2
OFFSET_Y = 80             # Adjusted for better vertical spacing

# Colors
COLOR_HIGHLIGHT = (255, 230, 100, 100)
COLOR_MOVES = (100, 200, 100, 128)
COLOR_TEXT_WHITE = (255, 255, 255)
COLOR_TEXT_BLACK = (20, 20, 20)
COLOR_BUTTON = (70, 130, 180)
COLOR_BUTTON_HOVER = (100, 160, 210)
COLOR_ATTACK = (200, 50, 50, 180) # Red for captures

UNICODE_PIECES = {
    'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
    'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
}

class ChessGame:
    def __init__(self):
        pygame.init()
        pygame.mixer.init()
        
        self.screen = pygame.display.set_mode((WIDTH, HEIGHT))
        pygame.display.set_caption("Chess Bot")
        self.clock = pygame.time.Clock()
        self.font_large = pygame.font.SysFont("segoe ui symbol", 40)
        self.font_small = pygame.font.SysFont("segoe ui", 20)
        self.font_menu = pygame.font.SysFont("segoe ui", 28)
        
        self.board = chess.Board()
        self.ai = None
        self.player_color = chess.WHITE
        self.selected_square = None
        self.dragging = False
        self.legal_moves = []
        self.difficulty = "easy"
        self.game_over = False
        self.winner = None
        
        self.hints_left = 10
        self.undos_left = 10
        self.max_hints = 10
        self.max_undos = 10
        self.hint_move = None
        
        self.time_limit = None 
        self.white_time = None
        self.black_time = None
        self.last_time_update = None
        
        self.animating_move = None 
        self.undo_stack_count = 0
        self.sound_enabled = True
        self.menu_transition_time = None
        self.undo_msg_time = 0
        self.friend_resign_choice = False
        
        # Player specific resources
        self.hints_white = 0
        self.hints_black = 0
        self.undos_white = 0
        self.undos_black = 0

        # --- Sounds (Synthesized) ---
        self.sounds = self.create_sounds()
            
        # --- Themes ---
        self.themes = {
            "classic": {"bg": (30, 30, 35), "light": (238, 216, 192), "dark": (166, 124, 82), "text": (255, 255, 255)},
            "midnight": {"bg": (10, 10, 20), "light": (100, 100, 150), "dark": (40, 40, 80), "text": (200, 200, 255)},
            "forest": {"bg": (20, 35, 20), "light": (200, 230, 200), "dark": (80, 120, 80), "text": (220, 255, 220)},
            "cyber": {"bg": (0, 0, 0), "light": (0, 255, 255), "dark": (155, 0, 155), "text": (0, 255, 0)},
            "sunset": {"bg": (40, 20, 40), "light": (255, 180, 100), "dark": (180, 60, 120), "text": (255, 220, 180)},
            "ocean": {"bg": (10, 30, 50), "light": (150, 220, 255), "dark": (20, 80, 130), "text": (200, 240, 255)},
            "monochrome": {"bg": (20, 20, 20), "light": (200, 200, 200), "dark": (80, 80, 80), "text": (255, 255, 255)},
            "blood": {"bg": (20, 0, 0), "light": (200, 50, 50), "dark": (80, 0, 0), "text": (255, 100, 100)},
            "gold": {"bg": (15, 15, 10), "light": (255, 215, 0), "dark": (130, 100, 20), "text": (255, 240, 150)}
        }
        self.theme_order = ["classic", "midnight", "forest", "cyber", "sunset", "ocean", "monochrome", "blood", "gold"]
        self.current_theme_idx = 0
        self.current_theme = self.themes[self.theme_order[self.current_theme_idx]]

    def create_sounds(self):
        sounds = {}
        # We'll use simple beeps
        import numpy as np
        
        def make_beep(freq, duration):
            sample_rate = 44100
            t = np.linspace(0, duration, int(sample_rate * duration), False)
            tone = np.sin(freq * t * 2 * np.pi)
            audio = (tone * 32767).astype(np.int16)
            # Create a 2D array [samples, channels]
            audio_2d = np.column_stack((audio, audio))
            return pygame.sndarray.make_sound(audio_2d)

        try:
            sounds['move'] = make_beep(440, 0.1)
            sounds['capture'] = make_beep(300, 0.15)
            sounds['check'] = make_beep(600, 0.2)
            sounds['click'] = make_beep(800, 0.05)
        except:
            print("Sound synthesis failed, continuing without sound.")
        return sounds

    def play_sound(self, name):
        if self.sound_enabled and name in self.sounds:
            self.sounds[name].play()

    def reset_game(self):
        self.board = chess.Board()
        self.selected_square = None
        self.game_over = False
        self.winner = None
        self.animating_move = None
        self.undo_stack_count = 0
        self.hint_move = None
        
        if self.difficulty == "easy":
            self.max_hints = 10; self.max_undos = 10
        elif self.difficulty == "medium":
            self.max_hints = 8; self.max_undos = 8
        elif self.difficulty == "hard":
            self.max_hints = 4; self.max_undos = 4
        elif self.difficulty == "absolute": # This acts as Extra Hard
            self.max_hints = 2; self.max_undos = 2
        else:
            self.max_hints = 10; self.max_undos = 10
            
        self.hints_left = self.max_hints
        self.undos_left = self.max_undos
        self.hints_white = self.max_hints
        self.hints_black = self.max_hints
        self.undos_white = self.max_undos
        self.undos_black = self.max_undos
        self.menu_transition_time = None
        
        if self.time_limit:
            self.white_time = self.time_limit
            self.black_time = self.time_limit
            self.last_time_update = pygame.time.get_ticks()
        else:
            self.white_time = None
            self.black_time = None

        if self.difficulty != "friend":
            self.ai = ChessBot(self.difficulty)
        else:
            self.ai = None

    def draw_text_centered(self, text, font, color, center_x, center_y):
        surface = font.render(text, True, color)
        rect = surface.get_rect(center=(center_x, center_y))
        self.screen.blit(surface, rect)

    def draw_time_menu(self):
        self.screen.fill(self.current_theme["bg"])
        self.draw_text_centered("Select Time Limit", self.font_menu, COLOR_TEXT_WHITE, WIDTH // 2, HEIGHT // 6)
        options = [("5 Min", 300), ("15 Min", 900), ("30 Min", 1800), ("No Time", None)]
        mouse_pos = pygame.mouse.get_pos()
        for i, (text, sec) in enumerate(options):
            rect = pygame.Rect(WIDTH // 2 - 100, HEIGHT // 3 + i * 70, 200, 50)
            color = COLOR_BUTTON_HOVER if rect.collidepoint(mouse_pos) else COLOR_BUTTON
            pygame.draw.rect(self.screen, color, rect, border_radius=10)
            self.draw_text_centered(text, self.font_small, COLOR_TEXT_WHITE, rect.centerx, rect.centery)
            if pygame.mouse.get_pressed()[0] and rect.collidepoint(mouse_pos):
                self.time_limit = sec
                self.play_sound('click')
                pygame.time.delay(200)
                return True
        pygame.display.flip()
        return False

    def draw_side_selection_menu(self):
        self.screen.fill(self.current_theme["bg"])
        self.draw_text_centered("Select Your Side", self.font_menu, COLOR_TEXT_WHITE, WIDTH // 2, HEIGHT // 4)
        options = [("White", chess.WHITE), ("Black", chess.BLACK)]
        mouse_pos = pygame.mouse.get_pos()
        for i, (text, val) in enumerate(options):
            rect = pygame.Rect(WIDTH // 2 - 100, HEIGHT // 2 + i * 70, 200, 50)
            color = COLOR_BUTTON_HOVER if rect.collidepoint(mouse_pos) else COLOR_BUTTON
            pygame.draw.rect(self.screen, color, rect, border_radius=10)
            self.draw_text_centered(text, self.font_small, COLOR_TEXT_WHITE, rect.centerx, rect.centery)
            if pygame.mouse.get_pressed()[0] and rect.collidepoint(mouse_pos):
                self.player_color = val
                self.play_sound('click')
                pygame.time.delay(200)
                return True
        pygame.display.flip()
        return False

    def draw_menu(self):
        difficulty_selected = False
        while not difficulty_selected:
            self.screen.fill(self.current_theme["bg"])
            self.draw_text_centered("CHESS BOT", self.font_menu, COLOR_TEXT_WHITE, WIDTH // 2, HEIGHT // 6)
            buttons = [("Easy AI", "easy"), ("Medium AI", "medium"), ("Hard AI", "hard"), ("Extra Hard", "absolute"), ("Friend", "friend")]
            mouse_pos = pygame.mouse.get_pos()
            for i, (text, mode) in enumerate(buttons):
                rect = pygame.Rect(WIDTH // 2 - 120, HEIGHT // 3 + i * 65, 240, 50)
                color = COLOR_BUTTON_HOVER if rect.collidepoint(mouse_pos) else COLOR_BUTTON
                pygame.draw.rect(self.screen, color, rect, border_radius=10)
                self.draw_text_centered(text, self.font_small, COLOR_TEXT_WHITE, rect.centerx, rect.centery)
                if pygame.mouse.get_pressed()[0] and rect.collidepoint(mouse_pos):
                    self.difficulty = mode
                    difficulty_selected = True
                    self.play_sound('click')
                    pygame.time.delay(200)
            for event in pygame.event.get():
                if event.type == pygame.QUIT: pygame.quit(); sys.exit()
            pygame.display.flip()
            self.clock.tick(60)
        while not self.draw_time_menu():
            for event in pygame.event.get():
                if event.type == pygame.QUIT: pygame.quit(); sys.exit()
            self.clock.tick(60)
        if self.difficulty != "friend":
            while not self.draw_side_selection_menu():
                for event in pygame.event.get():
                    if event.type == pygame.QUIT: pygame.quit(); sys.exit()
                self.clock.tick(60)
        self.reset_game()
        return False 

    def get_square_from_mouse(self, pos):
        x, y = pos
        if x < OFFSET_X or x > OFFSET_X + BOARD_SIZE or y < OFFSET_Y or y > OFFSET_Y + BOARD_SIZE:
            return None
        col = (x - OFFSET_X) // SQUARE_SIZE
        row = 7 - (y - OFFSET_Y) // SQUARE_SIZE
        if self.player_color == chess.BLACK:
            col = 7 - col
            row = 7 - row
        return chess.square(col, row)

    def get_square_center(self, square):
        col = chess.square_file(square)
        row = chess.square_rank(square)
        if self.player_color == chess.BLACK:
            col = 7 - col
            row = 7 - row
        x = OFFSET_X + col * SQUARE_SIZE + SQUARE_SIZE // 2
        y = OFFSET_Y + (7 - row) * SQUARE_SIZE + SQUARE_SIZE // 2
        return x, y

    def draw_board(self):
        theme = self.current_theme
        for r in range(8):
            for c in range(8):
                color = theme["light"] if (r + c) % 2 == 1 else theme["dark"]
                rect = pygame.Rect(OFFSET_X + c * SQUARE_SIZE, OFFSET_Y + (7 - r) * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE)
                pygame.draw.rect(self.screen, color, rect)
                if self.board.move_stack:
                    last_move = self.board.peek()
                    logical_c = c; logical_r = r
                    if self.player_color == chess.BLACK:
                        logical_c = 7 - c; logical_r = 7 - r
                    sq_idx = chess.square(logical_c, logical_r)
                    if sq_idx == last_move.from_square or sq_idx == last_move.to_square:
                         s = pygame.Surface((SQUARE_SIZE, SQUARE_SIZE), pygame.SRCALPHA)
                         s.fill(COLOR_HIGHLIGHT)
                         self.screen.blit(s, rect.topleft)

    def trigger_next_undo(self):
        if self.undo_stack_count > 0 and len(self.board.move_stack) > 0:
            move = self.board.pop()
            piece = self.board.piece_at(move.from_square)
            symbol = UNICODE_PIECES[piece.symbol()] if piece else "?"
            rev_move = chess.Move(move.to_square, move.from_square)
            self.animating_move = (rev_move, pygame.time.get_ticks(), 300, symbol, piece.color if piece else chess.WHITE, True)
            self.undo_stack_count -= 1
        else:
            self.undo_stack_count = 0
            self.selected_square = None
            self.game_over = False

    def draw_pieces(self):
        skip_square = None
        anim_piece_data = None
        if self.animating_move:
            move, start_time, duration, symbol, p_color, is_undo = self.animating_move
            skip_square = move.to_square if is_undo else move.from_square
            now = pygame.time.get_ticks()
            progress = min(1.0, (now - start_time) / duration)
            progress = 1 - (1 - progress) ** 3
            start_x, start_y = self.get_square_center(move.from_square)
            end_x, end_y = self.get_square_center(move.to_square)
            curr_x = start_x + (end_x - start_x) * progress
            curr_y = start_y + (end_y - start_y) * progress
            anim_piece_data = (curr_x, curr_y, symbol, p_color)

        for square in chess.SQUARES:
            piece = self.board.piece_at(square)
            if piece:
                if (self.dragging and square == self.selected_square) or square == skip_square:
                    continue
                x, y = self.get_square_center(square)
                symbol = UNICODE_PIECES[piece.symbol()]
                color = COLOR_TEXT_BLACK if piece.color == chess.BLACK else COLOR_TEXT_WHITE
                self.draw_text_centered(symbol, self.font_large, (80,80,80), x + 2, y + 2)
                self.draw_text_centered(symbol, self.font_large, color, x, y)
        if anim_piece_data:
            ax, ay, asym, acol = anim_piece_data
            acolor = COLOR_TEXT_BLACK if acol == chess.BLACK else COLOR_TEXT_WHITE
            self.draw_text_centered(asym, self.font_large, (80,80,80), ax + 2, ay + 2)
            self.draw_text_centered(asym, self.font_large, acolor, ax, ay)

    def draw_highlights(self):
        if self.selected_square is not None:
            x, y = self.get_square_center(self.selected_square)
            rect = pygame.Rect(x - SQUARE_SIZE//2, y - SQUARE_SIZE//2, SQUARE_SIZE, SQUARE_SIZE)
            pygame.draw.rect(self.screen, (255, 255, 0), rect, 4)
            for move in self.legal_moves:
                target = move.to_square
                cx, cy = self.get_square_center(target)
                
                # Turn dot red if it's a capture move
                dot_color = COLOR_ATTACK if self.board.is_capture(move) else COLOR_MOVES
                
                s = pygame.Surface((SQUARE_SIZE, SQUARE_SIZE), pygame.SRCALPHA)
                pygame.draw.circle(s, dot_color, (SQUARE_SIZE//2, SQUARE_SIZE//2), SQUARE_SIZE // 6)
                self.screen.blit(s, (cx - SQUARE_SIZE//2, cy - SQUARE_SIZE//2))
        if self.hint_move:
            for sq in [self.hint_move.from_square, self.hint_move.to_square]:
                x, y = self.get_square_center(sq)
                rect = pygame.Rect(x - SQUARE_SIZE//2, y - SQUARE_SIZE//2, SQUARE_SIZE, SQUARE_SIZE)
                pygame.draw.rect(self.screen, (150, 50, 255), rect, 5)


    def draw_game(self):
        theme = self.current_theme
        mouse_pos = pygame.mouse.get_pos()
        self.screen.fill(theme["bg"])
        self.draw_board()
        self.draw_highlights()
        self.draw_pieces()

        if self.board.is_check():
            ks = self.board.king(self.board.turn)
            if ks:
                x, y = self.get_square_center(ks)
                pygame.draw.rect(self.screen, (255, 0, 0, 100), (x - 30, y - 30, 60, 60), 3)
                self.draw_text_centered("CHECK!", self.font_menu, (255, 50, 50), WIDTH // 2, OFFSET_Y // 2)

        # Timers (Always show)
        if self.time_limit:
            self.draw_text_centered(f"B: {int(self.black_time//60):02}:{int(self.black_time%60):02}", self.font_small, theme["text"], 80, 25)
            self.draw_text_centered(f"W: {int(self.white_time//60):02}:{int(self.white_time%60):02}", self.font_small, theme["text"], WIDTH - 80, 25)

        # UI Elements
        if self.difficulty != "friend":
            self.draw_text_centered(f"Hints: {self.hints_left}", self.font_small, theme["text"], 80, 55)
            self.draw_text_centered(f"Undos: {self.undos_left}", self.font_small, theme["text"], WIDTH - 80, 55)
            self.draw_button_row(HEIGHT - 55)
        else:
            # Only Resign button for Friends
            rect = pygame.Rect(WIDTH // 2 - 50, HEIGHT - 55, 100, 40)
            color = COLOR_BUTTON_HOVER if rect.collidepoint(mouse_pos) else COLOR_BUTTON
            pygame.draw.rect(self.screen, color, rect, border_radius=10)
            self.draw_text_centered("Resign", pygame.font.SysFont("segoe ui", 16), COLOR_TEXT_WHITE, WIDTH // 2, HEIGHT - 35)

        # Undo Error Message
        if pygame.time.get_ticks() < self.undo_msg_time:
            self.draw_text_centered("All of the Pieces are on their places", self.font_small, (255, 100, 100), WIDTH // 2, HEIGHT - 85)

        # Friend Resign Overlay
        if self.friend_resign_choice:
            s = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
            s.fill((0, 0, 0, 180)); self.screen.blit(s, (0,0))
            self.draw_text_centered("Who is Resigning?", self.font_menu, COLOR_TEXT_WHITE, WIDTH // 2, HEIGHT // 2 - 80)
            btns = [("White", WIDTH // 2 - 80, chess.WHITE), ("Black", WIDTH // 2 + 80, chess.BLACK)]
            for text, cx, side in btns:
                r = pygame.Rect(cx - 60, HEIGHT // 2, 120, 50)
                c = COLOR_BUTTON_HOVER if r.collidepoint(mouse_pos) else COLOR_BUTTON
                pygame.draw.rect(self.screen, c, r, border_radius=10)
                self.draw_text_centered(text, self.font_small, COLOR_TEXT_WHITE, cx, HEIGHT // 2 + 25)
                if pygame.mouse.get_pressed()[0] and r.collidepoint(mouse_pos):
                    self.board.turn = side # Set turn so winner logic works correctly
                    self.game_over = True; self.winner = "Resigned"; self.play_sound('click')
                    self.menu_transition_time = pygame.time.get_ticks() + 2000
                    self.friend_resign_choice = False
        # Dragging piece visualization
        if self.dragging and self.selected_square:
            piece = self.board.piece_at(self.selected_square)
            if piece:
                self.draw_text_centered(UNICODE_PIECES[piece.symbol()], self.font_large, COLOR_TEXT_WHITE, mouse_pos[0], mouse_pos[1])

        if self.game_over:
            s = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
            s.fill((0, 0, 0, 220)); self.screen.blit(s, (0,0))
            
            if self.winner == "Resigned":
                if self.difficulty != "friend":
                    self.draw_text_centered("YOU LOST", self.font_large, (255, 50, 50), WIDTH // 2, HEIGHT // 2 - 100)
                    self.draw_text_centered("OPPONENT WINS!", self.font_menu, (50, 255, 50), WIDTH // 2, HEIGHT // 2 - 40)
                else:
                    loser = "WHITE" if self.board.turn == chess.WHITE else "BLACK"
                    winner = "BLACK" if self.board.turn == chess.WHITE else "WHITE"
                    self.draw_text_centered(f"{loser} RESIGNED", self.font_large, (255, 50, 50), WIDTH // 2, HEIGHT // 2 - 100)
                    self.draw_text_centered(f"{winner} WINS!", self.font_menu, (50, 255, 50), WIDTH // 2, HEIGHT // 2 - 40)
            else:
                self.draw_text_centered("GAME OVER", self.font_large, (255, 50, 50), WIDTH // 2, HEIGHT // 2 - 100)
                reason = "Reason Unknown"
                if self.board.is_checkmate(): reason = "Checkmate!"
                elif self.board.is_stalemate(): reason = "Stalemate!"
                elif self.board.is_insufficient_material(): reason = "Insufficient Material"
                elif self.winner: reason = self.winner
                self.draw_text_centered(reason, self.font_menu, (255, 255, 0), WIDTH // 2, HEIGHT // 2 - 40)

            self.draw_text_centered(f"Rounds: {len(self.board.move_stack)//2}", self.font_small, COLOR_TEXT_WHITE, WIDTH // 2, HEIGHT // 2 + 20)
            
            if self.menu_transition_time is None:
                restart_rect = pygame.Rect(WIDTH // 2 - 100, HEIGHT // 2 + 60, 200, 50)
                color = COLOR_BUTTON_HOVER if restart_rect.collidepoint(mouse_pos) else COLOR_BUTTON
                pygame.draw.rect(self.screen, color, restart_rect, border_radius=12)
                self.draw_text_centered("PLAY AGAIN", self.font_small, COLOR_TEXT_WHITE, WIDTH // 2, HEIGHT // 2 + 85)
                if pygame.mouse.get_pressed()[0] and restart_rect.collidepoint(mouse_pos):
                    self.reset_game()

    def draw_button_row(self, y_top, is_top_row=False):
        mouse_pos = pygame.mouse.get_pos()
        sound_text = "Sound: On" if self.sound_enabled else "Sound: Off"
        
        # In friend mode, top buttons are for Black, bottom for White (normally)
        # But we'll just allow both to use them.
        btns = [("Resign", 55, 80), ("Hint", 150, 80), ("Theme", 250, 80), (sound_text, 350, 80), ("Undo", 445, 80)]
        if is_top_row:
            # Drop Theme from top row as requested
            btns = [("Resign", 70, 90), ("Hint", 185, 90), (sound_text, 315, 90), ("Undo", 430, 90)]

        for text, cx, w in btns:
            rect = pygame.Rect(cx - w // 2, y_top, w, 40)
            color = COLOR_BUTTON_HOVER if rect.collidepoint(mouse_pos) else COLOR_BUTTON
            pygame.draw.rect(self.screen, color, rect, border_radius=10)
            self.draw_text_centered(text, pygame.font.SysFont("segoe ui", 16), COLOR_TEXT_WHITE, cx, y_top + 20)
        return btns

    def run(self):
        in_menu = True
        ai_thinking_start = None
        while True:
            self.clock.tick(60)
            if in_menu:
                if self.draw_menu() == False: in_menu = False; self.last_time_update = pygame.time.get_ticks()
                continue
            if not self.game_over and self.time_limit and self.last_time_update:
                dt = (pygame.time.get_ticks() - self.last_time_update) / 1000.0
                self.last_time_update = pygame.time.get_ticks()
                if self.board.turn == chess.WHITE: self.white_time -= dt
                else: self.black_time -= dt
                if self.white_time <= 0 or self.black_time <= 0: self.game_over = True; self.winner = "Timeout"

            for event in pygame.event.get():
                if event.type == pygame.QUIT: pygame.quit(); sys.exit()
                if self.menu_transition_time and pygame.time.get_ticks() >= self.menu_transition_time:
                    in_menu = True; self.menu_transition_time = None; continue

                if not self.game_over and self.animating_move is None and self.undo_stack_count == 0:
                    if event.type == pygame.MOUSEBUTTONDOWN:
                        pos = pygame.mouse.get_pos()
                        # --- CLICK LOGIC: BUTTONS (AI Mode Only) ---
                        if self.difficulty != "friend" and pos[1] > HEIGHT - 60:
                            # Resign (cx=55, w=80)
                            if 15 < pos[0] < 95: 
                                self.game_over = True; self.winner = "Resigned"; self.play_sound('click')
                                self.menu_transition_time = pygame.time.get_ticks() + 2000
                            # Hint (cx=150, w=80) 
                            elif 110 < pos[0] < 190:
                                count = self.hints_left
                                if count > 0:
                                    self.hints_left -= 1
                                    self.hint_move = self.ai.get_move(self.board) if self.ai else ChessBot("hard").get_move(self.board)
                                    self.play_sound('click')
                            # Theme (cx=250, w=80)
                            elif 210 < pos[0] < 290:
                                self.current_theme_idx = (self.current_theme_idx + 1) % len(self.theme_order)
                                self.current_theme = self.themes[self.theme_order[self.current_theme_idx]]; self.play_sound('click')
                            # Sound (cx=350, w=80)
                            elif 310 < pos[0] < 390:
                                self.sound_enabled = not self.sound_enabled; self.play_sound('click')
                            # Undo (cx=445, w=80)
                            elif 405 < pos[0] < 485:
                                if len(self.board.move_stack) == 0:
                                    self.undo_msg_time = pygame.time.get_ticks() + 2000
                                else:
                                    count = self.undos_left
                                    if count > 0:
                                        self.undos_left -= 1
                                        self.undo_stack_count = 2 if self.ai else 1; self.trigger_next_undo(); self.play_sound('click')
                            continue
                        
                        # --- CLICK LOGIC: Friend Resign ---
                        if self.difficulty == "friend" and pos[1] > HEIGHT - 60:
                            if WIDTH // 2 - 50 < pos[0] < WIDTH // 2 + 50:
                                self.friend_resign_choice = not self.friend_resign_choice; self.play_sound('click')
                            continue
                        sq = self.get_square_from_mouse(pos)
                        if sq is not None:
                            self.hint_move = None
                            piece = self.board.piece_at(sq)
                            if piece and piece.color == self.board.turn:
                                self.selected_square = sq; self.dragging = True
                                self.legal_moves = [m for m in self.board.legal_moves if m.from_square == sq]
                            elif self.selected_square is not None:
                                move = next((m for m in self.legal_moves if m.to_square == sq), None)
                                if move:
                                    if move.promotion: move.promotion = chess.QUEEN
                                    self.animating_move = (move, pygame.time.get_ticks(), 300, UNICODE_PIECES[self.board.piece_at(move.from_square).symbol()], self.board.turn, False)
                                    self.selected_square = None; self.dragging = False; self.legal_moves = []
                    elif event.type == pygame.MOUSEBUTTONUP and self.dragging:
                        sq = self.get_square_from_mouse(pygame.mouse.get_pos())
                        if sq is not None:
                            move = next((m for m in self.legal_moves if m.to_square == sq), None)
                            if move:
                                if move.promotion: move.promotion = chess.QUEEN
                                self.board.push(move)
                                if self.board.is_checkmate(): self.game_over = True
                                elif self.board.is_check(): self.play_sound('check')
                                elif self.board.is_capture(move): self.play_sound('capture')
                                else: self.play_sound('move')
                                if self.board.is_game_over(): self.game_over = True
                        self.selected_square = None; self.dragging = False; self.legal_moves = []
            
            if self.animating_move:
                m, st, d, sym, col, undo = self.animating_move
                if pygame.time.get_ticks() - st >= d:
                    self.animating_move = None
                    if undo:
                        self.trigger_next_undo()
                    else:
                        self.board.push(m)
                        if self.board.is_checkmate(): self.game_over = True
                        elif self.board.is_check(): self.play_sound('check')
                        elif self.board.is_capture(m): self.play_sound('capture')
                        else: self.play_sound('move')
                        if self.board.is_game_over(): self.game_over = True
            elif not self.game_over and self.ai and self.board.turn != self.player_color:
                if ai_thinking_start is None: ai_thinking_start = pygame.time.get_ticks()
                if pygame.time.get_ticks() - ai_thinking_start >= 500:
                    move = self.ai.get_move(self.board)
                    if move: 
                        if move.promotion: move.promotion = chess.QUEEN
                        self.animating_move = (move, pygame.time.get_ticks(), 500, UNICODE_PIECES[self.board.piece_at(move.from_square).symbol()], self.board.turn, False)
                    ai_thinking_start = None
            if self.game_over and pygame.key.get_pressed()[pygame.K_r]: self.reset_game()
            self.draw_game(); pygame.display.flip()

if __name__ == "__main__":
    game = ChessGame(); game.run()
