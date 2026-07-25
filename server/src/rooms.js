/**
 * Rooms — Manages per-room game state, scoped so games don't overlap.
 *
 * Each room is a gameState object (from GameState.js) extended with:
 *   - hostId: socket ID of the room creator
 *   - pendingActions: Set of player IDs that still owe a night action
 */
const { createGameState, addPlayer } = require('./engine/GameState');

/** @type {Map<string, object>} roomCode → gameState */
const rooms = new Map();

/**
 * Generate a random 4-letter uppercase room code.
 * Retries if the code is already in use.
 * @returns {string}
 */
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code;
  do {
    code = '';
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (rooms.has(code));
  return code;
}

/**
 * Create a new room and add the host as the first player.
 * @param {string} hostSocketId
 * @param {string} hostName
 * @returns {{ code: string, state: object }}
 */
function createRoomState(hostSocketId, hostName) {
  const code = generateRoomCode();
  const state = createGameState(code);
  addPlayer(state, hostSocketId, hostName);
  state.hostId = hostSocketId;
  state.pendingActions = new Set();
  rooms.set(code, state);
  return { code, state };
}

/**
 * Join an existing room.
 * @param {string} code — Room code
 * @param {string} socketId
 * @param {string} playerName
 * @returns {object} — The room's game state
 */
function joinRoomState(code, socketId, playerName) {
  const state = rooms.get(code);
  if (!state) throw new Error(`Room ${code} not found.`);
  if (state.phase !== 'lobby') throw new Error('Game already in progress.');
  addPlayer(state, socketId, playerName);
  return state;
}

/**
 * Get a room's state by code.
 * @param {string} code
 * @returns {object|null}
 */
function getRoom(code) {
  return rooms.get(code) || null;
}

/**
 * Get a sanitized player list (safe for broadcast — no role info).
 * @param {object} state
 * @returns {Array<{ id: string, name: string, isAlive: boolean }>}
 */
function getPlayerList(state) {
  return Object.values(state.players).map((p) => ({
    id: p.id,
    name: p.name,
    isAlive: p.isAlive,
  }));
}

module.exports = {
  rooms,
  generateRoomCode,
  createRoomState,
  joinRoomState,
  getRoom,
  getPlayerList,
};
