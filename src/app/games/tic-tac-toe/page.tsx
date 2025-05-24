// src/app/games/tic-tac-toe/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, RotateCcw, Swords, Zap, Sparkles, Copy, Users, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TicTacToeBoard from './components/TicTacToeBoard';
import TicTacToeStatus from './components/TicTacToeStatus';
import {
  type Player,
  type BoardState,
  GamePhase as TicTacToeGamePhase,
  createInitialBoard,
  checkWinner,
  isBoardFull,
  getPlayerThematicName,
  WINNING_COMBINATIONS,
} from '@/lib/tic-tac-toe-rules';
import { generateUniqueId } from '@/lib/utils';
import { ThemeToggle } from '@/app/(components)/ThemeToggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import GameBanner from '@/app/games/nine-pebbles/components/GameBanner';

type PagePhase = 'initial' | 'creatingRoom' | 'playing' | 'gameOver';


const TicTacToePage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [board, setBoard] = useState<BoardState>(createInitialBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
  const [localPlayer, setLocalPlayer] = useState<Player | null>(null);
  const [gamePhase, setGamePhase] = useState<TicTacToeGamePhase>('playing');
  const [pagePhase, setPagePhase] = useState<PagePhase>('initial');

  const [winner, setWinner] = useState<Player | null>(null);
  const [isDraw, setIsDraw] = useState<boolean>(false);
  const [winningCombination, setWinningCombination] = useState<number[] | null>(null);
  
  const [roomId, setRoomId] = useState<string | null>(null);
  const [inputRoomId, setInputRoomId] = useState<string>('');
  
  const [message, setMessage] = useState<string>('Create or join a game room.');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const existingRoomId = searchParams.get('room');
    if (existingRoomId) {
      setRoomId(existingRoomId.toUpperCase());
      // If a room ID is in URL, assume this player is joining as Player 2.
      // A robust system would involve signaling to confirm opponent and assign player roles.
      setLocalPlayer(2); 
      setCurrentPlayer(1); // Game starts with Player 1's turn
      setPagePhase('playing');
      toast({ title: "Joined Room", description: `You joined room: ${existingRoomId.toUpperCase()}. You are ${getPlayerThematicName(2)}. Waiting for Player 1.`});
    } else {
      setPagePhase('initial');
    }
    setIsLoading(false);
  }, [searchParams, toast]);


  const updateGameMessage = useCallback(() => {
    if (pagePhase === 'initial') {
      setMessage('Create a new game room or join an existing one.');
      return;
    }
    if (pagePhase === 'creatingRoom' && roomId) {
      setMessage(`Room ID: ${roomId}. Share this with your opponent! You are ${getPlayerThematicName(1)}.`);
      return;
    }

    if (pagePhase === 'playing' || pagePhase === 'gameOver') {
      if (winner) {
        setMessage(`${getPlayerThematicName(winner)} are victorious!`);
        const winningCombo = WINNING_COMBINATIONS.find(combo => 
          combo.every(pos => board[pos] === winner)
        );
        setWinningCombination(winningCombo || null);
      } else if (isDraw) {
        setMessage("It's a draw! The battle ends in a stalemate.");
      } else {
         const turnPlayerName = getPlayerThematicName(currentPlayer);
         const localPlayerInfo = localPlayer ? `You are ${getPlayerThematicName(localPlayer)}.` : 'Observing.';
         setMessage(`${turnPlayerName}'s turn. ${localPlayerInfo}`);
      }
    }
  }, [winner, isDraw, currentPlayer, board, pagePhase, roomId, localPlayer]);

  useEffect(() => {
    updateGameMessage();
  }, [updateGameMessage]);


  const handleCreateRoom = () => {
    setIsLoading(true);
    const newRoomId = generateUniqueId();
    setRoomId(newRoomId);
    setLocalPlayer(1); 
    setCurrentPlayer(1); 
    setBoard(createInitialBoard());
    setWinner(null);
    setIsDraw(false);
    setWinningCombination(null);
    setGamePhase('playing');
    setPagePhase('creatingRoom'); 
    
    router.push(`/games/tic-tac-toe?room=${newRoomId}`, { scroll: false });
    
    toast({
      title: "Room Created!",
      description: `Room ID: ${newRoomId}. Share this. You are ${getPlayerThematicName(1)}.`,
      className: "bg-primary/10 border-primary",
    });
    setIsLoading(false);
  };

  const handleStartGameAfterSharing = () => {
    if (pagePhase === 'creatingRoom') {
      setPagePhase('playing');
    }
  }

  const handleJoinRoom = () => {
    if (!inputRoomId.trim()) {
      toast({ title: "Error", description: "Please enter a Room ID.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    const cleanRoomId = inputRoomId.trim().toUpperCase();
    setRoomId(cleanRoomId);
    setLocalPlayer(2); 
    setCurrentPlayer(1); 
    setBoard(createInitialBoard());
    setWinner(null);
    setIsDraw(false);
    setWinningCombination(null);
    setGamePhase('playing');
    setPagePhase('playing');

    router.push(`/games/tic-tac-toe?room=${cleanRoomId}`, { scroll: false });
    
    toast({
      title: "Joined Room!",
      description: `You joined room: ${cleanRoomId}. You are ${getPlayerThematicName(2)}.`,
       className: "bg-destructive/10 border-destructive",
    });
    setIsLoading(false);
  };

  const handleResetGame = () => {
    setIsLoading(true);
    setPagePhase('initial');
    setBoard(createInitialBoard());
    setCurrentPlayer(1);
    setLocalPlayer(null);
    setWinner(null);
    setIsDraw(false);
    setGamePhase('playing');
    setWinningCombination(null);
    setRoomId(null);
    setInputRoomId('');
    router.push('/games/tic-tac-toe', { scroll: false }); 
    setMessage('Create a new game room or join an existing one.');
    toast({
      title: "Game Reset",
      description: "Ready to create or join a new Tic-Tac-Toe game.",
      className: "bg-card border-foreground/20 shadow-lg",
    });
    setTimeout(() => setIsLoading(false), 300);
  };

  const handleCellClick = (index: number) => {
    if (pagePhase !== 'playing' || board[index] || winner || isDraw || gamePhase !== 'playing' || currentPlayer !== localPlayer) {
      if (pagePhase === 'playing' && !winner && !isDraw && currentPlayer !== localPlayer) {
        toast({title: "Not your turn", description: `It's ${getPlayerThematicName(currentPlayer)}'s turn.`, variant: "default"});
      } else if (pagePhase === 'playing' && (winner || isDraw)) {
         toast({title: "Game Over", description: "The game has ended. Reset to play again.", variant: "default"});
      }
      return;
    }

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    // TODO: Implement state synchronization for multiplayer (e.g., via WebRTC)
    // For now, this updates local state and switches turns. Opponent won't see this change.

    const currentWinner = checkWinner(newBoard);
    if (currentWinner) {
      setWinner(currentWinner);
      setGamePhase('gameOver'); 
      setPagePhase('gameOver'); 
      toast({
        title: "Victory!",
        description: `${getPlayerThematicName(currentWinner)} has won!`,
        className: currentWinner === 1 ? "bg-primary/20 border-primary":"bg-destructive/20 border-destructive",
      });
    } else if (isBoardFull(newBoard)) {
      setIsDraw(true);
      setGamePhase('gameOver'); 
      setPagePhase('gameOver'); 
      toast({
        title: "Draw!",
        description: "The game is a stalemate.",
      });
    } else {
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    }
  };

  const copyRoomIdToClipboard = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId)
        .then(() => {
          toast({ title: "Copied!", description: "Room ID copied to clipboard." });
        })
        .catch(_err => {
          toast({ title: "Error", description: "Could not copy Room ID.", variant: "destructive" });
        });
    }
  };

  const renderInitialScreen = () => (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/20 p-2 sm:p-4 items-center justify-center">
      <header className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <Link href="/choose-game" passHref>
          <Button variant="outline" size="icon" aria-label="Back to Choose Game"> <ArrowLeft className="h-5 w-5" /> </Button>
        </Link>
        <ThemeToggle />
      </header>
      <Card className="w-full max-w-md shadow-2xl text-center animate-fadeIn">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex justify-center mb-3"> <Users className="w-16 h-16 text-primary animate-pulse" /> </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-primary font-heading">Tic-Tac-Toe Multiplayer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
          <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">{message}</p>
          <Button onClick={handleCreateRoom} className="w-full text-base sm:text-lg py-2.5 sm:py-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
            Create Game Room
          </Button>
          <div className="flex items-center space-x-2 pt-2">
            <Input 
              type="text" 
              placeholder="Enter Room ID" 
              value={inputRoomId}
              onChange={(e) => setInputRoomId(e.target.value.toUpperCase())}
              className="text-base"
            />
            <Button onClick={handleJoinRoom} variant="secondary" className="text-base shadow-md">Join</Button>
          </div>
        </CardContent>
      </Card>
      <footer className="text-center py-4 mt-6 text-sm text-muted-foreground"> <p>&copy; {new Date().getFullYear()} Pebble Arena</p> </footer>
    </div>
  );

  const renderCreatingRoomScreen = () => (
     <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/20 p-2 sm:p-4 items-center justify-center">
        <header className="absolute top-4 left-4 right-4 flex justify-between items-center">
            <Button variant="outline" size="icon" aria-label="Back / Reset" onClick={handleResetGame}> <ArrowLeft className="h-5 w-5" /> </Button>
            <ThemeToggle />
        </header>
        <Card className="w-full max-w-md shadow-2xl text-center animate-fadeIn">
            <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-2xl sm:text-3xl font-bold text-primary font-heading">Room Created!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
                <p className="text-muted-foreground text-sm sm:text-base">Share this Room ID with your opponent:</p>
                <div className="flex items-center justify-center space-x-2 p-3 bg-muted rounded-md">
                    <span className="text-2xl font-mono font-bold text-accent tracking-wider">{roomId}</span>
                    <Button variant="ghost" size="icon" onClick={copyRoomIdToClipboard} aria-label="Copy Room ID">
                        <Copy className="h-5 w-5" />
                    </Button>
                </div>
                 <CardDescription className="text-xs text-muted-foreground italic space-y-1">
                  <span>You are {getPlayerThematicName(1)}.</span><br/>
                  <span>This version does not have automatic opponent detection or real-time updates.</span><br/>
                  <span>Once your opponent has the Room ID and clicks "Join Game" on their end, you can click "Start Playing" below to begin playing on your screen. You'll need to coordinate turns manually.</span>
                </CardDescription>
                <Button onClick={handleStartGameAfterSharing} className="w-full text-base mt-4">
                    Start Playing
                </Button>
            </CardContent>
        </Card>
        <footer className="text-center py-4 mt-6 text-sm text-muted-foreground"> <p>&copy; {new Date().getFullYear()} Pebble Arena</p> </footer>
    </div>
  );
  
  const renderGameScreenSkeleton = () => (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/20 p-2 sm:p-4">
      <header className="flex justify-between items-center py-3 px-1 sm:px-2 mb-3 sm:mb-4">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-7 w-48 rounded-md" />
        <div className="flex items-center gap-2"><Skeleton className="h-8 w-8 rounded-md" /><Skeleton className="h-8 w-8 rounded-md" /></div>
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
      <footer className="text-center py-4 mt-auto text-sm text-muted-foreground"><p>&copy; {new Date().getFullYear()} Pebble Arena</p></footer>
    </div>
  );

  if (isLoading) return renderGameScreenSkeleton();
  if (pagePhase === 'initial') return renderInitialScreen();
  if (pagePhase === 'creatingRoom') return renderCreatingRoomScreen();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/20 p-2 sm:p-4">
      <header className="flex justify-between items-center py-3 px-1 sm:px-2 mb-2 sm:mb-3">
        <Button variant="outline" size="icon" onClick={handleResetGame} aria-label="New Room / Reset">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary text-center flex items-center gap-2 font-heading">
          <Swords className="h-6 w-6 sm:h-7 sm:w-7 text-accent animate-pulse" /> Tic-Tac-Toe <Zap className="h-6 w-6 sm:h-7 sm:w-7 text-primary animate-pulse" />
        </h1>
        <div className="flex items-center gap-2">
          {roomId && (
             <div className="text-xs text-muted-foreground hidden sm:block px-2 py-1 bg-muted rounded">Room: {roomId}</div>
          )}
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
      
      {pagePhase === 'gameOver' && (
        <div className="w-full text-center my-2 sm:my-3">
          <Button 
            onClick={handleResetGame} 
            className={`text-base py-2 sm:py-2.5 px-4 sm:px-6 ${winner === 1 ? 'bg-gradient-to-r from-primary via-primary/80 to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground' : winner === 2 ? 'bg-gradient-to-r from-destructive via-destructive/80 to-accent hover:from-destructive/90 hover:to-accent/90 text-destructive-foreground' : 'bg-accent hover:bg-accent/90 text-accent-foreground'} shadow-lg hover:shadow-xl transition-all duration-200`}
          >
            <Sparkles className="mr-2 h-5 w-5" /> {isDraw ? 'New Room' : 'Play Again (New Room)'} <Sparkles className="ml-2 h-5 w-5" />
          </Button>
        </div>
      )}

      <main className="flex-grow w-full flex flex-col items-center justify-center">
        <TicTacToeBoard
          board={board}
          onCellClick={handleCellClick}
          disabled={pagePhase !== 'playing' || gamePhase === 'gameOver' || currentPlayer !== localPlayer}
          winningCombination={winningCombination}
          currentPlayer={currentPlayer}
        />
         {roomId && <p className="text-xs text-center mt-3 text-muted-foreground sm:hidden">Room: {roomId}</p>}
         {pagePhase === 'playing' && currentPlayer !== localPlayer && !winner && !isDraw && (
           <p className="text-center text-sm mt-3 text-amber-600 dark:text-amber-400 animate-pulse">
             Waiting for {getPlayerThematicName(currentPlayer)}'s move...
           </p>
         )}
      </main>

      <footer className="text-center py-4 mt-auto text-sm text-muted-foreground">
         <p>&copy; {new Date().getFullYear()} Pebble Arena</p>
      </footer>
    </div>
  );
};

export default TicTacToePage;
