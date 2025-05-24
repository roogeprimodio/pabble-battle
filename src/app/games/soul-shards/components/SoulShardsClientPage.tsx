// src/app/games/soul-shards/components/SoulShardsClientPage.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, RotateCcw, ShieldQuestion, Swords, Zap, Sparkles, Construction, Users, Copy, PartyPopper, Gem } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SoulShardsBoard from './SoulShardsBoard';
import SoulShardsStatus from './SoulShardsStatus';
import PlayerPawnDisplay from '@/app/games/nine-pebbles/components/Pawn'; // Re-use
import {
  type Player,
  type BoardState,
  type Unit,
  type SoulShard,
  type PlayerStateSoulShards,
  GamePhaseSoulShards as LocalGamePhaseSoulShards,
  createInitialSoulShardsBoard,
  getPlayerThematicNameSoulShards,
  BOARD_ROWS,
  BOARD_COLS,
  MAX_UNITS_PER_PLAYER,
  SHARDS_TO_WIN,
  HARVESTER_MOVEMENT_RANGE,
  getPlayerDeploymentZone,
  createInitialSoulShards,
  isValidMove,
} from '@/lib/soul-shards-rules';
import { ThemeToggle } from '@/app/(components)/ThemeToggle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'; // Added CardFooter
import { Skeleton } from '@/components/ui/skeleton';
import GameBanner from '@/app/games/nine-pebbles/components/GameBanner';
import { generateUniqueId } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Added Alert imports

type OverallPagePhase = 'initialSetup' | 'localPlayerSelection' | 'onlineRoomSetup' | 'onlineWaitingForOpponent' | 'playing' | 'gameOver';

const initialPlayerState = (player: Player): PlayerStateSoulShards => ({
  player,
  name: getPlayerThematicNameSoulShards(player),
  shardsCollected: 0,
  faithOrDespair: 100, // Initial faith/despair
  units: [],
  unitsDeployed: 0,
});


const SoulShardsClientPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [shards, setShards] = useState<SoulShard[]>(createInitialSoulShards());
  const [board, setBoard] = useState<BoardState>(createInitialSoulShardsBoard(shards));
  const [player1State, setPlayer1State] = useState<PlayerStateSoulShards>(initialPlayerState(1));
  const [player2State, setPlayer2State] = useState<PlayerStateSoulShards>(initialPlayerState(2));
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
  const [localGamePhase, setLocalGamePhase] = useState<LocalGamePhaseSoulShards>('deployment'); // Start with deployment
  const [winner, setWinner] = useState<Player | null>(null);
  const [message, setMessage] = useState<string>('Choose game mode for Soul Shards.');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);


  const [overallPagePhase, setOverallPagePhase] = useState<OverallPagePhase>('initialSetup');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [inputRoomId, setInputRoomId] = useState<string>('');
  const [localPlayer, setLocalPlayer] = useState<Player | null>(null);


  useEffect(() => {
    const existingRoomId = searchParams.get('room');
    if (existingRoomId) {
      setRoomId(existingRoomId.toUpperCase());
      setLocalPlayer(2);
      setCurrentPlayer(1);
      setOverallPagePhase('playing');
      setLocalGamePhase('deployment');
      toast({ title: "Joined Soul Shards Room", description: `Room: ${existingRoomId.toUpperCase()}. You are ${getPlayerThematicNameSoulShards(2)}. ${getPlayerThematicNameSoulShards(1)} starts deployment.` });
    } else {
      setOverallPagePhase('initialSetup');
    }
    const timer = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(timer);
  }, [searchParams, toast]);

  const updateGameMessage = useCallback(() => {
    if (winner) {
      setMessage(`${getPlayerThematicNameSoulShards(winner)} have claimed victory by collecting ${SHARDS_TO_WIN} Soul Shards!`);
      return;
    }
     if (overallPagePhase !== 'playing') {
        if (overallPagePhase === 'initialSetup') setMessage('Soul Shards: Choose game mode.');
        else if (overallPagePhase === 'localPlayerSelection') setMessage('Soul Shards: Choose who starts locally.');
        else if (overallPagePhase === 'onlineRoomSetup') setMessage('Soul Shards: Create or join an online room.');
        else if (overallPagePhase === 'onlineWaitingForOpponent' && roomId) setMessage(`Room ID: ${roomId}. Share this ID. Click "Start Game" when ready.`);
        return;
    }
    const localPlayerInfo = localPlayer ? `(You are ${getPlayerThematicNameSoulShards(localPlayer)})` : '(Local Game)';
    const currentPlayerName = getPlayerThematicNameSoulShards(currentPlayer);

    if (localGamePhase === 'gameOver' && !winner) {
      setMessage("The battle for Soul Shards ends in a stalemate!"); // Should not happen with current rules
    } else if (localGamePhase === 'deployment') {
      const unitsLeftToDeploy = MAX_UNITS_PER_PLAYER - (currentPlayer === 1 ? player1State.unitsDeployed : player2State.unitsDeployed);
      if (unitsLeftToDeploy > 0) {
        setMessage(`${currentPlayerName}: Deploy ${unitsLeftToDeploy} more Harvester(s) in your zone. ${localPlayerInfo}`);
      } else {
        setMessage(`All units deployed. ${getPlayerThematicNameSoulShards(currentPlayer === 1 ? 2: 1)} to deploy or starting playing phase. ${localPlayerInfo}`);
      }
    } else if (localGamePhase === 'playing') {
      if (selectedUnitId) {
        const selectedUnit = [...player1State.units, ...player2State.units].find(u => u.id === selectedUnitId);
        setMessage(`${currentPlayerName}: Move selected ${selectedUnit?.type || 'unit'}. ${localPlayerInfo}`);
      } else {
        setMessage(`${currentPlayerName}'s turn. Select a unit to move. ${localPlayerInfo}`);
      }
    }
  }, [winner, currentPlayer, localGamePhase, overallPagePhase, roomId, localPlayer, player1State.units, player2State.units, player1State.unitsDeployed, player2State.unitsDeployed, selectedUnitId]);

  useEffect(() => {
    updateGameMessage();
  }, [updateGameMessage]);

  const resetGameState = () => {
    const initialShards = createInitialSoulShards();
    const newBoard = createInitialSoulShardsBoard(initialShards);
    const p1Initial = initialPlayerState(1);
    const p2Initial = initialPlayerState(2);

    setShards(initialShards);
    setBoard(newBoard);
    setPlayer1State(p1Initial);
    setPlayer2State(p2Initial);
    setCurrentPlayer(1);
    setLocalGamePhase('deployment');
    setWinner(null);
    setSelectedUnitId(null);
  };

  // Call resetGameState once on component mount if not joining a room.
  useEffect(() => {
    if (!searchParams.get('room')) {
        resetGameState();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handlePlayerSelectLocal = (player: Player) => {
    setIsLoading(true);
    resetGameState();
    setCurrentPlayer(player);
    setOverallPagePhase('playing');
    setLocalPlayer(null);
    setRoomId(null);
    toast({
      title: "Soul Shards: Local Battle Begins!",
      description: `${getPlayerThematicNameSoulShards(player)} will command their forces first. Start deployment.`,
      className: player === 1 ? "bg-primary/10 border-primary" : "bg-destructive/10 border-destructive",
    });
    setTimeout(() => setIsLoading(false), 300);
  };

  const handleFullReset = () => {
    setIsLoading(true);
    resetGameState();
    setOverallPagePhase('initialSetup');
    setRoomId(null);
    setInputRoomId('');
    setLocalPlayer(null);
    router.push('/games/soul-shards', { scroll: false }); // Navigate without room param
    setMessage('Choose game mode for Soul Shards.'); // Reset message
    toast({
      title: "Soul Shards Reset",
      description: "The board is cleared. A new war for souls awaits!",
      className: "bg-card border-foreground/20 shadow-lg",
    });
    setTimeout(() => setIsLoading(false), 300);
  };

  const handleCreateRoomOnline = () => {
    setIsLoading(true);
    resetGameState();
    const newRoomId = generateUniqueId();
    setRoomId(newRoomId);
    setLocalPlayer(1); // Creator is Player 1
    setCurrentPlayer(1); // Player 1 starts deployment
    setOverallPagePhase('onlineWaitingForOpponent');
    setLocalGamePhase('deployment');
    router.push(`/games/soul-shards?room=${newRoomId}`, { scroll: false });
    toast({ title: "Soul Shards Room Created!", description: `Room ID: ${newRoomId}. You are ${getPlayerThematicNameSoulShards(1)}. Share this ID.`});
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
    setLocalPlayer(2); // Joiner is Player 2
    setCurrentPlayer(1); // Player 1 (creator) always starts deployment
    setOverallPagePhase('playing');
    setLocalGamePhase('deployment');
    router.push(`/games/soul-shards?room=${cleanRoomId}`, { scroll: false });
    toast({ title: "Joined Soul Shards Room!", description: `Room: ${cleanRoomId}. You are ${getPlayerThematicNameSoulShards(2)}. ${getPlayerThematicNameSoulShards(1)} starts deployment.`});
    setIsLoading(false);
  };

  const copyRoomIdToClipboard = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId)
        .then(() => toast({ title: "Copied!", description: "Room ID copied to clipboard." }))
        .catch(() => toast({ title: "Error", description: "Could not copy Room ID.", variant: "destructive" }));
    }
  };

  const switchTurn = () => {
    setSelectedUnitId(null); // Deselect unit on turn switch
    const nextPlayer = currentPlayer === 1 ? 2 : 1;
    setCurrentPlayer(nextPlayer);
    // Reset 'canMove' for all units of the next player
    if (nextPlayer === 1) {
        setPlayer1State(prev => ({ ...prev, units: prev.units.map(u => ({ ...u, canMove: true })) }));
    } else {
        setPlayer2State(prev => ({ ...prev, units: prev.units.map(u => ({ ...u, canMove: true })) }));
    }
  };

  const checkWinCondition = (playerState: PlayerStateSoulShards) => {
    if (playerState.shardsCollected >= SHARDS_TO_WIN) {
      setWinner(playerState.player);
      setLocalGamePhase('gameOver');
      setOverallPagePhase('gameOver');
      toast({
          title: "Victory!",
          description: `${getPlayerThematicNameSoulShards(playerState.player)} has collected ${SHARDS_TO_WIN} Soul Shards!`,
          className: playerState.player === 1 ? "bg-primary/20 border-primary" : "bg-destructive/20 border-destructive",
          duration: 5000,
      });
      return true;
    }
    return false;
  };


  const handleCellClick = (r: number, c: number) => {
    if (winner || overallPagePhase !== 'playing' || localGamePhase === 'gameOver' || isLoading) return;
    if (roomId && localPlayer !== currentPlayer) {
        toast({ title: "Not Your Turn", description: `It's ${getPlayerThematicNameSoulShards(currentPlayer)}'s turn.`, variant: "default" });
        return;
    }

    let currentBoard = board.map(row => row.map(cell => ({ ...cell })));
    // Deep copy player states and their units to avoid direct state mutation
    let p1s = { ...player1State, units: player1State.units.map(u => ({ ...u })) };
    let p2s = { ...player2State, units: player2State.units.map(u => ({ ...u })) };


    if (localGamePhase === 'deployment') {
      const deploymentZone = getPlayerDeploymentZone(currentPlayer);
      const playerUnitsDeployed = currentPlayer === 1 ? p1s.unitsDeployed : p2s.unitsDeployed;

      if (playerUnitsDeployed >= MAX_UNITS_PER_PLAYER) {
        toast({ title: "Deployment Limit Reached", description: `You have deployed all ${MAX_UNITS_PER_PLAYER} units.`, variant: "default" });
        return;
      }
      if (r < deploymentZone.startRow || r > deploymentZone.endRow) {
        toast({ title: "Invalid Deployment Zone", description: `Deploy within rows ${deploymentZone.startRow}-${deploymentZone.endRow}.`, variant: "destructive" });
        return;
      }
      if (currentBoard[r][c].unitId !== null) {
        toast({ title: "Cell Occupied", description: "Cannot deploy on an occupied cell.", variant: "destructive" });
        return;
      }
       if (currentBoard[r][c].terrain === 'impassable') {
        toast({ title: "Impassable Terrain", description: "Cannot deploy here.", variant: "destructive" });
        return;
      }

      const newUnitId = `unit_${currentPlayer}_${generateUniqueId(4)}`;
      const newUnit: Unit = {
        id: newUnitId,
        player: currentPlayer,
        type: 'Harvester',
        health: 10,
        attack: 1,
        position: { r, c },
        canMove: true, // Units can move once the playing phase starts
      };

      currentBoard[r][c].unitId = newUnitId;
      setBoard(currentBoard);

      if (currentPlayer === 1) {
        p1s.units.push(newUnit);
        p1s.unitsDeployed += 1;
        setPlayer1State(p1s);
      } else {
        p2s.units.push(newUnit);
        p2s.unitsDeployed += 1;
        setPlayer2State(p2s);
      }
      toast({ title: "Unit Deployed", description: `${getPlayerThematicNameSoulShards(currentPlayer)} deployed a Harvester at (${r}, ${c}).` });

      // Check if deployment phase is over for both players
      if (p1s.unitsDeployed === MAX_UNITS_PER_PLAYER && p2s.unitsDeployed === MAX_UNITS_PER_PLAYER) {
        setLocalGamePhase('playing');
        // Player 1 starts the 'playing' phase
        if (currentPlayer === 2) { // If Player 2 just finished deploying
          setCurrentPlayer(1); // Switch to Player 1 to start the playing phase
           setPlayer1State(prev => ({ ...prev, units: prev.units.map(u => ({ ...u, canMove: true })) }));
        } else { // Player 1 just finished deploying (and P2 was already done or P1 started)
             setPlayer1State(prev => ({ ...prev, units: prev.units.map(u => ({ ...u, canMove: true })) }));
        }
        // Ensure P2 units are also ready if P1 started and just finished
        if (currentPlayer === 1) {
            setPlayer2State(prev => ({ ...prev, units: prev.units.map(u => ({ ...u, canMove: true })) }));
        }


      } else {
        // Switch turn for deployment
        switchTurn();
      }

    } else if (localGamePhase === 'playing') {
      const unitOnCell = [...p1s.units, ...p2s.units].find(u => u.position.r === r && u.position.c === c);

      if (selectedUnitId) {
        const unitToMove = (currentPlayer === 1 ? p1s.units : p2s.units).find(u => u.id === selectedUnitId);
        if (unitToMove && unitToMove.canMove && isValidMove(unitToMove, r, c, currentBoard)) {
          const oldR = unitToMove.position.r;
          const oldC = unitToMove.position.c;

          currentBoard[oldR][oldC].unitId = null; // Clear old position on board
          unitToMove.position = { r, c };       // Update unit's position
          currentBoard[r][c].unitId = unitToMove.id; // Set new position on board
          unitToMove.canMove = false; // Unit has moved this turn

          let shardCollectedThisMove = false;
          if (currentBoard[r][c].shardId) {
            const shardId = currentBoard[r][c].shardId as string;
            // Remove shard from the main shards list and board
            const newShardsList = shards.filter(s => s.id !== shardId);
            setShards(newShardsList);
            currentBoard[r][c].shardId = null;

            // Update player's collected shards
            if (currentPlayer === 1) {
              p1s.shardsCollected += 1;
            } else {
              p2s.shardsCollected += 1;
            }
            shardCollectedThisMove = true;
            toast({ title: "Soul Shard Collected!", description: `${getPlayerThematicNameSoulShards(currentPlayer)} collected a shard!`, className: "bg-accent/20 border-accent" });
          }
          
          setBoard(currentBoard); // Update board state first
          // Then update player states
          if (currentPlayer === 1) setPlayer1State(p1s); else setPlayer2State(p2s);

          // Check for win condition *after* states are updated
          if (shardCollectedThisMove && checkWinCondition(currentPlayer === 1 ? p1s : p2s)) {
            return; // Game over, no need to switch turn
          }
          
          setSelectedUnitId(null); // Deselect after move
          switchTurn(); // Switch to the next player

        } else if (unitOnCell && unitOnCell.player === currentPlayer && unitOnCell.id !== selectedUnitId) {
            // Clicked on another of own units, switch selection
            setSelectedUnitId(unitOnCell.id);
            toast({title: "Unit Re-selected", description: `Selected ${unitOnCell.type}. Choose where to move.`});
        } else if (unitToMove && unitToMove.id === selectedUnitId && unitOnCell?.id === selectedUnitId){
            // Clicked on already selected unit, deselect
            setSelectedUnitId(null);
        } else {
          toast({ title: "Invalid Move", description: "Cannot move there, or unit cannot move again this turn.", variant: "destructive" });
        }
      } else if (unitOnCell && unitOnCell.player === currentPlayer) {
        // No unit selected yet, and clicked on one of current player's units
        setSelectedUnitId(unitOnCell.id);
        toast({ title: "Unit Selected", description: `${unitOnCell.type} selected. Choose where to move.` });
      } else if (unitOnCell && unitOnCell.player !== currentPlayer) {
        toast({ title: "Enemy Unit", description: `That's an enemy ${unitOnCell.type}.` });
      } else {
        // Clicked an empty cell without a unit selected
        setSelectedUnitId(null); // Ensure deselection
      }
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
          <div className="flex justify-center mb-3"><Gem className="w-16 h-16 text-primary" /></div>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-primary font-heading">Soul Shards</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
          <Button onClick={() => setOverallPagePhase('localPlayerSelection')} className="w-full text-lg py-3">Play Locally</Button>
          <Button onClick={() => setOverallPagePhase('onlineRoomSetup')} variant="secondary" className="w-full text-lg py-3">Play Online (Beta)</Button>
           <CardDescription className="text-xs text-muted-foreground pt-2">Online play is a beta feature. Moves are not yet synced in real-time; manual coordination is needed.</CardDescription>
        </CardContent>
      </Card>
      <footer className="text-center py-4 mt-6 text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Pebble Arena - Soul Shards</footer>
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
          <CardTitle className="text-2xl sm:text-3xl font-bold text-primary font-heading">Soul Shards: Choose Commander (Local)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
          <Button onClick={() => handlePlayerSelectLocal(1)} className="w-full text-lg py-3 bg-primary hover:bg-primary/90 group"><PlayerPawnDisplay player={1} size="small" /> <span className="ml-2">{getPlayerThematicNameSoulShards(1)}</span></Button>
          <Button onClick={() => handlePlayerSelectLocal(2)} className="w-full text-lg py-3 bg-destructive hover:bg-destructive/90 group"><PlayerPawnDisplay player={2} size="small" /> <span className="ml-2">{getPlayerThematicNameSoulShards(2)}</span></Button>
        </CardContent>
      </Card>
       <footer className="text-center py-4 mt-6 text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Pebble Arena - Soul Shards</footer>
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
          <CardTitle className="text-2xl sm:text-3xl font-bold text-primary font-heading">Soul Shards Online</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
          <Button onClick={handleCreateRoomOnline} className="w-full text-lg py-3">Create New Room</Button>
          <div className="flex items-center space-x-2 pt-2">
            <Input type="text" placeholder="Enter Room ID" value={inputRoomId} onChange={(e) => setInputRoomId(e.target.value.toUpperCase())} className="text-base" />
            <Button onClick={handleJoinRoomOnline} variant="secondary" className="text-base">Join</Button>
          </div>
        </CardContent>
      </Card>
      <footer className="text-center py-4 mt-6 text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Pebble Arena - Soul Shards</footer>
    </div>
  );

  const renderOnlineWaitingScreen = () => (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/20 p-2 sm:p-4 items-center justify-center">
      <header className="absolute top-4 left-4 right-4 flex justify-between items-center">
         <Button variant="outline" size="icon" aria-label="Back" onClick={handleFullReset}><ArrowLeft className="h-5 w-5" /></Button>
        <ThemeToggle />
      </header>
      <Card className="w-full max-w-md shadow-2xl text-center animate-fadeIn">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex justify-center mb-3"><PartyPopper className="w-16 h-16 text-primary" /></div>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-primary font-heading">Soul Shards Room Created!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
          <p className="text-muted-foreground text-sm sm:text-base">Share this Room ID with your opponent:</p>
          <div className="flex items-center justify-center space-x-2 p-3 bg-muted rounded-md">
            <span className="text-2xl font-mono font-bold text-accent tracking-wider">{roomId}</span>
            <Button variant="ghost" size="icon" onClick={copyRoomIdToClipboard} aria-label="Copy Room ID"><Copy className="h-5 w-5" /></Button>
          </div>
          <CardDescription className="text-xs text-muted-foreground italic">You are {getPlayerThematicNameSoulShards(1)}. Wait for your opponent, then click "Start Game".</CardDescription>
          <Button onClick={() => setOverallPagePhase('playing')} className="w-full text-lg mt-4">Start Game</Button>
        </CardContent>
      </Card>
      <footer className="text-center py-4 mt-6 text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Pebble Arena - Soul Shards</footer>
    </div>
  );

  if (isLoading) return <SoulShardsLoadingSkeleton />;
  if (overallPagePhase === 'initialSetup') return renderInitialSetupScreen();
  if (overallPagePhase === 'localPlayerSelection') return renderLocalPlayerSelectionScreen();
  if (overallPagePhase === 'onlineRoomSetup') return renderOnlineRoomSetupScreen();
  if (overallPagePhase === 'onlineWaitingForOpponent') return renderOnlineWaitingScreen();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/20 p-2 sm:p-4">
      <header className="flex justify-between items-center py-3 px-1 sm:px-2 mb-2 sm:mb-3">
        <Button variant="outline" size="icon" aria-label="Back/New Game" onClick={handleFullReset}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary text-center flex items-center gap-2 font-heading">
          <Swords className="h-6 w-6 sm:h-7 sm:h-7 text-accent animate-pulse" /> Soul Shards
          <Zap className="h-6 w-6 sm:h-7 sm:h-7 text-primary animate-pulse" />
           {roomId && <span className="text-xs font-normal text-muted-foreground hidden sm:inline-block">(Room: {roomId})</span>}
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleFullReset} aria-label="Reset Game"><RotateCcw className="h-4 w-4" /></Button>
          <ThemeToggle />
        </div>
      </header>

      <GameBanner />

      <SoulShardsStatus
        player1State={player1State}
        player2State={player2State}
        currentPlayer={currentPlayer}
        gamePhase={localGamePhase}
        winner={winner}
        message={message}
      />

      {overallPagePhase === 'gameOver' && winner && (
        <div className="w-full text-center my-2 sm:my-3 p-4 rounded-lg shadow-lg bg-card">
           <AlertTitle className={`text-2xl font-bold mb-2 ${winner === 1 ? 'text-primary' : 'text-destructive'}`}>
            {getPlayerThematicNameSoulShards(winner)} are victorious!
          </AlertTitle>
          <Button onClick={handleFullReset} className={`text-base py-2.5 ${winner === 1 ? 'bg-gradient-to-r from-primary to-accent' : 'bg-gradient-to-r from-destructive to-accent'} text-primary-foreground`}>
            <Sparkles className="mr-2 h-5 w-5" /> New Campaign <Sparkles className="ml-2 h-5 w-5" />
          </Button>
        </div>
      )}
       {roomId && <p className="text-xs text-center text-muted-foreground sm:hidden mb-2">Room: {roomId}</p>}
       {overallPagePhase === 'playing' && roomId && localPlayer !== currentPlayer && !winner && (
           <p className="text-center text-sm mt-2 mb-2 text-amber-600 dark:text-amber-400 animate-pulse">
             Waiting for {getPlayerThematicNameSoulShards(currentPlayer)}'s move... (Manual Sync Needed)
           </p>
         )}

      <main className="flex-grow w-full flex flex-col items-center justify-center">
        { localGamePhase === 'deployment' || localGamePhase === 'playing' || localGamePhase === 'gameOver' ? (
             <SoulShardsBoard
                board={board}
                units={[...player1State.units, ...player2State.units]}
                shards={shards}
                onCellClick={handleCellClick}
                selectedUnitId={selectedUnitId}
                currentPlayer={currentPlayer}
                gamePhase={localGamePhase}
                disabled={overallPagePhase !== 'playing' || isLoading || localGamePhase === 'gameOver' || (roomId !== null && localPlayer !== currentPlayer)}
            />
        ) : (
         <Card className="w-full max-w-xl text-center shadow-xl my-4">
          <CardHeader>
            <div className="flex justify-center mb-2"><Construction className="h-12 w-12 text-accent animate-bounce" /></div>
            <CardTitle className="text-xl font-heading">Soul Shards - Game Pending</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <CardDescription className="text-sm mb-3">Game setup is in progress or player selection is pending.</CardDescription>
            <Button onClick={handleFullReset} className="mt-4 text-sm">
              <RotateCcw className="mr-2 h-4 w-4" /> Back to Setup
            </Button>
          </CardContent>
        </Card>
        )}
      </main>

      <footer className="text-center py-4 mt-auto text-sm text-muted-foreground">
         <p>&copy; {new Date().getFullYear()} Pebble Arena - Soul Shards</p>
      </footer>
    </div>
  );
};

const SoulShardsLoadingSkeleton = () => (
  <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/20 p-2 sm:p-4">
    <header className="flex justify-between items-center py-3 px-1 sm:px-2 mb-3 sm:mb-4">
      <Skeleton className="h-8 w-8 rounded-md" />
      <Skeleton className="h-7 w-48 rounded-md" />
      <div className="flex items-center gap-2"><Skeleton className="h-8 w-8 rounded-md" /><Skeleton className="h-8 w-8 rounded-md" /></div>
    </header>
    <GameBanner />
    <div className="w-full max-w-lg mx-auto mb-3 sm:mb-4">
      <div className="flex items-stretch justify-center gap-2 sm:gap-3">
        <Skeleton className="h-[90px] sm:h-[100px] flex-1 rounded-lg" />
        <Skeleton className="w-5 h-5 sm:w-6 sm:w-6 rounded-full self-center" />
        <Skeleton className="h-[90px] sm:h-[100px] flex-1 rounded-lg" />
      </div>
      <Skeleton className="h-6 w-3/4 mx-auto mt-2 rounded-md" />
    </div>
    <main className="flex-grow w-full flex flex-col items-center justify-center">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-xl aspect-square relative self-center">
        <Skeleton className="w-full h-full rounded-lg" />
      </div>
    </main>
    <footer className="text-center py-4 mt-auto text-sm text-muted-foreground"><Skeleton className="h-4 w-1/3 mx-auto rounded-md" /></footer>
  </div>
);

export default SoulShardsClientPage;
