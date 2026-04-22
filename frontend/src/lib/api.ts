export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const WS_URL = API_URL.replace(/^http/, 'ws');

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