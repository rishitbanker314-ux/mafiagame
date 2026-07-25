/**
 * ActionQueue — Priority-based night action resolution.
 *
 * Actions are pushed during the night phase and resolved at phase end,
 * sorted strictly by role priority (ascending — lower number first).
 * Ties are resolved by insertion order (stable sort).
 */
class ActionQueue {
  constructor() {
    this.actions = [];
  }

  /**
   * Push a night action onto the queue.
   * @param {object} action — { playerId, role, targetId }
   */
  push(action) {
    if (!action || !action.role || typeof action.role.priority !== 'number') {
      throw new Error('Action must include a role with a numeric priority.');
    }
    this.actions.push(action);
  }

  /**
   * Resolve all queued actions in priority order.
   * @param {object} gameState — The current game state (mutated in place)
   * @returns {Array<object>} — Array of action results
   */
  resolve(gameState) {
    // Stable sort by priority (ascending)
    const sorted = [...this.actions].sort((a, b) => a.role.priority - b.role.priority);

    const results = [];
    for (const action of sorted) {
      const result = action.role.nightAction(gameState, action.targetId);
      results.push({
        playerId: action.playerId,
        role: action.role.name,
        targetId: action.targetId,
        result,
      });
    }

    // Clear the queue after resolution
    this.actions = [];

    return results;
  }

  /**
   * Get the number of queued actions.
   * @returns {number}
   */
  get length() {
    return this.actions.length;
  }

  /**
   * Clear all queued actions without resolving.
   */
  clear() {
    this.actions = [];
  }
}

module.exports = ActionQueue;
