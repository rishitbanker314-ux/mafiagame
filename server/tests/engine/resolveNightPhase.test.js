const Role = require('../../src/roles/Role');
const { createGameState, addPlayer } = require('../../src/engine/GameState');
const { resolveNightPhase } = require('../../src/engine/resolveNightPhase');

// ── Imported concrete roles ─────────────────────────────────────────────
const Villager = require('../../src/roles/Villager');
const Doctor = require('../../src/roles/Doctor');
const Vigilante = require('../../src/roles/Vigilante');

// ── Inline test stubs (same pattern: push action with execute()) ────────

class ProtectorStub extends Role {
  constructor() {
    super('ProtectorStub', { team: 'town', priority: 20 });
  }

  nightAction(sourceId, targetId, state) {
    state.actionQueue.push({
      type: 'protect',
      sourceId,
      targetId,
      priority: this.priority,
      execute(s) {
        s.players[targetId].isProtected = true;
        return { type: 'protect', targetId };
      },
    });
  }
}

class KillerStub extends Role {
  constructor() {
    super('KillerStub', { team: 'mafia', priority: 30 });
  }

  nightAction(sourceId, targetId, state) {
    state.actionQueue.push({
      type: 'kill',
      sourceId,
      targetId,
      priority: this.priority,
      execute(s) {
        if (!s.players[targetId].isProtected) {
          s.players[targetId].isAlive = false;
        }
        return { type: 'kill', targetId, blocked: s.players[targetId].isProtected };
      },
    });
  }
}

// ── Unit tests ──────────────────────────────────────────────────────────

describe('resolveNightPhase', () => {
  let state;

  beforeEach(() => {
    state = createGameState('room-1');
    addPlayer(state, 'doctor', 'Dr. Smith');
    addPlayer(state, 'mafioso', 'Don Corleone');
    addPlayer(state, 'victim', 'Alice');
  });

  it('resolves actions sorted by priority (ascending)', () => {
    const killer = new KillerStub();     // priority 30
    const protector = new ProtectorStub(); // priority 20

    // Push kill FIRST — but protector has lower priority (20 < 30)
    killer.nightAction('mafioso', 'victim', state);
    protector.nightAction('doctor', 'victim', state);

    resolveNightPhase(state);

    // Target survives because protect (20) resolved before kill (30)
    expect(state.players['victim'].isAlive).toBe(true);
  });

  it('kill succeeds when target is not protected', () => {
    const killer = new KillerStub();

    killer.nightAction('mafioso', 'victim', state);
    resolveNightPhase(state);

    expect(state.players['victim'].isAlive).toBe(false);
  });

  it('clears the action queue after resolution', () => {
    const protector = new ProtectorStub();

    protector.nightAction('doctor', 'victim', state);
    resolveNightPhase(state);

    expect(state.actionQueue).toHaveLength(0);
  });

  it('resets all isProtected flags after resolution', () => {
    const protector = new ProtectorStub();

    protector.nightAction('doctor', 'victim', state);
    resolveNightPhase(state);

    expect(state.players['victim'].isProtected).toBe(false);
    expect(state.players['doctor'].isProtected).toBe(false);
    expect(state.players['mafioso'].isProtected).toBe(false);
  });

  it('returns results in resolution order', () => {
    const killer = new KillerStub();
    const protector = new ProtectorStub();

    killer.nightAction('mafioso', 'victim', state);
    protector.nightAction('doctor', 'victim', state);

    const results = resolveNightPhase(state);

    // Protector resolved first (priority 20), Killer second (priority 30)
    expect(results[0].type).toBe('protect');
    expect(results[1].type).toBe('kill');
  });

  it('handles an empty action queue gracefully', () => {
    const results = resolveNightPhase(state);

    expect(results).toEqual([]);
    expect(state.actionQueue).toHaveLength(0);
  });
});

// ── Custom Roles Integration ────────────────────────────────────────────

describe('Custom Roles Integration', () => {
  let state;

  beforeEach(() => {
    state = createGameState('integration-room');
    addPlayer(state, 'doc-player', 'Dr. House');
    addPlayer(state, 'vig-player', 'The Vigilante');
    addPlayer(state, 'vil-player', 'Innocent Villager');

    // Assign concrete role instances to players
    state.players['doc-player'].role = new Doctor();
    state.players['vig-player'].role = new Vigilante();
    state.players['vil-player'].role = new Villager();
  });

  it('villager survives when doctor protects and vigilante kills the same target', () => {
    const doctor = state.players['doc-player'].role;
    const vigilante = state.players['vig-player'].role;

    // Doctor protects the villager (priority 20 → resolves first)
    doctor.nightAction('doc-player', 'vil-player', state);

    // Vigilante targets the same villager (priority 30 → resolves second)
    vigilante.nightAction('vig-player', 'vil-player', state);

    // Resolve night phase
    resolveNightPhase(state);

    // Villager must survive — protect ran before kill
    expect(state.players['vil-player'].isAlive).toBe(true);
  });

  it('villager dies when vigilante kills without doctor protection', () => {
    const vigilante = state.players['vig-player'].role;

    vigilante.nightAction('vig-player', 'vil-player', state);
    resolveNightPhase(state);

    expect(state.players['vil-player'].isAlive).toBe(false);
  });

  it('vigilante cannot kill twice (only 1 bullet)', () => {
    const vigilante = state.players['vig-player'].role;

    // First shot — should push to queue
    vigilante.nightAction('vig-player', 'vil-player', state);
    expect(state.actionQueue).toHaveLength(1);

    resolveNightPhase(state);

    // Reset the villager for the second attempt
    state.players['vil-player'].isAlive = true;

    // Second shot — no bullets left, should NOT push to queue
    vigilante.nightAction('vig-player', 'vil-player', state);
    expect(state.actionQueue).toHaveLength(0);

    resolveNightPhase(state);

    // Villager survives — no action was queued
    expect(state.players['vil-player'].isAlive).toBe(true);
  });

  it('villager nightAction is a no-op', () => {
    const villager = state.players['vil-player'].role;

    const result = villager.nightAction('vil-player', 'doc-player', state);

    expect(result).toBeNull();
    expect(state.actionQueue).toHaveLength(0);
  });

  it('doctor, vigilante, and villager all have correct team', () => {
    expect(state.players['doc-player'].role.team).toBe('village');
    expect(state.players['vig-player'].role.team).toBe('village');
    expect(state.players['vil-player'].role.team).toBe('village');
  });
});
