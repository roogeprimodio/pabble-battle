
// src/app/games/tic-tac-toe/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw, ShieldQuestion, Swords, Zap, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TicTacToeBoard from './components/TicTacToeBoard';
import TicTacToeStatus from './components/TicTacToeStatus';
import PlayerPawnDisplay from '@/app/games/nine-pebbles/components/Pawn';
import {
  type Player,
  type BoardState,
  GamePhase,
  createInitialBoard,
  checkWinner,
  isBoardFull,
  getPlayerThematicName,
  WINNING_COMBINATIONS,
} from '@/lib/tic-tac-toe-rules';
import { ThemeToggle } from '@/app/(components)/ThemeToggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import GameBanner from '@/app/games/nine-pebbles/components/GameBanner';


const TicTacToePage: React.FC = () => {
  const [board, setBoard] = useState<BoardState>(createInitialBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
  const [gamePhase, setGamePhase] = useState<GamePhase>('playerSelection');
  const [winner, setWinner] = useState<Player | null>(null);
  const [isDraw, setIsDraw] = useState<boolean>(false);
  const [winningCombination, setWinningCombination] = useState<number[] | null>(null);
  const [message, setMessage] = useState<string>('Choose which side will make the first move.');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  const updateGameMessage = useCallback(() => {
    if (gamePhase === 'playerSelection') {
      setMessage('Choose which side will make the first move.');
    } else if (winner) {
      setMessage(`${getPlayerThematicName(winner)} are victorious!`);
      const winningCombo = WINNING_COMBINATIONS.find(combo => 
        combo.every(pos => board[pos] === winner)
      );
      setWinningCombination(winningCombo || null);
    } else if (isDraw) {
      setMessage("It's a draw! The battle ends in a stalemate.");
    } else {
      setMessage(`${getPlayerThematicName(currentPlayer)}'s turn.`);
    }
  }, [winner, isDraw, currentPlayer, gamePhase, board]);

  useEffect(() => {
    updateGameMessage();
  }, [updateGameMessage]);

  const handlePlayerSelect = (player: Player) => {
    setIsLoading(true);
    setCurrentPlayer(player);
    setGamePhase('playing');
    setBoard(createInitialBoard());
    setWinner(null);
    setIsDraw(false);
    setWinningCombination(null);
    toast({
      title: "Battle Commences!",
      description: `${getPlayerThematicName(player)} will make the first move.`,
      className: player === 1 ? "bg-primary/10 border-primary" : "bg-destructive/10 border-destructive",
    });
    setTimeout(() => setIsLoading(false), 300);
  };

  const handleResetGame = () => {
    setIsLoading(true);
    setGamePhase('playerSelection');
    setBoard(createInitialBoard());
    setCurrentPlayer(1); // Default or could be last winner/loser
    setWinner(null);
    setIsDraw(false);
    setWinningCombination(null);
    setMessage('Choose which side will make the first move.');
    toast({
      title: "Game Reset",
      description: "The board is cleared. A new challenge awaits!",
      className: "bg-card border-foreground/20 shadow-lg",
    });
    setTimeout(() => setIsLoading(false), 300);
  };

  const handleCellClick = (index: number) => {
    if (board[index] || winner || isDraw || gamePhase !== 'playing') return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const currentWinner = checkWinner(newBoard);
    if (currentWinner) {
      setWinner(currentWinner);
      setGamePhase('gameOver');
      toast({
        title: "Victory!",
        description: `${getPlayerThematicName(currentWinner)} has won!`,
        className: currentWinner === 1 ? "bg-primary/20 border-primary":"bg-destructive/20 border-destructive",
      });
    } else if (isBoardFull(newBoard)) {
      setIsDraw(true);
      setGamePhase('gameOver');
      toast({
        title: "Draw!",
        description: "The game is a stalemate.",
      });
    } else {
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
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
          <CardTitle className="text-2xl sm:text-3xl font-bold text-primary font-heading">Tic-Tac-Toe: First Move</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
          <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">The chosen side makes the first move.</p>
          <Button 
            onClick={() => handlePlayerSelect(1)} 
            className="w-full text-base sm:text-lg py-2.5 sm:py-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-150 ease-out hover:scale-105 active:scale-95 group"
          >
            <PlayerPawnDisplay player={1} size="small" /> <span className="ml-2 group-hover:tracking-wider transition-all">Angels (X) Start</span>
          </Button>
          <Button 
            onClick={() => handlePlayerSelect(2)} 
            className="w-full text-base sm:text-lg py-2.5 sm:py-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-md hover:shadow-lg transition-all duration-150 ease-out hover:scale-105 active:scale-95 group"
          >
            <PlayerPawnDisplay player={2} size="small" /> <span className="ml-2 group-hover:tracking-wider transition-all">Demons (O) Start</span>
          </Button>
        </CardContent>
      </Card>
      <footer className="text-center py-4 mt-6 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Pebble Arena</p>
      </footer>
    </div>
  );
  
  const renderGameScreenSkeleton = () => (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/20 p-2 sm:p-4">
      <header className="flex justify-between items-center py-3 px-1 sm:px-2 mb-3 sm:mb-4">
        <Link href="/choose-game" passHref>
          <Button variant="outline" size="icon" aria-label="Back to Choose Game"> <ArrowLeft className="h-5 w-5" /> </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary text-center flex items-center gap-2 font-heading">
          <Swords className="h-6 w-6 sm:h-7 sm:w-7 text-accent" /> Tic-Tac-Toe <Zap className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Reset Game" disabled> <RotateCcw className="h-4 w-4" /> </Button>
          <ThemeToggle />
        </div>
      </header>
      <div className="w-full my-2 sm:my-3"><div className="container mx-auto px-2 sm:px-0"><Skeleton className="h-10 sm:h-12 w-full rounded-lg" /></div></div>
      <div className="w-full max-w-md mx-auto mb-3 sm:mb-4">
        <div className="flex items-stretch justify-center gap-2 sm:gap-3">
          <Skeleton className="h-[70px] sm:h-[80px] flex-1 rounded-lg" />
          <div className="flex flex-col items-center justify-center p-1"><Skeleton className="w-5 h-5 sm:w-6 sm:w-6 rounded-full" /></div>
          <Skeleton className="h-[70px] sm:h-[80px] flex-1 rounded-lg" />
        </div>
        <Skeleton className="h-6 w-3/4 mx-auto mt-2 rounded-md" />
      </div>
      <main className="flex-grow w-full flex flex-col items-center justify-center">
        <div className="w-full max-w-xs sm:max-w-sm md:max-w-md aspect-square relative self-center">
          <Skeleton className="w-full h-full rounded-lg" />
        </div>
      </main>
      <footer className="text-center py-4 mt-auto text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Pebble Arena</p>
      </footer>
    </div>
  );

  if (gamePhase === 'playerSelection' && !isLoading) {
    return renderPlayerSelectionScreen();
  }

  if (isLoading) {
     return renderGameScreenSkeleton();
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/20 p-2 sm:p-4">
      <header className="flex justify-between items-center py-3 px-1 sm:px-2 mb-2 sm:mb-3">
        <Link href="/choose-game" passHref>
          <Button variant="outline" size="icon" aria-label="Back to Choose Game">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary text-center flex items-center gap-2 font-heading">
          <Swords className="h-6 w-6 sm:h-7 sm:w-7 text-accent animate-pulse" /> Tic-Tac-Toe <Zap className="h-6 w-6 sm:h-7 sm:w-7 text-primary animate-pulse" />
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleResetGame} aria-label="Reset Game">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <ThemeToggle />
        </div>
      </header>
      
      <GameBanner />

      <TicTacToeStatus
        currentPlayer={currentPlayer}
        winner={winner}
        isDraw={isDraw}
        gamePhase={gamePhase}
        message={message}
      />
      
      {gamePhase === 'gameOver' && (
        <div className="w-full text-center my-2 sm:my-3">
          <Button 
            onClick={handleResetGame} 
            className={`text-base py-2 sm:py-2.5 px-4 sm:px-6 ${winner === 1 ? 'bg-gradient-to-r from-primary via-primary/80 to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground' : winner === 2 ? 'bg-gradient-to-r from-destructive via-destructive/80 to-accent hover:from-destructive/90 hover:to-accent/90 text-destructive-foreground' : 'bg-accent hover:bg-accent/90 text-accent-foreground'} shadow-lg hover:shadow-xl transition-all duration-200`}
          >
            <Sparkles className="mr-2 h-5 w-5" /> {isDraw ? 'Play Again' : 'New Battle'} <Sparkles className="ml-2 h-5 w-5" />
          </Button>
        </div>
      )}

      <main className="flex-grow w-full flex flex-col items-center justify-center">
        <TicTacToeBoard
          board={board}
          onCellClick={handleCellClick}
          disabled={gamePhase === 'gameOver' || gamePhase === 'playerSelection'}
          winningCombination={winningCombination}
          currentPlayer={currentPlayer}
        />
      </main>

      <footer className="text-center py-4 mt-auto text-sm text-muted-foreground">
         <p>&copy; {new Date().getFullYear()} Pebble Arena</p>
      </footer>
    </div>
  );
};

export default TicTacToePage;
