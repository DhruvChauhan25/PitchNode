export const registerSignalingEvents = (socket, peerConnectionRef, getRoomId) => {
    socket.off("offer");
    socket.off("answer");
    socket.off("ice-candidate");

    socket.on("offer", async ({ offer }) => {
        const pc = peerConnectionRef.current;
        if (!pc) return;

        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("answer", { roomId: getRoomId(), answer });
    });

    socket.on("answer", async ({ answer }) => {
        const pc = peerConnectionRef.current;
        if (!pc) return;

        await pc.setRemoteDescription(answer);
    });

    socket.on("ice-candidate", async ({ candidate }) => {
        const pc = peerConnectionRef.current;
        if (!pc) return;

        await pc.addIceCandidate(candidate);
    });

    return () => {
        socket.off("offer");
        socket.off("answer");
        socket.off("ice-candidate");
    };
};
