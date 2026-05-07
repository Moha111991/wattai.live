const PROD_API_URL = 'https://www.wattai.live';

const isLocalHost =
  typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);

const normalizeApiUrl = (raw?: string | null): string => {
  const value = (raw || '').trim();
  if (!value) return '';

  try {
    const parsed = new URL(value);
    if (['localhost', '127.0.0.1'].includes(parsed.hostname) && !isLocalHost) {
      return PROD_API_URL;
    }
    // api.wattai.live → www.wattai.live (same Railway service)
    if (parsed.hostname === 'api.wattai.live') {
      parsed.hostname = 'www.wattai.live';
    }
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return value.replace(/\/$/, '');
  }
};

const fallbackApiUrl = isLocalHost ? 'http://localhost:8000' : PROD_API_URL;

export const API_URL = normalizeApiUrl(import.meta.env.VITE_API_URL) || fallbackApiUrl;

export const resolveWsUrl = (): string => {
  const wsOverride = (import.meta.env.VITE_API_WS || '').trim();
  if (wsOverride) {
    return wsOverride;
  }
  return `${API_URL.replace(/^http/, 'ws')}/ws`;
};

export const WS_URL = resolveWsUrl();

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