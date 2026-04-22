import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import apiService from '../services/api';
import websocketService from '../services/websocket';
import configService from '../services/config';

export default function SettingsScreen() {
  const [backendUrl, setBackendUrl] = useState('');
  const [wsUrl, setWsUrl] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [autoReconnect, setAutoReconnect] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const config = await configService.load();
    setBackendUrl(config.backendUrl);
    setWsUrl(config.websocketUrl);
    setNotifications(config.notificationsEnabled);
    setAutoReconnect(config.autoReconnect);
  };

  const handleSaveBackendUrl = async () => {
    try {
      await configService.setBackendUrl(backendUrl);
      await configService.setWebSocketUrl(wsUrl);
      apiService.setBaseUrl(backendUrl);
      Alert.alert('✅ Erfolg', 'URLs gespeichert und werden beim nächsten Start verwendet');
    } catch (error) {
      Alert.alert('❌ Fehler', 'Ungültige URL');
    }
  };

  const handleReconnectWebSocket = () => {
    websocketService.disconnect();
    websocketService.connect(wsUrl);
    Alert.alert('🔄 Reconnect', 'WebSocket-Verbindung neu aufgebaut');
  };

  const handleTestConnection = async () => {
    try {
      const status = await apiService.getAiStatus();
      Alert.alert(
        '✅ Verbindung OK',
        `Backend erreichbar\nAI-Agent: ${status.controller.agent_type}`
      );
    } catch (error) {
      Alert.alert('❌ Verbindungsfehler', error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Verbindungseinstellungen */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌐 Verbindung</Text>
        
        <Text style={styles.label}>Backend URL (HTTP)</Text>
        <TextInput
          style={styles.input}
          value={backendUrl}
          onChangeText={setBackendUrl}
          placeholder="http://192.168.1.100:8001"
          placeholderTextColor="#555"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>WebSocket URL</Text>
        <TextInput
          style={styles.input}
          value={wsUrl}
          onChangeText={setWsUrl}
          placeholder="ws://192.168.1.100:8001/ws"
          placeholderTextColor="#555"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity style={styles.button} onPress={handleSaveBackendUrl}>
          <Text style={styles.buttonText}>💾 URLs speichern</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleReconnectWebSocket}
        >
          <Text style={styles.buttonText}>🔄 WebSocket neu verbinden</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleTestConnection}
        >
          <Text style={styles.buttonText}>🧪 Verbindung testen</Text>
        </TouchableOpacity>
      </View>

      {/* App-Einstellungen */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ App-Einstellungen</Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>🔔 Push-Benachrichtigungen</Text>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: '#555', true: '#4CAF50' }}
            thumbColor={notifications ? '#fff' : '#ddd'}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>🔄 Auto-Reconnect</Text>
          <Switch
            value={autoReconnect}
            onValueChange={setAutoReconnect}
            trackColor={{ false: '#555', true: '#4CAF50' }}
            thumbColor={autoReconnect ? '#fff' : '#ddd'}
          />
        </View>
      </View>

      {/* System-Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ System-Info</Text>
        
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>App Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Backend</Text>
          <Text style={styles.infoValue}>{backendUrl}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>WebSocket</Text>
          <Text style={styles.infoValue}>
            {websocketService.isConnected() ? '🟢 Verbunden' : '🔴 Getrennt'}
          </Text>
        </View>
      </View>

      {/* Hilfe */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>❓ Hilfe</Text>
        <Text style={styles.helpText}>
          Stellen Sie sicher, dass Ihr Smartphone im gleichen Netzwerk wie das
          EMS-Backend ist. Die IP-Adresse finden Sie in Ihren Router-Einstellungen.
        </Text>
        <Text style={styles.helpText}>
          Standard-Port: 8001 (HTTP/REST) und WebSocket
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  label: {
    color: '#888',
    fontSize: 14,
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  settingLabel: {
    color: '#fff',
    fontSize: 16,
  },
  infoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
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
    fontSize: 14,
  },
  helpText: {
    color: '#888',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
});
