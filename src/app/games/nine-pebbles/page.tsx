// src/app/games/nine-pebbles/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, RotateCcw, Info, Swords, Zap, ShieldQuestion, Sparkles, Skull } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import GameBoardDisplay from './components/GameBoard';
import PlayerPawnDisplay from './components/Pawn';
import {
  TOTAL_POINTS,
  PAWNS_PER_PLAYER,
  Player,
  GameBoardArray,
  createInitialBoard,
  checkMill,
  canRemovePawn,
  ADJACENCY_LIST,
} from '@/lib/nine-pebbles-rules';
import { ThemeToggle } from '@/app/(components)/ThemeToggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type GamePhase = 'playerSelection' | 'placement' | 'movement' | 'removing' | 'animatingRemoval' | 'gameOver';

const PAWN_REMOVAL_ANIMATION_DURATION = 700; // ms, should match animation duration

const NinePebblesPage: React.FC = () => {
  const [board, setBoard] = useState<GameBoardArray>(createInitialBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
  const [gamePhase, setGamePhase] = useState<GamePhase>('playerSelection');
  
  const [playerStats, setPlayerStats] = useState({
    1: { pawnsToPlace: PAWNS_PER_PLAYER, pawnsOnBoard: 0, hasCompletedInitialTwoPawnPlacement: false },
    2: { pawnsToPlace: PAWNS_PER_PLAYER, pawnsOnBoard: 0, hasCompletedInitialTwoPawnPlacement: false },
  });
  
  const [pawnsToPlaceThisTurn, setPawnsToPlaceThisTurn] = useState(0); // Number of pawns the current player must place in their current turn sequence (1 or 2)
  const [isCurrentPlayerOnInitialTwoPawnTurn, setIsCurrentPlayerOnInitialTwoPawnTurn] = useState(false); // Tracks if current player is on their specific first 2-pawn turn
  
  const [selectedPawnIndex, setSelectedPawnIndex] = useState<number | null>(null);
  const [pawnToRemoveIndex, setPawnToRemoveIndex] = useState<number | null>(null);
  const [winner, setWinner] = useState<Player | null>(null);
  const [message, setMessage] = useState<string>('Choose which side will make the first move.');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); 
    return () => clearTimeout(timer);
  }, []);

  const getPlayerThematicName = useCallback((player: Player | null) => {
    if (player === 1) return "Angels";
    if (player === 2) return "Demons";
    return "";
  }, []);

  const updateMessageAndPawnsToPlace = useCallback(() => {
    if (winner || gamePhase === 'playerSelection' || gamePhase === 'animatingRemoval') {
        if (winner) {
             setMessage(`${getPlayerThematicName(winner)} are victorious!`);
        } else if (gamePhase === 'playerSelection') {
             setMessage('Choose which side will make the first move.');
        } else if (gamePhase === 'animatingRemoval') {
            const removingPlayerName = getPlayerThematicName(currentPlayer);
            const opponentPlayerName = getPlayerThematicName(currentPlayer === 1 ? 2 : 1);
            setMessage(`${removingPlayerName} are banishing a ${opponentPlayerName}' pawn!`);
        }
        return;
    }
    
    const currentPlayerName = getPlayerThematicName(currentPlayer);

    if (gamePhase === 'placement') {
      if (pawnsToPlaceThisTurn > 0 && playerStats[currentPlayer].pawnsToPlace > 0) {
        setMessage(`${currentPlayerName}'s turn. Place ${pawnsToPlaceThisTurn} pawn${pawnsToPlaceThisTurn > 1 ? 's' : ''}.`);
      } else if (playerStats[1].pawnsToPlace === 0 && playerStats[2].pawnsToPlace === 0) {
         setMessage("All pawns placed. Movement phase commencing.");
      } else {
         setMessage(`${currentPlayerName}'s turn. No more pawns to place this turn or overall.`);
      }
    } else if (gamePhase === 'movement') {
      setMessage(`${currentPlayerName}'s turn. Select a pawn to move.`);
    } else if (gamePhase === 'removing') {
      const icon = currentPlayer === 1 ? <Sparkles className="inline-block h-5 w-5 text-yellow-400 animate-pulse" /> : <Skull className="inline-block h-5 w-5 text-red-500 animate-pulse" />;
      setMessage(<span>{icon} {currentPlayerName} formed a line of power! Banish an opposing pawn.</span>);
    }
  }, [gamePhase, currentPlayer, playerStats, winner, getPlayerThematicName, pawnsToPlaceThisTurn]);


  useEffect(() => {
    updateMessageAndPawnsToPlace();
  }, [updateMessageAndPawnsToPlace]);


  const switchPlayerAndPhase = useCallback(() => {
    const nextPlayer = currentPlayer === 1 ? 2 : 1;
    
    // Check if overall placement phase is done for BOTH players
    if (playerStats[1].pawnsToPlace === 0 && playerStats[2].pawnsToPlace === 0 && gamePhase === 'placement') {
      setGamePhase('movement');
      setPawnsToPlaceThisTurn(0); // No pawns to place in movement phase
      setIsCurrentPlayerOnInitialTwoPawnTurn(false); // Initial turns are done
    } else if (gamePhase === 'placement') {
        let numToPlaceForNextPlayerTurn = 1; // Default for subsequent turns
        let nextPlayerIsOnInitialTurn = false;

        // If the next player hasn't completed their initial 2-pawn placement AND they still have pawns overall
        if (!playerStats[nextPlayer].hasCompletedInitialTwoPawnPlacement && playerStats[nextPlayer].pawnsToPlace > 0) {
            numToPlaceForNextPlayerTurn = 2;
            nextPlayerIsOnInitialTurn = true;
        }
        
        // Actual number of pawns the next player can place in their upcoming turn sequence
        const actualCanPlaceNext = Math.min(numToPlaceForNextPlayerTurn, playerStats[nextPlayer].pawnsToPlace);
        setPawnsToPlaceThisTurn(actualCanPlaceNext);
        // Only set true if they are eligible AND will actually place 2 (e.g. not if they only have 1 pawn left total)
        setIsCurrentPlayerOnInitialTwoPawnTurn(nextPlayerIsOnInitialTurn && actualCanPlaceNext === 2);
    }
    // Else, if in movement or other phases, pawnsToPlaceThisTurn and isCurrentPlayerOnInitialTwoPawnTurn are not changed here.
    
    setCurrentPlayer(nextPlayer);
  }, [currentPlayer, gamePhase, playerStats]);


  const handleResetGame = () => {
    setIsLoading(true);
    setBoard(createInitialBoard());
    setGamePhase('playerSelection');
    setCurrentPlayer(1); 
    setPlayerStats({
      1: { pawnsToPlace: PAWNS_PER_PLAYER, pawnsOnBoard: 0, hasCompletedInitialTwoPawnPlacement: false },
      2: { pawnsToPlace: PAWNS_PER_PLAYER, pawnsOnBoard: 0, hasCompletedInitialTwoPawnPlacement: false },
    });
    setSelectedPawnIndex(null);
    setPawnToRemoveIndex(null);
    setWinner(null);
    setPawnsToPlaceThisTurn(0);
    setIsCurrentPlayerOnInitialTwoPawnTurn(false);
    toast({ 
        title: "Game Reset", 
        description: "The eternal battle begins anew. Choose your champion.",
        className: "bg-card border-foreground/20 shadow-lg",
    });
    setTimeout(() => setIsLoading(false), 500);
  };
  
  const checkWinCondition = useCallback((updatedBoard: GameBoardArray, updatedPlayerStats: typeof playerStats) => {
    if (gamePhase === 'playerSelection' || winner || gamePhase === 'animatingRemoval') return false;

    const p1OnBoard = updatedPlayerStats[1].pawnsOnBoard;
    const p1CanPlace = updatedPlayerStats[1].pawnsToPlace > 0;
    const p2OnBoard = updatedPlayerStats[2].pawnsOnBoard;
    const p2CanPlace = updatedPlayerStats[2].pawnsToPlace > 0;

    // Win if opponent has fewer than 3 pawns on board AND cannot place more.
    if (!p1CanPlace && p1OnBoard < 3) {
      setWinner(2); setGamePhase('gameOver'); return true;
    }
    if (!p2CanPlace && p2OnBoard < 3) {
      setWinner(1); setGamePhase('gameOver'); return true;
    }
    
    // Win if opponent has no valid moves (only relevant after placement phase)
    if ((gamePhase === 'movement') || (playerStats[1].pawnsToPlace === 0 && playerStats[2].pawnsToPlace === 0) ) {
        const playerToCheckForNoMoves = gamePhase === 'removing' ? (currentPlayer === 1 ? 2 : 1) : currentPlayer;
        const opponentOfPlayerToCheck = playerToCheckForNoMoves === 1 ? 2 : 1;

        if (updatedPlayerStats[playerToCheckForNoMoves].pawnsToPlace === 0 && updatedPlayerStats[playerToCheckForNoMoves].pawnsOnBoard >=3) {
             let hasMoves = false;
            for (let i = 0; i < TOTAL_POINTS; i++) {
              if (updatedBoard[i] === playerToCheckForNoMoves) { 
                if (ADJACENCY_LIST[i].some(adj => updatedBoard[adj] === null)) { 
                  hasMoves = true;
                  break;
                }
              }
            }
            if (!hasMoves) {
              setWinner(opponentOfPlayerToCheck); 
              setGamePhase('gameOver');
              return true;
            }
        }
    }
    return false;
  }, [gamePhase, winner, currentPlayer, playerStats]); 


  useEffect(() => {
    if (!winner && gamePhase !== 'playerSelection' && gamePhase !== 'animatingRemoval' && gamePhase !== 'gameOver') {
      const gameEnded = checkWinCondition(board, playerStats);
      if(gameEnded) {
        updateMessageAndPawnsToPlace(); 
      }
    }
  }, [board, playerStats, winner, gamePhase, checkWinCondition, updateMessageAndPawnsToPlace]); 
  

  const handlePlayerSelect = (player: Player) => {
    setIsLoading(true);
    setCurrentPlayer(player);
    setGamePhase('placement');
    setPlayerStats({ 
      1: { pawnsToPlace: PAWNS_PER_PLAYER, pawnsOnBoard: 0, hasCompletedInitialTwoPawnPlacement: false },
      2: { pawnsToPlace: PAWNS_PER_PLAYER, pawnsOnBoard: 0, hasCompletedInitialTwoPawnPlacement: false },
    });
    setPawnsToPlaceThisTurn(Math.min(2, PAWNS_PER_PLAYER)); 
    setIsCurrentPlayerOnInitialTwoPawnTurn(true); 
    toast({ 
      title: "Battle Commences!", 
      description: `${getPlayerThematicName(player)} will lead the charge. Place 2 pawns.`,
      className: player === 1 ? "bg-primary/10 border-primary" : "bg-destructive/10 border-destructive",
    });
    setTimeout(() => setIsLoading(false), 500);
  };

  const handlePointClick = (index: number) => {
    if (winner || gamePhase === 'gameOver' || gamePhase === 'playerSelection' || gamePhase === 'animatingRemoval') return;

    let newBoard = [...board];
    let updatedPlayerStats = JSON.parse(JSON.stringify(playerStats)) as typeof playerStats;
    const currentPlayerName = getPlayerThematicName(currentPlayer);

    if (gamePhase === 'placement') {
      if (newBoard[index] === null && pawnsToPlaceThisTurn > 0 && updatedPlayerStats[currentPlayer].pawnsToPlace > 0) {
        newBoard[index] = currentPlayer;
        updatedPlayerStats[currentPlayer].pawnsToPlace -= 1;
        updatedPlayerStats[currentPlayer].pawnsOnBoard += 1;
        
        const remainingForThisActionSequence = pawnsToPlaceThisTurn - 1; 
        
        setBoard(newBoard); 

        if (checkMill(newBoard, currentPlayer, index)) {
          setPlayerStats(updatedPlayerStats); 
          setPawnsToPlaceThisTurn(remainingForThisActionSequence); 
          setGamePhase('removing');
        } else {
          if (remainingForThisActionSequence === 0) { 
            if (isCurrentPlayerOnInitialTwoPawnTurn) { 
                 updatedPlayerStats[currentPlayer].hasCompletedInitialTwoPawnPlacement = true;
            }
            setPlayerStats(updatedPlayerStats);
            switchPlayerAndPhase(); 
          } else {
            setPlayerStats(updatedPlayerStats);
            setPawnsToPlaceThisTurn(remainingForThisActionSequence);
          }
        }
      } else if (newBoard[index] !== null) {
        toast({ title: "Invalid Placement", description: "This position is already occupied.", variant: "destructive" });
      } else if (pawnsToPlaceThisTurn === 0 || updatedPlayerStats[currentPlayer].pawnsToPlace === 0) {
         toast({ title: "No Pawns to Place", description: "You have no more pawns for this turn or overall.", variant: "default" });
      }
    } else if (gamePhase === 'movement') {
      if (selectedPawnIndex === null) {
        if (newBoard[index] === currentPlayer) {
          setSelectedPawnIndex(index);
        } else {
          toast({ title: "Invalid Selection", description: `Select one of your own ${currentPlayerName}'s pawns.`, variant: "destructive" });
        }
      } else {
        if (index === selectedPawnIndex) { 
            setSelectedPawnIndex(null); 
            return;
        }
        if (newBoard[index] === null && ADJACENCY_LIST[selectedPawnIndex].includes(index)) {
          newBoard[selectedPawnIndex] = null;
          newBoard[index] = currentPlayer;
          const movedPawnIndex = index; 
          
          setSelectedPawnIndex(null);
          setBoard(newBoard); 

          if (checkMill(newBoard, currentPlayer, movedPawnIndex)) {
            setGamePhase('removing');
          } else {
            if (!checkWinCondition(newBoard, updatedPlayerStats)) { 
                switchPlayerAndPhase();
            }
          }
        } else {
          toast({ title: "Invalid Move", description: "You can only move to an adjacent empty spot.", variant: "destructive" });
        }
      }
    } else if (gamePhase === 'removing') {
      const opponent = currentPlayer === 1 ? 2 : 1;
      if (newBoard[index] === opponent && canRemovePawn(newBoard, index, opponent)) {
        
        setPawnToRemoveIndex(index); 
        setGamePhase('animatingRemoval'); 
        
        const toastIcon = currentPlayer === 1 ? <Sparkles className="inline-block h-4 w-4 text-yellow-300" /> : <Skull className="inline-block h-4 w-4 text-red-400" />;
        toast({ 
            title: <span>{toastIcon} Pawn Banished!</span>, 
            description: `${getPlayerThematicName(opponent)}'s pawn is being removed.`, 
            variant: "default",
            className: currentPlayer === 1 ? "bg-primary/20 border-primary" : "bg-destructive/20 border-destructive"
        });

        setTimeout(() => {
            let boardAfterRemoval = [...board]; 
            boardAfterRemoval[index] = null;
            
            // Use a fresh copy of playerStats from state for modification
            let statsAfterRemoval = JSON.parse(JSON.stringify(playerStats)); 
            statsAfterRemoval[opponent].pawnsOnBoard -= 1;

            setBoard(boardAfterRemoval); 
            // playerStats will be updated after this block or within checkWinCondition/switchPlayerAndPhase
            setPawnToRemoveIndex(null);

            const gameWon = checkWinCondition(boardAfterRemoval, statsAfterRemoval); 
            
            if (!gameWon) {
                const stillInPlacementPhaseOverall = statsAfterRemoval[1].pawnsToPlace > 0 || statsAfterRemoval[2].pawnsToPlace > 0;
                
                if (pawnsToPlaceThisTurn > 0 && stillInPlacementPhaseOverall) {
                    setPlayerStats(statsAfterRemoval); // Update stats, current player continues placement
                    setGamePhase('placement'); 
                } else {
                    let finalStatsForThisTurn = JSON.parse(JSON.stringify(statsAfterRemoval));
                    if (isCurrentPlayerOnInitialTwoPawnTurn) { 
                        finalStatsForThisTurn[currentPlayer].hasCompletedInitialTwoPawnPlacement = true;
                    }
                    setPlayerStats(finalStatsForThisTurn); 
                    
                    setGamePhase(stillInPlacementPhaseOverall ? 'placement' : 'movement');
                    updateMessageAndPawnsToPlace(); // Update message before switching player
                    switchPlayerAndPhase(); 
                }
            } else {
                 setPlayerStats(statsAfterRemoval); 
            }
        }, PAWN_REMOVAL_ANIMATION_DURATION);

      } else {
        toast({ title: "Invalid Banishment", description: "Cannot remove this pawn. Select a valid opponent's pawn.", variant: "destructive" });
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
          <CardTitle className="text-2xl sm:text-3xl font-bold text-primary font-heading">Choose Who Starts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
          <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">The chosen side makes the first move and places 2 pawns.</p>
          <Button 
            onClick={() => handlePlayerSelect(1)} 
            className="w-full text-base sm:text-lg py-2.5 sm:py-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-150 ease-out hover:scale-105 active:scale-95 group"
          >
            <PlayerPawnDisplay player={1} size="small" /> <span className="ml-2 group-hover:tracking-wider transition-all">Angels Start</span>
          </Button>
          <Button 
            onClick={() => handlePlayerSelect(2)} 
            className="w-full text-base sm:text-lg py-2.5 sm:py-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-md hover:shadow-lg transition-all duration-150 ease-out hover:scale-105 active:scale-95 group"
          >
            <PlayerPawnDisplay player={2} size="small" /> <span className="ml-2 group-hover:tracking-wider transition-all">Demons Start</span>
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
          <Button variant="outline" size="icon" aria-label="Back to Choose Game">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary text-center flex items-center gap-2 font-heading">
          <Swords className="h-6 w-6 sm:h-7 sm:w-7 text-accent" /> 9-Pebbles <Zap className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Reset Game" disabled>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-grow flex flex-col lg:flex-row items-center lg:items-start justify-center gap-3 sm:gap-4 lg:gap-6">
        <div className="w-full max-w-[calc(100vw-20px)] sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl aspect-square relative self-center">
          <Skeleton className="w-full h-full rounded-lg" />
        </div>
        <Card className="w-full lg:max-w-xs xl:max-w-sm shadow-lg mt-3 lg:mt-0 shrink-0">
          <CardHeader className="p-4 sm:p-5">
            <CardTitle className="text-lg sm:text-xl text-center text-primary font-heading">Battle Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 sm:p-5 sm:pt-0">
            <Alert variant="default" className="bg-card text-xs sm:text-sm">
              <Info className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <AlertTitle className="font-semibold text-sm sm:text-base">
                <Skeleton className="h-5 w-2/3" />
              </AlertTitle>
              <Skeleton className="h-4 w-full mt-1" />
              <Skeleton className="h-4 w-3/4 mt-1" />
            </Alert>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
              {[1, 2].map(p => (
                <div key={p} className={`p-2.5 rounded-md ${p === 1 ? 'bg-primary/10 border-primary/30' : 'bg-destructive/10 border-destructive/30'} border`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="w-7 h-7 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
            <Skeleton className="h-10 w-full mt-3" />
          </CardContent>
        </Card>
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
      <header className="flex justify-between items-center py-3 px-1 sm:px-2 mb-3 sm:mb-4">
        <Link href="/choose-game" passHref>
          <Button variant="outline" size="icon" aria-label="Back to Choose Game">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary text-center flex items-center gap-2 font-heading">
          <Swords className="h-6 w-6 sm:h-7 sm:w-7 text-accent animate-pulse" /> 9-Pebbles <Zap className="h-6 w-6 sm:h-7 sm:w-7 text-primary animate-pulse" />
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleResetGame} aria-label="Reset Game">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-grow flex flex-col lg:flex-row items-center lg:items-start justify-center gap-3 sm:gap-4 lg:gap-6">
        <div className="w-full max-w-[calc(100vw-20px)] sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl aspect-square relative self-center">
          <GameBoardDisplay
            board={board}
            onPointClick={handlePointClick}
            selectedPawnIndex={selectedPawnIndex}
            gamePhase={gamePhase}
            currentPlayer={currentPlayer}
            winner={winner}
            pawnToRemoveIndex={pawnToRemoveIndex}
          />
        </div>

        <Card className="w-full lg:max-w-xs xl:max-w-sm shadow-lg mt-3 lg:mt-0 shrink-0">
          <CardHeader className="p-4 sm:p-5">
            <CardTitle className="text-lg sm:text-xl text-center text-primary font-heading">Battle Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 sm:p-5 sm:pt-0">
             <Alert variant={winner ? (winner === currentPlayer ? "default" : "destructive") : "default"} className={`${
                (winner === 2 || (!winner && currentPlayer === 2)) ? 'border-destructive/60' : 'border-primary/60'
              } bg-card text-xs sm:text-sm shadow-inner`}>
              <Info className={`h-4 w-4 sm:h-5 sm:w-5 ${(winner === 2 || (!winner && currentPlayer === 2)) ? 'text-destructive' : 'text-primary'}`} />
              <AlertTitle className="font-semibold text-sm sm:text-base font-heading">
                {winner ? `Battle Over!` : `${getPlayerThematicName(currentPlayer)}'s Turn`}
              </AlertTitle>
              <AlertDescription className="min-h-[2.5em]">{message}</AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                <div className={`p-2.5 rounded-md bg-primary/10 border border-primary/40 shadow-sm transition-all duration-300 ${currentPlayer === 1 && !winner ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-primary/30 scale-105' : 'opacity-80'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-primary font-heading">{getPlayerThematicName(1)}</span>
                        <PlayerPawnDisplay player={1} size="small" />
                    </div>
                    <p>To Place: <span className="font-bold">{playerStats[1].pawnsToPlace}</span></p>
                    <p>On Board: <span className="font-bold">{playerStats[1].pawnsOnBoard}</span></p>
                </div>
                <div className={`p-2.5 rounded-md bg-destructive/10 border border-destructive/40 shadow-sm transition-all duration-300 ${currentPlayer === 2 && !winner ? 'ring-2 ring-destructive ring-offset-2 ring-offset-background shadow-destructive/30 scale-105' : 'opacity-80'}`}>
                     <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-destructive font-heading">{getPlayerThematicName(2)}</span>
                        <PlayerPawnDisplay player={2} size="small" />
                    </div>
                    <p>To Place: <span className="font-bold">{playerStats[2].pawnsToPlace}</span></p>
                    <p>On Board: <span className="font-bold">{playerStats[2].pawnsOnBoard}</span></p>
                </div>
            </div>
            
            {winner && (
              <Button onClick={handleResetGame} className={`w-full mt-3 text-sm sm:text-base py-2 sm:py-2.5 ${winner === 1 ? 'bg-gradient-to-r from-primary via-primary/80 to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground' : 'bg-gradient-to-r from-destructive via-destructive/80 to-accent hover:from-destructive/90 hover:to-accent/90 text-destructive-foreground'} shadow-lg hover:shadow-xl transition-all duration-200`}>
                <Sparkles className="mr-2 h-4 w-4" /> Fight Again <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            )}
             {!winner && gamePhase !== 'playerSelection' && (
                <Button onClick={handleResetGame} variant="outline" className="w-full mt-3 text-xs sm:text-sm py-1.5 sm:py-2 border-foreground/30 hover:border-foreground/50 hover:bg-secondary/50">
                    Restart Battle
                </Button>
            )}
          </CardContent>
        </Card>
      </main>
       <footer className="text-center py-4 mt-auto text-sm text-muted-foreground">
         <p>&copy; {new Date().getFullYear()} Pebble Arena</p>
      </footer>
    </div>
  );
};

export default NinePebblesPage;
