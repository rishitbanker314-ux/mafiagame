import React from 'react';
import type { Player } from '../App';
import PlayerCard from './PlayerCard';
import { motion } from 'framer-motion';

interface PlayerListProps {
  players: Player[];
  mySessionId: string;
  votes: Record<string, number>;
  onVote: (targetId: string) => void;
  disabled: boolean;
  canAct: boolean;
}

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const PlayerList = React.memo(function PlayerList({ players, mySessionId, votes, onVote, disabled, canAct }: PlayerListProps) {
  return (
    <motion.div 
      variants={listVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 sm:grid-cols-3 gap-4"
    >
      {players.map((player) => {
        const voteCount = votes[player.id] || 0;
        return (
          <PlayerCard
            key={player.id}
            player={player}
            isMe={player.id === mySessionId}
            voteCount={voteCount}
            onAction={onVote}
            disabled={disabled || !canAct || !player.isAlive || player.id === mySessionId}
            actionLabel={disabled ? "Waiting..." : "Vote"}
          />
        );
      })}
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Simple equality for simple props
  if (prevProps.mySessionId !== nextProps.mySessionId || prevProps.disabled !== nextProps.disabled || prevProps.canAct !== nextProps.canAct) return false;
  
  // Players array length change or object identity change
  if (prevProps.players !== nextProps.players) return false;

  // Votes object identity change (we can just check if they are identical refs, since we create a new object on update)
  if (prevProps.votes !== nextProps.votes) return false;

  return true;
});

export default PlayerList;
