import { authedClient } from "./authApi";
import { JOB_DESCRIPTIONS } from "../data/jobDescriptions";

const USE_MOCK = import.meta.env.VITE_AUTH_MOCK !== "false";

export const getJdPresetsApi = async () => {
  if (USE_MOCK) {
    return { presets: JOB_DESCRIPTIONS };
  }
  const { data } = await authedClient.get(`/documents/jd/presets`);
  return data; 
};

//JD CRUD
export const listJdsApi = async () => {
  if (USE_MOCK) return { job_descriptions: [] };
  const { data } = await authedClient.get(`/documents/jd`);
  return data;
};

export const createJdApi = async ({ title, company, text }) => {
  if (USE_MOCK) {
    return {
      id: `jd-local-${Date.now()}`,
      title,
      company,
      created_at: new Date().toISOString(),
    };
  }
  const { data } = await authedClient.post(`/documents/jd`, { title, company, text });
  return data;
};

export const getJdApi = async (jdId) => {
  if (USE_MOCK) {
    const jd = JOB_DESCRIPTIONS.find((j) => j.id === jdId);
    return jd
      ? { id: jd.id, title: jd.title, company: jd.company, text: jd.summary, created_at: null }
      : null;
  }
  const { data } = await authedClient.get(`/documents/jd/${jdId}`);
  return data;
};

export const deleteJdApi = async (jdId) => {
  if (USE_MOCK) return { ok: true };
  await authedClient.delete(`/documents/jd/${jdId}`);
  return { ok: true };
};

//cv CRUD
export const uploadCvApi = async (file) => {
  if (USE_MOCK) {
    return {
      id: `cv-local-${Date.now()}`,
      file_name: file?.name || "resume.pdf",
      size: file?.size || 0,
      uploaded_at: new Date().toISOString(),
      parsed: false,
    };
  }
  const form = new FormData();
  form.append("file", file);
  const { data } = await authedClient.post(`/documents/cv`, form);
  return data;
};

export const listCvsApi = async () => {
  if (USE_MOCK) return { cvs: [] };
  const { data } = await authedClient.get(`/documents/cv`);
  return data;
};

export const getCvUrlApi = async (cvId) => {
  if (USE_MOCK) return { url: "#", expires_in: 0 };
  const { data } = await authedClient.get(`/documents/cv/${cvId}/url`);
  return data; 
};

export const deleteCvApi = async (cvId) => {
  if (USE_MOCK) return { ok: true };
  await authedClient.delete(`/documents/cv/${cvId}`);
  return { ok: true };
};

export const isMockDocuments = () => USE_MOCK;