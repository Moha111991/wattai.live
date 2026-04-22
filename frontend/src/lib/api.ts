const isLocalHost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
export const API_URL = import.meta.env.VITE_API_URL || (isLocalHost ? 'http://localhost:8000' : window.location.origin);
export const WS_URL = API_URL ? API_URL.replace(/^http/, 'ws') : '';

console.log('[API_URL]', API_URL);
console.log('[WS_URL]', WS_URL);

// API helper functions
export async function fetchDevices() {
  const res = await fetch(`${API_URL}/devices`);
  return res.json();
}

export async function fetchRealtime() {
  const res = await fetch(`${API_URL}/realtime`);
  return res.json();
}

export async function fetchAIRecommendation() {
  const res = await fetch(`${API_URL}/airecommendation`, {
    headers: {
      'X-API-Key': 'mein_geheimer_schulkey123'
    }
  });
  return res.json();
}

export async function fetchEVProfiles() {
  const res = await fetch(`${API_URL}/ev/profiles`);
  return res.json();
}