/**
 * Timer Engine — Manages phase timers for rooms.
 */

/**
 * Clear the current phase timer if one exists.
 * @param {object} state — The game state
 */
function clearPhaseTimer(state) {
  if (state.timerInfo && state.timerInfo.intervalId) {
    clearInterval(state.timerInfo.intervalId);
    state.timerInfo = null;
  }
}

/**
 * Start a timer for the given phase.
 * @param {import('socket.io').Server} io
 * @param {string} roomCode
 * @param {object} state
 * @param {number} duration — in seconds
 * @param {Function} onComplete — Called when the timer reaches 0
 */
function startPhaseTimer(io, roomCode, state, duration, onComplete) {
  clearPhaseTimer(state);

  let timeLeft = duration;
  
  // Immediately emit first tick
  io.to(roomCode).emit('timer_tick', { timeLeft });

  const intervalId = setInterval(() => {
    timeLeft -= 1;
    
    io.to(roomCode).emit('timer_tick', { timeLeft });

    if (timeLeft <= 0) {
      clearPhaseTimer(state);
      if (onComplete) onComplete();
    }
  }, 1000);

  state.timerInfo = { intervalId, timeLeft };
}

module.exports = { startPhaseTimer, clearPhaseTimer };
