const generateRoomId = require('../utils/roomGenerator');

const rooms = {};

const createRoom = (req, res) => {
  const roomId = generateRoomId();

  rooms[roomId] = [];

  res.status(201).json({ 
    roomId,
  });
};

const checkRoom = (req, res) => {
  const { roomId } = req.params;

  res.json({
    exists: !!rooms[roomId],
  });
};

module.exports = {
  createRoom,
  checkRoom,
  rooms, // Exporting rooms for testing purposes
}