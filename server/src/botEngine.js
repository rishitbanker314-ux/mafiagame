const { resolveNightPhase } = require('./engine/resolveNightPhase');
const { handleWinCondition, computePendingActions } = require('./engine/gameHelpers');
const { getPlayerList } = require('./rooms');
const { startPhaseTimer, clearPhaseTimer } = require('./engine/timerEngine');

/**
 * Simulates Night Phase actions for all alive bots.
 */
function simulateBotNightActions(io, roomCode, state) {
  const aliveBots = Object.values(state.players).filter(p => p.isAlive && p.isBot);
  
  aliveBots.forEach(bot => {
    if (!bot.role) return;

    if (bot.role.canActAtNight()) {
      const targetId = bot.role.getBotNightTarget(bot.id, state);
      
      // We simulate a delay so it feels like they are thinking
      const thinkTime = Math.random() * 2000 + 1000; // 1-3 seconds
      
      setTimeout(() => {
        // Double check they are still in the night phase
        if (state.phase !== 'night') return;
        
        // Remove them from pending actions
        if (state.pendingActions && state.pendingActions.has(bot.id)) {
          state.pendingActions.delete(bot.id);
          
          if (targetId) {
            const action = bot.role.nightAction(bot.id, targetId, state);
            if (action) {
              console.log(`[Room ${roomCode}] Bot ${bot.name} submitted night action.`);
            }
          }
          
          if (state.pendingActions.size === 0) {
            const { resolveNightAndTransition } = require('./engine/gameLoop');
            resolveNightAndTransition(io, roomCode, state);
          }
        }
      }, thinkTime);
    } else {
      // Role can't act at night, just remove from pending
      if (state.pendingActions) {
        state.pendingActions.delete(bot.id);
      }
    }
  });
}

/**
 * Simulates Day Phase voting for all alive bots.
 */
function simulateBotDayActions(io, roomCode, state) {
  const aliveBots = Object.values(state.players).filter(p => p.isAlive && p.isBot);
  
  aliveBots.forEach(bot => {
    // Bots take longer to vote (3-10 seconds)
    const thinkTime = Math.random() * 7000 + 3000;
    
    setTimeout(() => {
      // Double check they are still alive and it's day phase
      if (state.phase !== 'day_voting' || !bot.isAlive) return;

      const validTargets = Object.values(state.players).filter(p => p.isAlive && p.id !== bot.id);
      if (validTargets.length === 0) return;
      
      const target = validTargets[Math.floor(Math.random() * validTargets.length)];
      
      // Record vote
      state.votes[bot.id] = target.id;

      // Broadcast vote update
      const voteCounts = {};
      for (const vId of Object.keys(state.votes)) {
        const tId = state.votes[vId];
        voteCounts[tId] = (voteCounts[tId] || 0) + 1;
      }

      io.to(roomCode).emit('vote_update', { 
        voterId: bot.id,
        targetId: target.id,
        votes: voteCounts 
      });

      console.log(`[Room ${roomCode}] Bot ${bot.name} voted for ${target.name}`);

      // Check for majority
      const alivePlayersCount = Object.values(state.players).filter((p) => p.isAlive).length;
      const majorityThreshold = Math.floor(alivePlayersCount / 2);

      let votedOutId = null;
      for (const tId of Object.keys(voteCounts)) {
        if (voteCounts[tId] > majorityThreshold) {
          votedOutId = tId;
          break;
        }
      }

      if (votedOutId) {
        clearPhaseTimer(state);
        const votedOutPlayer = state.players[votedOutId];
        console.log(`[Room ${roomCode}] ${votedOutPlayer.name} was voted out.`);

        io.to(roomCode).emit('chat_message', {
          id: Math.random().toString(36).substr(2, 9),
          senderId: 'system',
          senderName: 'System',
          text: `${votedOutPlayer.name} was voted out by the town.`,
          isGhost: false,
          isSystem: true
        });

        votedOutPlayer.role.onVotedOut(state);
        votedOutPlayer.isAlive = false;

        state.votes = {};
        
        io.to(roomCode).emit('update_lobby', { players: getPlayerList(state) });

        if (handleWinCondition(io, roomCode, state)) {
          return;
        }

        setTimeout(() => {
          state.phase = 'night';
          state.pendingActions = computePendingActions(state);
          io.to(roomCode).emit('phase_change', { phase: 'night' });
          
          startPhaseTimer(io, roomCode, state, 60, () => {}); // Dummy timer for now
          
          // Trigger night bots!
          simulateBotNightActions(io, roomCode, state);
          
        }, 2500);
      }
    }, thinkTime);
  });
}

module.exports = {
  simulateBotNightActions,
  simulateBotDayActions
};
