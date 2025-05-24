
// src/app/games/soul-shards/components/SoulShardsStatus.tsx
"use client";

import React from 'react';
import type { Player, PlayerStateSoulShards, GamePhaseSoulShards } from '@/lib/soul-shards-rules';
import { getPlayerThematicNameSoulShards, SHARDS_TO_WIN } from '@/lib/soul-shards-rules';
import PlayerPawnDisplay from '@/app/games/nine-pebbles/components/Pawn'; // Re-use for consistency
import { Swords, Gem, Zap, ShieldAlert } from 'lucide-react'; // Zap for Faith/Despair, ShieldAlert for units

interface SoulShardsStatusProps {
  player1State: PlayerStateSoulShards;
  player2State: PlayerStateSoulShards;
  currentPlayer: Player;
  gamePhase: GamePhaseSoulShards;
  winner: Player | null;
  message: string;
}

const PlayerInfo: React.FC<{
  playerState: PlayerStateSoulShards;
  isCurrent: boolean;
  isWinner: boolean;
}> = ({ playerState, isCurrent, isWinner }) => {
  const baseClasses = "p-2 sm:p-3 rounded-lg border-2 flex-1 text-center transition-all duration-300 ease-in-out min-w-[120px] sm:min-w-[150px]";
  const playerClass = playerState.player === 1
    ? "border-primary/70 bg-primary/10 text-primary dark:bg-primary/20 dark:border-primary/60"
    : "border-destructive/70 bg-destructive/10 text-destructive dark:bg-destructive/20 dark:border-destructive/60";

  const activeClass = isCurrent && !isWinner
    ? `ring-2 ring-offset-background scale-105 shadow-lg ${playerState.player === 1 ? 'ring-primary' : 'ring-destructive'}`
    : "opacity-80 hover:opacity-100";

  const winnerClass = isWinner ? "ring-4 ring-accent shadow-accent/30" : "";

  return (
    <div className={`${baseClasses} ${playerClass} ${activeClass} ${winnerClass}`}>
      <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-center gap-1 sm:gap-2 mb-1.5">
        <PlayerPawnDisplay player={playerState.player} size="small" />
        <span className="font-semibold font-heading text-xs sm:text-sm truncate">{playerState.name}</span>
      </div>
      <div className="space-y-0.5 text-xxs sm:text-xs">
        <p className="flex items-center justify-center gap-1">
          <Gem className="w-3 h-3 text-accent" /> Shards: <span className="font-bold">{playerState.shardsCollected} / {SHARDS_TO_WIN}</span>
        </p>
        <p className="flex items-center justify-center gap-1">
          <Zap className="w-3 h-3" /> {playerState.player === 1 ? 'Faith' : 'Despair'}: <span className="font-bold">{playerState.faithOrDespair}</span>
        </p>
         <p className="flex items-center justify-center gap-1">
          <ShieldAlert className="w-3 h-3" /> Units: <span className="font-bold">{playerState.units.length} ({playerState.unitsDeployed} deployed)</span>
        </p>
      </div>
    </div>
  );
};


const SoulShardsStatus: React.FC<SoulShardsStatusProps> = ({
  player1State,
  player2State,
  currentPlayer,
  gamePhase,
  winner,
  message,
}) => {
  return (
    <div className="w-full max-w-lg mx-auto mb-3 sm:mb-4">
      <div className="flex items-stretch justify-center gap-2 sm:gap-3">
        <PlayerInfo
          playerState={player1State}
          isCurrent={currentPlayer === 1 && (gamePhase === 'playing' || gamePhase === 'deployment')}
          isWinner={winner === 1}
        />
        <div className="flex flex-col items-center justify-center p-1 text-muted-foreground">
          <Swords className={`w-4 h-4 sm:w-5 sm:w-5 transition-colors duration-300 ${currentPlayer === 1 && (gamePhase === 'playing' || gamePhase === 'deployment') ? 'text-primary' : currentPlayer === 2 && (gamePhase === 'playing' || gamePhase === 'deployment') ? 'text-destructive' : 'text-muted-foreground/70'}`} />
        </div>
        <PlayerInfo
          playerState={player2State}
          isCurrent={currentPlayer === 2 && (gamePhase === 'playing' || gamePhase === 'deployment')}
          isWinner={winner === 2}
        />
      </div>
      {message && gamePhase !== 'playerSelection' && (
         <div className={`mt-2 text-center text-xs sm:text-sm px-3 py-1.5 rounded-md shadow-sm ${
            winner === 1 ? 'bg-primary/10 text-primary' :
            winner === 2 ? 'bg-destructive/10 text-destructive' :
            gamePhase === 'gameOver' && !winner ? 'bg-muted text-muted-foreground' : // Draw or other game over
            currentPlayer === 1 ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
          } font-medium`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default SoulShardsStatus;

