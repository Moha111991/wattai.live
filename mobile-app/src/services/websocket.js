/**
 * WebSocket Service für Echtzeit-Verbindung zum EMS Backend
 */

class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = {};
    this.reconnectInterval = 5000;
    this.reconnectTimer = null;
    this.isConnecting = false;
  }

  /**
   * Verbindung zum Backend herstellen
   * @param {string} url - WebSocket URL (z.B. ws://192.168.1.100:8001/ws)
   */
  connect(url = 'ws://localhost:8001/ws') {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      console.log('⚠️ WebSocket bereits verbunden oder verbindet sich');
      return;
    }

    this.isConnecting = true;
    console.log(`🔌 Verbinde mit WebSocket: ${url}`);

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('✅ WebSocket verbunden');
        this.isConnecting = false;
        this.emit('connected');
        
        // Reconnect-Timer stoppen
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket Nachricht:', data);
          
          // Event basierend auf device-Typ emittieren
          if (data.device === 'ev') {
            this.emit('ev_soc_update', data.soc);
          } else if (data.device === 'home_battery') {
            this.emit('battery_soc_update', data.soc);
          }
          
          // Generisches Event für alle Nachrichten
          this.emit('message', data);
        } catch (error) {
          console.error('❌ Fehler beim Parsen der WebSocket-Nachricht:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket Fehler:', error);
        this.emit('error', error);
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket geschlossen');
        this.isConnecting = false;
        this.emit('disconnected');
        
        // Auto-Reconnect
        this.scheduleReconnect(url);
      };

    } catch (error) {
      console.error('❌ WebSocket Verbindungsfehler:', error);
      this.isConnecting = false;
      this.scheduleReconnect(url);
    }
  }

  /**
   * Automatischer Reconnect
   */
  scheduleReconnect(url) {
    if (this.reconnectTimer) return;
    
    console.log(`🔄 Reconnect in ${this.reconnectInterval / 1000}s...`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(url);
    }, this.reconnectInterval);
  }

  /**
   * Verbindung trennen
   */
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Nachricht senden
   */
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('⚠️ WebSocket nicht verbunden - Nachricht nicht gesendet');
    }
  }

  /**
   * Event-Listener registrieren
   * @param {string} event - Event-Name
   * @param {function} callback - Callback-Funktion
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * Event-Listener entfernen
   */
  off(event, callback) {
    if (!this.listeners[event]) return;
    
    this.listeners[event] = this.listeners[event].filter(
      (listener) => listener !== callback
    );
  }

  /**
   * Event emittieren
   */
  emit(event, data) {
    if (!this.listeners[event]) return;
    
    this.listeners[event].forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`❌ Fehler im Event-Listener (${event}):`, error);
      }
    });
  }

  /**
   * Verbindungsstatus
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Singleton-Instanz
export default new WebSocketService();
