/**
 * Role — Abstract base class for all game roles (Strategy Pattern).
 *
 * Every role MUST extend this class and override nightAction().
 *
 * Defaults:
 *   - team: 'neutral'
 *   - priority: 50 (lower = resolved earlier in the night phase queue)
 */
class Role {
  /**
   * @param {string} name — Human-readable role name (e.g., "Mafia", "Doctor")
   * @param {object} [options]
   * @param {string} [options.team='neutral'] — The faction this role belongs to
   * @param {number} [options.priority=50] — Night phase resolution priority (lower = first)
   */
  constructor(name, { team = 'neutral', priority = 50 } = {}) {
    if (new.target === Role) {
      throw new Error('Role is abstract and cannot be instantiated directly.');
    }

    if (typeof name !== 'string' || name.trim() === '') {
      throw new Error('Role name must be a non-empty string.');
    }

    if (typeof priority !== 'number' || !Number.isInteger(priority)) {
      throw new Error('Role priority must be an integer.');
    }

    this.name = name;
    this.team = team;
    this.priority = priority;
  }

  /**
   * Perform this role's night action. Subclasses override this to
   * mutate gameState (e.g., protect a player, kill a player).
   *
   * The base implementation returns null (no-op).
   *
   * @param {string} sourceId — The ID of the player performing the action
   * @param {string} targetId — The ID of the targeted player
   * @param {object} state — The mutable game state
   * @returns {object|null} — An action result, or null for no-op
   */
  nightAction(sourceId, targetId, state) {
    return null;
  }

  /**
   * Whether this role has an active night ability.
   * Subclasses with night actions override this to return true.
   * Used by the engine to track pending night submissions.
   *
   * @returns {boolean}
   */
  canActAtNight() {
    return false;
  }

  /**
   * Hook called when this player is voted out during the day phase.
   * By default, it does nothing.
   * @param {object} state — The mutable game state
   */
  onVotedOut(state) {
    // No-op by default
  }

  /**
   * Called by the Bot Engine to determine the target for a bot during the Night phase.
   * Concrete roles with night actions should override this.
   * 
   * @param {string} botId - The ID of the bot executing the action.
   * @param {object} state - The current game state.
   * @returns {string|null} - The target player ID, or null if no valid target.
   */
  getBotNightTarget(botId, state) {
    return null;
  }
}

module.exports = Role;
