import axios from "axios";
import { getToken } from "./authApi";

const BASE = import.meta.env.VITE_INTERVIEW_API_URL || "http://localhost:8000";
const USE_MOCK = import.meta.env.VITE_AUTH_MOCK_HUMAN !== "false";

const client = axios.create({baseURL: BASE});
client.interceptors.request.use((config) => {
    const token = getToken();
    if(token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// mock store
const KEY = "pitchnode_mock_requests";
const readAll = () => {
    try{
        return JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch {
        return [];
    }
};

const writeAll = (rows) => localStorage.setItem(KEY, JSON.stringify(rows));
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

//current mock userId, so 'my requests' only shows the callers
const mockUserId = () => {
    try{
        return localStorage.getItem("pitchnode_mock_session") || "anon";
    } catch {
        return "anon"
    }
};

const mock = {
    async create(payload) {
        await delay();
        const rows = readAll();
        const now = new Date();
        const row = {
            id: `req-${Date.now()}`,
            owner_id: mockUserId(),
            status: "pending",
            job_title: payload.job_title,
            job_description: payload.job_description || null,
            jd_id: payload.jd_id || null,
            cv_file_name: payload.cv_file_name || null,
            preferred_time: payload.preferred_time || null,
            expires_at: new Date(now.getTime() + 7 * 864e5).toISOString(),
            created_at: now.toISOString(),
        };
        rows.push(row);
        writeAll(rows);
        return{
            id: row.id,
            status: row.status,
            job_title: row.job_title,
            preferred_time: row.preferred_time,
            expires_at: row.expires_at,
            created_at: row.created_at,
        };
    },

    async listMine(){
        await delay(200);
        const uid = mockUserId();
        const rows = readAll()
            .filter((r) => r.owner_id === uid)
            .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
        return { requests: rows };
    },

    async cancel(id) {
        await delay();
        const rows = readAll();
        const i = rows.findIndex((r) => r.id === id);
        if (i !== -1) {
            rows[i].status = "cancelled";
            writeAll(rows);
        }
        return { id, status: "cancelled" };
    },
}

const live = {
    create: (payload) => client.post("/requests", payload).then((r) => r.data),
    listMine: () => client.get("/requests").then((r) => r.data),
    cancel: (id) => client.post(`/requests/${id}/cancel`).then((r) => r.data),
};

const impl = USE_MOCK ? mock : live;

export const createRequestApi = (payload) => impl.create(payload);
export const listMyRequestsApi = () => impl.listMine();
export const cancelRequestApi = (id) => impl.cancel(id);