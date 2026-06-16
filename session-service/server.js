require("dotenv").config({quiet: true});

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

const rooms = {};

io.on("connection", (socket) => {
  console.log('A user connected:', socket.id);

  socket.on("join-session", (roomId) => {
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }

    if (!rooms[roomId].includes(socket.id)) {
      rooms[roomId].push(socket.id);
    }

    socket.join(roomId);
    
    io.to(roomId).emit("participant-count", rooms[roomId].length);
  });

  socket.on("message", (data) => {
    io.to(roomId).emit("message", `${socket.id} joined ${roomId}`);
  });

  socket.on("disconnect", () => {
    console.log('A user disconnected:', socket.id);
    // Remove the user from all rooms they were in
    for (const [roomId, participants] of Object.entries(rooms)) {
      rooms[roomId] = participants.filter((id) => id !== socket.id);
      io.to(roomId).emit("participant-count", rooms[roomId].length);
    }
  });
});

app.get('/', (req, res) => {
  res.send('Session Service is running');
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Session Service is running on port ${PORT}`);
});