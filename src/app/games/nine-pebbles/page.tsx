// src/app/games/nine-pebbles/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, RotateCcw, Info, Swords, Zap, ShieldQuestion, Sparkles, Skull } from 'lucide-react'; // Added Sparkles and Skull
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
    1: { pawnsToPlace: PAWNS_PER_PLAYER, pawnsOnBoard: 0, hasMadeFirstPlacement: false, hasMadeSecondPlacement: false },
    2: { pawnsToPlace: PAWNS_PER_PLAYER, pawnsOnBoard: 0, hasMadeFirstPlacement: false, hasMadeSecondPlacement: false },
  });
  
  const [pawnsToPlaceThisTurn, setPawnsToPlaceThisTurn] = useState(0); // Renamed from pawnsToPlaceThisAction
  const [selectedPawnIndex, setSelectedPawnIndex] = useState<number | null>(null);
  const [pawnToRemoveIndex, setPawnToRemoveIndex] = useState<number | null>(null); // For removal animation
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
    const currentPlayerData = playerStats[currentPlayer];

    if (gamePhase === 'placement') {
      let numToPlaceThisTurn = 0;
      if (!currentPlayerData.hasMadeFirstPlacement) {
        numToPlaceThisTurn = 2;
      } else if (!currentPlayerData.hasMadeSecondPlacement && currentPlayerData.pawnsToPlace >=1) { // This ensures they only get 2 if they can place 2
        // This logic is for the *second* player's first turn to also place 2
        const otherPlayer = currentPlayer === 1 ? 2 : 1;
        if (playerStats[otherPlayer].hasMadeFirstPlacement && !playerStats[otherPlayer].hasMadeSecondPlacement) {
            // If the other player has made their first placement (2 pawns)
            // And this current player hasn't made their second placement yet (meaning this IS their first turn)
             numToPlaceThisTurn = 2;
        } else {
             numToPlaceThisTurn = 1;
        }

      } else {
        numToPlaceThisTurn = 1;
      }
      
      // Ensure player doesn't place more than they have
      const actualCanPlace = Math.min(numToPlaceThisTurn, currentPlayerData.pawnsToPlace);
      
      if (pawnsToPlaceThisTurn !== actualCanPlace) {
        setPawnsToPlaceThisTurn(actualCanPlace);
      }

      if (actualCanPlace > 0) {
        setMessage(`${currentPlayerName}'s turn. Place ${actualCanPlace} pawn${actualCanPlace > 1 ? 's' : ''}.`);
      } else if (playerStats[1].pawnsToPlace === 0 && playerStats[2].pawnsToPlace === 0) {
         setMessage("All pawns placed. Movement phase commencing.");
      } else {
         setMessage(`${currentPlayerName}'s turn. All your pawns for this turn are placed.`);
      }

    } else if (gamePhase === 'movement') {
      setPawnsToPlaceThisTurn(0);
      setMessage(`${currentPlayerName}'s turn. Select a pawn to move.`);
    } else if (gamePhase === 'removing') {
      setPawnsToPlaceThisTurn(0);
      const icon = currentPlayer === 1 ? <Sparkles className="inline-block h-5 w-5 text-yellow-400 animate-pulse" /> : <Skull className="inline-block h-5 w-5 text-red-500 animate-pulse" />;
      setMessage(<span>{icon} {currentPlayerName} formed a line of power! Banish an opposing pawn.</span>);
    }
  }, [gamePhase, currentPlayer, playerStats, winner, getPlayerThematicName, pawnsToPlaceThisTurn, setPawnsToPlaceThisTurn, setMessage]);


  useEffect(() => {
    updateMessageAndPawnsToPlace();
  }, [updateMessageAndPawnsToPlace]);


  const switchPlayerAndPhase = useCallback(() => {
    const nextPlayer = currentPlayer === 1 ? 2 : 1;
    
    // Check if all pawns are placed to transition to movement phase
    if (playerStats[1].pawnsToPlace === 0 && playerStats[2].pawnsToPlace === 0 && gamePhase === 'placement') {
      setGamePhase('movement');
    }
    // Reset pawns to place for the next player's turn if still in placement
    else if (gamePhase === 'placement') {
        let numToPlaceForNext = 0;
        const nextPlayerData = playerStats[nextPlayer];
        if (!nextPlayerData.hasMadeFirstPlacement) {
            numToPlaceForNext = 2;
        } else if (!nextPlayerData.hasMadeSecondPlacement && playerStats[currentPlayer].hasMadeFirstPlacement && playerStats[currentPlayer].hasMadeSecondPlacement) {
            // If current player has finished their "2 pawn" start, and next player is due for theirs
            numToPlaceForNext = 2;
        }
        else {
            numToPlaceForNext = 1;
        }
        const actualCanPlaceNext = Math.min(numToPlaceForNext, nextPlayerData.pawnsToPlace);
        setPawnsToPlaceThisTurn(actualCanPlaceNext);
    }
    
    setCurrentPlayer(nextPlayer);
  }, [currentPlayer, gamePhase, playerStats]);


  const handleResetGame = () => {
    setIsLoading(true);
    setBoard(createInitialBoard());
    setGamePhase('playerSelection');
    setCurrentPlayer(1); 
    setPlayerStats({
      1: { pawnsToPlace: PAWNS_PER_PLAYER, pawnsOnBoard: 0, hasMadeFirstPlacement: false, hasMadeSecondPlacement: false },
      2: { pawnsToPlace: PAWNS_PER_PLAYER, pawnsOnBoard: 0, hasMadeFirstPlacement: false, hasMadeSecondPlacement: false },
    });
    setSelectedPawnIndex(null);
    setPawnToRemoveIndex(null);
    setWinner(null);
    setPawnsToPlaceThisTurn(0);
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

    if (!p1CanPlace && p1OnBoard < 3) {
      setWinner(2); setGamePhase('gameOver'); return true;
    }
    if (!p2CanPlace && p2OnBoard < 3) {
      setWinner(1); setGamePhase('gameOver'); return true;
    }
    
    // Check for no moves scenario only during movement phase or if placement is done
    if ((gamePhase === 'movement') || (playerStats[1].pawnsToPlace === 0 && playerStats[2].pawnsToPlace === 0) ) {
        const playerToCheck = gamePhase === 'movement' ? currentPlayer : (currentPlayer === 1 ? 2 : 1) ; // if just finished placement, check opponent
        const opponentPlayer = playerToCheck === 1 ? 2 : 1;

        if (updatedPlayerStats[playerToCheck].pawnsToPlace === 0 && updatedPlayerStats[playerToCheck].pawnsOnBoard >=3) {
             let hasMoves = false;
            for (let i = 0; i < TOTAL_POINTS; i++) {
              if (updatedBoard[i] === playerToCheck) { 
                if (ADJACENCY_LIST[i].some(adj => updatedBoard[adj] === null)) { 
                  hasMoves = true;
                  break;
                }
              }
            }
            if (!hasMoves) {
              setWinner(opponentPlayer); 
              setGamePhase('gameOver');
              return true;
            }
        }
    }
    return false;
  }, [gamePhase, winner, currentPlayer, playerStats]);


  useEffect(() => {
    if (!winner && (gamePhase === 'movement' || gamePhase === 'removing' || (gamePhase === 'placement' && playerStats[1].pawnsToPlace === 0 && playerStats[2].pawnsToPlace === 0) )) {
      const gameEnded = checkWinCondition(board, playerStats);
      if(gameEnded) {
        updateMessageAndPawnsToPlace(); 
      }
    }
  }, [board, playerStats, winner, checkWinCondition, updateMessageAndPawnsToPlace, gamePhase]);
  

  const handlePlayerSelect = (player: Player) => {
    setIsLoading(true);
    setCurrentPlayer(player);
    setGamePhase('placement');
    setPlayerStats({ 
      1: { pawnsToPlace: PAWNS_PER_PLAYER, pawnsOnBoard: 0, hasMadeFirstPlacement: false, hasMadeSecondPlacement: false },
      2: { pawnsToPlace: PAWNS_PER_PLAYER, pawnsOnBoard: 0, hasMadeFirstPlacement: false, hasMadeSecondPlacement: false },
    });
    setPawnsToPlaceThisTurn(2); // First player always places 2 initially
    toast({ 
      title: "Battle Commences!", 
      description: `${getPlayerThematicName(player)} will lead the charge. Place 2 pawns.`,
      className: player === 1 ? "bg-primary/10 border-primary" : "bg-accent/10 border-accent",
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
        
        const remainingForThisTurnAfterPlacement = pawnsToPlaceThisTurn - 1;
        
        setBoard(newBoard); 

        if (checkMill(newBoard, currentPlayer, index)) {
          setPawnsToPlaceThisTurn(remainingForThisTurnAfterPlacement); // Update remaining placements for this turn
          setPlayerStats(updatedPlayerStats); 
          setGamePhase('removing');
        } else {
          if (remainingForThisTurnAfterPlacement === 0) { 
             if (!updatedPlayerStats[currentPlayer].hasMadeFirstPlacement) {
                 updatedPlayerStats[currentPlayer].hasMadeFirstPlacement = true;
             } else if (!updatedPlayerStats[currentPlayer].hasMadeSecondPlacement) {
                 updatedPlayerStats[currentPlayer].hasMadeSecondPlacement = true;
             }
             setPlayerStats(updatedPlayerStats);
             switchPlayerAndPhase();
          } else {
            setPawnsToPlaceThisTurn(remainingForThisTurnAfterPlacement);
            setPlayerStats(updatedPlayerStats);
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
            switchPlayerAndPhase();
          }
        } else {
          toast({ title: "Invalid Move", description: "You can only move to an adjacent empty spot.", variant: "destructive" });
        }
      }
    } else if (gamePhase === 'removing') {
      const opponent = currentPlayer === 1 ? 2 : 1;
      if (newBoard[index] === opponent && canRemovePawn(newBoard, index, opponent)) {
        
        setPawnToRemoveIndex(index); // Set pawn to animate its removal
        setGamePhase('animatingRemoval');
        
        const toastIcon = currentPlayer === 1 ? <Sparkles className="inline-block h-4 w-4 text-yellow-300" /> : <Skull className="inline-block h-4 w-4 text-red-400" />;
        toast({ 
            title: <span>{toastIcon} Pawn Banished!</span>, 
            description: `${getPlayerThematicName(opponent)}'s pawn is being removed.`, 
            variant: "default",
            className: currentPlayer === 1 ? "bg-primary/20 border-primary" : "bg-accent/20 border-accent"
        });

        setTimeout(() => {
            let boardAfterRemoval = [...board]; // Use current board state for removal
            boardAfterRemoval[index] = null;
            let statsAfterRemoval = JSON.parse(JSON.stringify(playerStats));
            statsAfterRemoval[opponent].pawnsOnBoard -= 1;

            setBoard(boardAfterRemoval); 
            setPlayerStats(statsAfterRemoval);
            setPawnToRemoveIndex(null);

            const gameWon = checkWinCondition(boardAfterRemoval, statsAfterRemoval);
            if (!gameWon) {
                 // Determine next phase based on remaining pawns to place
                const stillInPlacementPhaseOverall = statsAfterRemoval[1].pawnsToPlace > 0 || statsAfterRemoval[2].pawnsToPlace > 0;
                if (pawnsToPlaceThisTurn > 0 && stillInPlacementPhaseOverall) { // If current player had pending placements before forming mill
                    setGamePhase('placement');
                } else {
                    setGamePhase(stillInPlacementPhaseOverall ? 'placement' : 'movement');
                    switchPlayerAndPhase();
                }
            } else {
                // gamePhase will be set to 'gameOver' by checkWinCondition
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
            className="w-full text-base sm:text-lg py-2.5 sm:py-3 bg-accent hover:bg-accent/90 text-accent-foreground shadow-md hover:shadow-lg transition-all duration-150 ease-out hover:scale-105 active:scale-95 group"
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
            <RotateCcw />
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
                <div key={p} className={`p-2.5 rounded-md bg-primary/10 border border-primary/30`}>
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
            <RotateCcw />
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
                currentPlayer === 1 ? 'border-primary/60' : 'border-accent/60'
              } bg-card text-xs sm:text-sm shadow-inner`}>
              <Info className={`h-4 w-4 sm:h-5 sm:w-5 ${currentPlayer === 1 ? 'text-primary' : 'text-accent'}`} />
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
                <div className={`p-2.5 rounded-md bg-accent/10 border border-accent/40 shadow-sm transition-all duration-300 ${currentPlayer === 2 && !winner ? 'ring-2 ring-accent ring-offset-2 ring-offset-background shadow-accent/30 scale-105' : 'opacity-80'}`}>
                     <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-accent font-heading">{getPlayerThematicName(2)}</span>
                        <PlayerPawnDisplay player={2} size="small" />
                    </div>
                    <p>To Place: <span className="font-bold">{playerStats[2].pawnsToPlace}</span></p>
                    <p>On Board: <span className="font-bold">{playerStats[2].pawnsOnBoard}</span></p>
                </div>
            </div>
            
            {winner && (
              <Button onClick={handleResetGame} className="w-full mt-3 text-sm sm:text-base py-2 sm:py-2.5 bg-gradient-to-r from-primary via-primary/80 to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200">
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
