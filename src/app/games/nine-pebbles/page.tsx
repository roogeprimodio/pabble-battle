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
import PlayerStatusDisplay from './components/PlayerStatusDisplay';
import {
  TOTAL_POINTS,
  PAWNS_PER_PLAYER,
  Player,
  GameBoardArray,
  createInitialBoard,
  checkMill,
  canRemovePawn,
  ADJACENCY_LIST,
  GamePhase,
} from '@/lib/nine-pebbles-rules';
import { ThemeToggle } from '@/app/(components)/ThemeToggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';


const PAWN_REMOVAL_ANIMATION_DURATION = 700; // ms, should match animation duration

const NinePebblesPage: React.FC = () => {
  const [board, setBoard] = useState<GameBoardArray>(createInitialBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
  const [gamePhase, setGamePhase] = useState<GamePhase>('playerSelection');
  
  const [playerStats, setPlayerStats] = useState({
    1: { pawnsToPlace: PAWNS_PER_PLAYER, pawnsOnBoard: 0, hasCompletedInitialTwoPawnPlacement: false },
    2: { pawnsToPlace: PAWNS_PER_PLAYER, pawnsOnBoard: 0, hasCompletedInitialTwoPawnPlacement: false },
  });
  
  const [pawnsToPlaceThisTurn, setPawnsToPlaceThisTurn] = useState(0); 
  const [isCurrentPlayerOnInitialTwoPawnTurn, setIsCurrentPlayerOnInitialTwoPawnTurn] = useState(false); 
  
  const [selectedPawnIndex, setSelectedPawnIndex] = useState<number | null>(null);
  const [pawnToRemoveIndex, setPawnToRemoveIndex] = useState<number | null>(null);
  const [winner, setWinner] = useState<Player | null>(null);
  const [message, setMessage] = useState<string>('Choose which side will make the first move.');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [movingPawn, setMovingPawn] = useState<{ from: number; to: number; player: Player } | null>(null);


  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Reduced skeleton loading time
    return () => clearTimeout(timer);
  }, []);

  const getPlayerThematicName = useCallback((player: Player | null) => {
    if (player === 1) return "Angels";
    if (player === 2) return "Demons";
    return "";
  }, []);


  const executeSwitchPlayerAndPhase = useCallback((currentPhaseForLogic: GamePhase, effectivePlayerStats: typeof playerStats) => {
    const nextPlayer = currentPlayer === 1 ? 2 : 1;
    let nextPhase = currentPhaseForLogic; // Start with the current phase

    // Determine if placement is fully complete for both players
    const allPawnsPlacedByBoth = effectivePlayerStats[1].pawnsToPlace === 0 && effectivePlayerStats[2].pawnsToPlace === 0;

    if (allPawnsPlacedByBoth && currentPhaseForLogic === 'placement') {
        nextPhase = 'movement'; // Transition to movement phase
        setPawnsToPlaceThisTurn(0);
        setIsCurrentPlayerOnInitialTwoPawnTurn(false);
    } else if (currentPhaseForLogic === 'placement') { // Still in placement phase
        let numToPlaceForNextPlayerTurn = 1;
        let nextPlayerIsOnInitialTurn = false;
        if (!effectivePlayerStats[nextPlayer].hasCompletedInitialTwoPawnPlacement && effectivePlayerStats[nextPlayer].pawnsToPlace > 0) {
            numToPlaceForNextPlayerTurn = 2;
            nextPlayerIsOnInitialTurn = true;
        }
        // Ensure the player doesn't place more than they have left
        const actualCanPlaceNext = Math.min(numToPlaceForNextPlayerTurn, effectivePlayerStats[nextPlayer].pawnsToPlace);
        setPawnsToPlaceThisTurn(actualCanPlaceNext);
        setIsCurrentPlayerOnInitialTwoPawnTurn(nextPlayerIsOnInitialTurn && actualCanPlaceNext === 2);
    }
    
    setGamePhase(nextPhase); // Update the game phase
    setCurrentPlayer(nextPlayer); // Switch player
}, [currentPlayer]);


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
         // This case should ideally not be hit if logic is correct, or means turn switch pending
         setMessage(`${currentPlayerName}'s turn is processing or pawns are exhausted.`);
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
    setMovingPawn(null);
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
    
    const allPawnsPlacedByBoth = updatedPlayerStats[1].pawnsToPlace === 0 && updatedPlayerStats[2].pawnsToPlace === 0;
    if (allPawnsPlacedByBoth) { 
        for (const player of [1, 2] as Player[]) {
            if (updatedPlayerStats[player].pawnsOnBoard >= 3) { 
                let hasMoves = false;
                for (let i = 0; i < TOTAL_POINTS; i++) {
                    if (updatedBoard[i] === player) { 
                        if (ADJACENCY_LIST[i].some(adj => updatedBoard[adj] === null)) { 
                            hasMoves = true;
                            break;
                        }
                    }
                }
                if (!hasMoves) {
                    setWinner(player === 1 ? 2 : 1); 
                    setGamePhase('gameOver');
                    return true;
                }
            }
        }
    }
    return false;
  }, [gamePhase, winner]);


  useEffect(() => {
    if (!winner && gamePhase !== 'playerSelection' && gamePhase !== 'animatingRemoval' && gamePhase !== 'gameOver') {
      checkWinCondition(board, playerStats);
    }
  }, [board, playerStats, winner, gamePhase, checkWinCondition]); 
  

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
            
            let effectivePhaseForSwitch = gamePhase;
             if (updatedPlayerStats[1].pawnsToPlace === 0 && updatedPlayerStats[2].pawnsToPlace === 0) {
                 effectivePhaseForSwitch = 'movement';
             }
            executeSwitchPlayerAndPhase(effectivePhaseForSwitch, updatedPlayerStats);
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
          const fromIndex = selectedPawnIndex;
          newBoard[fromIndex] = null;
          newBoard[index] = currentPlayer;
          const movedPawnIndex = index; 
          
          setMovingPawn({ from: fromIndex, to: movedPawnIndex, player: currentPlayer });
          setSelectedPawnIndex(null); 
          
          setTimeout(() => {
            setBoard(newBoard);
            setMovingPawn(null); 

            if (checkMill(newBoard, currentPlayer, movedPawnIndex)) {
              setGamePhase('removing');
            } else {
              if (!checkWinCondition(newBoard, updatedPlayerStats)) { 
                executeSwitchPlayerAndPhase(gamePhase, updatedPlayerStats); 
              }
            }
          }, 100); 

        } else {
          toast({ title: "Invalid Move", description: "You can only move to an adjacent empty spot.", variant: "destructive" });
          setSelectedPawnIndex(null); 
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
            let boardAfterRemoval = [...newBoard]; 
            boardAfterRemoval[index] = null; 
            
            let statsAfterRemoval = JSON.parse(JSON.stringify(playerStats));
            statsAfterRemoval[opponent].pawnsOnBoard -= 1;

            setBoard(boardAfterRemoval); 
            setPawnToRemoveIndex(null); 

            const gameWon = checkWinCondition(boardAfterRemoval, statsAfterRemoval); 
            
            if (!gameWon) {
                const stillInPlacementPhaseOverall = statsAfterRemoval[1].pawnsToPlace > 0 || statsAfterRemoval[2].pawnsToPlace > 0;
                
                if (pawnsToPlaceThisTurn > 0 && stillInPlacementPhaseOverall) { 
                    setPlayerStats(statsAfterRemoval); 
                    setGamePhase('placement'); 
                    updateMessageAndPawnsToPlace();
                } else { 
                    let finalStatsForThisTurn = JSON.parse(JSON.stringify(statsAfterRemoval));
                    if (isCurrentPlayerOnInitialTwoPawnTurn && pawnsToPlaceThisTurn === 0 && !finalStatsForThisTurn[currentPlayer].hasCompletedInitialTwoPawnPlacement) { 
                        finalStatsForThisTurn[currentPlayer].hasCompletedInitialTwoPawnPlacement = true;
                    }
                    setPlayerStats(finalStatsForThisTurn); 
                    
                    const nextPhaseAfterRemoval = stillInPlacementPhaseOverall ? 'placement' : 'movement';
                    setGamePhase(nextPhaseAfterRemoval);
                    updateMessageAndPawnsToPlace(); // Update message before switching player
                    executeSwitchPlayerAndPhase(nextPhaseAfterRemoval, finalStatsForThisTurn); 
                }
            } else {
                 setPlayerStats(statsAfterRemoval); 
                 updateMessageAndPawnsToPlace(); // Update message for win
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

      <Alert variant="default" className="w-full max-w-xs sm:max-w-sm mx-auto mb-2 sm:mb-3 rounded-xl shadow-lg bg-card">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle className="font-semibold text-xs">
          <Skeleton className="h-4 w-1/3" />
        </AlertTitle>
        <Skeleton className="h-3 w-full mt-1" />
      </Alert>
      
      <main className="flex-grow w-full flex flex-col md:flex-row items-center md:items-start md:justify-between gap-3 sm:gap-4 lg:gap-6">
        <div className="w-full md:w-auto order-1 md:order-1">
          <Card className="p-3 rounded-lg border bg-card shadow-md min-w-[150px] md:min-w-[180px]">
            <div className="flex items-center justify-between mb-1.5">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="w-7 h-7 rounded-full" />
            </div>
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-4 w-20" />
          </Card>
        </div>


        <div className="w-full md:flex-grow order-3 md:order-2 max-w-[calc(100vw-20px)] sm:max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl aspect-square relative self-center">
          <Skeleton className="w-full h-full rounded-lg" />
        </div>

        <div className="w-full md:w-auto order-2 md:order-3">
           <Card className="p-3 rounded-lg border bg-card shadow-md min-w-[150px] md:min-w-[180px]">
            <div className="flex items-center justify-between mb-1.5">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="w-7 h-7 rounded-full" />
            </div>
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-4 w-20" />
          </Card>
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
          <Swords className="h-6 w-6 sm:h-7 sm:w-7 text-accent animate-pulse" /> 9-Pebbles <Zap className="h-6 w-6 sm:h-7 sm:w-7 text-primary animate-pulse" />
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleResetGame} aria-label="Reset Game">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <ThemeToggle />
        </div>
      </header>

      {!winner && (
         <Alert
            variant={(currentPlayer === 2 && !winner) ? 'destructive' : 'default'}
            className={`
              w-full max-w-xs sm:max-w-sm mx-auto mb-2 sm:mb-3
              rounded-xl shadow-lg
              ${(currentPlayer === 2 && !winner) 
                ? 'border-destructive/50 bg-destructive/10' 
                : 'border-primary/50 bg-primary/10'}
            `}
          >
            <Info className={`h-4 w-4 ${(currentPlayer === 2 && !winner) ? 'text-destructive' : 'text-primary'}`} />
            <AlertTitle 
              className={`font-semibold text-xs font-heading ${
                (currentPlayer === 2 && !winner) ? 'text-destructive' : 'text-primary'
              }`}
            >
                {gamePhase === 'animatingRemoval' || gamePhase === 'removing' ? 'Mill Formed!' : `${getPlayerThematicName(currentPlayer)}'s Turn`}
            </AlertTitle>
            <AlertDescription 
              className={`text-xs min-h-[1.2em] ${
                (currentPlayer === 2 && !winner) ? 'text-destructive/90' : 'text-primary/90'
              }`}
            >
              {message}
            </AlertDescription>
          </Alert>
      )}

      {winner && (
        <div className="w-full text-center my-4 p-4 rounded-lg shadow-lg bg-card">
          <AlertTitle className={`text-2xl font-bold mb-2 ${winner === 1 ? 'text-primary' : 'text-destructive'}`}>
            {getPlayerThematicName(winner)} are victorious!
          </AlertTitle>
          <AlertDescription className="mb-4 text-base">{message}</AlertDescription>
          <Button 
            onClick={handleResetGame} 
            className={`text-base py-2.5 ${winner === 1 ? 'bg-gradient-to-r from-primary via-primary/80 to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground' : 'bg-gradient-to-r from-destructive via-destructive/80 to-accent hover:from-destructive/90 hover:to-accent/90 text-destructive-foreground'} shadow-lg hover:shadow-xl transition-all duration-200`}
          >
            <Sparkles className="mr-2 h-5 w-5" /> Fight Again <Sparkles className="ml-2 h-5 w-5" />
          </Button>
        </div>
      )}

      <main className="flex-grow w-full flex flex-col md:flex-row items-center md:items-start md:justify-center gap-3 sm:gap-4 lg:gap-6 relative">
        {/* Player 1 Status - Positioned on Left for md screens, top-left for sm */}
        <div className="w-full md:w-auto order-1 md:absolute md:left-0 md:top-0 md:h-full md:flex md:items-center">
           <PlayerStatusDisplay
            player={1}
            playerName={getPlayerThematicName(1)}
            pawnsToPlace={playerStats[1].pawnsToPlace}
            pawnsOnBoard={playerStats[1].pawnsOnBoard}
            isCurrentPlayer={currentPlayer === 1}
            winner={winner}
          />
        </div>
        
        {/* Game Board - Centered */}
        <div className="w-full md:flex-grow-0 order-3 md:order-2 max-w-[calc(100vw-20px)] sm:max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl aspect-square relative self-center mx-auto">
          <GameBoardDisplay
            board={board}
            onPointClick={handlePointClick}
            selectedPawnIndex={selectedPawnIndex}
            gamePhase={gamePhase}
            currentPlayer={currentPlayer}
            winner={winner}
            pawnToRemoveIndex={pawnToRemoveIndex}
            movingPawn={movingPawn}
          />
        </div>

        {/* Player 2 Status - Positioned on Right for md screens, top-right for sm */}
        <div className="w-full md:w-auto order-2 md:absolute md:right-0 md:top-0 md:h-full md:flex md:items-center">
           <PlayerStatusDisplay
            player={2}
            playerName={getPlayerThematicName(2)}
            pawnsToPlace={playerStats[2].pawnsToPlace}
            pawnsOnBoard={playerStats[2].pawnsOnBoard}
            isCurrentPlayer={currentPlayer === 2}
            winner={winner}
          />
        </div>
      </main>
       <footer className="text-center py-4 mt-auto text-sm text-muted-foreground">
         <p>&copy; {new Date().getFullYear()} Pebble Arena</p>
      </footer>
    </div>
  );
};

export default NinePebblesPage;
