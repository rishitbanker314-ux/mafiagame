import { useState, useRef, useEffect } from 'react';
import type { Player, KilledPlayer, ChatMessage } from '../App';
import type { Socket } from 'socket.io-client';
import { motion } from 'framer-motion';
import ChatBox from './ChatBox';
import PlayerList from './PlayerList';

interface DayViewProps {
  socket: Socket;
  players: Player[];
  killed: KilledPlayer[];
  chatMessages: ChatMessage[];
  votes: Record<string, number>;
  mySessionId: string;
  phase: 'day_discussion' | 'day_voting';
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function DayView({
  socket,
  players,
  killed,
  chatMessages,
  votes,
  mySessionId,
  phase,
}: DayViewProps) {
  const me = players.find((p) => p.id === mySessionId);
  const isMeAlive = me?.isAlive ?? false;

  const [ripples, setRipples] = useState<string[]>([]);

  useEffect(() => {
    function handleVoteHit(e: Event) {
      const targetId = (e as CustomEvent).detail.targetId;
      setRipples(prev => [...prev, targetId]);
      setTimeout(() => {
        setRipples(prev => prev.filter(id => id !== targetId));
      }, 500); // 500ms ripple duration
    }

    window.addEventListener('voteHit', handleVoteHit);
    return () => window.removeEventListener('voteHit', handleVoteHit);
  }, []);

  function handleSendChat(message: string) {
    if (!isMeAlive) {
      // Dead players can chat (ghost chat) but we just let the server handle it
    }
    socket.emit('send_chat', { message }, (res: { success: boolean; error?: string }) => {
      if (!res.success) {
        console.error('Chat error:', res.error);
      }
    });
  }

  function handleVote(targetId: string) {
    if (phase !== 'day_voting') return;
    
    // Dispatch custom event for the ripple effect on the target player card
    const event = new CustomEvent('voteHit', { detail: { targetId } });
    window.dispatchEvent(event);

    socket.emit('submit_vote', { targetId }, (res: { success: boolean; error?: string }) => {
      if (!res.success) {
        console.error('Vote error:', res.error);
      }
    });
  }

  const isDiscussion = phase === 'day_discussion';

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-4 max-w-lg mx-auto">
      <motion.div
        initial="hidden"
        animate="show"
        className="flex flex-col h-full gap-4"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="text-center shrink-0">
          <h2 className="text-3xl font-bold mb-2">
            {isDiscussion ? 'Discussion Time' : 'Time to Vote'}
          </h2>
          <p className="text-sm text-slate-300">
            {isDiscussion
              ? "Discuss who the mafia might be! Voting is currently disabled."
              : "The floor is open. Cast your vote!"}
          </p>
          {!isMeAlive && (
            <p className="text-sm text-red-400 mt-2 font-medium">
              You are dead. You can chat with other ghosts, but cannot vote.
            </p>
          )}
        </motion.div>

        {/* Night Results (If any) */}
        {killed.length > 0 && (
          <motion.div variants={itemVariants} className="shrink-0 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
            <h3 className="text-red-400 font-bold text-lg mb-1">Night Casualties</h3>
            {killed.map((k, idx) => (
              <p key={idx} className="text-sm text-slate-200">
                <span className="font-semibold text-white">{k.playerName}</span> was eliminated.
              </p>
            ))}
          </motion.div>
        )}
        
        {killed.length === 0 && (
          <motion.div variants={itemVariants} className="shrink-0 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <p className="text-sm text-emerald-400 font-medium">It was a quiet night. Nobody was eliminated.</p>
          </motion.div>
        )}

        {/* Split View: Players (Top), Chat (Bottom) */}
        <div className="flex flex-col gap-4 flex-1 min-h-0">
          
          {/* Players Grid (Scrollable if needed) */}
          <div className="flex-shrink-0">
            <PlayerList 
              players={players}
              mySessionId={mySessionId}
              votes={votes}
              onVote={handleVote}
              disabled={isDiscussion}
              canAct={isMeAlive}
            />
          </div>

          {/* Chat Box (Takes remaining space) */}
          <div className="flex-1 min-h-0">
            <ChatBox 
              chatMessages={chatMessages}
              mySessionId={mySessionId}
              onSendChat={handleSendChat}
            />
          </div>

        </div>
      </motion.div>
    </div>
  );
}
