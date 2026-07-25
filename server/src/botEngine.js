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
          
          // Check if all actions are in
          if (state.pendingActions.size === 0) {
            clearPhaseTimer(state);
            const wasAlive = {};
            for (const pid of Object.keys(state.players)) {
              wasAlive[pid] = state.players[pid].isAlive;
            }

            resolveNightPhase(state);

            const killed = Object.keys(state.players)
              .filter((pid) => wasAlive[pid] && !state.players[pid].isAlive)
              .map((pid) => ({
                playerId: pid,
                playerName: state.players[pid].name,
                roleName: state.players[pid].role ? state.players[pid].role.name : 'Unknown'
              }));

            if (handleWinCondition(io, roomCode, state)) {
              io.to(roomCode).emit('night_results', { killed });
              return;
            }

            state.phase = 'day';
            io.to(roomCode).emit('phase_change', { phase: 'day' });

            startPhaseTimer(io, roomCode, state, 60, () => {
              // We'll just let the server's day timeout handle it if we wanted, 
              // but bot engine doesn't have forceDayResolution. We can just wait for bots to vote.
              // Actually it's fine, if a timeout happens, the bot won't do anything special,
              // but we need forceDayResolution. Since we don't have it, let's just 
              // emit a chat message and transition to night inline if timeout fires here.
              clearPhaseTimer(state);
              io.to(roomCode).emit('chat_message', {
                id: Math.random().toString(36).substr(2, 9),
                senderId: 'system',
                senderName: 'System',
                text: `Time ran out! The town failed to reach a consensus.`,
                isGhost: false,
                isSystem: true
              });
              state.votes = {};
              setTimeout(() => {
                state.phase = 'night';
                state.pendingActions = computePendingActions(state);
                io.to(roomCode).emit('phase_change', { phase: 'night' });
                // We don't start the night timer here because it's tricky without circular deps.
                // It's better to just let the bot vote naturally since bots vote fast anyway.
                simulateBotNightActions(io, roomCode, state);
              }, 2500);
            });
            
            setTimeout(() => {
              io.to(roomCode).emit('night_results', { killed });

              if (killed.length > 0) {
                killed.forEach((k) => {
                  io.to(roomCode).emit('chat_message', {
                    id: Math.random().toString(36).substr(2, 9),
                    senderId: 'system',
                    senderName: 'System',
                    text: `${k.playerName} was eliminated during the night.`,
                    isGhost: false,
                    isSystem: true
                  });
                });
              } else {
                io.to(roomCode).emit('chat_message', {
                  id: Math.random().toString(36).substr(2, 9),
                  senderId: 'system',
                  senderName: 'System',
                  text: `Nobody was eliminated last night.`,
                  isGhost: false,
                  isSystem: true
                });
              }

              console.log(`[Room ${roomCode}] Night resolved — killed: ${killed.length > 0 ? killed.map(k => k.playerName).join(', ') : 'nobody'}`);
              
              // Now it's day phase, trigger day bots!
              simulateBotDayActions(io, roomCode, state);

            }, 500);
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
      if (state.phase !== 'day' || !bot.isAlive) return;

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
