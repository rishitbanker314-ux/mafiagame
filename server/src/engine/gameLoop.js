const { resolveNightPhase } = require('./resolveNightPhase');
const { handleWinCondition, computePendingActions } = require('./gameHelpers');
const { startPhaseTimer, clearPhaseTimer } = require('./timerEngine');
const botEngine = require('../botEngine');

function resolveNightAndTransition(io, roomCode, state) {
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

  state.phase = 'day_discussion';
  io.to(roomCode).emit('phase_change', { phase: 'day_discussion' });
  
  startPhaseTimer(io, roomCode, state, 90, () => {
    state.phase = 'day_voting';
    io.to(roomCode).emit('phase_change', { phase: 'day_voting' });
    
    botEngine.simulateBotDayActions(io, roomCode, state);

    startPhaseTimer(io, roomCode, state, 30, () => {
      forceDayResolution(io, roomCode, state);
    });
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
  }, 500);
}

function forceDayResolution(io, roomCode, state) {
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
    
    startPhaseTimer(io, roomCode, state, 60, () => {
      resolveNightAndTransition(io, roomCode, state);
    });
    
    botEngine.simulateBotNightActions(io, roomCode, state);
  }, 2500);
}

module.exports = {
  resolveNightAndTransition,
  forceDayResolution
};
