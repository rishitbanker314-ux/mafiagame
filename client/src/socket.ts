/**
 * Singleton Socket.io client connection.
 * Import this from any component to emit/listen to server events.
 */
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.PROD ? '/' : 'http://localhost:3001';

const socket = io(SERVER_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;
