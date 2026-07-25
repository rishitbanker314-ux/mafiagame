/**
 * Checks the win conditions for the game.
 * 
 * @param {object} state - The game state
 * @returns {object} { gameOver: boolean, winner: string | null }
 */
function checkWinCondition(state) {
  if (state.winner) {
    return { gameOver: true, winner: state.winner };
  }

  let mafiaCount = 0;
  let villageCount = 0;

  for (const pid of Object.keys(state.players)) {
    const player = state.players[pid];
    if (player.isAlive && player.role) {
      if (player.role.team === 'mafia') {
        mafiaCount++;
      } else if (player.role.team === 'village') {
        villageCount++;
      }
    }
  }

  if (mafiaCount === 0) {
    return { gameOver: true, winner: 'village' };
  }

  if (mafiaCount >= villageCount) {
    return { gameOver: true, winner: 'mafia' };
  }

  return { gameOver: false, winner: null };
}

module.exports = { checkWinCondition };
