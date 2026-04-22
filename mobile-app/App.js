import ConfigScreen from './src/screens/ConfigScreen';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Screens
import OnboardingScreen from './src/screens/OnboardingScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ControlScreen from './src/screens/ControlScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Services
import configService from './src/services/config';

// Icons (simple text-based for now)
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#1a1a1a',
            },
            headerTintColor: '#fff',
            tabBarStyle: {
              backgroundColor: '#1a1a1a',
              borderTopColor: '#333',
            },
            tabBarActiveTintColor: '#4CAF50',
            tabBarInactiveTintColor: '#888',
          }}
        >
          <Tab.Screen 
            name="Dashboard" 
            component={DashboardScreen}
            options={{
              title: '⚡ Dashboard',
              tabBarLabel: 'Dashboard',
            }}
          />
          <Tab.Screen 
            name="Control" 
            component={ControlScreen}
            options={{
              title: '🎮 Steuerung',
              tabBarLabel: 'Steuerung',
            }}
          />
          <Tab.Screen 
            name="History" 
            component={HistoryScreen}
            options={{
              title: '📊 Verlauf',
              tabBarLabel: 'Verlauf',
            }}
          />
          <Tab.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{
              title: '⚙️ Einstellungen',
              tabBarLabel: 'Einstellungen',
            }}
          />
        </Tab.Navigator>
  );
}

export default function App() {
  const [isFirstRun, setIsFirstRun] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkFirstRun();
  }, []);

  const checkFirstRun = async () => {
    try {
      const config = await configService.load();
      
      // Prüfen ob Backend-URL bereits konfiguriert ist (nicht localhost)
      if (config.backendUrl && config.backendUrl !== 'http://localhost:8001') {
        setIsFirstRun(false);
      } else {
        setIsFirstRun(true);
      }
    } catch (error) {
      setIsFirstRun(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null; // Splash Screen
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isFirstRun ? (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          ) : null}
          <Stack.Screen name="QRScanner" component={QRScannerScreen} />
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Config" component={ConfigScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
