require("dotenv").config({quiet: true});

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const setupSockets = require('./sockets/socketHandler');
const sessionRoutes = require('./routes/sessionRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/session', sessionRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ['GET', 'POST'],
  },
});

setupSockets(io);
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Session Service is running on port ${PORT}`);
});