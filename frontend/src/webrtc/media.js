export const getLocalStream = async () => {
    return await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
    });
};

export const stopLocalStream = (stream) => {
    stream?.getTracks().forEach(track => track.stop());
}