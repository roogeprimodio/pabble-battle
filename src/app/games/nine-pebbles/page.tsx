
// src/app/games/nine-pebbles/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, RotateCcw, Info, Swords, Zap, ShieldQuestion } from 'lucide-react';
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

type GamePhase = 'playerSelection' | 'placement' | 'movement' | 'removing' | 'gameOver';

const NinePebblesPage: React.FC = () => {
  const [board, setBoard] = useState<GameBoardArray>(createInitialBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
  const [gamePhase, setGamePhase] = useState<GamePhase>('playerSelection');
  
  const [playerStats, setPlayerStats] = useState({
    1: { pawnsToPlace: PAWNS_PER_PLAYER, pawnsOnBoard: 0, hasMadeFirstPlacement: false },
    2: { pawnsToPlace: PAWNS_PER_PLAYER, pawnsOnBoard: 0, hasMadeFirstPlacement: false },
  });
  
  const [pawnsToPlaceThisAction, setPawnsToPlaceThisAction] = useState(0);
  const [selectedPawnIndex, setSelectedPawnIndex] = useState<number | null>(null);
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
    if (winner || gamePhase === 'playerSelection') {
        if (winner) {
             setMessage(`${getPlayerThematicName(winner)} are victorious!`);
        } else {
             setMessage('Choose which side will make the first move.');
        }
        return;
    }
    
    const currentPlayerName = getPlayerThematicName(currentPlayer);

    if (gamePhase === 'placement') {
      const currentPlayerData = playerStats[currentPlayer];
      
      if (currentPlayerData.pawnsToPlace === 0) {
        setPawnsToPlaceThisAction(0);
        if (playerStats[1].pawnsToPlace === 0 && playerStats[2].pawnsToPlace === 0) {
          setMessage("All pawns placed. Movement phase commencing.");
        } else {
          setMessage(`${currentPlayerName}'s turn. All your pawns are placed. Waiting for opponent or next phase.`);
        }
        return; 
      }

      const intendedPawnsForAction = !currentPlayerData.hasMadeFirstPlacement ? 2 : 1;
      const actualPawnsToPlace = Math.min(intendedPawnsForAction, currentPlayerData.pawnsToPlace);
      
      setPawnsToPlaceThisAction(actualPawnsToPlace);
      if (actualPawnsToPlace > 0) {
        setMessage(`${currentPlayerName}'s turn. Place ${actualPawnsToPlace} pawn${actualPawnsToPlace > 1 ? 's' : ''}.`);
      } else {
        // Should not happen if currentPlayerData.pawnsToPlace > 0
        setMessage(`${currentPlayerName}'s turn. No pawns to place this action.`);
      }

    } else if (gamePhase === 'movement') {
      setMessage(`${currentPlayerName}'s turn. Select a pawn to move.`);
    } else if (gamePhase === 'removing') {
      setMessage(`${currentPlayerName} formed a line of power! Banish an opposing pawn.`);
    }
  }, [gamePhase, currentPlayer, playerStats, winner, getPlayerThematicName]);

  useEffect(() => {
    updateMessageAndPawnsToPlace();
  }, [updateMessageAndPawnsToPlace]);


  const switchPlayerAndPhase = useCallback(() => {
    const nextPlayer = currentPlayer === 1 ? 2 : 1;
    
    // Check for game phase transition after playerStats has been updated by handlePointClick
    if (gamePhase === 'placement' && playerStats[1].pawnsToPlace === 0 && playerStats[2].pawnsToPlace === 0) {
      setGamePhase('movement');
    }
    setCurrentPlayer(nextPlayer);

  }, [currentPlayer, gamePhase, playerStats]);


  const handleResetGame = () => {
    setIsLoading(true);
    setBoard(createInitialBoard());
    setGamePhase('playerSelection');
    setCurrentPlayer(1); 
    setPlayerStats({
      1: { pawnsToPlace: PAWNS_PER_PLAYER, pawnsOnBoard: 0, hasMadeFirstPlacement: false },
      2: { pawnsToPlace: PAWNS_PER_PLAYER, pawnsOnBoard: 0, hasMadeFirstPlacement: false },
    });
    setSelectedPawnIndex(null);
    setWinner(null);
    setPawnsToPlaceThisAction(0);
    toast({ title: "Game Reset", description: "The eternal battle begins anew. Choose your champion." });
    setTimeout(() => setIsLoading(false), 500);
  };
  
  const checkWinCondition = useCallback((updatedBoard: GameBoardArray, updatedPlayerStats: typeof playerStats) => {
    if (gamePhase === 'playerSelection' || winner) return false;

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
    
    const playerWhoseTurnItIs = currentPlayer;
    
    if (updatedPlayerStats[playerWhoseTurnItIs].pawnsToPlace === 0 && updatedPlayerStats[playerWhoseTurnItIs].pawnsOnBoard >= 3) {
        let hasMoves = false;
        for (let i = 0; i < TOTAL_POINTS; i++) {
          if (updatedBoard[i] === playerWhoseTurnItIs) { 
            if (ADJACENCY_LIST[i].some(adj => updatedBoard[adj] === null)) { 
              hasMoves = true;
              break;
            }
          }
        }
        if (!hasMoves) {
          setWinner(playerWhoseTurnItIs === 1 ? 2 : 1); 
          setGamePhase('gameOver');
          return true;
        }
      }
    return false;
  }, [gamePhase, winner, currentPlayer]); 


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
      1: { pawnsToPlace: PAWNS_PER_PLAYER, pawnsOnBoard: 0, hasMadeFirstPlacement: false },
      2: { pawnsToPlace: PAWNS_PER_PLAYER, pawnsOnBoard: 0, hasMadeFirstPlacement: false },
    });
    toast({ 
      title: "Battle Commences!", 
      description: `${getPlayerThematicName(player)} will lead the charge. Place 2 pawns.` 
    });
    setTimeout(() => setIsLoading(false), 500);
  };

  const handlePointClick = (index: number) => {
    if (winner || gamePhase === 'gameOver' || gamePhase === 'playerSelection') return;

    let newBoard = [...board];
    let updatedPlayerStats = JSON.parse(JSON.stringify(playerStats)) as typeof playerStats;
    const currentPlayerName = getPlayerThematicName(currentPlayer);

    if (gamePhase === 'placement') {
      if (newBoard[index] === null && pawnsToPlaceThisAction > 0 && updatedPlayerStats[currentPlayer].pawnsToPlace > 0) {
        newBoard[index] = currentPlayer;
        updatedPlayerStats[currentPlayer].pawnsToPlace -= 1;
        updatedPlayerStats[currentPlayer].pawnsOnBoard += 1;
        
        const remainingForThisActionLocal = pawnsToPlaceThisAction - 1;
        
        setBoard(newBoard);

        if (checkMill(newBoard, currentPlayer, index)) {
          setPlayerStats(updatedPlayerStats); 
          setGamePhase('removing');
          toast({ title: "Line of Power!", description: `${currentPlayerName} may banish a foe.`, variant: "default" });
        } else {
          if (remainingForThisActionLocal === 0) { 
             // Current player's action for this turn is complete.
             // Mark 'hasMadeFirstPlacement' if this was their first 2-pawn (or fewer if limited) placement turn.
             if (!playerStats[currentPlayer].hasMadeFirstPlacement) { // Check original state before this action sequence
                 updatedPlayerStats[currentPlayer].hasMadeFirstPlacement = true;
             }
             
             setPlayerStats(updatedPlayerStats);
             setPawnsToPlaceThisAction(0); // Action for this player this turn is done

             if (updatedPlayerStats[1].pawnsToPlace === 0 && updatedPlayerStats[2].pawnsToPlace === 0) {
                setGamePhase('movement'); 
             }
             switchPlayerAndPhase(); 
          } else {
            // Player still has pawns to place *in this current action* (e.g., placed 1 of 2)
            setPlayerStats(updatedPlayerStats);
            setPawnsToPlaceThisAction(remainingForThisActionLocal);
          }
        }
      } else if (newBoard[index] !== null) {
        toast({ title: "Invalid Placement", description: "This position is already occupied.", variant: "destructive" });
      } else if (pawnsToPlaceThisAction === 0 || updatedPlayerStats[currentPlayer].pawnsToPlace === 0) {
         toast({ title: "No Pawns to Place", description: "You have no more pawns for this action or overall.", variant: "default" });
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
            toast({ title: "Line of Power!", description: `${currentPlayerName} may banish a foe.`, variant: "default" });
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
        newBoard[index] = null;
        updatedPlayerStats[opponent].pawnsOnBoard -= 1;
        
        toast({ title: "Pawn Banished!", description: `${getPlayerThematicName(opponent)}'s pawn removed.`, variant: "default" });
        
        const stillInPlacementPhaseOverall = updatedPlayerStats[1].pawnsToPlace > 0 || updatedPlayerStats[2].pawnsToPlace > 0;
        
        setBoard(newBoard); 
        setPlayerStats(updatedPlayerStats);

        setGamePhase(stillInPlacementPhaseOverall ? 'placement' : 'movement');
        switchPlayerAndPhase();
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
            className="w-full text-base sm:text-lg py-2.5 sm:py-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-150 ease-out hover:scale-105 active:scale-95"
          >
            <PlayerPawnDisplay player={1} size="small" /> <span className="ml-2">Angels Start</span>
          </Button>
          <Button 
            onClick={() => handlePlayerSelect(2)} 
            className="w-full text-base sm:text-lg py-2.5 sm:py-3 bg-accent hover:bg-accent/90 text-accent-foreground shadow-md hover:shadow-lg transition-all duration-150 ease-out hover:scale-105 active:scale-95"
          >
            <PlayerPawnDisplay player={2} size="small" /> <span className="ml-2">Demons Start</span>
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
          <Swords className="h-6 w-6 sm:h-7 sm:w-7 text-accent" /> 9-Pebbles <Zap className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
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
          />
        </div>

        <Card className="w-full lg:max-w-xs xl:max-w-sm shadow-lg mt-3 lg:mt-0 shrink-0">
          <CardHeader className="p-4 sm:p-5">
            <CardTitle className="text-lg sm:text-xl text-center text-primary font-heading">Battle Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 sm:p-5 sm:pt-0">
             <Alert variant={winner ? (winner === currentPlayer ? "default" : "destructive") : "default"} className={`${
                currentPlayer === 1 ? 'border-primary/50' : 'border-accent/50'
              } bg-card text-xs sm:text-sm`}>
              <Info className={`h-4 w-4 sm:h-5 sm:w-5 ${currentPlayer === 1 ? 'text-primary' : 'text-accent'}`} />
              <AlertTitle className="font-semibold text-sm sm:text-base font-heading">
                {winner ? `Battle Over!` : `${getPlayerThematicName(currentPlayer)}'s Turn`}
              </AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                <div className={`p-2.5 rounded-md bg-primary/10 border border-primary/30 ${currentPlayer === 1 && !winner ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}`}>
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-primary font-heading">{getPlayerThematicName(1)}</span>
                        <PlayerPawnDisplay player={1} size="small" />
                    </div>
                    <p>To Place: <span className="font-bold">{playerStats[1].pawnsToPlace}</span></p>
                    <p>On Board: <span className="font-bold">{playerStats[1].pawnsOnBoard}</span></p>
                </div>
                <div className={`p-2.5 rounded-md bg-accent/10 border border-accent/30 ${currentPlayer === 2 && !winner ? 'ring-2 ring-accent ring-offset-1 ring-offset-background' : ''}`}>
                     <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-accent font-heading">{getPlayerThematicName(2)}</span>
                        <PlayerPawnDisplay player={2} size="small" />
                    </div>
                    <p>To Place: <span className="font-bold">{playerStats[2].pawnsToPlace}</span></p>
                    <p>On Board: <span className="font-bold">{playerStats[2].pawnsOnBoard}</span></p>
                </div>
            </div>
            
            {winner && (
              <Button onClick={handleResetGame} className="w-full mt-3 text-sm sm:text-base py-2 sm:py-2.5">
                Fight Again
              </Button>
            )}
             {!winner && gamePhase !== 'playerSelection' && (
                <Button onClick={handleResetGame} variant="outline" className="w-full mt-3 text-xs sm:text-sm py-1.5 sm:py-2">
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

