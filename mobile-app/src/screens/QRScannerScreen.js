import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import configService from '../services/config';
import apiService from '../services/api';

export default function QRScannerScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    requestPermission();
  }, []);

  const requestPermission = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    
    try {
      // QR-Code sollte URL enthalten (z.B. "http://192.168.1.100:8001")
      let url = data.trim();
      
      // URL validieren
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `http://${url}`;
      }
      
      if (!url.includes(':')) {
        url = `${url}:8001`;
      }

      // Backend testen
      const response = await Promise.race([
        fetch(`${url}/`, { method: 'GET' }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]);

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.service && (
          responseData.service.includes('EMS') || 
          responseData.service.includes('Energy')
        )) {
          // Erfolg!
          await configService.setBackendUrl(url);
          await configService.setWebSocketUrl(url.replace('http', 'ws') + '/ws');
          apiService.setBaseUrl(url);

          Alert.alert(
            '✅ Verbunden!',
            `Backend: ${url}`,
            [{ text: 'OK', onPress: () => navigation.replace('Main') }]
          );
        } else {
          Alert.alert('❌ Fehler', 'QR-Code enthält kein EMS-Backend');
          setScanned(false);
        }
      } else {
        Alert.alert('❌ Fehler', 'Backend nicht erreichbar');
        setScanned(false);
      }
    } catch (error) {
      Alert.alert('❌ Fehler', 'Ungültiger QR-Code: ' + error.message);
      setScanned(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Kamera-Berechtigung wird angefordert...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Keine Kamera-Berechtigung</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>← Zurück</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.title}>QR-Code scannen</Text>
          <Text style={styles.subtitle}>
            Scannen Sie den QR-Code Ihres EMS-Backends
          </Text>
        </View>

        <View style={styles.scanArea}>
          <View style={styles.corner} style={[styles.corner, styles.topLeft]} />
          <View style={styles.corner} style={[styles.corner, styles.topRight]} />
          <View style={styles.corner} style={[styles.corner, styles.bottomLeft]} />
          <View style={styles.corner} style={[styles.corner, styles.bottomRight]} />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>← Zurück</Text>
          </TouchableOpacity>

          {scanned && (
            <TouchableOpacity
              style={[styles.button, styles.rescanButton]}
              onPress={() => setScanned(false)}
            >
              <Text style={styles.buttonText}>🔄 Erneut scannen</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 30,
  },
  header: {
    marginTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    alignSelf: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#4CAF50',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  footer: {
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 10,
  },
  rescanButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
});
