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

type GamePhase = 'playerSelection' | 'placement' | 'movement' | 'removing' | 'gameOver';

const NinePebblesPage: React.FC = () => {
  const [board, setBoard] = useState<GameBoardArray>(createInitialBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1); // Default, will be set by selection
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

  const getPlayerThematicName = useCallback((player: Player | null) => {
    if (player === 1) return "Angels";
    if (player === 2) return "Demons";
    return "";
  }, []);

  const updateMessageAndPawnsToPlace = useCallback(() => {
    if (winner || gamePhase === 'playerSelection') return;
    
    const currentPlayerName = getPlayerThematicName(currentPlayer);

    if (gamePhase === 'placement') {
      const currentPlayerData = playerStats[currentPlayer];
      
      if (currentPlayerData.pawnsToPlace === 0) {
        setPawnsToPlaceThisAction(0);
        if (playerStats[1].pawnsToPlace === 0 && playerStats[2].pawnsToPlace === 0) {
          // This message might be brief as phase transition often updates it again
          setMessage("All pawns placed. Movement phase commencing.");
        } else {
          setMessage(`${currentPlayerName}'s turn. All your pawns are placed. Waiting for opponent or next phase.`);
        }
        return; 
      }

      const intendedPawnsForAction = !currentPlayerData.hasMadeFirstPlacement ? 2 : 1;
      // Ensure pawnsToPlaceThisAction does not exceed remaining pawns
      const actualPawnsToPlace = Math.min(intendedPawnsForAction, currentPlayerData.pawnsToPlace);
      
      setPawnsToPlaceThisAction(actualPawnsToPlace);
      if (actualPawnsToPlace > 0) {
        setMessage(`${currentPlayerName}'s turn. Place ${actualPawnsToPlace} pawn${actualPawnsToPlace > 1 ? 's' : ''}.`);
      } else {
        // This case should ideally be covered by the currentPlayerData.pawnsToPlace === 0 check above,
        // but as a fallback:
        setMessage(`${currentPlayerName}'s turn. No pawns to place this action.`);
      }

    } else if (gamePhase === 'movement') {
      setMessage(`${currentPlayerName}'s turn. Select a pawn to move.`);
    } else if (gamePhase === 'removing') {
      setMessage(`${currentPlayerName} formed a line of power! Banish an opposing pawn.`);
    } else if (gamePhase === 'gameOver' && winner) {
      setMessage(`${getPlayerThematicName(winner)} are victorious!`);
    }
  }, [gamePhase, currentPlayer, playerStats, winner, getPlayerThematicName]);

  useEffect(() => {
    updateMessageAndPawnsToPlace();
  }, [updateMessageAndPawnsToPlace]);


  const switchPlayerAndPhase = useCallback(() => {
    const nextPlayer = currentPlayer === 1 ? 2 : 1;
    setCurrentPlayer(nextPlayer);

    // This check ensures that if placement phase just ended for both players, it transitions.
    // It's also checked in handlePointClick using newPlayerStats for immediate transition.
    if (gamePhase === 'placement' && playerStats[1].pawnsToPlace === 0 && playerStats[2].pawnsToPlace === 0) {
      setGamePhase('movement');
    }
    // The useEffect calling updateMessageAndPawnsToPlace will handle setting pawns for the nextPlayer.
  }, [currentPlayer, gamePhase, playerStats]);


  const handleResetGame = () => {
    setBoard(createInitialBoard());
    setGamePhase('playerSelection');
    setPlayerStats({
      1: { pawnsToPlace: PAWNS_PER_PLAYER, pawnsOnBoard: 0, hasMadeFirstPlacement: false },
      2: { pawnsToPlace: PAWNS_PER_PLAYER, pawnsOnBoard: 0, hasMadeFirstPlacement: false },
    });
    setSelectedPawnIndex(null);
    setWinner(null);
    setPawnsToPlaceThisAction(0);
    setMessage('Choose which side will make the first move.');
    toast({ title: "Game Reset", description: "The eternal battle begins anew. Choose your champion." });
  };
  
  const checkWinCondition = useCallback(() => {
    if (gamePhase === 'gameOver' || gamePhase === 'placement' || gamePhase === 'playerSelection') return false;

    const p1OnBoard = playerStats[1].pawnsOnBoard;
    const p2OnBoard = playerStats[2].pawnsOnBoard;
    
    // Win if opponent has fewer than 3 pawns AND has no more pawns to place
    if (p1OnBoard < 3 && playerStats[1].pawnsToPlace === 0) {
      setWinner(2); setGamePhase('gameOver'); return true;
    }
    if (p2OnBoard < 3 && playerStats[2].pawnsToPlace === 0) {
      setWinner(1); setGamePhase('gameOver'); return true;
    }

    // Win if current player has pawns on board but no valid moves (and not in placement phase)
    // This check is for the player whose turn it *would* be.
    // The check should be for the *opponent* of the player who just moved, if they are now stuck.
    // Or rather, after a player moves, check if *that* player now has no moves for their *next* turn (if not winning by capture).
    // Simpler: check after switchPlayerAndPhase for the *new* current player.
    // The current implementation checks for the current player. Let's refine this for the player whose turn it is.
    const playerToCheck = currentPlayer; // The player whose turn it is to make a move
    if (playerStats[playerToCheck].pawnsOnBoard >= 3 && playerStats[playerToCheck].pawnsToPlace === 0) { // Only check if in movement phase and has enough pawns
        let hasMoves = false;
        for(let i=0; i<TOTAL_POINTS; i++) {
            if(board[i] === playerToCheck) { // For each of their pawns
                if(ADJACENCY_LIST[i].some(adj => board[adj] === null)) { // Check if any adjacent point is empty
                    hasMoves = true;
                    break;
                }
            }
        }
        if(!hasMoves) { // If no moves are possible
             setWinner(playerToCheck === 1 ? 2 : 1); // The other player wins
             setGamePhase('gameOver'); 
             return true;
        }
    }
    return false;
  }, [board, playerStats, gamePhase, currentPlayer]); // currentPlayer is important here.

  useEffect(() => {
    if (!winner && gamePhase !== 'playerSelection' && gamePhase !== 'placement' && gamePhase !== 'removing') {
      // Check win condition only if it's a player's turn to move or after a move has been made.
      // The checkWinCondition itself handles phase to prevent checks during placement.
      const gameEnded = checkWinCondition();
      if(gameEnded) {
        updateMessageAndPawnsToPlace(); // Update message if game ended
      }
    }
  }, [board, playerStats, winner, checkWinCondition, updateMessageAndPawnsToPlace, gamePhase, currentPlayer]);
  // Added currentPlayer to dependency array for checkWinCondition effect, as it's used in the check

  const handlePlayerSelect = (player: Player) => {
    setCurrentPlayer(player);
    setGamePhase('placement');
    // playerStats are reset in handleResetGame or are initial.
    // updateMessageAndPawnsToPlace (via useEffect) will set up the 2-pawn placement.
    toast({ 
      title: "Battle Commences!", 
      description: `${getPlayerThematicName(player)} will lead the charge. Place 2 pawns.` 
    });
  };

  const handlePointClick = (index: number) => {
    if (winner || gamePhase === 'gameOver' || gamePhase === 'playerSelection') return;

    let newBoard = [...board];
    // Deep copy playerStats to avoid direct mutation before setState
    let newPlayerStats = JSON.parse(JSON.stringify(playerStats)) as typeof playerStats;
    const currentPlayerName = getPlayerThematicName(currentPlayer);

    if (gamePhase === 'placement') {
      // pawnsToPlaceThisAction is now correctly capped by updateMessageAndPawnsToPlace
      if (newBoard[index] === null && pawnsToPlaceThisAction > 0 && newPlayerStats[currentPlayer].pawnsToPlace > 0) {
        newBoard[index] = currentPlayer;
        newPlayerStats[currentPlayer].pawnsToPlace -= 1;
        newPlayerStats[currentPlayer].pawnsOnBoard += 1;
        
        const pawnsPlacedInThisActionSoFar = (!newPlayerStats[currentPlayer].hasMadeFirstPlacement ? 2 : 1) - (pawnsToPlaceThisAction - 1);
        const remainingForThisAction = pawnsToPlaceThisAction - 1;
        
        setBoard(newBoard); // Order of setting state might matter for subsequent logic
        setPlayerStats(newPlayerStats); // Update playerStats first
        setPawnsToPlaceThisAction(remainingForThisAction); // Then update pawnsToPlaceThisAction

        if (checkMill(newBoard, currentPlayer, index)) {
          setGamePhase('removing');
          // Message update for removing phase will be handled by useEffect
          toast({ title: "Line of Power!", description: `${currentPlayerName} may banish a foe.`, variant: "default" });
        } else {
          if (remainingForThisAction === 0) { // Current action (placing 1 or 2 pawns) is complete
            if (!newPlayerStats[currentPlayer].hasMadeFirstPlacement) {
              // This state change needs to be part of newPlayerStats for consistency if it affects next turn's logic immediately
              // It's already handled as newPlayerStats is a fresh copy for this scope.
              // However, to be explicit for the next logic steps, we can create another copy or ensure its passed.
              // The setPlayerStats above has already captured this potential change if made.
              // For clarity, ensure `hasMadeFirstPlacement` is set on the `newPlayerStats` instance being used.
               const statsForNextStep = JSON.parse(JSON.stringify(newPlayerStats)) as typeof playerStats;
               if (!statsForNextStep[currentPlayer].hasMadeFirstPlacement) {
                  statsForNextStep[currentPlayer].hasMadeFirstPlacement = true;
                  // This change will be reflected in playerStats for the next render cycle
                  // For immediate use in switchPlayerAndPhase, it would need to be passed or playerStats updated synchronously (not React way)
                  // The setPlayerStats(newPlayerStats) call already registered the potential change.
               }
            }
            
            // Check if placement phase should end
            if (newPlayerStats[1].pawnsToPlace === 0 && newPlayerStats[2].pawnsToPlace === 0) {
              setGamePhase('movement');
            }
            switchPlayerAndPhase(); // This will use playerStats from its closure, which has been scheduled to update
          } else {
             // Message update for more pawns in this action (first turn) will be handled by useEffect
             // setMessage(`${currentPlayerName}, place ${remainingForThisAction} more pawn${remainingForThisAction > 1 ? 's' : ''}.`);
          }
        }
      } else if (newBoard[index] !== null) {
        toast({ title: "Invalid Placement", description: "This position is already occupied.", variant: "destructive" });
      } else if (pawnsToPlaceThisAction === 0 || newPlayerStats[currentPlayer].pawnsToPlace === 0) {
         toast({ title: "No Pawns to Place", description: "You have no more pawns for this action or overall.", variant: "default" });
      }
    } else if (gamePhase === 'movement') {
      if (selectedPawnIndex === null) {
        if (newBoard[index] === currentPlayer) {
          setSelectedPawnIndex(index);
          // Message update will be handled by useEffect
        } else {
          toast({ title: "Invalid Selection", description: `Select one of your own ${currentPlayerName}'s pawns.`, variant: "destructive" });
        }
      } else {
        if (index === selectedPawnIndex) { 
            setSelectedPawnIndex(null);
            // Message update will be handled by useEffect
            return;
        }
        if (newBoard[index] === null && ADJACENCY_LIST[selectedPawnIndex].includes(index)) {
          newBoard[selectedPawnIndex] = null;
          newBoard[index] = currentPlayer;
          setBoard(newBoard); // PlayerStats don't change here, only board
          setSelectedPawnIndex(null);

          if (checkMill(newBoard, currentPlayer, index)) {
            setGamePhase('removing');
            toast({ title: "Line of Power!", description: `${currentPlayerName} may banish a foe.`, variant: "default" });
          } else {
            // Win condition check is now part of useEffect triggered by board/player changes.
            // It will be checked for the *next* player after switching.
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
        newPlayerStats[opponent].pawnsOnBoard -= 1;
        setBoard(newBoard);
        setPlayerStats(newPlayerStats); // Update playerStats for the opponent
        toast({ title: "Pawn Banished!", description: `${getPlayerThematicName(opponent)}'s pawn removed.`, variant: "default" });
        
        // Determine next phase: if placements were ongoing, return to placement, else movement.
        const stillInPlacementPhaseOverall = newPlayerStats[1].pawnsToPlace > 0 || newPlayerStats[2].pawnsToPlace > 0;
        setGamePhase(stillInPlacementPhaseOverall ? 'placement' : 'movement');
        
        // Win condition check is now part of useEffect.
        // It will be checked for the *next* player after switching.
        switchPlayerAndPhase();
      } else {
        toast({ title: "Invalid Banishment", description: "Cannot remove this pawn. Select a valid opponent's pawn.", variant: "destructive" });
      }
    }
  };

  if (gamePhase === 'playerSelection') {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/20 p-2 sm:p-4 items-center justify-center">
        <header className="absolute top-4 left-4 right-4 flex justify-between items-center">
            <Link href="/choose-game" passHref>
              <Button variant="outline" size="icon" aria-label="Back to Choose Game">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <ThemeToggle />
        </header>
        <Card className="w-full max-w-md shadow-2xl text-center">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex justify-center mb-3">
                <ShieldQuestion className="w-16 h-16 text-primary" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-primary">Choose Who Starts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
            <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">The chosen side makes the first move and places 2 pawns.</p>
            <Button 
              onClick={() => handlePlayerSelect(1)} 
              className="w-full text-base sm:text-lg py-2.5 sm:py-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg"
            >
              <PlayerPawnDisplay player={1} size="small" /> <span className="ml-2">Angels Start</span>
            </Button>
            <Button 
              onClick={() => handlePlayerSelect(2)} 
              className="w-full text-base sm:text-lg py-2.5 sm:py-3 bg-accent hover:bg-accent/90 text-accent-foreground shadow-md hover:shadow-lg"
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
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/20 p-2 sm:p-4">
      <header className="flex justify-between items-center py-3 px-1 sm:px-2 mb-3 sm:mb-4">
        <Link href="/choose-game" passHref>
          <Button variant="outline" size="icon" aria-label="Back to Choose Game">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary text-center flex items-center gap-2">
          <Swords className="h-6 w-6 sm:h-7 sm:w-7 text-accent" /> 9-Pebbles <Zap className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleResetGame} aria-label="Reset Game">
            <RotateCcw className="h-5 w-5" />
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-grow flex flex-col lg:flex-row items-center lg:items-start justify-center gap-3 sm:gap-4 lg:gap-6">
        <div className="w-full max-w-[calc(100vw-32px)] sm:max-w-sm md:max-w-md lg:max-w-lg aspect-square relative self-center">
          <GameBoardDisplay
            board={board}
            onPointClick={handlePointClick}
            selectedPawnIndex={selectedPawnIndex}
            gamePhase={gamePhase}
            currentPlayer={currentPlayer}
          />
        </div>

        <Card className="w-full lg:w-80 shadow-lg mt-3 lg:mt-0">
          <CardHeader className="p-4 sm:p-5">
            <CardTitle className="text-lg sm:text-xl text-center text-primary">Battle Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 sm:p-5 sm:pt-0">
             <Alert variant={winner ? (winner === currentPlayer ? "default" : "destructive") : "default"} className={`${
                currentPlayer === 1 ? 'border-primary/50' : 'border-accent/50'
              } bg-card text-xs sm:text-sm`}>
              <Info className={`h-4 w-4 sm:h-5 sm:w-5 ${currentPlayer === 1 ? 'text-primary' : 'text-accent'}`} />
              <AlertTitle className="font-semibold text-sm sm:text-base">
                {winner ? `Battle Over!` : `${getPlayerThematicName(currentPlayer)}'s ${gamePhase.charAt(0).toUpperCase() + gamePhase.slice(1)} Phase`}
              </AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                <div className="p-2 rounded-md bg-primary/10 border border-primary/30">
                    <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-primary">{getPlayerThematicName(1)}</span>
                        <PlayerPawnDisplay player={1} size="small" />
                    </div>
                    <p>To Place: <span className="font-bold">{playerStats[1].pawnsToPlace}</span></p>
                    <p>On Board: <span className="font-bold">{playerStats[1].pawnsOnBoard}</span></p>
                </div>
                <div className="p-2 rounded-md bg-accent/10 border border-accent/30">
                     <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-accent">{getPlayerThematicName(2)}</span>
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
    </div>
  );
};

export default NinePebblesPage;
