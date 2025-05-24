
// src/lib/soul-shards-rules.ts
"use client";

export type Player = 1 | 2; // Angel (1) vs Demon (2)
export type UnitType = 'Harvester'; // For now, only Harvesters

export const MAX_UNITS_PER_PLAYER = 3;
export const SHARDS_TO_WIN = 3;
export const HARVESTER_MOVEMENT_RANGE = 2;

export interface Unit {
  id: string;
  player: Player;
  type: UnitType;
  health: number; // Less relevant for now without combat
  attack: number; // Less relevant for now without combat
  position: { r: number; c: number }; // row, col
  canMove: boolean; // Can this unit move this turn?
}

export interface SoulShard {
  id: string;
  position: { r: number; c: number };
  value: number;
}

export type BoardCell = {
  terrain: 'plains' | 'difficult' | 'impassable';
  unitId: string | null;
  shardId: string | null;
};
export type BoardState = BoardCell[][];

export type GamePhaseSoulShards =
  | 'playerSelection'
  | 'deployment'
  | 'playing'
  | 'gameOver';

export const BOARD_ROWS = 10;
export const BOARD_COLS = 10;

export const INITIAL_SHARD_POSITIONS: { r: number; c: number }[] = [
  { r: 2, c: 2 },
  { r: 2, c: 7 },
  { r: 4, c: 4 }, // Centered shard
  { r: 7, c: 2 },
  { r: 7, c: 7 },
];

export function createInitialSoulShards(): SoulShard[] {
  return INITIAL_SHARD_POSITIONS.map((pos, index) => ({
    id: `shard-${index}`,
    position: pos,
    value: 1,
  }));
}

export function createInitialSoulShardsBoard(shards: SoulShard[]): BoardState {
  const board: BoardState = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    board[r] = [];
    for (let c = 0; c < BOARD_COLS; c++) {
      board[r][c] = {
        terrain: 'plains',
        unitId: null,
        shardId: null,
      };
    }
  }
  shards.forEach(shard => {
    if (board[shard.position.r] && board[shard.position.r][shard.position.c]) {
      board[shard.position.r][shard.position.c].shardId = shard.id;
    }
  });
  return board;
}

export interface PlayerStateSoulShards {
  player: Player;
  name: string;
  shardsCollected: number;
  faithOrDespair: number;
  units: Unit[];
  unitsDeployed: number;
}

export function getPlayerThematicNameSoulShards(player: Player | null): string {
  if (player === 1) return "Angelic Host";
  if (player === 2) return "Demonic Legion";
  return "";
}

export function getPlayerDeploymentZone(player: Player): { startRow: number; endRow: number } {
  if (player === 1) return { startRow: 0, endRow: 1 }; // Top two rows for Angels
  return { startRow: BOARD_ROWS - 2, endRow: BOARD_ROWS - 1 }; // Bottom two rows for Demons
}

export function isValidMove(
  unit: Unit,
  targetR: number,
  targetC: number,
  board: BoardState
): boolean {
  if (targetR < 0 || targetR >= BOARD_ROWS || targetC < 0 || targetC >= BOARD_COLS) {
    return false; // Out of bounds
  }
  if (board[targetR][targetC].unitId !== null) {
    return false; // Cell occupied by another unit
  }
  if (board[targetR][targetC].terrain === 'impassable') {
    return false; // Impassable terrain
  }

  const dr = Math.abs(targetR - unit.position.r);
  const dc = Math.abs(targetC - unit.position.c);

  // Orthogonal movement only for now
  return (dr <= HARVESTER_MOVEMENT_RANGE && dc === 0) || (dc <= HARVESTER_MOVEMENT_RANGE && dr === 0);
}
