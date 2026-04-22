import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import configService from '../services/config';

export default function ConfigScreen() {
  const [backendUrl, setBackendUrl] = useState('');
  const [websocketUrl, setWebSocketUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const config = await configService.load();
      setBackendUrl(config.backendUrl);
      setWebSocketUrl(config.websocketUrl);
      setLoading(false);
    })();
  }, []);

  const saveConfig = async () => {
    try {
      await configService.setBackendUrl(backendUrl);
      await configService.setWebSocketUrl(websocketUrl);
      Alert.alert('Erfolg', 'Konfiguration gespeichert!');
    } catch (e) {
      Alert.alert('Fehler', 'Konnte Konfiguration nicht speichern.');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}><Text>Lade Konfiguration…</Text></View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Backend URL</Text>
      <TextInput
        style={styles.input}
        value={backendUrl}
        onChangeText={setBackendUrl}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="https://reserved-april-nonemploying.ngrok-free.dev"
      />
      <Text style={styles.label}>WebSocket URL</Text>
      <TextInput
        style={styles.input}
        value={websocketUrl}
        onChangeText={setWebSocketUrl}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="wss://reserved-april-nonemploying.ngrok-free.dev/ws"
      />
      <Button title="Speichern" onPress={saveConfig} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#121212',
    justifyContent: 'center',
  },
  label: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
});