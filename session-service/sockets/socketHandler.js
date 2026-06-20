const { rooms } = require("../controllers/sessionController");

const setupSockets = (io) => {

    io.on("connection", (socket) => {

        console.log("A user connected:", socket.id);

        socket.on("offer", ({ roomId, offer }) => {
            console.log(`Received offer for room ${roomId} from ${socket.id}`);
            socket.to(roomId).emit("offer", { 
                offer,
                senderId: socket.id
             });
        });

        socket.on("answer", ({ roomId, answer }) => {
            console.log(`Received answer for room ${roomId} from ${socket.id}`);
            socket.to(roomId).emit("answer", { 
                answer,
                senderId: socket.id
             });
        });

        socket.on("ice-candidate", ({ roomId, candidate }) => {
            console.log(`Received ICE candidate for room ${roomId} from ${socket.id}`);
            socket.to(roomId).emit("ice-candidate", { 
                candidate,
                senderId: socket.id
             });
        });

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

        socket.on("leave-session", (roomId) => {

            if (!rooms[roomId]) {
                return;
            }

            rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
            socket.leave(roomId);

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