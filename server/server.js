const app = require('./app');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`User connected via socket: ${socket.id}`);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });

  socket.on('send_message', (data) => {
    // Broadcast message to the specific room
    if (data.room) {
      io.to(data.room).emit('receive_message', data);
    } else {
      io.emit('receive_message', data);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  PMS BACKEND SERVER IS RUNNING ON PORT ${PORT}`);
  console.log(`  Environment: Development`);
  console.log(`===============================================`);
});

module.exports = { server, io };