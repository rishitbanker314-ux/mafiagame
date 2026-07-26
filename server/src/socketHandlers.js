/**
 * Socket Handlers — All Socket.io event listeners.
 */
const { createRoomState, joinRoomState, getRoom, getPlayerList } = require('./rooms');
const { createRole } = require('./roles/registry');
const { resolveNightPhase } = require('./engine/resolveNightPhase');
const { handleWinCondition, computePendingActions } = require('./engine/gameHelpers');
const { simulateBotNightActions, simulateBotDayActions } = require('./botEngine');
const { startPhaseTimer, clearPhaseTimer } = require('./engine/timerEngine');

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildRoleList(playerCount, settings) {
  const roles = [];
  for (let i = 0; i < settings.mafiaCount; i++) {
    roles.push('Mafia');
  }
  if (settings.hasDoctor && roles.length < playerCount) roles.push('Doctor');
  if (settings.hasDetective && roles.length < playerCount) roles.push('Detective');
  if (settings.hasJester && roles.length < playerCount) roles.push('Jester');
  while (roles.length < playerCount) {
    roles.push('Villager');
  }
  return shuffle(roles);
}

const { resolveNightAndTransition, forceDayResolution } = require('./engine/gameLoop');


function registerHandlers(io, socket) {
  // ── 1. Lobby Management ─────────────────────────────────────────────

  socket.on('update_settings', (newSettings, callback) => {
    try {
      const roomCode = socket.data.roomCode;
      const sessionId = socket.data.sessionId;
      const state = getRoom(roomCode);
      if (!state) throw new Error('Room not found.');
      if (state.hostId !== sessionId) throw new Error('Only the host can update settings.');
      if (state.phase !== 'lobby') throw new Error('Game already started.');

      state.settings = { ...state.settings, ...newSettings };
      io.to(roomCode).emit('update_lobby', { players: getPlayerList(state), settings: state.settings });
      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  socket.on('create_room', ({ playerName, sessionId } = {}, callback) => {
    try {
      if (!sessionId) throw new Error('Missing sessionId');
      const { code, state } = createRoomState(sessionId, socket.id, playerName || 'Host');
      socket.join(code);
      socket.data.roomCode = code;
      socket.data.sessionId = sessionId;

      console.log(`[Room ${code}] Created by ${sessionId} (${playerName})`);
      io.to(code).emit('update_lobby', { players: getPlayerList(state), settings: state.settings });
      if (callback) callback({ success: true, roomCode: code });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  socket.on('join_room', ({ roomCode, playerName, sessionId } = {}, callback) => {
    try {
      if (!sessionId) throw new Error('Missing sessionId');
      const state = joinRoomState(roomCode, sessionId, socket.id, playerName || 'Player');
      socket.join(roomCode);
      socket.data.roomCode = roomCode;
      socket.data.sessionId = sessionId;

      console.log(`[Room ${roomCode}] ${playerName} (${sessionId}) joined`);
      io.to(roomCode).emit('update_lobby', { players: getPlayerList(state), settings: state.settings });

      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });
  
  socket.on('reconnect_session', ({ roomCode, sessionId } = {}, callback) => {
    try {
      const state = getRoom(roomCode);
      if (!state) throw new Error('Room not found.');
      
      const player = state.players[sessionId];
      if (!player) throw new Error('Session not found in this room.');
      
      player.socketId = socket.id;
      player.connected = true;
      socket.join(roomCode);
      socket.data.roomCode = roomCode;
      socket.data.sessionId = sessionId;
      
      io.to(roomCode).emit('update_lobby', { players: getPlayerList(state), settings: state.settings });
      
      const roleInfo = player.role ? { roleName: player.role.name, team: player.role.team } : null;
      if (roleInfo && roleInfo.team === 'mafia') {
        roleInfo.mafiaTeammates = Object.values(state.players)
          .filter(p => p.role && p.role.team === 'mafia' && p.id !== player.id)
          .map(p => p.name);
      }
      
      if (callback) {
        callback({
          success: true,
          gameState: {
            phase: state.phase,
            players: getPlayerList(state),
            settings: state.settings,
            myRole: roleInfo,
            votes: state.votes,
            winner: state.winner,
            timerLeft: state.timerInfo ? state.timerInfo.timeLeft : 0
          }
        });
      }
      console.log(`[Room ${roomCode}] Player ${player.name} reconnected.`);
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // ── 2. Game Start & Role Distribution ───────────────────────────────

  socket.on('add_bot', (_, callback) => {
    try {
      const roomCode = socket.data.roomCode;
      const sessionId = socket.data.sessionId;
      const state = getRoom(roomCode);
      if (!state) throw new Error('Room not found.');
      if (state.phase !== 'lobby') throw new Error('Game already started.');
      if (state.hostId !== sessionId) throw new Error('Only host can add bots.');
      
      const botCount = Object.values(state.players).filter(p => p.isBot).length;
      const botId = `bot_${Math.random().toString(36).substr(2, 9)}`;
      const botNames = ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy'];
      const botName = `Bot ${botNames[botCount % botNames.length]}`;
      
      state.players[botId] = {
        id: botId,
        name: botName,
        isAlive: true,
        role: null,
        socketId: botId,
        isBot: true,
        connected: true,
      };

      io.to(roomCode).emit('update_lobby', { players: getPlayerList(state), settings: state.settings });
      console.log(`[Room ${roomCode}] Bot ${botName} added by host`);
      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  socket.on('start_game', (_, callback) => {
    try {
      const roomCode = socket.data.roomCode;
      const sessionId = socket.data.sessionId;
      const state = getRoom(roomCode);
      if (!state) throw new Error('Room not found.');
      if (state.hostId !== sessionId) throw new Error('Only the host can start the game.');
      if (state.phase !== 'lobby') throw new Error('Game already started.');

      const playerIds = Object.keys(state.players);
      if (playerIds.length < 2) throw new Error('Need at least 2 players to start.');

      const roleNames = buildRoleList(playerIds.length, state.settings);
      playerIds.forEach((pid, idx) => {
        state.players[pid].role = createRole(roleNames[idx]);
      });

      playerIds.forEach((pid) => {
        const player = state.players[pid];
        if (!player.isBot && player.socketId) {
          const payload = {
            roleName: player.role.name,
            team: player.role.team,
          };
          if (player.role.team === 'mafia') {
            payload.mafiaTeammates = Object.values(state.players)
              .filter(p => p.role && p.role.team === 'mafia' && p.id !== player.id)
              .map(p => p.name);
          }
          io.to(player.socketId).emit('your_role', payload);
        }
      });

      state.phase = 'night';
      state.pendingActions = computePendingActions(state);
      io.to(roomCode).emit('phase_change', { phase: 'night' });
      
      startPhaseTimer(io, roomCode, state, 60, () => {
        resolveNightAndTransition(io, roomCode, state);
      });
      
      simulateBotNightActions(io, roomCode, state);

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
      const sessionId = socket.data.sessionId;
      const state = getRoom(roomCode);
      if (!state) throw new Error('Room not found.');
      if (state.phase !== 'night') throw new Error('Not the night phase.');

      const player = state.players[sessionId];
      if (!player) throw new Error('Player not found.');
      if (!player.isAlive) throw new Error('Dead players cannot act.');
      if (!player.role.canActAtNight()) throw new Error('Your role has no night action.');
      if (!state.pendingActions.has(sessionId)) throw new Error('You already submitted an action.');

      player.role.nightAction(sessionId, targetId, state);
      state.pendingActions.delete(sessionId);

      console.log(`[Room ${roomCode}] ${player.name} (${player.role.name}) submitted action → ${targetId}`);
      if (callback) callback({ success: true });

      if (state.pendingActions.size === 0) {
        resolveNightAndTransition(io, roomCode, state);
      }
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // ── 4. Day Phase (Chat & Voting) ────────────────────────────────────

  socket.on('send_chat', ({ message } = {}, callback) => {
    try {
      const roomCode = socket.data.roomCode;
      const sessionId = socket.data.sessionId;
      const state = getRoom(roomCode);
      if (!state) throw new Error('Room not found.');
      if (state.phase !== 'day_discussion' && state.phase !== 'day_voting') throw new Error('Not the day phase.');

      const now = Date.now();
      state.chatLastSent = state.chatLastSent || {};
      if (state.chatLastSent[sessionId] && now - state.chatLastSent[sessionId] < 500) {
        throw new Error('You are sending messages too fast.');
      }
      state.chatLastSent[sessionId] = now;

      const sender = state.players[sessionId];
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
        io.to(roomCode).emit('chat_message', chatData);
      } else {
        Object.keys(state.players).forEach((pid) => {
          if (!state.players[pid].isAlive && state.players[pid].socketId) {
            io.to(state.players[pid].socketId).emit('chat_message', chatData);
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
      const sessionId = socket.data.sessionId;
      const state = getRoom(roomCode);
      if (!state) throw new Error('Room not found.');
      if (state.phase !== 'day_voting') throw new Error('Voting is only allowed during the voting phase.');

      const voter = state.players[sessionId];
      const target = state.players[targetId];

      if (!voter) throw new Error('Player not found.');
      if (!voter.isAlive) throw new Error('Dead players cannot vote.');
      if (!target) throw new Error('Target player not found.');
      if (!target.isAlive) throw new Error('Cannot vote for a dead player.');

      state.votes[sessionId] = targetId;

      const voteCounts = {};
      for (const vId of Object.keys(state.votes)) {
        const tId = state.votes[vId];
        voteCounts[tId] = (voteCounts[tId] || 0) + 1;
      }

      io.to(roomCode).emit('vote_update', { 
        voterId: sessionId,
        targetId: targetId,
        votes: voteCounts 
      });

      if (callback) callback({ success: true });

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
        clearPhaseTimer(state);
        
        const votedOutPlayer = state.players[votedOutId];
        console.log(`[Room ${roomCode}] ${votedOutPlayer.name} was voted out.`);

        io.to(roomCode).emit('chat_message', {
          id: Math.random().toString(36).substr(2, 9),
          senderId: 'system',
          senderName: 'System',
          text: `${votedOutPlayer.name} was voted out by the town.`,
          isGhost: false,
          isSystem: true
        });

        votedOutPlayer.role.onVotedOut(state);
        votedOutPlayer.isAlive = false;

        state.votes = {};
        io.to(roomCode).emit('update_lobby', { players: getPlayerList(state), settings: state.settings });

        if (handleWinCondition(io, roomCode, state)) {
          return;
        }

        setTimeout(() => {
          state.phase = 'night';
          state.pendingActions = computePendingActions(state);
          io.to(roomCode).emit('phase_change', { phase: 'night' });
          
          startPhaseTimer(io, roomCode, state, 60, () => {
            resolveNightAndTransition(io, roomCode, state);
          });
          
          simulateBotNightActions(io, roomCode, state);
        }, 2500);
      }

    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  socket.on('reset_game', (_, callback) => {
    try {
      const roomCode = socket.data.roomCode;
      const sessionId = socket.data.sessionId;
      const state = getRoom(roomCode);
      if (!state) throw new Error('Room not found.');
      if (state.hostId !== sessionId) throw new Error('Only the host can reset the game.');

      clearPhaseTimer(state);
      Object.keys(state.players).forEach((pid) => {
        const player = state.players[pid];
        player.isAlive = true;
        player.role = null;
      });

      state.winner = null;
      state.votes = {};
      state.actionQueue = [];
      if (state.pendingActions) state.pendingActions.clear();
      
      state.phase = 'lobby';
      io.to(roomCode).emit('phase_change', { phase: 'lobby' });
      io.to(roomCode).emit('update_lobby', { players: getPlayerList(state), settings: state.settings });

      console.log(`[Room ${roomCode}] Game reset to lobby by host`);
      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // ── Disconnect ──────────────────────────────────────────────────────

  socket.on('disconnect', () => {
    const roomCode = socket.data.roomCode;
    const sessionId = socket.data.sessionId;
    if (!roomCode || !sessionId) return;

    const state = getRoom(roomCode);
    if (!state) return;

    const player = state.players[sessionId];
    if (!player) return;

    console.log(`[Room ${roomCode}] Player ${player.name} disconnected`);
    player.connected = false;

    if (state.phase === 'lobby') {
      delete state.players[sessionId];
    }
    
    io.to(roomCode).emit('update_lobby', {
      players: getPlayerList(state),
      settings: state.settings
    });

    if (state.phase === 'night' && state.pendingActions && state.pendingActions.has(sessionId)) {
      // Don't auto resolve, they might reconnect. But if timer runs out, it forces resolve.
    }
  });
}

module.exports = { registerHandlers };
