/**
 * Role Registry — Maps role names to role classes.
 *
 * The engine uses this registry to look up roles by name
 * without importing concrete role files directly.
 *
 * Concrete role imports are isolated HERE in the registry layer,
 * keeping the engine fully decoupled per the architectural guardrails.
 */
const registry = new Map();

/**
 * Register a role class.
 * @param {string} name — The role name (must match the Role subclass name property)
 * @param {Function} RoleClass — The Role subclass constructor
 */
function registerRole(name, RoleClass) {
  if (registry.has(name)) {
    throw new Error(`Role "${name}" is already registered.`);
  }
  registry.set(name, RoleClass);
}

/**
 * Create a role instance by name.
 * @param {string} name
 * @returns {Role}
 */
function createRole(name) {
  const RoleClass = registry.get(name);
  if (!RoleClass) {
    throw new Error(`Role "${name}" is not registered.`);
  }
  return new RoleClass();
}

/**
 * Get all registered role names.
 * @returns {string[]}
 */
function getRegisteredRoles() {
  return Array.from(registry.keys());
}

/**
 * Clear the registry (useful for testing).
 */
function clearRegistry() {
  registry.clear();
}

/**
 * Register all known roles. Called once at server startup.
 * This is the ONLY place concrete role files are imported.
 */
function initializeRoles() {
  const Villager = require('./Villager');
  const Doctor = require('./Doctor');
  const Vigilante = require('./Vigilante');
  const Mafia = require('./Mafia');

  // Guard against double-initialization
  if (registry.size > 0) return;

  registerRole('Villager', Villager);
  registerRole('Doctor', Doctor);
  registerRole('Vigilante', Vigilante);
  registerRole('Mafia', Mafia);
}

module.exports = {
  registerRole,
  createRole,
  getRegisteredRoles,
  clearRegistry,
  initializeRoles,
};
