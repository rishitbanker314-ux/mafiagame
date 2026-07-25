import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Background from './components/Background';
import socket from './socket';
import JoinView from './components/JoinView';
import LobbyView from './components/LobbyView';
import NightView from './components/NightView';
import DayView from './components/DayView';
import GameOverView from './components/GameOverView';
import RoleReveal from './components/RoleReveal';
import VoteAnimator from './components/VoteAnimator';
import ProgressBar from './components/ProgressBar';

// ── Types ──────────────────────────────────────────────────────────────

export interface Player {
  id: string;
  name: string;
  isAlive: boolean;
  role?: string;
  socketId?: string; // Add socketId for animation tracking
  isBot?: boolean;
  connected?: boolean;
}

export interface Role {
  roleName: string;
  team: string;
  mafiaTeammates?: string[];
}

export interface KilledPlayer {
  playerId: string;
  playerName: string;
  roleName: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  isGhost: boolean;
  isSystem?: boolean;
}

export interface RevealedRole {
  playerName: string;
  roleName: string;
  team: string;
  isAlive: boolean;
}

type Phase = 'join' | 'lobby' | 'night' | 'day_discussion' | 'day_voting' | 'game_over';

export interface GameSettings {
  mafiaCount: number;
  hasDoctor: boolean;
  hasDetective: boolean;
  hasJester: boolean;
}

// ── App ────────────────────────────────────────────────────────────────

export default function App() {
  const [phase, setPhase] = useState<Phase>('join');
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [myRole, setMyRole] = useState<Role | null>(null);
  const [myTeammates, setMyTeammates] = useState<string[]>([]);
  const [showRoleReveal, setShowRoleReveal] = useState(false);
  const [killed, setKilled] = useState<KilledPlayer[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [winner, setWinner] = useState<string | null>(null);
  const [revealedRoles, setRevealedRoles] = useState<RevealedRole[]>([]);
  const [settings, setSettings] = useState<GameSettings>({ mafiaCount: 1, hasDoctor: true, hasDetective: false, hasJester: false });
  const [connected, setConnected] = useState(socket.connected);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // ── Session Initialization ─────────────────────────────────────────────
  
  useEffect(() => {
    let sessionToken = localStorage.getItem('sessionToken');
    if (!sessionToken) {
      sessionToken = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('sessionToken', sessionToken);
    }
  }, []);

  // ── Socket.io event listeners with proper cleanup ───────────────────
  // Each useEffect returns a cleanup function that calls socket.off()
  // to prevent duplicate listeners on re-render / HMR.

  useEffect(() => {
    function onConnect() {
      setConnected(true);
      const roomCode = localStorage.getItem('roomCode');
      const sessionId = localStorage.getItem('sessionToken');
      if (roomCode && sessionId) {
        socket.emit('reconnect_session', { roomCode, sessionId }, (res: any) => {
          if (res.success && res.gameState) {
            setRoomCode(roomCode);
            setPhase(res.gameState.phase);
            setPlayers(res.gameState.players);
            if (res.gameState.settings) setSettings(res.gameState.settings);
            if (res.gameState.myRole) {
              setMyRole(res.gameState.myRole);
              if (res.gameState.myRole.mafiaTeammates) {
                setMyTeammates(res.gameState.myRole.mafiaTeammates);
              }
            }
            if (res.gameState.votes) setVotes(res.gameState.votes);
            if (res.gameState.winner) setWinner(res.gameState.winner);
            if (res.gameState.timerLeft) setTimeLeft(res.gameState.timerLeft);
          } else {
            localStorage.removeItem('roomCode');
          }
        });
      }
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
    function onUpdateLobby(data: { players: Player[], settings?: GameSettings }) {
      setPlayers(data.players);
      if (data.settings) setSettings(data.settings);
    }

    socket.on('update_lobby', onUpdateLobby);

    return () => {
      socket.off('update_lobby', onUpdateLobby);
    };
  }, []);

  useEffect(() => {
    function onYourRole(data: Role) {
      setMyRole(data);
      if (data.mafiaTeammates) {
        setMyTeammates(data.mafiaTeammates);
      }
      setShowRoleReveal(true);
    }

    socket.on('your_role', onYourRole);

    return () => {
      socket.off('your_role', onYourRole);
    };
  }, []);

  useEffect(() => {
    function onPhaseChange(data: { phase: Phase }) {
      setPhase(data.phase);
      if (data.phase === 'night') {
        setKilled([]); // clear previous results
        setVotes({}); // clear previous votes
      } else if (data.phase === 'day_discussion' || data.phase === 'day_voting') {
        setVotes({}); // ensure clean state
      } else if (data.phase === 'lobby') {
        // Clear game state tracking variables on restart
        setMyRole(null);
        setMyTeammates([]);
        setKilled([]);
        setChatMessages([]);
        setVotes({});
        setWinner(null);
        setRevealedRoles([]);
      } else if (data.phase === 'game_over') {
        setTimeLeft(null);
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
    function onInvestigationResult(data: { targetId: string, team: string }) {
      const targetName = players.find((p) => p.id === data.targetId)?.name || 'Unknown';
      setChatMessages((prev) => [
        ...prev,
        {
          id: `investigation-${Date.now()}`,
          senderId: 'system',
          senderName: 'System',
          text: `Your investigation revealed that ${targetName} is aligned with the ${data.team}.`,
          isGhost: false,
          isSystem: true,
        }
      ]);
    }
    
    socket.on('investigation_result', onInvestigationResult);
    
    return () => {
      socket.off('investigation_result', onInvestigationResult);
    };
  }, [players]);

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

  useEffect(() => {
    function onTimerTick(data: { timeLeft: number }) {
      setTimeLeft(data.timeLeft);
    }

    socket.on('timer_tick', onTimerTick);

    return () => {
      socket.off('timer_tick', onTimerTick);
    };
  }, []);

  // ── Callbacks ───────────────────────────────────────────────────────

  const handleJoined = useCallback((code: string, _name: string) => {
    setRoomCode(code);
    localStorage.setItem('roomCode', code);
    setPhase('lobby');
  }, []);

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <VoteAnimator>
      <div className="relative min-h-screen text-white overflow-hidden selection:bg-purple-500/30">
        <Background phase={phase} winner={winner} />
        
        {timeLeft !== null && (phase === 'day_discussion' || phase === 'day_voting' || phase === 'night') && (
          <ProgressBar timeLeft={timeLeft} maxTime={60} />
        )}

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

        {showRoleReveal && myRole && (
          <div className="absolute inset-0 z-50">
            <RoleReveal 
              roleName={myRole.roleName} 
              onAcknowledge={() => setShowRoleReveal(false)} 
            />
          </div>
        )}

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
                  settings={settings}
                  mySessionId={localStorage.getItem('sessionToken') ?? ''}
                />
              )}

              {phase === 'night' && myRole && (
                <NightView
                  socket={socket}
                  myRole={myRole}
                  players={players}
                  mySessionId={localStorage.getItem('sessionToken') ?? ''}
                  myTeammates={myTeammates}
                />
              )}

              {(phase === 'day_discussion' || phase === 'day_voting') && (
                <DayView 
                  socket={socket}
                  players={players} 
                  killed={killed}
                  chatMessages={chatMessages}
                  votes={votes}
                  mySessionId={localStorage.getItem('sessionToken') ?? ''}
                  phase={phase}
                  myTeammates={myTeammates}
                />
              )}

              {phase === 'game_over' && (
                <GameOverView
                  socket={socket}
                  winner={winner}
                  revealedRoles={revealedRoles}
                  isHost={players.length > 0 ? (players[0].id === localStorage.getItem('sessionToken')) : false}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </VoteAnimator>
  );
}
