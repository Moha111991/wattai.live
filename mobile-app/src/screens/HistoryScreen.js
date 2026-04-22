import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import LiveChart from '../components/LiveChart';
import websocketService from '../services/websocket';

export default function HistoryScreen() {
  const [evHistory, setEvHistory] = useState([]);
  const [batteryHistory, setBatteryHistory] = useState([]);
  const maxDataPoints = 50;

  useEffect(() => {
    // WebSocket-Listener für History
    websocketService.on('ev_soc_update', (soc) => {
      setEvHistory(prev => {
        const newHistory = [...prev, soc];
        if (newHistory.length > maxDataPoints) {
          return newHistory.slice(-maxDataPoints);
        }
        return newHistory;
      });
    });

    websocketService.on('battery_soc_update', (soc) => {
      setBatteryHistory(prev => {
        const newHistory = [...prev, soc];
        if (newHistory.length > maxDataPoints) {
          return newHistory.slice(-maxDataPoints);
        }
        return newHistory;
      });
    });

    return () => {
      // Cleanup
    };
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 SOC-Verlauf</Text>
        <Text style={styles.subtitle}>
          Letzte {maxDataPoints} Messwerte (Echtzeit)
        </Text>
      </View>

      {/* EV Verlauf */}
      <LiveChart
        data={evHistory}
        title="🚗 E-Auto SOC"
        color="#4CAF50"
        maxDataPoints={maxDataPoints}
      />

      {/* Batterie Verlauf */}
      <LiveChart
        data={batteryHistory}
        title="🔋 Heim-Batterie SOC"
        color="#2196F3"
        maxDataPoints={maxDataPoints}
      />

      {/* Statistiken */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>📈 Statistiken</Text>
        
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>EV Durchschnitt</Text>
          <Text style={styles.statValue}>
            {evHistory.length > 0
              ? (evHistory.reduce((a, b) => a + b, 0) / evHistory.length).toFixed(1)
              : '—'}
            %
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Batterie Durchschnitt</Text>
          <Text style={styles.statValue}>
            {batteryHistory.length > 0
              ? (batteryHistory.reduce((a, b) => a + b, 0) / batteryHistory.length).toFixed(1)
              : '—'}
            %
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>EV Minimum</Text>
          <Text style={styles.statValue}>
            {evHistory.length > 0 ? Math.min(...evHistory).toFixed(1) : '—'}%
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>EV Maximum</Text>
          <Text style={styles.statValue}>
            {evHistory.length > 0 ? Math.max(...evHistory).toFixed(1) : '—'}%
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    color: '#888',
    fontSize: 16,
  },
  statValue: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
