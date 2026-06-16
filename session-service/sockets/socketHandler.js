const { rooms } = require("../controllers/sessionController");

const setupSockets = (io) => {

    io.on("connection", (socket) => {

        console.log("A user connected:", socket.id);

        socket.on("join-session", (roomId) => {

            if (!rooms[roomId]) {
                return;
            }

            if (!rooms[roomId].includes(socket.id)) {
                rooms[roomId].push(socket.id);
            }

            socket.join(roomId);

            io.to(roomId).emit(
                "participant-count",
                rooms[roomId].length
            );
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

};

module.exports = setupSockets;