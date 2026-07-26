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
  const participants = rooms[roomId];

  res.json({
    exists: !!rooms[roomId],
    participantCount: participants ? participants.length : 0,
  });
};

module.exports = {
  createRoom,
  checkRoom,
  rooms, // Exporting rooms for testing purposes
}