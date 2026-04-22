/**
 * REST API Service für EMS Backend
 */

class ApiService {
  constructor() {
    this.baseUrl = 'http://localhost:8001'; // Default, wird von Config überschrieben
  }

  /**
   * Backend-URL setzen
   */
  setBaseUrl(url) {
    this.baseUrl = url.replace(/\/$/, ''); // Trailing slash entfernen
  }

  /**
   * Generische API-Anfrage
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ API Fehler (${endpoint}):`, error);
      throw error;
    }
  }

  /**
   * Aktuelle SOC-Werte abrufen
   */
  async getSocValues() {
    return await this.request('/soc');
  }

  /**
   * AI-Entscheidung für aktuelle Situation
   */
  async getAiDecision(systemData) {
    return await this.request('/ai/decision', {
      method: 'POST',
      body: JSON.stringify(systemData),
    });
  }

  /**
   * 24h-Energieplanung optimieren
   */
  async optimizeSchedule(forecastData, horizonHours = 24) {
    return await this.request('/ai/optimize', {
      method: 'POST',
      body: JSON.stringify({
        forecast_data: forecastData,
        horizon_hours: horizonHours,
      }),
    });
  }

  /**
   * AI-Controller Status
   */
  async getAiStatus() {
    return await this.request('/ai/status');
  }

  /**
   * Steuerungsbefehl senden
   */
  async sendControlCommand(deviceType, command, params = {}) {
    return await this.request('/control', {
      method: 'POST',
      body: JSON.stringify({
        device_type: deviceType,
        command: command,
        params: params,
      }),
    });
  }
}

export default new ApiService();
