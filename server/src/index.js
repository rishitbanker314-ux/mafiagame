const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { initializeRoles } = require('./roles/registry');
const { registerHandlers } = require('./socketHandlers');

// ── Initialize roles in the registry (once at startup) ──────────────────
initializeRoles();

// ── Express + Socket.io setup ───────────────────────────────────────────
const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// ── Serve static React app in production ────────────────────────────────
app.use(express.static(path.join(__dirname, '../../client/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

// ── Socket connection handler ───────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);
  registerHandlers(io, socket);
});

// ── Start listening ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Mafia server running on http://localhost:${PORT}`);
});

module.exports = { app, server, io };
