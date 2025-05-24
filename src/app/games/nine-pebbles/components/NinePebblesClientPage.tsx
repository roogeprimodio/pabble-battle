
// src/app/games/nine-pebbles/components/NinePebblesClientPage.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, RotateCcw, Info, Swords, Zap, ShieldQuestion, Sparkles, Skull, Copy, Users, PartyPopper } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import GameBoardDisplay from './GameBoard';
import PlayerPawnDisplay from './Pawn';
import PlayerStatusDisplay from './PlayerStatusDisplay';
import GameBanner from './GameBanner';
import {
  TOTAL_POINTS,
  PAWNS_PER_PLAYER,
  Player,
  GameBoardArray,
  createInitialBoard,
  checkMill,
  canRemovePawn,
  ADJACENCY_LIST,
  GamePhase as LocalGamePhase,
} from '@/lib/nine-pebbles-rules';
import { ThemeToggle } from '@/app/(components)/ThemeToggle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { generateUniqueId } from '@/lib/utils';

type OverallPagePhase = 'initialSetup' | 'localPlayerSelection' | 'onlineRoomSetup' | 'onlineWaitingForOpponent' | 'playing' | 'gameOver';

const PAWN_REMOVAL_ANIMATION_DURATION = 700; // ms, should match animation duration

const NinePebblesClientPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [board, setBoard] = useState<GameBoardArray>(createInitialBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
  const [localGamePhase, setLocalGamePhase] = useState<LocalGamePhase>('placement');

  const [playerStats, setPlayerStats] = useState({
    1: { pawnsToPlace: PAWNS_PER_PLAYER, pawnsOnBoard: 0, hasCompletedInitialTwoPawnPlacement: false },
    2: { pawnsToPlace: PAWNS_PER_PLAYER, pawnsOnBoard: 0, hasCompletedInitialTwoPawnPlacement: false },
  });

  // How many pawns the current player is allowed to place in this specific action sequence (1 or 2)
  const [pawnsToPlaceThisTurn, setPawnsToPlaceThisTurn] = useState(0);
  // How many pawns the current player has already placed in the current action sequence
  const [pawnsPlacedThisActionSequence, setPawnsPlacedThisActionSequence] = useState(0);

  const [selectedPawnIndex, setSelectedPawnIndex] = useState<number | null>(null);
  const [pawnToRemoveIndex, setPawnToRemoveIndex] = useState<number | null>(null);
  const [winner, setWinner] = useState<Player | null>(null);
  const [message, setMessage] = useState<string>('Choose game mode.');
  const [isLoading, setIsLoading] = useState(true);
  const [movingPawn, setMovingPawn] = useState<{ from: number; to: number; player: Player } | null>(null);

  const [overallPagePhase, setOverallPagePhase] = useState<OverallPagePhase>('initialSetup');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [inputRoomId, setInputRoomId] = useState<string>('');
  const [localPlayer, setLocalPlayer] = useState<Player | null>(null);


  const getPlayerThematicName = useCallback((player: Player | null) => {
    if (player === 1) return "Angels";
    if (player === 2) return "Demons";
    return "";
  }, []);

  const resetGameState = useCallback(() => {
    setBoard(createInitialBoard());
    setPlayerStats({
      1: { pawnsToPlace: PAWNS_PER_PLAYER, pawnsOnBoard: 0, hasCompletedInitialTwoPawnPlacement: false },
      2: { pawnsToPlace: PAWNS_PER_PLAYER, pawnsOnBoard: 0, hasCompletedInitialTwoPawnPlacement: false },
    });
    setSelectedPawnIndex(null);
    setPawnToRemoveIndex(null);
    setWinner(null);
    setMovingPawn(null);
    setPawnsPlacedThisActionSequence(0);
    // pawnsToPlaceThisTurn will be set by useEffect when game phase becomes 'playing'
  }, []);


  useEffect(() => {
    // This effect is only for initializing from URL.
    // It should only run if we are in 'initialSetup' and don't have a room ID yet.
    if (overallPagePhase === 'initialSetup' && !roomId) {
      const existingRoomIdFromUrl = searchParams.get('room');
      if (existingRoomIdFromUrl) {
        setRoomId(existingRoomIdFromUrl.toUpperCase());
        setLocalPlayer(2); // Joiner is player 2
        setCurrentPlayer(1); // Game starts with player 1
        resetGameState(); // Reset game state for the new room
        setOverallPagePhase('playing');
        setLocalGamePhase('placement'); // Ensure game starts in placement phase
        toast({ title: "Joined Room", description: `Room ID: ${existingRoomIdFromUrl.toUpperCase()}. You are Demons. Angels start.` });
      }
    }
  }, [searchParams, overallPagePhase, roomId, resetGameState, toast]);


  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // This useEffect is CRITICAL for setting up each player's turn allowance.
  useEffect(() => {
    if (overallPagePhase === 'playing' && localGamePhase === 'placement') {
      const currentTurnPlayerSpecificStats = playerStats[currentPlayer];
      
      if (currentTurnPlayerSpecificStats.pawnsToPlace > 0) {
        if (!currentTurnPlayerSpecificStats.hasCompletedInitialTwoPawnPlacement) {
          // This player has NOT YET completed their initial 2-pawn placement turn
          setPawnsToPlaceThisTurn(Math.min(2, currentTurnPlayerSpecificStats.pawnsToPlace));
        } else {
          // This player HAS completed their initial 2-pawn placement, so now it's 1 pawn
          setPawnsToPlaceThisTurn(Math.min(1, currentTurnPlayerSpecificStats.pawnsToPlace));
        }
      } else {
        setPawnsToPlaceThisTurn(0); // No pawns left to place for this player
      }
      setPawnsPlacedThisActionSequence(0); // Reset for the new turn's action sequence
    } else if (localGamePhase !== 'placement') { 
      // Ensure these are zeroed out if not in placement phase (e.g., movement)
      setPawnsToPlaceThisTurn(0);
      setPawnsPlacedThisActionSequence(0);
    }
  }, [currentPlayer, playerStats, overallPagePhase, localGamePhase]);


  const executeSwitchPlayerAndPhase = useCallback((currentLatestStats: typeof playerStats) => {
    const nextPlayer = currentPlayer === 1 ? 2 : 1;
    let nextLocalGamePhase = localGamePhase;

    // Check if ALL pawns for BOTH players have been placed to move to 'movement' phase
    if (currentLatestStats[1].pawnsToPlace === 0 && currentLatestStats[2].pawnsToPlace === 0) {
      if (localGamePhase === 'placement') { // Ensure we only switch from placement
        nextLocalGamePhase = 'movement';
      }
    }
    
    setLocalGamePhase(nextLocalGamePhase);
    setCurrentPlayer(nextPlayer); 
    // The useEffect hook dependent on [currentPlayer, playerStats, localGamePhase]
    // will then reset pawnsToPlaceThisTurn and pawnsPlacedThisActionSequence for the new player.
  }, [currentPlayer, localGamePhase]);


  const updateMessageAndPawnsToPlace = useCallback(() => {
    if (winner) {
         setMessage(`${getPlayerThematicName(winner)} are victorious!`);
         return;
    }
    if (overallPagePhase !== 'playing') {
        if (overallPagePhase === 'initialSetup') setMessage('Choose game mode.');
        else if (overallPagePhase === 'localPlayerSelection') setMessage('Choose which side will make the first move locally.');
        else if (overallPagePhase === 'onlineRoomSetup') setMessage('Create or join an online game room.');
        else if (overallPagePhase === 'onlineWaitingForOpponent' && roomId) setMessage(`Room ID: ${roomId}. Share ID. Click "Start Game" when ready.`);
        return;
    }

    if (localGamePhase === 'animatingRemoval') {
        const removingPlayerName = getPlayerThematicName(currentPlayer);
        const opponentPlayerName = getPlayerThematicName(currentPlayer === 1 ? 2 : 1);
        setMessage(`${removingPlayerName} are banishing a ${opponentPlayerName}'s pawn!`);
        return;
    }
    
    const currentPlayerName = getPlayerThematicName(currentPlayer);
    const localPlayerInfo = roomId && localPlayer ? ` (You are ${getPlayerThematicName(localPlayer)})` : '';

    if (localGamePhase === 'placement') {
      const pawnsLeftInThisAction = pawnsToPlaceThisTurn - pawnsPlacedThisActionSequence;
      if (pawnsLeftInThisAction > 0 && playerStats[currentPlayer].pawnsToPlace > 0) {
        setMessage(`${currentPlayerName}'s turn${localPlayerInfo}. Place ${pawnsLeftInThisAction} pawn${pawnsLeftInThisAction > 1 ? 's' : ''}.`);
      } else if (playerStats[1].pawnsToPlace === 0 && playerStats[2].pawnsToPlace === 0) {
         setMessage("All pawns placed. Movement phase starts.");
      } else {
         // This case should ideally be covered by the above, or it implies turn switching.
         // Let's refine this to be more explicit if the phase is about to change.
         const allPawnsPlaced = playerStats[1].pawnsToPlace === 0 && playerStats[2].pawnsToPlace === 0;
         if (allPawnsPlaced) {
             setMessage("All pawns placed. Starting Movement phase.");
         } else {
             setMessage(`${currentPlayerName}'s turn processing... ${localPlayerInfo}`);
         }
      }
    } else if (localGamePhase === 'movement') {
      setMessage(`${currentPlayerName}'s turn${localPlayerInfo}. Select a pawn to move.`);
    } else if (localGamePhase === 'removing') {
      const icon = currentPlayer === 1 ? <Sparkles className="inline-block h-4 w-4 text-yellow-400" /> : <Skull className="inline-block h-4 w-4 text-red-500" />;
      setMessage(<span>{icon} {currentPlayerName} formed a mill! Banish an opposing pawn.</span>);
    }
  }, [localGamePhase, currentPlayer, playerStats, winner, getPlayerThematicName, pawnsToPlaceThisTurn, pawnsPlacedThisActionSequence, overallPagePhase, roomId, localPlayer]);

  useEffect(() => {
    updateMessageAndPawnsToPlace();
  }, [updateMessageAndPawnsToPlace]);
  
  const handleFullReset = useCallback(() => {
    setIsLoading(true);
    resetGameState();
    setCurrentPlayer(1); // Default to player 1 starting, will be overridden by local/online setup
    setOverallPagePhase('initialSetup');
    setLocalGamePhase('placement'); // Default to placement
    setRoomId(null);
    setInputRoomId('');
    setLocalPlayer(null);
    router.push('/games/nine-pebbles', { scroll: false }); // Clear room param
    toast({
        title: "Game Reset",
        description: "The board is cleared. Choose your game mode.",
        className: "bg-card border-foreground/20 shadow-lg",
    });
    setTimeout(() => setIsLoading(false), 300);
  }, [resetGameState, router, toast]);

  const checkWinCondition = useCallback((updatedBoard: GameBoardArray, currentStats: typeof playerStats) => {
    if (localGamePhase === 'animatingRemoval' || winner) return false;

    const p1OnBoard = currentStats[1].pawnsOnBoard;
    const p1CanPlace = currentStats[1].pawnsToPlace > 0;
    const p2OnBoard = currentStats[2].pawnsOnBoard;
    const p2CanPlace = currentStats[2].pawnsToPlace > 0;

    // Check if a player has fewer than 3 pawns ON THE BOARD after placement phase is over
    if (!p1CanPlace && p1OnBoard < 3) {
      setWinner(2); setLocalGamePhase('gameOver'); setOverallPagePhase('gameOver'); return true;
    }
    if (!p2CanPlace && p2OnBoard < 3) {
      setWinner(1); setLocalGamePhase('gameOver'); setOverallPagePhase('gameOver'); return true;
    }
    
    // Check if a player has no valid moves during movement phase
    const allPawnsPlacedByBoth = currentStats[1].pawnsToPlace === 0 && currentStats[2].pawnsToPlace === 0;
    if (allPawnsPlacedByBoth) { // Only check for no moves if all pawns are placed
        for (const player of [1, 2] as Player[]) {
            // Only check the player whose turn it would be if they have enough pawns
            if (currentStats[player].pawnsOnBoard >= 3) { 
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
                    setWinner(player === 1 ? 2 : 1); // The other player wins
                    setLocalGamePhase('gameOver');
                    setOverallPagePhase('gameOver');
                    return true;
                }
            }
        }
    }
    return false;
  }, [localGamePhase, winner]); 

  useEffect(() => {
    if (!winner && overallPagePhase === 'playing' && localGamePhase !== 'animatingRemoval') {
      checkWinCondition(board, playerStats);
    }
  }, [board, playerStats, winner, localGamePhase, overallPagePhase, checkWinCondition]);

  const handleLocalPlayerSelect = (player: Player) => {
    setIsLoading(true);
    resetGameState(); // Full reset
    setCurrentPlayer(player); // Set who starts
    setLocalGamePhase('placement');
    setOverallPagePhase('playing'); // Move to playing phase
    setLocalPlayer(null); // No specific local player for UI highlighting, as it's local pass-and-play
    
    toast({ 
      title: "Local Battle Commences!", 
      description: `${getPlayerThematicName(player)} will lead the charge. First player places 2 pawns.`,
      className: player === 1 ? "bg-primary/10 border-primary" : "bg-destructive/10 border-destructive",
    });
    setTimeout(() => setIsLoading(false), 300);
  };

  const handlePointClick = (index: number) => {
    if (winner || overallPagePhase !== 'playing' || localGamePhase === 'animatingRemoval' || isLoading) return;

    // If it's an online game, only allow moves if it's the local player's turn
    if (roomId && localPlayer !== currentPlayer) {
        toast({ title: "Not Your Turn", description: `It's ${getPlayerThematicName(currentPlayer)}'s turn.`, variant: "default" });
        return;
    }

    let newBoard = [...board];
    let updatedPlayerStats = JSON.parse(JSON.stringify(playerStats)) as typeof playerStats;

    if (localGamePhase === 'placement') {
      const canStillPlaceInThisAction = pawnsPlacedThisActionSequence < pawnsToPlaceThisTurn;
      if (newBoard[index] === null && canStillPlaceInThisAction && updatedPlayerStats[currentPlayer].pawnsToPlace > 0) {
        newBoard[index] = currentPlayer;
        updatedPlayerStats[currentPlayer].pawnsToPlace -= 1;
        updatedPlayerStats[currentPlayer].pawnsOnBoard += 1;
        
        const newPawnsPlacedCountInAction = pawnsPlacedThisActionSequence + 1;
        setBoard(newBoard); 

        if (checkMill(newBoard, currentPlayer, index)) {
          // Mill formed
          setPlayerStats(updatedPlayerStats); 
          setPawnsPlacedThisActionSequence(newPawnsPlacedCountInAction); 
          setLocalGamePhase('removing');
        } else {
          // No mill formed
          const isActionComplete = newPawnsPlacedCountInAction === pawnsToPlaceThisTurn;

          if (isActionComplete) {
            // Player has placed all pawns for THIS action sequence (e.g., 1 of 1, or 2 of 2)
            
            // Mark initial 2-pawn placement as complete if applicable FOR THE CURRENT PLAYER
            if (!updatedPlayerStats[currentPlayer].hasCompletedInitialTwoPawnPlacement && pawnsToPlaceThisTurn === 2) {
                 updatedPlayerStats[currentPlayer].hasCompletedInitialTwoPawnPlacement = true;
            }
            
            setPlayerStats(updatedPlayerStats); // Commit stats changes for current player
            executeSwitchPlayerAndPhase(updatedPlayerStats); // Switch turn

          } else {
            // Player still has more pawns to place IN THIS CURRENT ACTION SEQUENCE (e.g., placed 1 of 2)
            // Turn does NOT switch. Only update stats and sequence count.
            setPlayerStats(updatedPlayerStats); 
            setPawnsPlacedThisActionSequence(newPawnsPlacedCountInAction);
          }
        }
      } else if (newBoard[index] !== null) {
        toast({ title: "Invalid Placement", description: "This position is already occupied.", variant: "destructive" });
      } else if (!canStillPlaceInThisAction || updatedPlayerStats[currentPlayer].pawnsToPlace === 0) {
         toast({ title: "Placement Limit Reached", description: `No more pawns for this turn or all placed. Check messages.`, variant: "default" });
      }
    } else if (localGamePhase === 'movement') {
      if (selectedPawnIndex === null) {
        if (newBoard[index] === currentPlayer) {
          setSelectedPawnIndex(index);
        } else {
          toast({ title: "Invalid Selection", description: `Select one of your own pawns.`, variant: "destructive" });
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
            const currentStatsAfterMove = JSON.parse(JSON.stringify(playerStats)); 

            if (checkMill(newBoard, currentPlayer, movedPawnIndex)) {
              setLocalGamePhase('removing');
            } else {
              if (!checkWinCondition(newBoard, currentStatsAfterMove)) { 
                executeSwitchPlayerAndPhase(currentStatsAfterMove); 
              }
            }
          }, 400); 
        } else {
          toast({ title: "Invalid Move", description: "You can only move to an adjacent empty spot.", variant: "destructive" });
          setSelectedPawnIndex(null); 
        }
      }
    } else if (localGamePhase === 'removing') {
      const opponent = currentPlayer === 1 ? 2 : 1;
      if (newBoard[index] === opponent && canRemovePawn(newBoard, index, opponent)) {
        setPawnToRemoveIndex(index); 
        setLocalGamePhase('animatingRemoval'); 
        
        toast({
            title: <span>{currentPlayer === 1 ? <Sparkles className="inline-block h-4 w-4 text-yellow-300" /> : <Skull className="inline-block h-4 w-4 text-red-400" />} Pawn Banished!</span>,
            description: `${getPlayerThematicName(opponent)}'s pawn is being removed.`,
            className: currentPlayer === 1 ? "bg-primary/20 border-primary" : "bg-destructive/20 border-destructive"
        });

        setTimeout(() => {
            let boardAfterRemoval = [...newBoard]; 
            boardAfterRemoval[index] = null;
            
            let statsAfterRemoval = JSON.parse(JSON.stringify(playerStats)); 
            statsAfterRemoval[opponent].pawnsOnBoard -= 1;
            
            setBoard(boardAfterRemoval); 
            setPlayerStats(statsAfterRemoval); 
            setPawnToRemoveIndex(null); 

            const gameWon = checkWinCondition(boardAfterRemoval, statsAfterRemoval); 
            if (!gameWon) {
                const pawnsAllowedThisActionWhenMillFormed = pawnsToPlaceThisTurn;
                const pawnsPlacedBeforeRemovalWhenMillFormed = pawnsPlacedThisActionSequence;

                if (pawnsPlacedBeforeRemovalWhenMillFormed < pawnsAllowedThisActionWhenMillFormed && 
                    (statsAfterRemoval[1].pawnsToPlace > 0 || statsAfterRemoval[2].pawnsToPlace > 0)) {
                    // Player formed a mill but hadn't finished their 1 or 2 placements for this action.
                    // They should return to placement phase to complete their current action's placements.
                    setLocalGamePhase('placement');
                    // Message will update. pawnsPlacedThisActionSequence is already correct.
                } else {
                    // Player had completed their 1 or 2 placements for this action (or all game pawns placed), then formed mill.
                    // Or it's movement phase. Now, switch turns.
                    // Ensure hasCompletedInitialTwoPawnPlacement is set if this action was the initial 2-pawn one
                    if (localGamePhase !== 'movement' && 
                        !statsAfterRemoval[currentPlayer].hasCompletedInitialTwoPawnPlacement && 
                        pawnsAllowedThisActionWhenMillFormed === 2) {
                       statsAfterRemoval[currentPlayer].hasCompletedInitialTwoPawnPlacement = true;
                       setPlayerStats(JSON.parse(JSON.stringify(statsAfterRemoval))); 
                    }
                    executeSwitchPlayerAndPhase(statsAfterRemoval);
                }
            }
        }, PAWN_REMOVAL_ANIMATION_DURATION);

      } else {
        toast({ title: "Invalid Banishment", description: "Cannot remove this pawn. It might be in a mill and other pawns are available, or it's not an opponent's pawn.", variant: "destructive" });
      }
    }
  };

  const handleCreateRoomOnline = () => {
    setIsLoading(true);
    resetGameState();
    const newRoomId = generateUniqueId();
    setRoomId(newRoomId);
    setLocalPlayer(1); 
    setCurrentPlayer(1); 
    setOverallPagePhase('onlineWaitingForOpponent');
    setLocalGamePhase('placement'); 
    router.push(`/games/nine-pebbles?room=${newRoomId}`, { scroll: false });
    toast({ title: "Room Created!", description: `Room ID: ${newRoomId}. You are Angels. Share this ID.`});
    setIsLoading(false);
  };

  const handleJoinRoomOnline = () => {
    if (!inputRoomId.trim()) {
      toast({ title: "Error", description: "Please enter a Room ID.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    resetGameState();
    const cleanRoomId = inputRoomId.trim().toUpperCase();
    setRoomId(cleanRoomId);
    setLocalPlayer(2); 
    setCurrentPlayer(1); 
    setOverallPagePhase('playing');
    setLocalGamePhase('placement');
    router.push(`/games/nine-pebbles?room=${cleanRoomId}`, { scroll: false });
    toast({ title: "Joined Room!", description: `Room: ${cleanRoomId}. You are Demons. Angels start.`});
    setIsLoading(false);
  };

  const copyRoomIdToClipboard = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId)
        .then(() => toast({ title: "Copied!", description: "Room ID copied to clipboard." }))
        .catch(() => toast({ title: "Error", description: "Could not copy Room ID.", variant: "destructive" }));
    }
  };

  const renderInitialSetupScreen = () => (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/20 p-2 sm:p-4 items-center justify-center">
      <header className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <Link href="/choose-game" passHref><Button variant="outline" size="icon" aria-label="Back"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <ThemeToggle />
      </header>
      <Card className="w-full max-w-md shadow-2xl text-center animate-fadeIn">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex justify-center mb-3"><Swords className="w-16 h-16 text-primary" /></div>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-primary font-heading">9-Pebbles Arena</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
          <Button onClick={() => setOverallPagePhase('localPlayerSelection')} className="w-full text-lg py-3">Play Locally</Button>
          <Button onClick={() => setOverallPagePhase('onlineRoomSetup')} variant="secondary" className="w-full text-lg py-3">Play Online (Manual Sync)</Button>
          <CardDescription className="text-xs text-muted-foreground pt-2">Online play requires manual turn coordination. Real-time sync is not yet implemented.</CardDescription>
        </CardContent>
      </Card>
      <footer className="text-center py-4 mt-6 text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Pebble Arena</footer>
    </div>
  );

  const renderLocalPlayerSelectionScreen = () => (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/20 p-2 sm:p-4 items-center justify-center">
      <header className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <Button variant="outline" size="icon" aria-label="Back" onClick={() => setOverallPagePhase('initialSetup')}><ArrowLeft className="h-5 w-5" /></Button>
        <ThemeToggle />
      </header>
      <Card className="w-full max-w-md shadow-2xl text-center animate-fadeIn">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex justify-center mb-3"><ShieldQuestion className="w-16 h-16 text-primary animate-pulse" /></div>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-primary font-heading">Choose Who Starts (Local)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
          <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">The chosen side makes the first move and places 2 pawns.</p>
          <Button onClick={() => handleLocalPlayerSelect(1)} className="w-full text-lg py-3 bg-primary hover:bg-primary/90 group"><PlayerPawnDisplay player={1} size="small" /> <span className="ml-2">Angels Start</span></Button>
          <Button onClick={() => handleLocalPlayerSelect(2)} className="w-full text-lg py-3 bg-destructive hover:bg-destructive/90 group"><PlayerPawnDisplay player={2} size="small" /> <span className="ml-2">Demons Start</span></Button>
        </CardContent>
      </Card>
      <footer className="text-center py-4 mt-6 text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Pebble Arena</footer>
    </div>
  );

  const renderOnlineRoomSetupScreen = () => (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/20 p-2 sm:p-4 items-center justify-center">
      <header className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <Button variant="outline" size="icon" aria-label="Back" onClick={() => setOverallPagePhase('initialSetup')}><ArrowLeft className="h-5 w-5" /></Button>
        <ThemeToggle />
      </header>
      <Card className="w-full max-w-md shadow-2xl text-center animate-fadeIn">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex justify-center mb-3"><Users className="w-16 h-16 text-primary animate-pulse" /></div>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-primary font-heading">9-Pebbles Online</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
          <Button onClick={handleCreateRoomOnline} className="w-full text-lg py-3">Create New Room</Button>
          <div className="flex items-center space-x-2 pt-2">
            <Input type="text" placeholder="Enter Room ID" value={inputRoomId} onChange={(e) => setInputRoomId(e.target.value.toUpperCase())} className="text-base" />
            <Button onClick={handleJoinRoomOnline} variant="secondary" className="text-base">Join</Button>
          </div>
        </CardContent>
      </Card>
      <footer className="text-center py-4 mt-6 text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Pebble Arena</footer>
    </div>
  );

  const renderOnlineWaitingScreen = () => (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/20 p-2 sm:p-4 items-center justify-center">
      <header className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <Button variant="outline" size="icon" aria-label="Back" onClick={() => {handleFullReset(); }}><ArrowLeft className="h-5 w-5" /></Button>
        <ThemeToggle />
      </header>
      <Card className="w-full max-w-md shadow-2xl text-center animate-fadeIn">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex justify-center mb-3"><PartyPopper className="w-16 h-16 text-primary" /></div>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-primary font-heading">Room Created!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
          <p className="text-muted-foreground text-sm sm:text-base">Share this Room ID with your opponent:</p>
          <div className="flex items-center justify-center space-x-2 p-3 bg-muted rounded-md">
            <span className="text-2xl font-mono font-bold text-accent tracking-wider">{roomId}</span>
            <Button variant="ghost" size="icon" onClick={copyRoomIdToClipboard} aria-label="Copy Room ID"><Copy className="h-5 w-5" /></Button>
          </div>
          <CardDescription className="text-xs text-muted-foreground italic">You are {getPlayerThematicName(1)}. Wait for your opponent to join, then click "Start Game".</CardDescription>
          <Button onClick={() => setOverallPagePhase('playing')} className="w-full text-lg mt-4">Start Game</Button>
        </CardContent>
      </Card>
      <footer className="text-center py-4 mt-6 text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Pebble Arena</footer>
    </div>
  );


  if (isLoading && overallPagePhase === 'initialSetup') return <NinePebblesLoadingSkeleton />;
  if (overallPagePhase === 'initialSetup') return renderInitialSetupScreen();
  if (overallPagePhase === 'localPlayerSelection') return renderLocalPlayerSelectionScreen();
  if (overallPagePhase === 'onlineRoomSetup') return renderOnlineRoomSetupScreen();
  if (overallPagePhase === 'onlineWaitingForOpponent') return renderOnlineWaitingScreen();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/20 p-2 sm:p-4">
      <header className="flex justify-between items-center py-3 px-1 sm:px-2 mb-2 sm:mb-3">
        <Button variant="outline" size="icon" aria-label="Back/New Game" onClick={handleFullReset}>
            <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary text-center flex items-center gap-2 font-heading">
          <Swords className="h-6 w-6 sm:h-7 sm:h-7 text-accent animate-pulse" /> 9-Pebbles
          <Zap className="h-6 w-6 sm:h-7 sm:h-7 text-primary animate-pulse" />
          {roomId && <span className="text-xs font-normal text-muted-foreground hidden sm:inline-block">(Room: {roomId})</span>}
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleFullReset} aria-label="Reset Game">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <ThemeToggle />
        </div>
      </header>
      
      <GameBanner /> 

      <PlayerStatusDisplay
        player1Stats={playerStats[1]}
        player2Stats={playerStats[2]}
        player1Name={getPlayerThematicName(1)}
        player2Name={getPlayerThematicName(2)}
        currentPlayer={currentPlayer}
        winner={winner}
        message={message}
      />

      {overallPagePhase === 'gameOver' && winner && (
        <div className="w-full text-center my-4 p-4 rounded-lg shadow-lg bg-card">
          <CardTitle className={`text-2xl font-bold mb-2 ${winner === 1 ? 'text-primary' : 'text-destructive'}`}>
            {getPlayerThematicName(winner)} are victorious!
          </CardTitle>
          <Button 
            onClick={handleFullReset} 
            className={`text-base py-2.5 ${winner === 1 ? 'bg-gradient-to-r from-primary via-primary/80 to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground' : 'bg-gradient-to-r from-destructive via-destructive/80 to-accent hover:from-destructive/90 hover:to-accent/90 text-destructive-foreground'} shadow-lg hover:shadow-xl transition-all duration-200`}
          >
            <Sparkles className="mr-2 h-5 w-5" /> Play Again <Sparkles className="ml-2 h-5 w-5" />
          </Button>
        </div>
      )}
       {roomId && <p className="text-xs text-center text-muted-foreground sm:hidden mb-2">Room: {roomId}</p>}
       {overallPagePhase === 'playing' && roomId && localPlayer !== currentPlayer && !winner && (
           <p className="text-center text-sm mt-2 mb-2 text-amber-600 dark:text-amber-400 animate-pulse">
             Waiting for {getPlayerThematicName(currentPlayer)}'s move... (Manual Sync Needed)
           </p>
         )}

      <main className="flex-grow w-full flex flex-col items-center justify-center">
        <div className="w-full max-w-[calc(100vw-20px)] sm:max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl aspect-square relative self-center">
          <GameBoardDisplay
            board={board}
            onPointClick={handlePointClick}
            selectedPawnIndex={selectedPawnIndex}
            gamePhase={localGamePhase}
            currentPlayer={currentPlayer}
            winner={winner}
            pawnToRemoveIndex={pawnToRemoveIndex}
            movingPawn={movingPawn}
            disabled={isLoading || (roomId !== null && localPlayer !== currentPlayer && overallPagePhase === 'playing')}
          />
        </div>
      </main>
       <footer className="text-center py-4 mt-auto text-sm text-muted-foreground">
         <p>&copy; {new Date().getFullYear()} Pebble Arena</p>
      </footer>
    </div>
  );
};

const NinePebblesLoadingSkeleton = () => (
  <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/20 p-2 sm:p-4">
    <header className="flex justify-between items-center py-3 px-1 sm:px-2 mb-3 sm:mb-4">
      <Skeleton className="h-8 w-8 rounded-md" />
      <Skeleton className="h-7 w-40 rounded-md" />
      <div className="flex items-center gap-2"><Skeleton className="h-8 w-8 rounded-md" /><Skeleton className="h-8 w-8 rounded-md" /></div>
    </header>
    <GameBanner /> 
    <div className="w-full max-w-md mx-auto mb-3 sm:mb-4">
      <div className="flex items-stretch justify-center gap-2 sm:gap-3">
        <Skeleton className="h-[70px] sm:h-[80px] flex-1 rounded-lg" />
        <Skeleton className="w-5 h-5 sm:w-6 sm:w-6 rounded-full self-center" />
        <Skeleton className="h-[70px] sm:h-[80px] flex-1 rounded-lg" />
      </div>
      <Skeleton className="h-6 w-3/4 mx-auto mt-2 rounded-md" />
    </div>
    <main className="flex-grow w-full flex flex-col items-center justify-center">
      <div className="w-full max-w-[calc(100vw-20px)] sm:max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl aspect-square relative self-center">
        <Skeleton className="w-full h-full rounded-lg" />
      </div>
    </main>
    <footer className="text-center py-4 mt-auto text-sm text-muted-foreground"><p>&copy; {new Date().getFullYear()} Pebble Arena</p></footer>
  </div>
);


export default NinePebblesClientPage;
    
