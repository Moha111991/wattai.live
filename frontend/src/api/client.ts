import axios from "axios";

export const api = axios.create({
  baseURL: 'https://locations-member-excel-uni.trycloudflare.com',
  timeout: 5000,
  headers: {
    'X-API-Key': import.meta.env.VITE_API_KEY || 'Quick10'
  }
});

export const getHealth = () => api.get("/");
export const getSOC = () => api.get("/soc");
export const getPVRealtime = () => api.get("/pv/realtime");
export const getGridRealtime = () => api.get("/grid/realtime");
export const getInverterStatus = () => api.get("/inverter/status");

export const fetch = (url: string, {
  method = 'GET',
  headers = {}
}: { method?: string; headers?: Record<string, string> } = {}) => api.get(url, {
  method,
  headers: {
    'X-API-Key': import.meta.env.VITE_API_KEY || 'Quick10',
    ...headers
  }
});