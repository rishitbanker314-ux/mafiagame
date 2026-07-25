/**
 * GameEngine — Core game state machine.
 *
 * Manages phases, players, and night action resolution.
 * This module is DECOUPLED from specific role implementations.
 * It depends only on the abstract Role interface (name, priority, nightAction).
 */
const ActionQueue = require('./ActionQueue');

const PHASES = {
  LOBBY: 'lobby',
  NIGHT: 'night',
  DAY: 'day',
  VOTE: 'vote',
  END: 'end',
};

class GameEngine {
  constructor() {
    this.phase = PHASES.LOBBY;
    this.players = new Map(); // playerId -> { id, name, role, isAlive }
    this.actionQueue = new ActionQueue();
    this.round = 0;
  }

  /**
   * Add a player to the game.
   * @param {string} playerId
   * @param {string} playerName
   */
  addPlayer(playerId, playerName) {
    if (this.phase !== PHASES.LOBBY) {
      throw new Error('Can only add players during the lobby phase.');
    }
    this.players.set(playerId, {
      id: playerId,
      name: playerName,
      role: null,
      isAlive: true,
    });
  }

  /**
   * Assign a role to a player. Role must implement the Role interface.
   * @param {string} playerId
   * @param {Role} role — An instance of a Role subclass
   */
  assignRole(playerId, role) {
    const player = this.players.get(playerId);
    if (!player) throw new Error(`Player ${playerId} not found.`);
    player.role = role;
  }

  /**
   * Transition to the next phase.
   */
  nextPhase() {
    const transitions = {
      [PHASES.LOBBY]: PHASES.NIGHT,
      [PHASES.NIGHT]: PHASES.DAY,
      [PHASES.DAY]: PHASES.VOTE,
      [PHASES.VOTE]: PHASES.NIGHT,
    };

    const next = transitions[this.phase];
    if (!next) throw new Error(`Cannot transition from phase: ${this.phase}`);

    if (this.phase === PHASES.LOBBY) {
      this.round = 1;
    } else if (next === PHASES.NIGHT) {
      this.round += 1;
    }

    this.phase = next;
  }

  /**
   * Submit a night action for a player.
   * @param {string} playerId
   * @param {string} targetId
   */
  submitNightAction(playerId, targetId) {
    if (this.phase !== PHASES.NIGHT) {
      throw new Error('Night actions can only be submitted during the night phase.');
    }

    const player = this.players.get(playerId);
    if (!player) throw new Error(`Player ${playerId} not found.`);
    if (!player.isAlive) throw new Error(`Player ${playerId} is not alive.`);
    if (!player.role) throw new Error(`Player ${playerId} has no assigned role.`);

    this.actionQueue.push({
      playerId,
      role: player.role,
      targetId,
    });
  }

  /**
   * Resolve all queued night actions in priority order.
   * @returns {Array<object>} — Array of action results
   */
  resolveNightActions() {
    const gameState = this.getState();
    return this.actionQueue.resolve(gameState);
  }

  /**
   * Get a serializable snapshot of the current game state.
   * @returns {object}
   */
  getState() {
    const players = {};
    for (const [id, player] of this.players) {
      players[id] = {
        id: player.id,
        name: player.name,
        roleName: player.role ? player.role.name : null,
        isAlive: player.isAlive,
      };
    }
    return {
      phase: this.phase,
      round: this.round,
      players,
    };
  }

  /**
   * End the game.
   */
  endGame() {
    this.phase = PHASES.END;
  }
}

module.exports = { GameEngine, PHASES };
