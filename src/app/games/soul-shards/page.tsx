// src/app/games/soul-shards/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw, ShieldQuestion, Swords, Zap, Sparkles, Construction } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SoulShardsBoard from './components/SoulShardsBoard';
import SoulShardsStatus from './components/SoulShardsStatus';
import PlayerPawnDisplay from '@/app/games/nine-pebbles/components/Pawn'; // Re-use
import {
  type Player,
  type BoardState,
  type Unit,
  type SoulShard,
  type PlayerStateSoulShards,
  GamePhaseSoulShards,
  createInitialSoulShardsBoard,
  getPlayerThematicNameSoulShards,
  BOARD_ROWS,
  BOARD_COLS,
} from '@/lib/soul-shards-rules';
import { ThemeToggle } from '@/app/(components)/ThemeToggle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import GameBanner from '@/app/games/nine-pebbles/components/GameBanner'; // Can reuse or create a new one

const initialPlayerState = (player: Player): PlayerStateSoulShards => ({
  player,
  name: getPlayerThematicNameSoulShards(player),
  shardsCollected: 0,
  faithOrDespair: 100, // Starting resource
  units: [], // Units will be added during deployment phase
});


const SoulShardsPage: React.FC = () => {
  const [board, setBoard] = useState<BoardState>(createInitialSoulShardsBoard());
  const [player1State, setPlayer1State] = useState<PlayerStateSoulShards>(initialPlayerState(1));
  const [player2State, setPlayer2State] = useState<PlayerStateSoulShards>(initialPlayerState(2));
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
  const [gamePhase, setGamePhase] = useState<GamePhaseSoulShards>('playerSelection');
  const [winner, setWinner] = useState<Player | null>(null);
  const [message, setMessage] = useState<string>('Choose which side will make the first move in Soul Shards.');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [shards, setShards] = useState<SoulShard[]>([]); // Game shards

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  const updateGameMessage = useCallback(() => {
    if (gamePhase === 'playerSelection') {
      setMessage(`Soul Shards: ${getPlayerThematicNameSoulShards(null)} - Choose who starts.`);
    } else if (winner) {
      setMessage(`${getPlayerThematicNameSoulShards(winner)} have claimed victory!`);
    } else if (gamePhase === 'gameOver' && !winner) {
      setMessage("The battle for Soul Shards ends in a stalemate!");
    } else if (gamePhase === 'deployment') {
       setMessage(`${getPlayerThematicNameSoulShards(currentPlayer)}: Deploy your units.`);
    } else { // Playing
      setMessage(`${getPlayerThematicNameSoulShards(currentPlayer)}'s turn.`);
    }
  }, [winner, currentPlayer, gamePhase]);

  useEffect(() => {
    updateGameMessage();
  }, [updateGameMessage]);

  const handlePlayerSelect = (player: Player) => {
    setIsLoading(true);
    setCurrentPlayer(player);
    setGamePhase('deployment'); // Or 'playing' if no deployment phase initially
    setBoard(createInitialSoulShardsBoard());
    setPlayer1State(initialPlayerState(1));
    setPlayer2State(initialPlayerState(2));
    setWinner(null);
    setSelectedUnitId(null);
    setShards([]); // Reset shards
    // TODO: Initialize units and shards based on starting player/rules
    toast({
      title: "Soul Shards: Battle Begins!",
      description: `${getPlayerThematicNameSoulShards(player)} will command their forces first.`,
      className: player === 1 ? "bg-primary/10 border-primary" : "bg-destructive/10 border-destructive",
    });
    setTimeout(() => setIsLoading(false), 300);
  };

  const handleResetGame = () => {
    setIsLoading(true);
    setGamePhase('playerSelection');
    setBoard(createInitialSoulShardsBoard());
    setCurrentPlayer(1);
    setPlayer1State(initialPlayerState(1));
    setPlayer2State(initialPlayerState(2));
    setWinner(null);
    setSelectedUnitId(null);
    setShards([]);
    setMessage('Choose which side will make the first move in Soul Shards.');
    toast({
      title: "Soul Shards Reset",
      description: "The board is cleared. A new war for souls awaits!",
      className: "bg-card border-foreground/20 shadow-lg",
    });
    setTimeout(() => setIsLoading(false), 300);
  };

  const handleCellClick = (r: number, c: number) => {
    if (winner || gamePhase === 'gameOver' || gamePhase === 'playerSelection' || isLoading) return;
    // Placeholder: Basic logic to show interaction
    // Actual game logic for unit selection, movement, attack, shard pickup will be complex
    toast({ title: "Cell Clicked", description: `Cell (${r}, ${c}) clicked. Current player: ${currentPlayer}. Phase: ${gamePhase}`});

    // Example: Unit selection (very simplified)
    if (gamePhase === 'playing') {
      const currentUnits = currentPlayer === 1 ? player1State.units : player2State.units;
      const unitAtCell = currentUnits.find(u => u.position.r === r && u.position.c === c);
      if (unitAtCell) {
        setSelectedUnitId(unitAtCell.id);
        setMessage(`Unit ${unitAtCell.type} selected. Choose action or target.`);
      } else if (selectedUnitId) {
        // Attempt to move or act with selectedUnitId to (r,c)
        setMessage(`Attempting action with selected unit to (${r}, ${c}).`);
        // ... (more logic needed here) ...
        // After action:
        // setSelectedUnitId(null);
        // setCurrentPlayer(currentPlayer === 1 ? 2 : 1); // Switch turn
      }
    }
  };
  
  const renderPlayerSelectionScreen = () => (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/20 p-2 sm:p-4 items-center justify-center">
      <header className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <Link href="/choose-game" passHref>
          <Button variant="outline" size="icon" aria-label="Back to Choose Game">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <ThemeToggle />
      </header>
      <Card className="w-full max-w-md shadow-2xl text-center animate-fadeIn">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex justify-center mb-3">
            <ShieldQuestion className="w-16 h-16 text-primary animate-pulse" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-primary font-heading">Soul Shards: Choose Commander</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
          <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">The chosen commander leads their forces first.</p>
          <Button 
            onClick={() => handlePlayerSelect(1)} 
            className="w-full text-base sm:text-lg py-2.5 sm:py-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-150 ease-out hover:scale-105 active:scale-95 group"
          >
            <PlayerPawnDisplay player={1} size="small" /> <span className="ml-2 group-hover:tracking-wider transition-all">{getPlayerThematicNameSoulShards(1)}</span>
          </Button>
          <Button 
            onClick={() => handlePlayerSelect(2)} 
            className="w-full text-base sm:text-lg py-2.5 sm:py-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-md hover:shadow-lg transition-all duration-150 ease-out hover:scale-105 active:scale-95 group"
          >
            <PlayerPawnDisplay player={2} size="small" /> <span className="ml-2 group-hover:tracking-wider transition-all">{getPlayerThematicNameSoulShards(2)}</span>
          </Button>
        </CardContent>
      </Card>
       <footer className="text-center py-4 mt-6 text-sm text-muted-foreground">
         <p>&copy; {new Date().getFullYear()} Pebble Arena - Soul Shards</p>
      </footer>
    </div>
  );
  
  const renderGameScreenSkeleton = () => (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/20 p-2 sm:p-4">
      <header className="flex justify-between items-center py-3 px-1 sm:px-2 mb-3 sm:mb-4">
        <Skeleton className="h-8 w-8 rounded-md" /> {/* Back button */}
        <Skeleton className="h-7 w-48 rounded-md" /> {/* Title */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-md" /> {/* Reset button */}
          <Skeleton className="h-8 w-8 rounded-md" /> {/* Theme toggle */}
        </div>
      </header>
      <div className="w-full my-2 sm:my-3"><div className="container mx-auto px-2 sm:px-0"><Skeleton className="h-10 sm:h-12 w-full rounded-lg" /></div></div> {/* Banner */}
      {/* Status Display Skeleton */}
      <div className="w-full max-w-lg mx-auto mb-3 sm:mb-4">
        <div className="flex items-stretch justify-center gap-2 sm:gap-3">
          <Skeleton className="h-[90px] sm:h-[100px] flex-1 rounded-lg" />
          <Skeleton className="w-5 h-5 sm:w-6 sm:w-6 rounded-full self-center" />
          <Skeleton className="h-[90px] sm:h-[100px] flex-1 rounded-lg" />
        </div>
        <Skeleton className="h-6 w-3/4 mx-auto mt-2 rounded-md" /> {/* Message skeleton */}
      </div>
      <main className="flex-grow w-full flex flex-col items-center justify-center">
        <div className="w-full max-w-md sm:max-w-lg md:max-w-xl aspect-square relative self-center">
          <Skeleton className="w-full h-full rounded-lg" /> {/* Board skeleton */}
        </div>
      </main>
      <footer className="text-center py-4 mt-auto text-sm text-muted-foreground">
        <Skeleton className="h-4 w-1/3 mx-auto rounded-md" />
      </footer>
    </div>
  );

  if (isLoading) {
     return renderGameScreenSkeleton();
  }
  
  if (gamePhase === 'playerSelection') {
    return renderPlayerSelectionScreen();
  }

  // Main Game Screen (Simplified - primarily showing it's under construction)
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/20 p-2 sm:p-4">
      <header className="flex justify-between items-center py-3 px-1 sm:px-2 mb-2 sm:mb-3">
        <Link href="/choose-game" passHref>
          <Button variant="outline" size="icon" aria-label="Back to Choose Game">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary text-center flex items-center gap-2 font-heading">
          <Swords className="h-6 w-6 sm:h-7 sm:w-7 text-accent animate-pulse" /> Soul Shards <Zap className="h-6 w-6 sm:h-7 sm:w-7 text-primary animate-pulse" />
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleResetGame} aria-label="Reset Game">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <ThemeToggle />
        </div>
      </header>
      
      <GameBanner /> {/* Re-using existing banner */}

      <SoulShardsStatus
        player1State={player1State}
        player2State={player2State}
        currentPlayer={currentPlayer}
        gamePhase={gamePhase}
        winner={winner}
        message={message}
      />
      
      {winner && (
        <div className="w-full text-center my-2 sm:my-3">
          {/* Winner display and reset button */}
        </div>
      )}

      <main className="flex-grow w-full flex flex-col items-center justify-center">
         <Card className="w-full max-w-xl text-center shadow-xl my-8">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Construction className="h-16 w-16 text-accent animate-bounce" />
            </div>
            <CardTitle className="text-2xl font-heading">Soul Shards - Under Construction!</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-lg mb-4">
              The core game mechanics for Soul Shards are still being forged.
              Stay tuned for epic battles! For now, you can see the basic board and player status.
            </CardDescription>
             <SoulShardsBoard
                board={board}
                units={currentPlayer === 1 ? player1State.units : player2State.units} // Show current player's units for now
                shards={shards}
                onCellClick={handleCellClick}
                selectedUnitId={selectedUnitId}
                currentPlayer={currentPlayer}
                disabled={gamePhase === 'gameOver' || gamePhase === 'playerSelection' || isLoading}
            />
            <Button onClick={handleResetGame} className="mt-6">
              <RotateCcw className="mr-2 h-4 w-4" /> Reset (Back to Selection)
            </Button>
          </CardContent>
        </Card>
      </main>

      <footer className="text-center py-4 mt-auto text-sm text-muted-foreground">
         <p>&copy; {new Date().getFullYear()} Pebble Arena - Soul Shards</p>
      </footer>
    </div>
  );
};

export default SoulShardsPage;
