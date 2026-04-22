/**
 * App-Konfiguration mit persistentem Storage
 * 
 * Verwaltet Backend-URLs und andere Einstellungen
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';

const CONFIG_KEY = '@ems_config';

const DEFAULT_CONFIG = {
  backendUrl: 'http://localhost:8001',
  websocketUrl: 'ws://localhost:8001/ws',
  notificationsEnabled: true,
  autoReconnect: true,
};

class ConfigService {
  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.listeners = [];
  }

  /**
   * Konfiguration aus Storage laden
   */
  async load() {
    try {
      const stored = await AsyncStorage.getItem(CONFIG_KEY);
      if (stored) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
        console.log('✅ Konfiguration geladen:', this.config);
      } else {
        // Auto-Detect für Development
        this.config = await this.autoDetectBackend();
        await this.save();
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden der Konfiguration:', error);
      this.config = { ...DEFAULT_CONFIG };
    }
    return this.config;
  }

  /**
   * Konfiguration speichern
   */
  async save() {
    try {
      await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(this.config));
      console.log('💾 Konfiguration gespeichert');
      this.notifyListeners();
    } catch (error) {
      console.error('❌ Fehler beim Speichern der Konfiguration:', error);
    }
  }

  /**
   * Backend-URL setzen
   */
  async setBackendUrl(url) {
    // URL normalisieren
    const normalizedUrl = url.replace(/\/$/, '');
    this.config.backendUrl = normalizedUrl;
    
    // WebSocket-URL automatisch ableiten falls nicht explizit gesetzt
    if (!this.config.websocketUrl || this.config.websocketUrl.includes(this.config.backendUrl.replace('http', 'ws'))) {
      this.config.websocketUrl = normalizedUrl.replace('http', 'ws') + '/ws';
    }
    
    await this.save();
  }

  /**
   * WebSocket-URL setzen
   */
  async setWebSocketUrl(url) {
    this.config.websocketUrl = url;
    await this.save();
  }

  /**
   * Benachrichtigungen aktivieren/deaktivieren
   */
  async setNotificationsEnabled(enabled) {
    this.config.notificationsEnabled = enabled;
    await this.save();
  }

  /**
   * Auto-Reconnect aktivieren/deaktivieren
   */
  async setAutoReconnect(enabled) {
    this.config.autoReconnect = enabled;
    await this.save();
  }

  /**
   * Aktuelle Konfiguration abrufen
   */
  get() {
    return { ...this.config };
  }

  /**
   * Backend automatisch erkennen mit intelligentem Netzwerk-Scan
   * 1. Scannt das aktuelle Gerät-Subnet (z.B. 192.168.178.x)
   * 2. Falls nicht gefunden: Fallback auf Standard-Subnets
   */
  async autoDetectBackend(progressCallback = null) {
    console.log('🔍 Starte intelligenten Netzwerk-Scan...');
    
    const port = 8001;
    let totalScanned = 0;

    // SCHRITT 1: Aktuelles Gerät-Subnet ermitteln
    const deviceSubnet = await this.getDeviceSubnet();
    console.log(`📍 Gerät-Subnet: ${deviceSubnet || 'unbekannt'}`);

    // SCHRITT 2: Primär-Subnets (inkl. Device-Subnet)
    const primarySubnets = [];
    if (deviceSubnet) {
      primarySubnets.push(deviceSubnet); // Zuerst das aktuelle Subnet!
    }
    
    // Standard-Subnets als Fallback
    const fallbackSubnets = [
      '192.168.1',
      '192.168.0', 
      '192.168.178', // FritzBox Standard
      '10.0.0',
      '10.0.1',
    ];
    
    // Deduplizieren (Device-Subnet nicht doppelt scannen)
    for (const subnet of fallbackSubnets) {
      if (subnet !== deviceSubnet) {
        primarySubnets.push(subnet);
      }
    }

    console.log(`🔍 Scanne Subnets in dieser Reihenfolge: ${primarySubnets.join(', ')}`);

    // SCHRITT 3: Jedes Subnet scannen (stoppt bei erstem Treffer)
    for (const subnet of primarySubnets) {
      console.log(`🔎 Scanne ${subnet}.0/24...`);
      
      const allCandidates = [];
      for (let i = 1; i <= 254; i++) {
        allCandidates.push(`http://${subnet}.${i}:${port}`);
      }
      
      const totalIPs = allCandidates.length;

      // Batch-Scanning mit Parallelität
      const BATCH_SIZE = 30; // 30 parallele Requests
      const TIMEOUT = 600;   // 600ms pro Request (schneller)

      for (let batchStart = 0; batchStart < allCandidates.length; batchStart += BATCH_SIZE) {
        const batch = allCandidates.slice(batchStart, batchStart + BATCH_SIZE);
        
        // Parallel alle IPs in diesem Batch prüfen
        const results = await Promise.allSettled(
          batch.map(url => this.checkBackendUrl(url, TIMEOUT))
        );

        // Ersten Treffer zurückgeben
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          if (result.status === 'fulfilled' && result.value) {
            console.log(`✅ Backend gefunden: ${result.value}`);
            return {
              ...DEFAULT_CONFIG,
              backendUrl: result.value,
              websocketUrl: result.value.replace('http', 'ws') + '/ws',
            };
          }
        }

        // Progress-Update
        totalScanned += batch.length;
        if (progressCallback) {
          progressCallback({
            scanned: totalScanned,
            total: primarySubnets.length * 254,
            percentage: Math.round((totalScanned / (primarySubnets.length * 254)) * 100),
            currentSubnet: subnet
          });
        }
      }
      
      console.log(`⚠️ Nichts in ${subnet}.0/24 gefunden`);
    }

    console.log('⚠️ Backend nicht gefunden nach vollständigem Scan');
    return DEFAULT_CONFIG;
  }

  /**
   * Aktuelles Gerät-Subnet ermitteln
   * Beispiel: Gerät hat IP 192.168.178.42 → return '192.168.178'
   */
  async getDeviceSubnet() {
    try {
      const ip = await Network.getIpAddressAsync();
      
      if (!ip || ip === '0.0.0.0') {
        console.log('⚠️ Keine IP-Adresse verfügbar');
        return null;
      }

      console.log(`📱 Gerät-IP: ${ip}`);
      
      // IP-Adresse parsen (z.B. "192.168.178.42" → "192.168.178")
      const parts = ip.split('.');
      if (parts.length === 4) {
        const subnet = `${parts[0]}.${parts[1]}.${parts[2]}`;
        return subnet;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Fehler beim Ermitteln der Gerät-IP:', error);
      return null;
    }
  }

  /**
   * Einzelne URL auf EMS-Backend prüfen
   */
  async checkBackendUrl(url, timeout = 1000) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(`${url}/`, { 
        method: 'GET',
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        try {
          const data = await response.json();
          // Validiere EMS-Backend
          if (data.service && (
            data.service.includes('EMS') || 
            data.service.includes('Energy')
          )) {
            return url; // Gefunden!
          }
        } catch {
          // Kein JSON, kein EMS-Backend
        }
      }
      return null;
    } catch (error) {
      return null; // Nicht erreichbar
    }
  }

  /**
   * Listener für Config-Änderungen
   */
  onChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Alle Listener benachrichtigen
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.config);
      } catch (error) {
        console.error('❌ Fehler im Config-Listener:', error);
      }
    });
  }

  /**
   * Konfiguration zurücksetzen
   */
  async reset() {
    this.config = { ...DEFAULT_CONFIG };
    await this.save();
  }
}

export default new ConfigService();
