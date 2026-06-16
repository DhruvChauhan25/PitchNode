import axios from "axios";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/session`;

export const createRoomApi = async () => {
  return axios.post(`${API_BASE_URL}/create`);
};

export const checkRoomApi = async (roomId) => {
  return axios.get(`${API_BASE_URL}/${roomId}`);
};