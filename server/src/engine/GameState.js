/**
 * GameState — Factory for creating a fresh game state object.
 *
 * The state tracks:
 *   - roomId:      unique identifier for the game room
 *   - phase:       current phase (lobby | night | day | voting)
 *   - players:     dictionary of playerId → player data
 *   - actionQueue: array of pending night actions
 */

/**
 * Create a new game state.
 * @param {string} roomId — Unique room identifier
 * @returns {object} — A fresh game state
 */
function createGameState(roomId) {
  return {
    roomId,
    phase: 'lobby',
    players: {},
    actionQueue: [],
    votes: {},
    settings: {
      mafiaCount: 1,
      hasDoctor: true,
      hasDetective: false,
    },
  };
}

/**
 * Add a player to the game state.
 * @param {object} state — The game state
 * @param {string} playerId
 * @param {string} playerName
 * @param {Role} [role=null] — Optional role assignment
 */
function addPlayer(state, playerId, playerName, role = null) {
  state.players[playerId] = {
    id: playerId,
    name: playerName,
    role,
    isAlive: true,
    isProtected: false,
  };
}

module.exports = { createGameState, addPlayer };
