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
      hasJester: false,
      discussionTime: 60,
    },
    timerInfo: null,
  };
}

/**
 * Add a player to the game state.
 * @param {object} state — The game state
 * @param {string} playerId — This is now the sessionToken
 * @param {string} playerName
 * @param {string} socketId — The current socket connection ID
 * @param {Role} [role=null] — Optional role assignment
 */
function addPlayer(state, playerId, playerName, socketId, role = null) {
  state.players[playerId] = {
    id: playerId,
    name: playerName,
    socketId,
    role,
    isAlive: true,
    isProtected: false,
    connected: true,
  };
}

module.exports = { createGameState, addPlayer };
