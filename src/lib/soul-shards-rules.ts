// src/lib/soul-shards-rules.ts
"use client";

export type Player = 1 | 2; // Angel (1) vs Demon (2)
export type UnitType = 'Harvester' | 'Guardian'; // Example unit types

export interface Unit {
  id: string;
  player: Player;
  type: UnitType;
  health: number;
  attack: number;
  position: { r: number; c: number }; // row, col
}

export interface SoulShard {
  id: string;
  position: { r: number; c: number };
  value: number;
}

export type BoardCell = {
  terrain: 'plains' | 'difficult' | 'impassable'; // Example terrain
  unitId: string | null;
  shardId: string | null;
};
export type BoardState = BoardCell[][]; // Grid of cells

export type GamePhaseSoulShards = 
  | 'playerSelection' 
  | 'deployment' 
  | 'playing' 
  | 'gameOver';

export const BOARD_ROWS = 10;
export const BOARD_COLS = 10;

export function createInitialSoulShardsBoard(): BoardState {
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
  // Example: Add some initial shards (placeholder)
  // if (board[2] && board[2][2]) board[2][2].shardId = 'shard-1';
  // if (board[7] && board[7][7]) board[7][7].shardId = 'shard-2';
  return board;
}

export interface PlayerStateSoulShards {
  player: Player;
  name: string;
  shardsCollected: number;
  faithOrDespair: number; // Resource
  units: Unit[];
}

export function getPlayerThematicNameSoulShards(player: Player | null): string {
  if (player === 1) return "Angelic Host";
  if (player === 2) return "Demonic Legion";
  return "";
}

// More game logic to be added:
// - Unit movement rules
// - Combat resolution
// - Shard collection
// - Win conditions (e.g., collect X shards, defeat all enemy units)
// - Turn structure
