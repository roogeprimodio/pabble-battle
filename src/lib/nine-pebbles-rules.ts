export type Player = 1 | 2;
export type BoardPosition = Player | null;
export type GameBoardArray = BoardPosition[]; // Array of 24 positions
export type GamePhase = 'playerSelection' | 'placement' | 'movement' | 'removing' | 'animatingRemoval' | 'gameOver';


export const TOTAL_POINTS = 24;
export const PAWNS_PER_PLAYER = 9;

// Define points for visualization (conceptual, actual rendering might differ)
// Outer square: 0-7, Middle square: 8-15, Inner square: 16-23
export const POINT_COORDINATES = [
  // Outer square (0-7)
  { id: 0, x: 0, y: 0, square: 'outer' }, { id: 1, x: 3, y: 0, square: 'outer' }, { id: 2, x: 6, y: 0, square: 'outer' },
  { id: 3, x: 6, y: 3, square: 'outer' }, { id: 4, x: 6, y: 6, square: 'outer' }, { id: 5, x: 3, y: 6, square: 'outer' },
  { id: 6, x: 0, y: 6, square: 'outer' }, { id: 7, x: 0, y: 3, square: 'outer' },
  // Middle square (8-15)
  { id: 8, x: 1, y: 1, square: 'middle' }, { id: 9, x: 3, y: 1, square: 'middle' }, { id: 10, x: 5, y: 1, square: 'middle' },
  { id: 11, x: 5, y: 3, square: 'middle' }, { id: 12, x: 5, y: 5, square: 'middle' }, { id: 13, x: 3, y: 5, square: 'middle' },
  { id: 14, x: 1, y: 5, square: 'middle' }, { id: 15, x: 1, y: 3, square: 'middle' },
  // Inner square (16-23)
  { id: 16, x: 2, y: 2, square: 'inner' }, { id: 17, x: 3, y: 2, square: 'inner' }, { id: 18, x: 4, y: 2, square: 'inner' },
  { id: 19, x: 4, y: 3, square: 'inner' }, { id: 20, x: 4, y: 4, square: 'inner' }, { id: 21, x: 3, y: 4, square: 'inner' },
  { id: 22, x: 2, y: 4, square: 'inner' }, { id: 23, x: 2, y: 3, square: 'inner' },
];


// Lines (Mills) - 3 points in a row
export const LINES: number[][] = [
  // Outer square horizontal/vertical
  [0, 1, 2], [2, 3, 4], [4, 5, 6], [6, 7, 0],
  // Middle square horizontal/vertical
  [8, 9, 10], [10, 11, 12], [12, 13, 14], [14, 15, 8],
  // Inner square horizontal/vertical
  [16, 17, 18], [18, 19, 20], [20, 21, 22], [22, 23, 16],
  // Connecting lines (spokes)
  [1, 9, 17], [3, 11, 19], [5, 13, 21], [7, 15, 23],
];

// Adjacency list for pawn movement
// Corrected to include all valid connections, especially radial ones.
export const ADJACENCY_LIST: number[][] = [
  /*0*/ [1, 7],           /*1*/ [0, 2, 9],      /*2*/ [1, 3],           /*3*/ [2, 4, 11],
  /*4*/ [3, 5],           /*5*/ [4, 6, 13],     /*6*/ [5, 7],           /*7*/ [0, 6, 15],
  /*8*/ [9, 15],          /*9*/ [1, 8, 10, 17], /*10*/ [9, 11],         /*11*/ [3, 10, 12, 19],
  /*12*/ [11, 13],        /*13*/ [5, 12, 14, 21],/*14*/ [13, 15],        /*15*/ [7, 8, 14, 23],
  /*16*/ [17, 23],        /*17*/ [9, 16, 18],    /*18*/ [17, 19],        /*19*/ [11, 18, 20],
  /*20*/ [19, 21],        /*21*/ [13, 20, 22],   /*22*/ [21, 23],        /*23*/ [15, 16, 22],
];

export function createInitialBoard(): GameBoardArray {
  return Array(TOTAL_POINTS).fill(null);
}

export function checkMill(board: GameBoardArray, player: Player, lastMoveIndex: number): boolean {
  return LINES.some(line => 
    line.includes(lastMoveIndex) && line.every(pos => board[pos] === player)
  );
}

export function getPlayerPawnCountOnBoard(board: GameBoardArray, player: Player): number {
  return board.filter(p => p === player).length;
}

export function canRemovePawn(board: GameBoardArray, pawnIndexToRemove: number, opponent: Player): boolean {
  if (board[pawnIndexToRemove] !== opponent) return false; // Not opponent's pawn

  // Check if the pawn is part of a mill
  const isPawnInMill = LINES.some(line => 
    line.includes(pawnIndexToRemove) && line.every(pos => board[pos] === opponent)
  );

  if (!isPawnInMill) return true; // Can remove if not in a mill

  // If it is in a mill, check if all other opponent pawns are also in mills
  const opponentPawnsIndices = board.reduce((acc, p, i) => {
    if (p === opponent) acc.push(i);
    return acc;
  }, [] as number[]);

  const allOpponentPawnsInMills = opponentPawnsIndices.every(idx => 
    LINES.some(line => line.includes(idx) && line.every(pos => board[pos] === opponent))
  );
  
  return allOpponentPawnsInMills; // Can remove if all opponent pawns are in mills
}

