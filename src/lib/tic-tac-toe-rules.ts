
// src/lib/tic-tac-toe-rules.ts
export type Player = 1 | 2; // 1 for Angels (X), 2 for Demons (O)
export type CellState = Player | null;
export type BoardState = CellState[]; // Array of 9 cells
export type GamePhase = 'playerSelection' | 'playing' | 'gameOver';

export const BOARD_SIZE = 3;
export const TOTAL_CELLS = BOARD_SIZE * BOARD_SIZE;

export function createInitialBoard(): BoardState {
  return Array(TOTAL_CELLS).fill(null);
}

export const WINNING_COMBINATIONS = [
  // Rows
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  // Columns
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  // Diagonals
  [0, 4, 8], [2, 4, 6],
];

export function checkWinner(board: BoardState): Player | null {
  for (const combination of WINNING_COMBINATIONS) {
    const [a, b, c] = combination;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as Player;
    }
  }
  return null;
}

export function isBoardFull(board: BoardState): boolean {
  return board.every(cell => cell !== null);
}

export function getPlayerThematicName(player: Player | null): string {
  if (player === 1) return "Angels (X)";
  if (player === 2) return "Demons (O)";
  return "";
}
