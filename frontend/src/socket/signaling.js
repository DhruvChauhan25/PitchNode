export const registerSignalingEvents = (socket) => {
  socket.on("offer", () => {});
  socket.on("answer", () => {});
  socket.on("ice-candidate", () => {});
};