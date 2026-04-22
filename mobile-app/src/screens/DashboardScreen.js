import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import SOCGauge from '../components/SOCGauge';
import websocketService from '../services/websocket';
import apiService from '../services/api';
import configService from '../services/config';

export default function DashboardScreen() {
  const [evSoc, setEvSoc] = useState(0);
  const [batterySoc, setBatterySoc] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Konfiguration laden und dann verbinden
    initializeConnection();

    return () => {
      websocketService.disconnect();
    };
  }, []);

  const initializeConnection = async () => {
    // Config laden
    const config = await configService.load();
    
    // API-URL setzen
    apiService.setBaseUrl(config.backendUrl);
    
    // WebSocket-Verbindung aufbauen
    connectWebSocket(config.websocketUrl);

    // Initiale Daten über REST API laden
    fetchInitialData();
  };

  const connectWebSocket = (wsUrl) => {
    // WebSocket-Listener
    websocketService.on('connected', () => {
      console.log('✅ Dashboard: WebSocket verbunden');
      setIsConnected(true);
      setIsLoading(false);
    });

    websocketService.on('disconnected', () => {
      console.log('❌ Dashboard: WebSocket getrennt');
      setIsConnected(false);
    });

    websocketService.on('ev_soc_update', (soc) => {
      console.log('🚗 EV SOC Update:', soc);
      setEvSoc(soc);
    });

    websocketService.on('battery_soc_update', (soc) => {
      console.log('🔋 Batterie SOC Update:', soc);
      setBatterySoc(soc);
    });

    // Verbindung herstellen mit URL aus Config
    websocketService.connect(wsUrl);
  };

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getSocValues();
      setEvSoc(data.ev_soc || 0);
      setBatterySoc(data.home_battery_soc || 0);
    } catch (error) {
      console.error('❌ Fehler beim Laden der Daten:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInitialData();
    setRefreshing(false);
  };

  // Reichweite berechnen (geschätzt)
  const calculateRange = (soc, capacity = 75) => {
    const efficiency = 6.5; // km/kWh (geschätzt)
    const usableCapacity = capacity * (soc / 100);
    return Math.round(usableCapacity * efficiency);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Verbindungsstatus */}
      <View style={styles.statusBar}>
        <View style={[styles.statusDot, isConnected ? styles.connected : styles.disconnected]} />
        <Text style={styles.statusText}>
          {isConnected ? '🟢 Verbunden' : '🔴 Nicht verbunden'}
        </Text>
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Lade Daten...</Text>
        </View>
      ) : (
        <>
          {/* E-Auto SOC */}
          <View style={styles.section}>
            <SOCGauge
              soc={evSoc}
              title="🚗 E-Auto"
              size={180}
              color="#4CAF50"
            />
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Geschätzte Reichweite</Text>
              <Text style={styles.infoValue}>{calculateRange(evSoc)} km</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Ladestand</Text>
              <Text style={styles.infoValue}>{Math.round(evSoc)}%</Text>
            </View>
          </View>

          {/* Heim-Batterie SOC */}
          <View style={styles.section}>
            <SOCGauge
              soc={batterySoc}
              title="🔋 Heim-Batterie"
              size={180}
              color="#2196F3"
            />
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Kapazität (13.5 kWh)</Text>
              <Text style={styles.infoValue}>
                {((batterySoc / 100) * 13.5).toFixed(1)} kWh
              </Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Ladestand</Text>
              <Text style={styles.infoValue}>{Math.round(batterySoc)}%</Text>
            </View>
          </View>

          {/* Schnellinfo */}
          <View style={styles.quickInfo}>
            <Text style={styles.sectionTitle}>📊 Schnellübersicht</Text>
            <View style={styles.quickInfoRow}>
              <View style={styles.quickInfoItem}>
                <Text style={styles.quickInfoLabel}>EV Reichweite</Text>
                <Text style={styles.quickInfoValue}>{calculateRange(evSoc)} km</Text>
              </View>
              <View style={styles.quickInfoItem}>
                <Text style={styles.quickInfoLabel}>Batterie</Text>
                <Text style={styles.quickInfoValue}>
                  {((batterySoc / 100) * 13.5).toFixed(1)} kWh
                </Text>
              </View>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  connected: {
    backgroundColor: '#4CAF50',
  },
  disconnected: {
    backgroundColor: '#F44336',
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  loadingText: {
    color: '#888',
    marginTop: 10,
    fontSize: 16,
  },
  section: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  infoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
    width: '80%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: '#888',
    fontSize: 14,
  },
  infoValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quickInfo: {
    padding: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  quickInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickInfoItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  quickInfoLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 5,
  },
  quickInfoValue: {
    color: '#4CAF50',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
