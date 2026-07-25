# Mafia Game — Architectural Guardrails

These rules govern the design and implementation of the multiplayer Mafia game engine. Every contributor (human or AI) **must** follow them.

---

## 1. No Monolithic Control Flow for Game Logic

> **NEVER** use monolithic `if/else` chains or `switch` statements to branch on player roles, game phases, or action types.

Branching on role identity inside the engine creates tight coupling and makes adding new roles a breaking change. Use polymorphism (the Strategy Pattern) instead.

**Bad:**
```js
if (role === 'mafia') { /* ... */ }
else if (role === 'doctor') { /* ... */ }
else if (role === 'detective') { /* ... */ }
```

**Good:**
```js
role.nightAction(gameState);
```

---

## 2. Strategy Pattern for All Player Roles

Every role in the game **must** be implemented as a class that extends the base `Role` class.

### Base Role Contract

```js
class Role {
  constructor(name, priority) {
    this.name = name;
    this.priority = priority; // lower number = higher priority (resolved first)
  }

  /** @abstract */
  nightAction(gameState, targetId) {
    throw new Error(`nightAction() not implemented for role: ${this.name}`);
  }
}
```

### Requirements

- Every role **must** provide a `nightAction(gameState, targetId)` method.
- Every role **must** declare a `priority` integer in its constructor.
- Role files live in `server/src/roles/` — one file per role.
- Adding a new role must **never** require editing the core engine.

---

## 3. Priority Queue for Night Phase Resolution

Night actions are **not** resolved immediately. They are pushed onto an `actionQueue` and resolved **at the end of the night phase**, sorted strictly by `priority` (ascending — lower number resolves first).

### Resolution Order (example)

| Priority | Role      | Action           |
| -------- | --------- | ---------------- |
| 1        | Detective | Investigate      |
| 2        | Doctor    | Protect          |
| 3        | Mafia     | Kill             |

### Implementation Rules

- The engine collects all night actions into an array.
- At phase end, the array is sorted by `action.role.priority`.
- Actions are resolved sequentially in sorted order.
- Ties in priority are resolved by insertion order (stable sort).

---

## 4. Decoupled Engine Architecture

The core server engine (`server/src/engine/`) must remain **completely decoupled** from specific role behaviors.

### What the engine is responsible for:

- Managing game phases (lobby → night → day → vote → end).
- Collecting actions from players during each phase.
- Sorting and resolving the action queue.
- Broadcasting state updates via Socket.io.

### What the engine must NOT do:

- Reference any specific role by name (e.g., `"mafia"`, `"doctor"`).
- Contain role-specific branching logic.
- Import individual role files directly (use a role registry or factory).

### Dependency Direction

```
Engine → Role (abstract base)
              ↑
    MafiaRole, DoctorRole, DetectiveRole, ...
```

The engine depends only on the abstract `Role` interface. Concrete roles depend on the base `Role` class. The engine never depends on concrete roles.

---

## 5. Testing Requirements

- **Jest** is the testing framework for the backend.
- All role classes must have unit tests verifying `nightAction()` behavior.
- The priority queue resolution logic must have dedicated tests.
- Tests live in `server/tests/` mirroring the `src/` structure.
- Run tests with `npm test` from the `server/` directory.

---

## Summary

| Rule | Enforcement |
| ---- | ----------- |
| No monolithic if/else/switch | Code review — reject any PR that branches on role identity in the engine |
| Strategy Pattern for roles | Every role extends `Role` with `nightAction()` + `priority` |
| Priority Queue for night phase | Actions queued, sorted by priority, resolved at phase end |
| Decoupled engine | Engine imports only base `Role`; never concrete role classes |
| Jest testing | All roles and engine logic must have unit test coverage |

---

## 6. Auto-Push Requirement

Whenever changes are made to the codebase in response to a user request, the agent **must** automatically commit the changes and push them to the GitHub repository (`origin main`) without waiting for explicit permission.
