/**
 * test-lobby.js — Dummy script to verify lobby flow.
 *
 * Connects two Socket.io clients to the running server,
 * has Client 1 create a room and Client 2 join it,
 * then verifies both receive the update_lobby event with 2 players.
 *
 * Usage:
 *   1. Start the server:  npm run dev  (or node src/index.js)
 *   2. Run this script:   node scripts/test-lobby.js
 */
const { io } = require('socket.io-client');

const SERVER_URL = 'http://localhost:3001';
const TIMEOUT_MS = 5000;

function log(msg) {
  console.log(`[test-lobby] ${msg}`);
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  log('Connecting two clients to the server...');

  const client1 = io(SERVER_URL, { forceNew: true });
  const client2 = io(SERVER_URL, { forceNew: true });

  // Wait for both clients to connect
  await Promise.all([
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Client 1 connection timeout')), TIMEOUT_MS);
      client1.on('connect', () => {
        clearTimeout(timer);
        log(`Client 1 connected: ${client1.id}`);
        resolve();
      });
    }),
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Client 2 connection timeout')), TIMEOUT_MS);
      client2.on('connect', () => {
        clearTimeout(timer);
        log(`Client 2 connected: ${client2.id}`);
        resolve();
      });
    }),
  ]);

  // ── Step 1: Client 1 creates a room ─────────────────────────────────

  const createResult = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('create_room timeout')), TIMEOUT_MS);
    client1.emit('create_room', { playerName: 'Alice' }, (response) => {
      clearTimeout(timer);
      resolve(response);
    });
  });

  if (!createResult.success) {
    throw new Error(`create_room failed: ${createResult.error}`);
  }

  const roomCode = createResult.roomCode;
  log(`Client 1 (Alice) created room: ${roomCode}`);

  // ── Step 2: Client 2 joins the room ─────────────────────────────────

  // Listen for update_lobby on BOTH clients before joining
  const lobbyPromise1 = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Client 1 update_lobby timeout')), TIMEOUT_MS);
    client1.on('update_lobby', (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });

  const lobbyPromise2 = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Client 2 update_lobby timeout')), TIMEOUT_MS);
    client2.on('update_lobby', (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });

  const joinResult = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('join_room timeout')), TIMEOUT_MS);
    client2.emit('join_room', { roomCode, playerName: 'Bob' }, (response) => {
      clearTimeout(timer);
      resolve(response);
    });
  });

  if (!joinResult.success) {
    throw new Error(`join_room failed: ${joinResult.error}`);
  }

  log(`Client 2 (Bob) joined room: ${roomCode}`);

  // ── Step 3: Verify both received update_lobby ───────────────────────

  const [lobby1, lobby2] = await Promise.all([lobbyPromise1, lobbyPromise2]);

  log(`Client 1 received update_lobby: ${JSON.stringify(lobby1)}`);
  log(`Client 2 received update_lobby: ${JSON.stringify(lobby2)}`);

  // Assert player count
  const passed =
    lobby1.players.length === 2 &&
    lobby2.players.length === 2 &&
    lobby1.players.some((p) => p.name === 'Alice') &&
    lobby1.players.some((p) => p.name === 'Bob');

  if (passed) {
    log('');
    log('✅ ALL CHECKS PASSED');
    log(`   - Room code: ${roomCode}`);
    log(`   - Players: ${lobby1.players.map((p) => p.name).join(', ')}`);
    log(`   - Both clients received update_lobby with 2 players`);
  } else {
    log('');
    log('❌ TEST FAILED — unexpected lobby data');
    process.exitCode = 1;
  }

  // ── Cleanup ──────────────────────────────────────────────────────────
  client1.disconnect();
  client2.disconnect();

  // Give sockets time to close gracefully
  await sleep(200);
}

main().catch((err) => {
  console.error(`\n❌ TEST ERROR: ${err.message}\n`);
  process.exit(1);
});
