const { checkWinCondition } = require('./checkWinCondition');

/**
 * Handle game over evaluation and broadcast if a win condition is met.
 * @param {import('socket.io').Server} io
 * @param {string} roomCode
 * @param {object} state
 * @returns {boolean} true if game over
 */
function handleWinCondition(io, roomCode, state) {
  const result = checkWinCondition(state);
  if (result.gameOver) {
    state.phase = 'game_over';
    const revealedRoles = Object.keys(state.players).map((pid) => {
      const p = state.players[pid];
      return {
        playerName: p.name,
        roleName: p.role ? p.role.name : 'Unknown',
        team: p.role ? p.role.team : 'neutral',
        isAlive: p.isAlive,
      };
    });

    io.to(roomCode).emit('phase_change', { phase: 'game_over' });
    io.to(roomCode).emit('game_over', {
      winner: result.winner,
      revealedRoles,
    });
    console.log(`[Room ${roomCode}] Game Over! Winner: ${result.winner}`);
    return true;
  }
  return false;
}

/**
 * Determine which players need to submit an action tonight.
 * Only alive players whose roles have `canActAtNight()` returning true.
 *
 * @param {object} state - Game state
 * @returns {Set<string>} - Set of player IDs
 */
function computePendingActions(state) {
  const pending = new Set();
  for (const pid of Object.keys(state.players)) {
    const player = state.players[pid];
    if (player.isAlive && player.role && player.role.canActAtNight()) {
      pending.add(pid);
    }
  }
  return pending;
}

module.exports = {
  handleWinCondition,
  computePendingActions
};
