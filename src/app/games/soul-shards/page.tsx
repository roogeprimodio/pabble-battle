
// src/app/games/soul-shards/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, RotateCcw, ShieldQuestion, Swords, Zap, Sparkles, Construction, Users, Copy, PartyPopper, Gem } from 'lucide-react';
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
  GamePhaseSoulShards as LocalGamePhaseSoulShards, // Renamed
  createInitialSoulShardsBoard,
  getPlayerThematicNameSoulShards,
  BOARD_ROWS,
  BOARD_COLS,
} from '@/lib/soul-shards-rules';
import { ThemeToggle } from '@/app/(components)/ThemeToggle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import GameBanner from '@/app/games/nine-pebbles/components/GameBanner';
import { generateUniqueId } from '@/lib/utils';

type OverallPagePhase = 'initialSetup' | 'localPlayerSelection' | 'onlineRoomSetup' | 'onlineWaitingForOpponent' | 'playing' | 'gameOver';

const initialPlayerState = (player: Player): PlayerStateSoulShards => ({
  player,
  name: getPlayerThematicNameSoulShards(player),
  shardsCollected: 0,
  faithOrDespair: 100,
  units: [], // Start with no units
});


const SoulShardsPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [board, setBoard] = useState<BoardState>(createInitialSoulShardsBoard());
  const [player1State, setPlayer1State] = useState<PlayerStateSoulShards>(initialPlayerState(1));
  const [player2State, setPlayer2State] = useState<PlayerStateSoulShards>(initialPlayerState(2));
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
  const [localGamePhase, setLocalGamePhase] = useState<LocalGamePhaseSoulShards>('deployment'); 
  const [winner, setWinner] = useState<Player | null>(null);
  const [message, setMessage] = useState<string>('Choose game mode for Soul Shards.');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [shards, setShards] = useState<SoulShard[]>([]);

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
      toast({ title: "Joined Soul Shards Room", description: `Room: ${existingRoomId.toUpperCase()}. You are ${getPlayerThematicNameSoulShards(2)}. ${getPlayerThematicNameSoulShards(1)} starts.` });
    } else {
      setOverallPagePhase('initialSetup');
    }
    const timer = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(timer);
  }, [searchParams, toast]);

  const updateGameMessage = useCallback(() => {
    if (winner) {
      setMessage(`${getPlayerThematicNameSoulShards(winner)} have claimed victory!`);
      return;
    }
     if (overallPagePhase !== 'playing') {
        if (overallPagePhase === 'initialSetup') setMessage('Soul Shards: Choose game mode.');
        else if (overallPagePhase === 'localPlayerSelection') setMessage('Soul Shards: Choose who starts locally.');
        else if (overallPagePhase === 'onlineRoomSetup') setMessage('Soul Shards: Create or join an online room.');
        else if (overallPagePhase === 'onlineWaitingForOpponent' && roomId) setMessage(`Room ID: ${roomId}. Share this ID. Click "Start Game" when ready.`);
        return;
    }
    if (localGamePhase === 'gameOver' && !winner) {
      setMessage("The battle for Soul Shards ends in a stalemate!");
    } else if (localGamePhase === 'deployment') {
       const localPlayerName = localPlayer ? getPlayerThematicNameSoulShards(localPlayer) : 'Observer';
       setMessage(`${getPlayerThematicNameSoulShards(currentPlayer)}: Deploy your units. (You are ${localPlayerName})`);
    } else {
      const localPlayerName = localPlayer ? getPlayerThematicNameSoulShards(localPlayer) : 'Observer';
      setMessage(`${getPlayerThematicNameSoulShards(currentPlayer)}'s turn. (You are ${localPlayerName})`);
    }
  }, [winner, currentPlayer, localGamePhase, overallPagePhase, roomId, localPlayer]);

  useEffect(() => {
    updateGameMessage();
  }, [updateGameMessage]);

  const resetGameState = () => {
    const newBoard = createInitialSoulShardsBoard();
    const p1Initial = initialPlayerState(1);
    const p2Initial = initialPlayerState(2);
    
    setBoard(newBoard);
    setPlayer1State(p1Initial);
    setPlayer2State(p2Initial);
    setCurrentPlayer(1);
    setLocalGamePhase('deployment'); 
    setWinner(null);
    setSelectedUnitId(null);
    setShards([]); 
  };

  useEffect(() => { // Ensure initial units are on the board state
    resetGameState();
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
      description: `${getPlayerThematicNameSoulShards(player)} will command their forces first.`,
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
    router.push('/games/soul-shards', { scroll: false });
    setMessage('Choose game mode for Soul Shards.');
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
    setLocalPlayer(1);
    setCurrentPlayer(1); 
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
    setLocalPlayer(2);
    setCurrentPlayer(1); 
    setOverallPagePhase('playing');
    setLocalGamePhase('deployment'); 
    router.push(`/games/soul-shards?room=${cleanRoomId}`, { scroll: false });
    toast({ title: "Joined Soul Shards Room!", description: `Room: ${cleanRoomId}. You are ${getPlayerThematicNameSoulShards(2)}. ${getPlayerThematicNameSoulShards(1)} starts.`});
    setIsLoading(false);
  };

  const copyRoomIdToClipboard = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId)
        .then(() => toast({ title: "Copied!", description: "Room ID copied to clipboard." }))
        .catch(() => toast({ title: "Error", description: "Could not copy Room ID.", variant: "destructive" }));
    }
  };


  const handleCellClick = (r: number, c: number) => {
    if (winner || overallPagePhase !== 'playing' || localGamePhase === 'gameOver' || isLoading) return;
    if (roomId && localPlayer !== currentPlayer) {
        toast({ title: "Not Your Turn", description: `It's ${getPlayerThematicNameSoulShards(currentPlayer)}'s turn.`, variant: "default" });
        return;
    }

    if (localGamePhase === 'deployment') {
      if (board[r][c].unitId === null && board[r][c].terrain !== 'impassable') {
        const newUnitId = `temp_unit_${generateUniqueId(4)}`;
        const newUnit: Unit = {
          id: newUnitId,
          player: currentPlayer,
          type: 'Harvester', // Default type for this visual test
          health: 10,
          attack: 1,
          position: { r, c },
        };

        setBoard(prevBoard => {
          const newBoardState = prevBoard.map(row => row.map(cell => ({ ...cell })));
          newBoardState[r][c].unitId = newUnitId;
          return newBoardState;
        });

        if (currentPlayer === 1) {
          setPlayer1State(prevState => ({
            ...prevState,
            units: [...prevState.units, newUnit],
          }));
        } else {
          setPlayer2State(prevState => ({
            ...prevState,
            units: [...prevState.units, newUnit],
          }));
        }
        toast({ title: "Unit Deployed (Visually)", description: `Harvester placed at (${r}, ${c}).` });
        // Basic turn switch for demo. Real logic would be more complex.
        // setCurrentPlayer(prev => prev === 1 ? 2 : 1); 
      } else {
        toast({ title: "Invalid Deployment", description: "Cannot deploy here.", variant: "destructive" });
      }
    } else if (localGamePhase === 'playing') {
      // Placeholder for unit selection and movement logic
      const unitOnCell = [...player1State.units, ...player2State.units].find(u => u.position.r === r && u.position.c === c);
      if (selectedUnitId) {
        // Attempt to move selected unit
        const unitToMove = [...player1State.units, ...player2State.units].find(u => u.id === selectedUnitId);
        if (unitToMove && unitToMove.player === currentPlayer) {
           // TODO: Implement movement logic (check range, terrain, if cell is empty etc.)
           toast({title: "Move Action", description: `Attempting to move unit ${selectedUnitId} to (${r},${c})`});
           setSelectedUnitId(null); // Deselect after attempting move
        } else {
          setSelectedUnitId(null);
        }
      } else if (unitOnCell && unitOnCell.player === currentPlayer) {
        // Select unit
        setSelectedUnitId(unitOnCell.id);
        toast({title: "Unit Selected", description: `${unitOnCell.type} selected.`});
      } else if (unitOnCell && unitOnCell.player !== currentPlayer) {
        toast({title: "Enemy Unit", description: `That's an enemy ${unitOnCell.type}.`});
      } else {
        toast({title: "Empty Cell", description: `Cell (${r}, ${c}) is empty.`});
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

  const renderGameScreenSkeleton = () => (
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

  if (isLoading) return renderGameScreenSkeleton();
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
         <Card className="w-full max-w-xl text-center shadow-xl my-4">
          <CardHeader>
            <div className="flex justify-center mb-2"><Construction className="h-12 w-12 text-accent animate-bounce" /></div>
            <CardTitle className="text-xl font-heading">Soul Shards - Under Construction!</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <CardDescription className="text-sm mb-3">Core game mechanics are being forged. Basic board interaction is enabled.</CardDescription>
             <SoulShardsBoard
                board={board}
                units={[...player1State.units, ...player2State.units]}
                shards={shards}
                onCellClick={handleCellClick}
                selectedUnitId={selectedUnitId}
                currentPlayer={currentPlayer}
                disabled={overallPagePhase !== 'playing' || isLoading || (roomId !== null && localPlayer !== currentPlayer)}
            />
            <Button onClick={handleFullReset} className="mt-4 text-sm">
              <RotateCcw className="mr-2 h-4 w-4" /> Back to Setup
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
