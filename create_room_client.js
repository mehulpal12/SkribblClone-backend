const { io } = require('socket.io-client');
const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('Client connected:', socket.id);
  // Emit create_room with dummy data
  socket.emit('create_room', { playerName: 'TestPlayer', playerId: 'test123' });
});

socket.on('room_created', (room) => {
  console.log('Room created response received:', room);
  // Disconnect after receiving response
  socket.disconnect();
});

socket.on('error', (err) => {
  console.error('Error from server:', err);
});

socket.on('disconnect', () => {
  console.log('Client disconnected');
});
