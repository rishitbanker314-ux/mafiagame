const { GameEngine, PHASES } = require('../../src/engine/GameEngine');

// Stub role following the new interface (name, team, priority, nightAction)
const makeRole = (name, priority, actionFn) => ({
  name,
  team: 'neutral',
  priority,
  nightAction: actionFn || ((sourceId, targetId, state) => ({ action: name, targetId })),
});

describe('GameEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new GameEngine();
  });

  describe('Lobby phase', () => {
    it('starts in the lobby phase', () => {
      expect(engine.phase).toBe(PHASES.LOBBY);
    });

    it('can add players during lobby', () => {
      engine.addPlayer('p1', 'Alice');
      engine.addPlayer('p2', 'Bob');
      const state = engine.getState();
      expect(Object.keys(state.players)).toHaveLength(2);
    });

    it('rejects adding players outside lobby', () => {
      engine.addPlayer('p1', 'Alice');
      engine.assignRole('p1', makeRole('TestRole', 1));
      engine.nextPhase(); // → night
      expect(() => engine.addPlayer('p2', 'Bob')).toThrow(
        'Can only add players during the lobby phase.'
      );
    });
  });

  describe('Phase transitions', () => {
    beforeEach(() => {
      engine.addPlayer('p1', 'Alice');
      engine.assignRole('p1', makeRole('TestRole', 1));
    });

    it('transitions lobby → night → day → vote → night', () => {
      engine.nextPhase();
      expect(engine.phase).toBe(PHASES.NIGHT);
      expect(engine.round).toBe(1);

      engine.nextPhase();
      expect(engine.phase).toBe(PHASES.DAY);

      engine.nextPhase();
      expect(engine.phase).toBe(PHASES.VOTE);

      engine.nextPhase();
      expect(engine.phase).toBe(PHASES.NIGHT);
      expect(engine.round).toBe(2);
    });

    it('cannot transition from END', () => {
      engine.endGame();
      expect(() => engine.nextPhase()).toThrow();
    });
  });

  describe('Night actions', () => {
    beforeEach(() => {
      engine.addPlayer('p1', 'Alice');
      engine.addPlayer('p2', 'Bob');
      engine.assignRole('p1', makeRole('Attacker', 3, (sid, tid, gs) => ({ killed: tid })));
      engine.assignRole('p2', makeRole('Healer', 1, (sid, tid, gs) => ({ healed: tid })));
      engine.nextPhase(); // → night
    });

    it('accepts night actions during night phase', () => {
      engine.submitNightAction('p1', 'p2');
      expect(engine.actionQueue.length).toBe(1);
    });

    it('rejects night actions outside night phase', () => {
      engine.nextPhase(); // → day
      expect(() => engine.submitNightAction('p1', 'p2')).toThrow(
        'Night actions can only be submitted during the night phase.'
      );
    });

    it('resolves actions in priority order', () => {
      engine.submitNightAction('p1', 'p2'); // Attacker, priority 3
      engine.submitNightAction('p2', 'p1'); // Healer, priority 1

      const results = engine.resolveNightActions();

      expect(results[0].role).toBe('Healer');
      expect(results[1].role).toBe('Attacker');
    });
  });

  describe('Role assignment', () => {
    it('assigns a role to a player', () => {
      engine.addPlayer('p1', 'Alice');
      const role = makeRole('Detective', 1);
      engine.assignRole('p1', role);

      const state = engine.getState();
      expect(state.players['p1'].roleName).toBe('Detective');
    });

    it('throws for unknown player', () => {
      expect(() => engine.assignRole('unknown', makeRole('X', 1))).toThrow(
        'Player unknown not found.'
      );
    });
  });
});
