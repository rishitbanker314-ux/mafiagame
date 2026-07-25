import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Background from './components/Background';
import socket from './socket';
import JoinView from './components/JoinView';
import LobbyView from './components/LobbyView';
import NightView from './components/NightView';
import DayView from './components/DayView';
import GameOverView from './components/GameOverView';
import VoteAnimator from './components/VoteAnimator';

// ── Types ──────────────────────────────────────────────────────────────

interface Player {
  id: string;
  name: string;
  isAlive: boolean;
}

interface RoleInfo {
  roleName: string;
  team: string;
}

interface KilledPlayer {
  playerId: string;
  playerName: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  isGhost: boolean;
}

export interface RevealedRole {
  playerName: string;
  roleName: string;
  team: string;
  isAlive: boolean;
}

type Phase = 'join' | 'lobby' | 'night' | 'day' | 'game_over';

// ── App ────────────────────────────────────────────────────────────────

export default function App() {
  const [phase, setPhase] = useState<Phase>('join');
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [myRole, setMyRole] = useState<RoleInfo | null>(null);
  const [killed, setKilled] = useState<KilledPlayer[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [winner, setWinner] = useState<string | null>(null);
  const [revealedRoles, setRevealedRoles] = useState<RevealedRole[]>([]);
  const [connected, setConnected] = useState(socket.connected);

  // ── Socket.io event listeners with proper cleanup ───────────────────
  // Each useEffect returns a cleanup function that calls socket.off()
  // to prevent duplicate listeners on re-render / HMR.

  useEffect(() => {
    function onConnect() {
      setConnected(true);
    }
    function onDisconnect() {
      setConnected(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  useEffect(() => {
    function onUpdateLobby(data: { players: Player[] }) {
      setPlayers(data.players);
    }

    socket.on('update_lobby', onUpdateLobby);

    return () => {
      socket.off('update_lobby', onUpdateLobby);
    };
  }, []);

  useEffect(() => {
    function onYourRole(data: RoleInfo) {
      setMyRole(data);
    }

    socket.on('your_role', onYourRole);

    return () => {
      socket.off('your_role', onYourRole);
    };
  }, []);

  useEffect(() => {
    function onPhaseChange(data: { phase: string }) {
      if (data.phase === 'night') {
        setPhase('night');
        setKilled([]); // clear previous results
        setVotes({}); // clear previous votes
      } else if (data.phase === 'day') {
        setPhase('day');
        setVotes({}); // ensure clean state
      } else if (data.phase === 'lobby') {
        setPhase('lobby');
        // Clear game state tracking variables on restart
        setMyRole(null);
        setKilled([]);
        setChatMessages([]);
        setVotes({});
        setWinner(null);
        setRevealedRoles([]);
      } else if (data.phase === 'game_over') {
        setPhase('game_over');
      }
    }

    socket.on('phase_change', onPhaseChange);

    return () => {
      socket.off('phase_change', onPhaseChange);
    };
  }, []);

  useEffect(() => {
    function onNightResults(data: { killed: KilledPlayer[] }) {
      setKilled(data.killed);

      // Update player alive status from the killed list
      setPlayers((prev) =>
        prev.map((p) => ({
          ...p,
          isAlive: data.killed.some((k) => k.playerId === p.id)
            ? false
            : p.isAlive,
        }))
      );
    }

    socket.on('night_results', onNightResults);

    return () => {
      socket.off('night_results', onNightResults);
    };
  }, []);

  useEffect(() => {
    function onChatMessage(data: ChatMessage) {
      setChatMessages((prev) => [...prev, data]);
    }
    
    socket.on('chat_message', onChatMessage);
    
    return () => {
      socket.off('chat_message', onChatMessage);
    };
  }, []);

  useEffect(() => {
    function onVoteUpdate(data: { votes: Record<string, number> }) {
      setVotes(data.votes);
    }
    
    socket.on('vote_update', onVoteUpdate);
    
    return () => {
      socket.off('vote_update', onVoteUpdate);
    };
  }, []);

  useEffect(() => {
    function onGameOver(data: { winner: string; revealedRoles: RevealedRole[] }) {
      setWinner(data.winner);
      setRevealedRoles(data.revealedRoles);
    }

    socket.on('game_over', onGameOver);

    return () => {
      socket.off('game_over', onGameOver);
    };
  }, []);

  // ── Callbacks ───────────────────────────────────────────────────────

  const handleJoined = useCallback((code: string, _name: string) => {
    setRoomCode(code);
    setPhase('lobby');
  }, []);

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <VoteAnimator>
      <div className="relative min-h-screen text-white overflow-hidden selection:bg-purple-500/30">
        <Background phase={phase} winner={winner} />

        {/* Connection indicator */}
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              connected ? 'bg-green-400' : 'bg-red-400 animate-pulse-slow'
            }`}
          />
          <span className="text-xs text-slate-500">
            {connected ? 'Connected' : 'Reconnecting...'}
          </span>
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {/* Phase-based views */}
              {phase === 'join' && (
                <JoinView socket={socket} onJoined={handleJoined} />
              )}

              {phase === 'lobby' && (
                <LobbyView
                  socket={socket}
                  roomCode={roomCode}
                  players={players}
                  mySocketId={socket.id ?? ''}
                />
              )}

              {phase === 'night' && myRole && (
                <NightView
                  socket={socket}
                  myRole={myRole}
                  players={players}
                  mySocketId={socket.id ?? ''}
                />
              )}

              {phase === 'day' && (
                <DayView 
                  socket={socket}
                  players={players} 
                  killed={killed}
                  chatMessages={chatMessages}
                  votes={votes}
                  mySocketId={socket.id ?? ''}
                />
              )}

              {phase === 'game_over' && (
                <GameOverView
                  socket={socket}
                  winner={winner}
                  revealedRoles={revealedRoles}
                  isHost={players[0]?.id === socket.id} // First player in lobby is host
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </VoteAnimator>
  );
}
