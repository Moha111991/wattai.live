import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import configService from '../services/config';
import apiService from '../services/api';

export default function OnboardingScreen({ navigation }) {
  const [backendUrl, setBackendUrl] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [scanProgress, setScanProgress] = useState({ scanned: 0, total: 0, percentage: 0 });

  const handleAutoDetect = async () => {
    setIsDetecting(true);
    setScanProgress({ scanned: 0, total: 0, percentage: 0 });
    
    try {
      const config = await configService.autoDetectBackend((progress) => {
        setScanProgress(progress);
      });
      
      if (config.backendUrl !== 'http://localhost:8001') {
        // Backend gefunden!
        await configService.setBackendUrl(config.backendUrl);
        await configService.setWebSocketUrl(config.websocketUrl);
        apiService.setBaseUrl(config.backendUrl);
        
        Alert.alert(
          '✅ Backend gefunden!',
          `Verbunden mit: ${config.backendUrl}`,
          [{ text: 'OK', onPress: () => navigation.replace('Main') }]
        );
      } else {
        // Nicht gefunden
        Alert.alert(
          '⚠️ Backend nicht gefunden',
          `Netzwerk vollständig gescannt (${scanProgress.scanned} IPs).\nBitte geben Sie die URL manuell ein.`
        );
      }
    } catch (error) {
      Alert.alert('❌ Fehler', 'Auto-Detection fehlgeschlagen: ' + error.message);
    } finally {
      setIsDetecting(false);
      setScanProgress({ scanned: 0, total: 0, percentage: 0 });
    }
  };

  const handleManualConnect = async () => {
    if (!backendUrl) {
      Alert.alert('⚠️ Fehler', 'Bitte geben Sie eine URL ein');
      return;
    }

    try {
      // URL normalisieren
      let url = backendUrl.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `http://${url}`;
      }
      if (!url.includes(':')) {
        url = `${url}:8001`;
      }

      // Verbindung testen
      setIsDetecting(true);
      const response = await Promise.race([
        fetch(`${url}/`, { method: 'GET' }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]);

      if (response.ok) {
        // HTTP 200 = Backend erreichbar
        let isEMS = false;
        try {
          const data = await response.json();
          // Prüfe ob es ein EMS-Backend ist (flexible Prüfung)
          isEMS = data.service && (
            data.service.includes('EMS') || 
            data.service.includes('Energy')
          );
        } catch {
          // Kein JSON - aber HTTP 200, akzeptieren wir
          isEMS = true;
        }

        if (isEMS || response.ok) {
          // Erfolgreich!
          await configService.setBackendUrl(url);
          await configService.setWebSocketUrl(url.replace('http', 'ws') + '/ws');
          apiService.setBaseUrl(url);

          Alert.alert(
            '✅ Verbunden!',
            `Backend erreichbar: ${url}`,
            [{ text: 'OK', onPress: () => navigation.replace('Main') }]
          );
        } else {
          Alert.alert('⚠️ Hinweis', 'Backend gefunden, aber möglicherweise kein EMS-System. Trotzdem speichern?', [
            { text: 'Abbrechen', style: 'cancel' },
            { 
              text: 'Ja, speichern',
              onPress: async () => {
                await configService.setBackendUrl(url);
                await configService.setWebSocketUrl(url.replace('http', 'ws') + '/ws');
                apiService.setBaseUrl(url);
                navigation.replace('Main');
              }
            }
          ]);
        }
      } else {
        Alert.alert('❌ Fehler', 'Backend nicht erreichbar - HTTP ' + response.status);
      }
    } catch (error) {
      Alert.alert('❌ Verbindungsfehler', 'Backend nicht erreichbar - prüfen Sie die URL');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSkip = async () => {
    // Skip für Development/Testing
    await configService.setBackendUrl('http://localhost:8001');
    navigation.replace('Main');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🌱⚡ EMS Mobile</Text>
        <Text style={styles.subtitle}>
          Willkommen beim AI-basierten Energiemanagementsystem
        </Text>
      </View>

      <View style={styles.content}>
        {/* Auto-Detection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Option 1: Automatisch finden</Text>
          <Text style={styles.hint}>
            Scannt das lokale Netzwerk nach dem Backend
          </Text>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleAutoDetect}
            disabled={isDetecting}
          >
            {isDetecting ? (
              <View>
                <ActivityIndicator color="#fff" />
                <Text style={styles.progressText}>
                  {scanProgress.percentage}% ({scanProgress.scanned} IPs)
                </Text>
                {scanProgress.currentSubnet && (
                  <Text style={styles.progressSubtext}>
                    Aktuell: {scanProgress.currentSubnet}.x
                  </Text>
                )}
              </View>
            ) : (
              <Text style={styles.buttonText}>🔍 Automatisch finden (Vollscan)</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Trennlinie */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ODER</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Manuelle Eingabe */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Option 2: Manuell eingeben</Text>
          <Text style={styles.hint}>
            Beispiele:{'\n'}
            • 192.168.1.100:8001{'\n'}
            • http://192.168.0.50:8001
          </Text>

          <TextInput
            style={styles.input}
            value={backendUrl}
            onChangeText={setBackendUrl}
            placeholder="192.168.1.100:8001"
            placeholderTextColor="#555"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleManualConnect}
            disabled={isDetecting || !backendUrl}
          >
            {isDetecting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>🔌 Verbinden</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Trennlinie */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ODER</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* QR-Code Scanner */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Option 3: QR-Code scannen</Text>
          <TouchableOpacity
            style={[styles.button, styles.qrButton]}
            onPress={() => navigation.navigate('QRScanner')}
          >
            <Text style={styles.buttonText}>📷 QR-Code scannen</Text>
          </TouchableOpacity>
        </View>

        {/* Skip */}
        <TouchableOpacity
          style={[styles.button, styles.tertiaryButton]}
          onPress={handleSkip}
        >
          <Text style={styles.tertiaryButtonText}>⏭️ Überspringen (Development)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 30,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  hint: {
    color: '#888',
    fontSize: 14,
    marginBottom: 15,
    lineHeight: 20,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#666',
    paddingHorizontal: 15,
    fontSize: 12,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  button: {
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 15,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  secondaryButton: {
    backgroundColor: '#2196F3',
  },
  qrButton: {
    backgroundColor: '#9C27B0',
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#555',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tertiaryButtonText: {
    color: '#888',
    fontSize: 14,
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  progressSubtext: {
    color: '#aaa',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
});
