// src/app/games/tic-tac-toe/components/TicTacToeClientPage.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, RotateCcw, Swords, Zap, Sparkles, Copy, Users } from 'lucide-react'; // Removed AlertCircle as it wasn't used
import { useToast } from '@/hooks/use-toast';
import TicTacToeBoard from './TicTacToeBoard';
import TicTacToeStatus from './TicTacToeStatus';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import GameBanner from '@/app/games/nine-pebbles/components/GameBanner';

type PagePhase = 'initial' | 'creatingRoom' | 'waitingForOpponent' | 'playing' | 'gameOver';

let peerConnection: RTCPeerConnection | null = null;
let dataChannel: RTCDataChannel | null = null;

const TicTacToeClientPage: React.FC = () => {
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
  const [isLoading, setIsLoading] = useState(true); // Set to true initially

  const signalingUrl = '/.netlify/functions/signaling';

  const initializePeerConnection = useCallback(async (isInitiator: boolean) => {
    if (!roomId || !localPlayer) {
      console.warn("Cannot initialize peer connection without roomId or localPlayer");
      return;
    }
    console.log('Initializing Peer Connection for room:', roomId, 'Is Initiator:', isInitiator, 'Local Player:', localPlayer);

    const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    if (peerConnection) {
        peerConnection.close(); // Close any existing connection
    }
    peerConnection = new RTCPeerConnection(configuration);

    peerConnection.onicecandidate = async (event) => {
      if (event.candidate && roomId && localPlayer) {
        console.log('Sending ICE candidate:', event.candidate);
        try {
          await fetch(signalingUrl, {
            method: 'POST',
            body: JSON.stringify({ type: 'candidate', roomId, payload: event.candidate, senderId: localPlayer.toString() }),
          });
        } catch (error) {
          console.error("Error sending ICE candidate:", error);
        }
      }
    };
    
    peerConnection.onconnectionstatechange = () => {
      if (peerConnection) {
        console.log("Peer connection state:", peerConnection.connectionState);
        if (peerConnection.connectionState === 'connected' && pagePhase === 'waitingForOpponent') {
          setPagePhase('playing');
          toast({title: "Opponent Connected!", description: "The game can now begin."});
        }
        if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
           toast({title: "Connection Issue", description: "Lost connection to opponent.", variant: "destructive"});
           // Potentially reset or show an error
        }
      }
    };

    peerConnection.ondatachannel = (event) => {
      console.log('Data channel received');
      dataChannel = event.channel;
      setupDataChannelEvents();
    };
    
    if (isInitiator) {
      console.log('Creating data channel');
      dataChannel = peerConnection.createDataChannel('ticTacToeChannel');
      setupDataChannelEvents();

      try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        console.log('Sending offer:', offer);
        if (roomId && localPlayer) {
          await fetch(signalingUrl, {
            method: 'POST',
            body: JSON.stringify({ type: 'offer', roomId, payload: offer, senderId: localPlayer.toString() }),
          });
        }
      } catch (error) {
        console.error("Error creating or sending offer:", error);
      }
    }
  }, [roomId, localPlayer, signalingUrl, pagePhase, toast]);

  const setupDataChannelEvents = () => {
    if (!dataChannel) return;
    dataChannel.onopen = () => {
      console.log('Data channel OPEN');
      if (pagePhase === 'waitingForOpponent' || (localPlayer === 2 && pagePhase !== 'playing')) {
        setPagePhase('playing');
        toast({ title: "Connection Established!", description: "You can now play."});
      }
    };
    dataChannel.onclose = () => {
      console.log('Data channel CLOSED');
      toast({ title: "Connection Closed", variant: "destructive"});
    };
    dataChannel.onmessage = (event) => {
      console.log('Data channel message received:', event.data);
      try {
        const receivedData = JSON.parse(event.data as string);
        if (receivedData.type === 'move') {
          handleOpponentMove(receivedData.board, receivedData.currentPlayer);
        } else if (receivedData.type === 'reset') {
           handleResetGame(false); 
           toast({ title: "Opponent Reset Game", description: "The game has been reset." });
        }
      } catch(e) {
        console.error("Failed to parse data channel message", e);
      }
    };
  };
  
  const handleSignalingMessage = useCallback(async (data: any) => {
    if (!peerConnection || !roomId || !localPlayer) {
      console.warn("Cannot handle signaling message without peerConnection, roomId, or localPlayer");
      return;
    }

    console.log('Received signaling data:', data);
    // Ensure we don't process signals sent by ourselves, which can happen with simple polling
    if (data.senderId && data.senderId === localPlayer.toString()) {
        console.log("Ignoring signal from self");
        return;
    }

    try {
      if (data.type === 'offer') {
          if (peerConnection.signalingState !== "stable" && peerConnection.signalingState !== "have-local-offer") {
             console.warn(`Cannot set remote offer in state ${peerConnection.signalingState}. Resetting connection might be needed.`);
             // Potentially handle this more gracefully, e.g., by ignoring or re-initiating.
             return;
          }
          await peerConnection.setRemoteDescription(new RTCSessionDescription(data.payload));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          console.log('Sending answer:', answer);
          await fetch(signalingUrl, {
              method: 'POST',
              body: JSON.stringify({ type: 'answer', roomId, payload: answer, senderId: localPlayer.toString() }),
          });
      } else if (data.type === 'answer') {
          if (peerConnection.signalingState !== "have-local-offer") {
             console.warn(`Cannot set remote answer in state ${peerConnection.signalingState}.`);
             return;
          }
          await peerConnection.setRemoteDescription(new RTCSessionDescription(data.payload));
      } else if (data.type === 'candidate') {
          if (data.payload && peerConnection.signalingState !== "closed") { // Only add if connection is not closed
             await peerConnection.addIceCandidate(new RTCIceCandidate(data.payload));
          }
      }
    } catch (error) {
       console.error("Error handling signaling message:", error, "Message:", data);
    }
  }, [peerConnection, roomId, localPlayer, signalingUrl]); 
  
  useEffect(() => {
    if (!roomId || !localPlayer || (pagePhase !== 'playing' && pagePhase !== 'waitingForOpponent')) {
        return;
    }
    
    let isActive = true;
    const pollInterval = 3000; 
    let timeoutId: NodeJS.Timeout;

    const pollSignalingServer = async () => {
        if (!isActive || !roomId || !localPlayer) return;

        try {
            // Include senderId in poll request to allow server to filter out own messages if it supports it.
            // Or filter client-side as already done in handleSignalingMessage.
            const response = await fetch(`${signalingUrl}?roomId=${roomId}&clientId=${localPlayer.toString()}`);
            if (!isActive) return;

            if (response.ok) {
                const messages = await response.json();
                if (Array.isArray(messages)) {
                    messages.forEach(msg => {
                       // We already filter by senderId in handleSignalingMessage, so this check might be redundant 
                       // if the server doesn't filter, but good for safety.
                       if (msg.senderId !== localPlayer?.toString()) { 
                           handleSignalingMessage(msg);
                       }
                    });
                }
            } else {
                console.error("Error polling signaling server:", response.statusText);
            }
        } catch (error) {
            if (isActive) console.error("Polling error:", error);
        } finally {
            if (isActive) {
               timeoutId = setTimeout(pollSignalingServer, pollInterval);
            }
        }
    };
    
    timeoutId = setTimeout(pollSignalingServer, pollInterval); // Start polling
    
    return () => { 
      isActive = false;
      clearTimeout(timeoutId); // Clear timeout on cleanup
    };
  }, [pagePhase, roomId, localPlayer, handleSignalingMessage, signalingUrl]);


  useEffect(() => {
    const paramRoomId = searchParams.get('room');
    if (paramRoomId && paramRoomId !== roomId) { // Only update if paramRoomId is new and different
      setRoomId(paramRoomId.toUpperCase());
      // If joining through URL, and not yet having a role, assume joiner.
      // Actual role setting happens in handleCreateRoom/handleJoinRoom.
      // This useEffect is mainly for initializing roomId from URL.
      if (!localPlayer && pagePhase === 'initial') {
        // Do not automatically set localPlayer here, let join/create buttons handle it.
        // Just set roomId and potentially transition pagePhase if needed.
        // setPagePhase('joiningViaUrl'); // Could be a new phase if specific UX is needed
      }
    }
    // Initial loading complete after first effect run
    if (isLoading) setIsLoading(false); 
  }, [searchParams, roomId, localPlayer, pagePhase, isLoading]);


  const updateGameMessage = useCallback(() => {
    if (pagePhase === 'initial') {
      setMessage('Create a new game room or join an existing one.');
      return;
    }
    if (pagePhase === 'waitingForOpponent' && roomId) { // Changed from 'creatingRoom'
      setMessage(`Room ID: ${roomId}. Share this. You are ${getPlayerThematicName(localPlayer || 1)}. Waiting for opponent...`);
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


  const handleCreateRoom = async () => {
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
    setPagePhase('waitingForOpponent'); 
    
    router.push(`/games/tic-tac-toe?room=${newRoomId}`, { scroll: false });
    
    toast({
      title: "Room Created!",
      description: `Room ID: ${newRoomId}. Share this. You are ${getPlayerThematicName(1)}. Waiting for opponent.`,
      className: "bg-primary/10 border-primary",
    });
    await initializePeerConnection(true); 
    setIsLoading(false);
  };

  const handleJoinRoom = async () => {
    if (!inputRoomId.trim()) {
      toast({ title: "Error", description: "Please enter a Room ID.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    const cleanRoomId = inputRoomId.trim().toUpperCase();
    setRoomId(cleanRoomId); // This will trigger useEffect for searchParams if URL is not yet updated
    setLocalPlayer(2); 
    setCurrentPlayer(1); 
    setBoard(createInitialBoard());
    setWinner(null);
    setIsDraw(false);
    setWinningCombination(null);
    setGamePhase('playing');
    // For joiner, go to 'playing' phase, assuming connection will establish.
    // Signaling useEffect will handle actual connection.
    setPagePhase('playing'); 

    // Update URL to reflect joined room, if not already set by param
    if (searchParams.get('room') !== cleanRoomId) {
        router.push(`/games/tic-tac-toe?room=${cleanRoomId}`, { scroll: false });
    }
    
    toast({
      title: "Joined Room!",
      description: `You joined room: ${cleanRoomId}. You are ${getPlayerThematicName(2)}.`,
       className: "bg-destructive/10 border-destructive",
    });
    await initializePeerConnection(false); 
    setIsLoading(false);
  };

  const handleResetGame = (shouldNotifyOpponent = true) => {
    setIsLoading(true);
    if (shouldNotifyOpponent && dataChannel && dataChannel.readyState === 'open') {
        dataChannel.send(JSON.stringify({ type: 'reset' }));
    }
    
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    if (dataChannel) {
        dataChannel.close();
        dataChannel = null;
    }

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
    setTimeout(() => setIsLoading(false), 300); // Ensure loading state is reset
  };

  const handleOpponentMove = (newBoard: BoardState, nextPlayer: Player) => {
    setBoard(newBoard);
    const currentWinner = checkWinner(newBoard);
    if (currentWinner) {
      setWinner(currentWinner);
      setGamePhase('gameOver');
      setPagePhase('gameOver');
      toast({
        title: "Game Over!",
        description: `${getPlayerThematicName(currentWinner)} has won!`,
        className: currentWinner === 1 ? "bg-primary/20 border-primary" : "bg-destructive/20 border-destructive",
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
      setCurrentPlayer(nextPlayer);
    }
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

    const nextPlayer = currentPlayer === 1 ? 2 : 1;

    if (dataChannel && dataChannel.readyState === 'open') {
      dataChannel.send(JSON.stringify({ type: 'move', board: newBoard, currentPlayer: nextPlayer }));
    } else if (roomId) { 
      toast({ title: "Connection Issue", description: "Opponent not connected or data channel closed. Moves are local.", variant: "destructive"});
    }

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
      setCurrentPlayer(nextPlayer);
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
          <CardTitle className="text-2xl sm:text-3xl font-bold text-primary font-heading">Tic-Tac-Toe Online</CardTitle>
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
            <Button onClick={handleJoinRoom} variant="secondary" className="text-base shadow-md">Join Room</Button>
          </div>
        </CardContent>
      </Card>
      <footer className="text-center py-4 mt-6 text-sm text-muted-foreground"> <p>&copy; {new Date().getFullYear()} Pebble Arena</p> </footer>
    </div>
  );

  const renderWaitingForOpponentScreen = () => (
     <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/20 p-2 sm:p-4 items-center justify-center">
        <header className="absolute top-4 left-4 right-4 flex justify-between items-center">
            <Button variant="outline" size="icon" aria-label="Back / Reset" onClick={() => handleResetGame()}> <ArrowLeft className="h-5 w-5" /> </Button>
            <ThemeToggle />
        </header>
        <Card className="w-full max-w-md shadow-2xl text-center animate-fadeIn">
            <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-2xl sm:text-3xl font-bold text-primary font-heading">Room Ready!</CardTitle>
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
                  <span>You are {getPlayerThematicName(localPlayer === 1 ? 1 : 2)}.</span><br/> {/* Corrected this to show current local player */}
                  <span>Waiting for opponent to join and connect...</span><br/>
                  <span>Once connected, the game will start automatically.</span>
                </CardDescription>
            </CardContent>
        </Card>
        <footer className="text-center py-4 mt-6 text-sm text-muted-foreground"> <p>&copy; {new Date().getFullYear()} Pebble Arena</p> </footer>
    </div>
  );
  
  const renderGameScreenSkeleton = () => ( // This is used by the Suspense fallback now
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/20 p-2 sm:p-4">
      <header className="flex justify-between items-center py-3 px-1 sm:px-2 mb-3 sm:mb-4">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-7 w-48 rounded-md" />
        <div className="flex items-center gap-2"><Skeleton className="h-8 w-8 rounded-md" /><Skeleton className="h-8 w-8 rounded-md" /></div>
      </header>
      <GameBanner />
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

  if (isLoading && pagePhase === 'initial') return renderGameScreenSkeleton();
  if (pagePhase === 'initial') return renderInitialScreen();
  if (pagePhase === 'waitingForOpponent') return renderWaitingForOpponentScreen();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/20 p-2 sm:p-4">
      <header className="flex justify-between items-center py-3 px-1 sm:px-2 mb-2 sm:mb-3">
        <Button variant="outline" size="icon" onClick={() => handleResetGame()} aria-label="New Room / Reset">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary text-center flex items-center gap-2 font-heading">
          <Swords className="h-6 w-6 sm:h-7 sm:h-7 text-accent animate-pulse" /> Tic-Tac-Toe <Zap className="h-6 w-6 sm:h-7 sm:h-7 text-primary animate-pulse" />
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
            onClick={() => handleResetGame()} 
            className={`text-base py-2 sm:py-2.5 px-4 sm:px-6 ${winner === 1 ? 'bg-gradient-to-r from-primary via-primary/80 to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground' : winner === 2 ? 'bg-gradient-to-r from-destructive via-destructive/80 to-accent hover:from-destructive/90 hover:to-accent/90 text-destructive-foreground' : 'bg-accent hover:bg-accent/90 text-accent-foreground'} shadow-lg hover:shadow-xl transition-all duration-200`}
          >
            <Sparkles className="mr-2 h-5 w-5" /> {isDraw ? 'New Game' : 'Play Again'} <Sparkles className="ml-2 h-5 w-5" />
          </Button>
        </div>
      )}

      <main className="flex-grow w-full flex flex-col items-center justify-center">
        <TicTacToeBoard
          board={board}
          onCellClick={handleCellClick}
          disabled={pagePhase !== 'playing' || gamePhase === 'gameOver' || currentPlayer !== localPlayer || (!!roomId && dataChannel?.readyState !== 'open')}
          winningCombination={winningCombination}
          currentPlayer={currentPlayer}
        />
         {roomId && <p className="text-xs text-center mt-3 text-muted-foreground sm:hidden">Room: {roomId}</p>}
         {pagePhase === 'playing' && currentPlayer !== localPlayer && !winner && !isDraw && (
           <p className="text-center text-sm mt-3 text-amber-600 dark:text-amber-400 animate-pulse">
             Waiting for {getPlayerThematicName(currentPlayer)}'s move...
           </p>
         )}
         {pagePhase === 'playing' && roomId && dataChannel?.readyState !== 'open' && (!winner && !isDraw && localPlayer) && ( // Added localPlayer check here
            <p className="text-center text-sm mt-3 text-orange-500 dark:text-orange-400">
                Attempting to connect to opponent...
            </p>
         )}
      </main>

      <footer className="text-center py-4 mt-auto text-sm text-muted-foreground">
         <p>&copy; {new Date().getFullYear()} Pebble Arena</p>
      </footer>
    </div>
  );
};

export default TicTacToeClientPage;

    