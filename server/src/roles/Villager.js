/**
 * Villager — A basic village-aligned role with no night ability.
 *
 * team:     'village'
 * priority: 50
 * nightAction: no-op (inherits base class null return)
 */
const Role = require('./Role');

class Villager extends Role {
  constructor() {
    super('Villager', { team: 'village', priority: 50 });
  }

  // nightAction inherited from Role — returns null (no-op)
}

module.exports = Villager;
