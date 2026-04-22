import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Slider,
  Alert,
} from 'react-native';
import apiService from '../services/api';

export default function ControlScreen() {
  const [isCharging, setIsCharging] = useState(false);
  const [chargeLimit, setChargeLimit] = useState(80);
  const [chargingPower, setChargingPower] = useState(7.4);
  const [autoMode, setAutoMode] = useState(true);
  const [aiDecision, setAiDecision] = useState(null);

  useEffect(() => {
    if (autoMode) {
      fetchAiDecision();
    }
  }, [autoMode]);

  const fetchAiDecision = async () => {
    try {
      const decision = await apiService.getAiDecision({
        pv_power: 5.0,
        battery_soc: 65.0,
        ev_soc: 45.0,
        household_load: 1.5,
        grid_price: 0.28,
        hour: new Date().getHours(),
        temperature: 20.0,
      });
      setAiDecision(decision.decision);
    } catch (error) {
      console.error('❌ Fehler beim Abrufen der AI-Entscheidung:', error);
    }
  };

  const handleStartCharging = async () => {
    try {
      await apiService.sendControlCommand('ev', 'start_charging', {
        power: chargingPower,
        limit: chargeLimit,
      });
      setIsCharging(true);
      Alert.alert('✅ Erfolg', 'Laden gestartet');
    } catch (error) {
      Alert.alert('❌ Fehler', 'Laden konnte nicht gestartet werden');
    }
  };

  const handleStopCharging = async () => {
    try {
      await apiService.sendControlCommand('ev', 'stop_charging', {});
      setIsCharging(false);
      Alert.alert('✅ Erfolg', 'Laden gestoppt');
    } catch (error) {
      Alert.alert('❌ Fehler', 'Laden konnte nicht gestoppt werden');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Auto-Modus */}
      <View style={styles.section}>
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>🤖 Auto-Modus</Text>
          <Switch
            value={autoMode}
            onValueChange={setAutoMode}
            trackColor={{ false: '#555', true: '#4CAF50' }}
            thumbColor={autoMode ? '#fff' : '#ddd'}
          />
        </View>
        {autoMode && aiDecision && (
          <View style={styles.aiCard}>
            <Text style={styles.aiTitle}>AI-Empfehlung:</Text>
            <Text style={styles.aiText}>{aiDecision.explanation}</Text>
            <Text style={styles.aiConfidence}>
              Konfidenz: {(aiDecision.confidence * 100).toFixed(0)}%
            </Text>
          </View>
        )}
      </View>

      {/* Manuelle Steuerung */}
      {!autoMode && (
        <>
          {/* Ladestatus */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚡ Ladestatus</Text>
            <View style={styles.statusCard}>
              <Text style={styles.statusLabel}>Status:</Text>
              <Text style={[styles.statusValue, isCharging ? styles.charging : styles.notCharging]}>
                {isCharging ? '🔋 Lädt' : '⏸️ Pausiert'}
              </Text>
            </View>
          </View>

          {/* Ladesteuerung */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎮 Steuerung</Text>
            
            {/* Ladegrenze */}
            <View style={styles.controlItem}>
              <Text style={styles.controlLabel}>Ladegrenze: {chargeLimit}%</Text>
              <Slider
                style={styles.slider}
                minimumValue={20}
                maximumValue={100}
                step={5}
                value={chargeLimit}
                onValueChange={setChargeLimit}
                minimumTrackTintColor="#4CAF50"
                maximumTrackTintColor="#555"
                thumbTintColor="#fff"
              />
            </View>

            {/* Ladeleistung */}
            <View style={styles.controlItem}>
              <Text style={styles.controlLabel}>Ladeleistung: {chargingPower} kW</Text>
              <Slider
                style={styles.slider}
                minimumValue={3.7}
                maximumValue={11.0}
                step={0.1}
                value={chargingPower}
                onValueChange={setChargingPower}
                minimumTrackTintColor="#4CAF50"
                maximumTrackTintColor="#555"
                thumbTintColor="#fff"
              />
              <Text style={styles.hint}>
                {chargingPower <= 3.7 ? '🐌 Langsam' : chargingPower <= 7.4 ? '⚡ Mittel' : '🚀 Schnell'}
              </Text>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.startButton, isCharging && styles.disabled]}
                onPress={handleStartCharging}
                disabled={isCharging}
              >
                <Text style={styles.buttonText}>▶️ Laden starten</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.stopButton, !isCharging && styles.disabled]}
                onPress={handleStopCharging}
                disabled={!isCharging}
              >
                <Text style={styles.buttonText}>⏸️ Laden stoppen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* Schnellaktionen */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Schnellaktionen</Text>
        <TouchableOpacity
          style={[styles.quickAction, styles.eco]}
          onPress={() => {
            setChargingPower(3.7);
            setChargeLimit(80);
            Alert.alert('🌿 Eco-Modus', 'Langsames Laden auf 80% aktiviert');
          }}
        >
          <Text style={styles.quickActionText}>🌿 Eco-Modus</Text>
          <Text style={styles.quickActionHint}>3.7 kW, 80%</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickAction, styles.fast]}
          onPress={() => {
            setChargingPower(11.0);
            setChargeLimit(100);
            Alert.alert('🚀 Schnell-Modus', 'Schnelles Laden auf 100% aktiviert');
          }}
        >
          <Text style={styles.quickActionText}>🚀 Schnell-Modus</Text>
          <Text style={styles.quickActionHint}>11 kW, 100%</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickAction, styles.solar]}
          onPress={() => {
            setChargingPower(7.4);
            setChargeLimit(90);
            Alert.alert('☀️ Solar-Modus', 'Laden mit PV-Überschuss aktiviert');
          }}
        >
          <Text style={styles.quickActionText}>☀️ Solar-Modus</Text>
          <Text style={styles.quickActionHint}>Nur PV, 90%</Text>
        </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  aiCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  aiTitle: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  aiText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  aiConfidence: {
    color: '#888',
    fontSize: 12,
  },
  statusCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    color: '#888',
    fontSize: 16,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  charging: {
    color: '#4CAF50',
  },
  notCharging: {
    color: '#888',
  },
  controlItem: {
    marginBottom: 20,
  },
  controlLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  hint: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#FF9800',
  },
  disabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickAction: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  eco: {
    backgroundColor: '#2E7D32',
  },
  fast: {
    backgroundColor: '#1976D2',
  },
  solar: {
    backgroundColor: '#F57C00',
  },
  quickActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  quickActionHint: {
    color: '#ddd',
    fontSize: 12,
  },
});
