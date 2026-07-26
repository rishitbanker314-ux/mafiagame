const { io } = require("socket.io-client");
const socket = io("http://localhost:3000");

let roomCode = null;
const sessionToken = 'test-session-1';

socket.on("connect", () => {
  console.log("Connected!");
  socket.emit('create_room', { playerName: 'DetectivePlayer', sessionToken: sessionToken });
});

socket.on('room_created', (data) => {
  roomCode = data.roomCode;
  console.log("Room created:", roomCode);
  
  // Settings: 1 Mafia, 1 Detective, 1 Villager (Total 3 players)
  socket.emit('update_settings', { mafiaCount: 1, hasDoctor: false, hasDetective: true, hasJester: false, discussionTime: 10 });
  
  socket.emit('add_bot', { roomCode: roomCode });
  setTimeout(() => {
    socket.emit('add_bot', { roomCode: roomCode });
    setTimeout(() => {
        socket.emit('start_game', { roomCode: roomCode });
    }, 500);
  }, 500);
});

socket.on('phase_change', (data) => {
  console.log("Phase change:", data.phase);
  if (data.phase === 'night') {
    // Wait a bit to simulate thinking, then submit action to some target
    setTimeout(() => {
      // Find a target to investigate
      socket.emit('submit_action', { targetId: 'bot-1' }, (res) => {
        console.log("Submit action result:", res);
      });
    }, 1000);
  }
});

socket.on('investigation_result', (data) => {
  console.log("INVESTIGATION RESULT RECEIVED:", data);
});

socket.on('night_results', (data) => {
  console.log("Night results received:", data);
  setTimeout(() => process.exit(0), 1000);
});

socket.on("disconnect", () => {
  console.log("Disconnected");
});
