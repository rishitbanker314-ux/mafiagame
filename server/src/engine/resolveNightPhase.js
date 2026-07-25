/**
 * resolveNightPhase — Resolves all queued night actions.
 *
 * This function is DECOUPLED from specific role behaviors.
 * It does NOT branch on action types or role names.
 *
 * Each action in the queue carries its own execute() closure,
 * which was defined by the role that pushed it. The engine
 * simply sorts and calls execute() — pure polymorphic dispatch.
 *
 * Resolution steps:
 *   1. Sort actionQueue by priority (ascending — lower = first).
 *   2. Call each action's execute(state).
 *   3. Clear the actionQueue.
 *   4. Reset all isProtected flags on players.
 */

/**
 * Resolve the night phase by processing all queued actions.
 * @param {object} state — The mutable game state
 * @returns {Array<object>} — Array of action results
 */
function resolveNightPhase(state) {
  // 1. Sort by priority ascending (stable sort — ties keep insertion order)
  state.actionQueue.sort((a, b) => a.priority - b.priority);

  // 2. Execute each action via its own execute() closure (polymorphic dispatch)
  const results = [];
  for (const action of state.actionQueue) {
    const result = action.execute(state);
    results.push({
      sourceId: action.sourceId,
      targetId: action.targetId,
      type: action.type,
      result,
    });
  }

  // 3. Clear the action queue
  state.actionQueue = [];

  // 4. Reset all isProtected flags
  for (const playerId of Object.keys(state.players)) {
    state.players[playerId].isProtected = false;
  }

  return results;
}

module.exports = { resolveNightPhase };
