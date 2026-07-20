import axios from "axios";

// MOCK MODE: untill backend endpoint exists

const BASE = import.meta.env.VITE_INTERVIEW_API_URL || "http://localhost:8000";
const USE_MOCK = import.meta.env.VITE_AUTH_MOCK !== "false";

const TOKEN_KEY = "pitchnode_access_token";
const REFRESH_KEY = "pitchnode_refresh_token";

export const SELF_ASSIGNABLE_ROLES = ["user", "expert_applicant"];

export const ROLES = {
  USER: "user",
  EXPERT_APPLICANT: "expert_applicant",
  EXPERT: "expert",
  ADMIN: "admin",
};

//tokens
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setTokens = ({access_token, refresh_token}) => {
    if(access_token) localStorage.setItem(TOKEN_KEY, access_token);
    if(refresh_token) localStorage.setItem(REFRESH_KEY, refresh_token);
}

export const clearTokens = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY)
}

//axios with bearer token
export const authClient = axios.create({baseURL: BASE});
authClient.interceptors.request.use((config) => {
    const token = getToken();
    if(token) config.headers.Authorization = `Bearer ${token}`;
    return config;
})

const MOCK_USERS_KEY = "pitchnode_mock_users";
const MOCK_SESSION_KEY = "pitchnode_mock_session";

const readMockUsers = () => {
    try {
    return JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

const writeMockUsers = (users) => 
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));

//seeding one admin
function seedMockUsers(){
    const users = readMockUsers();

    if(users.length) return users;
    const seeded = [
        {
            id: "admin-0001",
            email: "admin@pitchnode.dev",
            password: "admin123",
            full_name: "Platform Admin",
            role: ROLES.ADMIN,
            verified: true,
            headline: null,
            expertise: [],
            created_at: new Date().toISOString(),
        },
    ];
    writeMockUsers(seeded);
    return seeded;
}

const publicUser = (u) => {
  if (!u) return null;
  const { password, ...rest } = u;
  void password;
  return rest;
};

const delay = (ms = 320) => new Promise((r) => setTimeout(r, ms));

const mock = {
    async register({email, password, full_name, role}){
        await delay();
        const users = seedMockUsers();

        if(!SELF_ASSIGNABLE_ROLES.includes(role)){
            const err = new Error("Role not self-assignable");
            err.code = "ROLE_NOT_SELF_ASSIGNABLE";
            throw err;
        }

        if(users.some((u) => u.email.toLowerCase() === email.toLowerCase())){
            const err = new Error("An account with that email already exists");
            err.code = "EMAIL_TAKEN";
            throw err;
        }

        const user = {
            id: `u-${Date.now()}`,
            email,
            password,
            full_name,
            role,
            verified: role === ROLES.USER,
            headline: null,
            expertise: [],
            created_at: new Date().toISOString(),
        };

        users.push(user);
        writeMockUsers(users);
        localStorage.setItem(MOCK_SESSION_KEY, user.id);

        return {
            user: publicUser(user),
            access_token: `mock.${user.id}`,
            refresh_token: `mockr.${user.id}`,
        };
    },

    async login({email, password}) {
        await delay();
        const users = seedMockUsers();
        const user = users.find(
            (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );

        if(!user){
            const err = new Error("Incorrect email or password");
            err.code = "INVALID_CREDENTIALS";
            throw err;
        }

        localStorage.setItem(MOCK_SESSION_KEY, user.id);
        return {
            user: publicUser(user),
            access_token: `mock.${user.id}`,
            refresh_token: `mock.${user.id}`,
        };
    },

    async me() {
        await delay(120);
        const id = localStorage.getItem(MOCK_SESSION_KEY);
        const users = seedMockUsers();
        const user = users.find((u) => u.id === id);

        if (!user) {
            const err = new Error("Not authenticated");
            err.status = 401;
            throw err;
        }
        return publicUser(user);
    },

    async logout() {
        await delay(80);
        localStorage.removeItem(MOCK_SESSION_KEY);
    },

    async updateMe(patch) {
        await delay();
        const id = localStorage.getItem(MOCK_SESSION_KEY);
        const users = seedMockUsers();
        const i = users.findIndex((u) => u.id === id);

        if(i === -1) throw new Error("Not Authenticated");

        const {role, ...safe} = patch;
        void role;
        users[i] = { ...users[i], ...safe};
        writeMockUsers(users);
        return publicUser(users[i]);
    },

    async listUsers() {
        await delay();
        return { users: seedMockUsers().map(publicUser), total: readMockUsers().length };
    },

    async setRole(userId, role) {
        await delay();
        const users = seedMockUsers();
        const i = users.findIndex((u) => u.id === userId);
        if (i === -1) throw new Error("User not found");
        users[i].role = role;
        users[i].verified = role !== ROLES.EXPERT_APPLICANT;
        writeMockUsers(users);
        return publicUser(users[i]);
    },
};

//live implementation
const live = {
  register: (body) => axios.post(`${BASE}/auth/register`, body).then((r) => r.data),
  login: (body) => axios.post(`${BASE}/auth/login`, body).then((r) => r.data),
  me: () => authedClient.get("/auth/me").then((r) => r.data),
  logout: () => authedClient.post("/auth/logout").then((r) => r.data),
  updateMe: (patch) => authedClient.patch("/auth/me", patch).then((r) => r.data),
  listUsers: (params) => authedClient.get("/admin/users", { params }).then((r) => r.data),
  setRole: (userId, role) =>
    authedClient.patch(`/admin/users/${userId}/role`, { role }).then((r) => r.data),
};

const impl = USE_MOCK ? mock : live;

//public-api
export const registerApi = async ({email, password, full_name, role}) => {
    const safeRole = SELF_ASSIGNABLE_ROLES.includes(role) ? role : ROLES.USER;
    const data = await impl.register({ email, password, full_name, role: safeRole });
    setTokens(data);
    return data.user;
}

export const loginApi = async ({ email, password }) => {
  const data = await impl.login({ email, password });
  setTokens(data);
  return data.user;
};

export const meApi = () => impl.me();

export const logoutApi = async () => {
    try{
        await impl.logout();
    } finally {
        clearTokens();
    }
}

export const updateMeApi = (patch) => impl.updateMe(patch);

/* Admin */
export const adminListUsersApi = (params) => impl.listUsers(params);
export const adminSetRoleApi = (userId, role) => impl.setRole(userId, role);

export const isMockAuth = () => USE_MOCK;

