/**
 * Socket Handlers — All Socket.io event listeners.
 *
 * Three flows:
 *   1. Lobby Management:   create_room, join_room
 *   2. Game Start:         start_game (role distribution + phase_change)
 *   3. Night Phase:        submit_action (auto-resolves when all roles submit)
 *
 * The handler layer uses the role registry (factory) to instantiate roles,
 * and calls resolveNightPhase() for resolution. It never branches on
 * role names or action types — fully respecting the architectural guardrails.
 */
const { createRoomState, joinRoomState, getRoom, getPlayerList } = require('./rooms');
const { createRole } = require('./roles/registry');
const { resolveNightPhase } = require('./engine/resolveNightPhase');
const { checkWinCondition } = require('./engine/checkWinCondition');

/**
 * Handle game over evaluation and broadcast if a win condition is met.
 * @param {import('socket.io').Server} io
 * @param {string} roomCode
 * @param {object} state
 * @returns {boolean} true if game over
 */
function handleWinCondition(io, roomCode, state) {
  const result = checkWinCondition(state);
  if (result.gameOver) {
    state.phase = 'game_over';
    const revealedRoles = Object.keys(state.players).map((pid) => {
      const p = state.players[pid];
      return {
        playerName: p.name,
        roleName: p.role ? p.role.name : 'Unknown',
        team: p.role ? p.role.team : 'neutral',
        isAlive: p.isAlive,
      };
    });

    io.to(roomCode).emit('phase_change', { phase: 'game_over' });
    io.to(roomCode).emit('game_over', {
      winner: result.winner,
      revealedRoles,
    });
    console.log(`[Room ${roomCode}] Game Over! Winner: ${result.winner}`);
    return true;
  }
  return false;
}

/**
 * Fisher-Yates shuffle (in-place).
 * @param {Array} arr
 * @returns {Array}
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Build the role name list for a given player count.
 * Always includes 1 Mafia, 1 Doctor and 1 Vigilante; remaining slots are Villagers.
 * @param {number} playerCount
 * @returns {string[]}
 */
function buildRoleList(playerCount) {
  const roles = ['Mafia', 'Doctor', 'Vigilante'];
  while (roles.length < playerCount) {
    roles.push('Villager');
  }
  return shuffle(roles);
}

/**
 * Compute pending night action set — alive players whose role canActAtNight().
 * @param {object} state
 * @returns {Set<string>}
 */
function computePendingActions(state) {
  const pending = new Set();
  for (const pid of Object.keys(state.players)) {
    const player = state.players[pid];
    if (player.isAlive && player.role && player.role.canActAtNight()) {
      pending.add(pid);
    }
  }
  return pending;
}

/**
 * Register all socket event handlers for a connected socket.
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
function registerHandlers(io, socket) {
  // ── 1. Lobby Management ─────────────────────────────────────────────

  socket.on('create_room', ({ playerName } = {}, callback) => {
    try {
      const { code, state } = createRoomState(socket.id, playerName || 'Host');
      socket.join(code);
      socket.data.roomCode = code;

      console.log(`[Room ${code}] Created by ${socket.id} (${playerName})`);

      if (callback) callback({ success: true, roomCode: code });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  socket.on('join_room', ({ roomCode, playerName } = {}, callback) => {
    try {
      const state = joinRoomState(roomCode, socket.id, playerName || 'Player');
      socket.join(roomCode);
      socket.data.roomCode = roomCode;

      console.log(`[Room ${roomCode}] ${playerName} (${socket.id}) joined`);

      // Broadcast updated lobby to all players in the room
      io.to(roomCode).emit('update_lobby', {
        players: getPlayerList(state),
      });

      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // ── 2. Game Start & Role Distribution ───────────────────────────────

  socket.on('start_game', (_, callback) => {
    try {
      const roomCode = socket.data.roomCode;
      const state = getRoom(roomCode);
      if (!state) throw new Error('Room not found.');
      if (state.hostId !== socket.id) throw new Error('Only the host can start the game.');
      if (state.phase !== 'lobby') throw new Error('Game already started.');

      const playerIds = Object.keys(state.players);
      if (playerIds.length < 2) throw new Error('Need at least 2 players to start.');

      // Build and assign roles via the registry (no concrete imports here)
      const roleNames = buildRoleList(playerIds.length);
      playerIds.forEach((pid, idx) => {
        state.players[pid].role = createRole(roleNames[idx]);
      });

      // SECURITY: emit private role to each individual socket — not broadcast
      playerIds.forEach((pid) => {
        const player = state.players[pid];
        io.to(pid).emit('your_role', {
          roleName: player.role.name,
          team: player.role.team,
        });
      });

      // Transition to night phase
      state.phase = 'night';
      state.pendingActions = computePendingActions(state);

      io.to(roomCode).emit('phase_change', { phase: 'night' });

      console.log(`[Room ${roomCode}] Game started — ${playerIds.length} players, night phase`);

      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // ── 3. Night Phase Execution ────────────────────────────────────────

  socket.on('submit_action', ({ targetId } = {}, callback) => {
    try {
      const roomCode = socket.data.roomCode;
      const state = getRoom(roomCode);
      if (!state) throw new Error('Room not found.');
      if (state.phase !== 'night') throw new Error('Not the night phase.');

      const player = state.players[socket.id];
      if (!player) throw new Error('Player not found.');
      if (!player.isAlive) throw new Error('Dead players cannot act.');
      if (!player.role.canActAtNight()) throw new Error('Your role has no night action.');
      if (!state.pendingActions.has(socket.id)) throw new Error('You already submitted an action.');

      // Delegate to the role's nightAction (Strategy Pattern)
      player.role.nightAction(socket.id, targetId, state);

      // Mark this player as having submitted
      state.pendingActions.delete(socket.id);

      console.log(`[Room ${roomCode}] ${player.name} (${player.role.name}) submitted action → ${targetId}`);

      if (callback) callback({ success: true });

      // Auto-resolve once all active roles have submitted
      if (state.pendingActions.size === 0) {
        // Snapshot who is alive before resolution
        const wasAlive = {};
        for (const pid of Object.keys(state.players)) {
          wasAlive[pid] = state.players[pid].isAlive;
        }

        resolveNightPhase(state);

        // Diff to find who was killed (decoupled — no action-type branching)
        const killed = Object.keys(state.players)
          .filter((pid) => wasAlive[pid] && !state.players[pid].isAlive)
          .map((pid) => ({
            playerId: pid,
            playerName: state.players[pid].name,
          }));

        // Check for Game Over immediately after night resolution
        if (handleWinCondition(io, roomCode, state)) {
          // Send night results so they see who died, but phase is now game_over
          io.to(roomCode).emit('night_results', { killed });
          return;
        }

        // Transition to day phase
        state.phase = 'day';

        io.to(roomCode).emit('phase_change', { phase: 'day' });
        io.to(roomCode).emit('night_results', { killed });

        console.log(
          `[Room ${roomCode}] Night resolved — killed: ${
            killed.length > 0 ? killed.map((k) => k.playerName).join(', ') : 'nobody'
          }`
        );
      }
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // ── 4. Day Phase (Chat & Voting) ────────────────────────────────────

  socket.on('send_chat', ({ message } = {}, callback) => {
    try {
      const roomCode = socket.data.roomCode;
      const state = getRoom(roomCode);
      if (!state) throw new Error('Room not found.');
      if (state.phase !== 'day') throw new Error('Not the day phase.');

      const sender = state.players[socket.id];
      if (!sender) throw new Error('Player not found.');
      if (!message || message.trim() === '') throw new Error('Empty message.');

      const chatData = {
        id: Math.random().toString(36).substr(2, 9),
        senderId: sender.id,
        senderName: sender.name,
        text: message.trim(),
        isGhost: !sender.isAlive,
      };

      if (sender.isAlive) {
        // Alive players broadcast to everyone
        io.to(roomCode).emit('chat_message', chatData);
      } else {
        // Dead players only broadcast to other dead players
        Object.keys(state.players).forEach((pid) => {
          if (!state.players[pid].isAlive) {
            io.to(pid).emit('chat_message', chatData);
          }
        });
      }

      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  socket.on('submit_vote', ({ targetId } = {}, callback) => {
    try {
      const roomCode = socket.data.roomCode;
      const state = getRoom(roomCode);
      if (!state) throw new Error('Room not found.');
      if (state.phase !== 'day') throw new Error('Not the day phase.');

      const voter = state.players[socket.id];
      const target = state.players[targetId];

      if (!voter) throw new Error('Player not found.');
      if (!voter.isAlive) throw new Error('Dead players cannot vote.');
      if (!target) throw new Error('Target player not found.');
      if (!target.isAlive) throw new Error('Cannot vote for a dead player.');

      // Record vote
      state.votes[socket.id] = targetId;

      // Broadcast vote update (format: { targetId: count })
      const voteCounts = {};
      for (const vId of Object.keys(state.votes)) {
        const tId = state.votes[vId];
        voteCounts[tId] = (voteCounts[tId] || 0) + 1;
      }

      io.to(roomCode).emit('vote_update', { 
        voterId: socket.id,
        targetId: targetId,
        votes: voteCounts 
      });

      if (callback) callback({ success: true });

      // Check for majority
      const alivePlayersCount = Object.values(state.players).filter((p) => p.isAlive).length;
      const majorityThreshold = Math.floor(alivePlayersCount / 2);

      let votedOutId = null;
      for (const tId of Object.keys(voteCounts)) {
        if (voteCounts[tId] > majorityThreshold) {
          votedOutId = tId;
          break;
        }
      }

      if (votedOutId) {
        const votedOutPlayer = state.players[votedOutId];
        console.log(`[Room ${roomCode}] ${votedOutPlayer.name} was voted out.`);

        // Strategy Pattern hook
        votedOutPlayer.role.onVotedOut(state);
        votedOutPlayer.isAlive = false;

        // Reset for night phase
        state.votes = {};
        
        // We broadcast an update_lobby so clients see the dead player
        io.to(roomCode).emit('update_lobby', { players: getPlayerList(state) });

        // Check win condition after elimination
        if (handleWinCondition(io, roomCode, state)) {
          return;
        }

        state.phase = 'night';
        state.pendingActions = computePendingActions(state);

        io.to(roomCode).emit('phase_change', { phase: 'night' });
      }

    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  socket.on('reset_game', (_, callback) => {
    try {
      const roomCode = socket.data.roomCode;
      const state = getRoom(roomCode);
      if (!state) throw new Error('Room not found.');
      if (state.hostId !== socket.id) throw new Error('Only the host can reset the game.');

      // Reset players
      Object.keys(state.players).forEach((pid) => {
        const player = state.players[pid];
        player.isAlive = true;
        player.role = null;
      });

      // Clear game state tracking variables
      state.winner = null;
      state.votes = {};
      state.actionQueue = [];
      if (state.pendingActions) state.pendingActions.clear();
      
      state.phase = 'lobby';

      io.to(roomCode).emit('phase_change', { phase: 'lobby' });
      io.to(roomCode).emit('update_lobby', { players: getPlayerList(state) });

      console.log(`[Room ${roomCode}] Game reset to lobby by host`);
      
      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // ── Disconnect ──────────────────────────────────────────────────────

  socket.on('disconnect', () => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;

    const state = getRoom(roomCode);
    if (!state) return;

    console.log(`[Room ${roomCode}] Player ${socket.id} disconnected`);

    // Remove from pending actions
    if (state.pendingActions) {
      state.pendingActions.delete(socket.id);
    }

    // In lobby, remove the player entirely; in-game, mark as dead
    if (state.phase === 'lobby') {
      delete state.players[socket.id];
    } else if (state.players[socket.id]) {
      state.players[socket.id].isAlive = false;
    }

    io.to(roomCode).emit('update_lobby', {
      players: getPlayerList(state),
    });

    // Check if night should auto-resolve after disconnect
    if (state.phase === 'night' && state.pendingActions && state.pendingActions.size === 0) {
      const wasAlive = {};
      for (const pid of Object.keys(state.players)) {
        wasAlive[pid] = state.players[pid].isAlive;
      }

      resolveNightPhase(state);

      const killed = Object.keys(state.players)
        .filter((pid) => wasAlive[pid] && !state.players[pid].isAlive)
        .map((pid) => ({
          playerId: pid,
          playerName: state.players[pid].name,
        }));

      if (handleWinCondition(io, roomCode, state)) {
        io.to(roomCode).emit('night_results', { killed });
        return;
      }

      state.phase = 'day';
      io.to(roomCode).emit('phase_change', { phase: 'day' });
      io.to(roomCode).emit('night_results', { killed });
    }
  });
}

module.exports = { registerHandlers, buildRoleList, computePendingActions };
