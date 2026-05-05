import React, { useState } from 'react';
import ChargingStationStatus from './components/ChargingStationStatus';
import EnhancedEnergyFlow from './components/EnhancedEnergyFlow';
import EnhancedSmartHomeDashboard from './components/EnhancedSmartHomeDashboard';
import AIRecommendationsWidget from './components/AIRecommendationsWidget';
import {
  ChargingStationIcon,
  BatteryIcon,
  EnergyFlowArrow,
  SolarPanelIcon,
  GridIcon,
  HouseIcon,
  EVIcon,
  StatusBadge
} from './components/icons/EnergyIcons';

/**
 * UI/UX Demo Page
 * Zeigt alle neuen Komponenten und Icons in Aktion
 */

const UIUXDemo: React.FC = () => {
  const [tab, setTab] = useState<'icons' | 'charging' | 'energy-flow' | 'smart-home' | 'ai'>('icons');

  // Demo-Daten
  const energyFlowData = {
    pv_power_kw: 4.2,
    house_load_kw: 2.8,
    ev_power_kw: 7.0,
    battery_power_kw: -1.5,
    battery_soc: 75,
    grid_import_kw: 0.1,
    grid_export_kw: 0.0,
    ev_soc: 65,
    ev_charging: true
  };

  const smartHomeDevices = [
    {
      id: 'washing_machine',
      name: 'Waschmaschine',
      type: 'washing_machine' as const,
      status: 'standby' as const,
      power_w: 0,
      flexibility: 'high' as const,
      priority: 7,
      schedulable: true,
      estimated_runtime_min: 120,
      room: 'Hauswirtschaftsraum'
    },
    {
      id: 'dishwasher',
      name: 'Geschirrspüler',
      type: 'dishwasher' as const,
      status: 'active' as const,
      power_w: 1200,
      flexibility: 'high' as const,
      priority: 5,
      schedulable: true,
      estimated_runtime_min: 90,
      room: 'Küche'
    },
    {
      id: 'heat_pump',
      name: 'Wärmepumpe',
      type: 'heat_pump' as const,
      status: 'active' as const,
      power_w: 3500,
      flexibility: 'medium' as const,
      priority: 9,
      schedulable: false,
      room: 'Heizungsraum'
    },
    {
      id: 'ev_charger',
      name: 'Wallbox',
      type: 'ev_charger' as const,
      status: 'active' as const,
      power_w: 7200,
      flexibility: 'high' as const,
      priority: 8,
      schedulable: true,
      room: 'Garage'
    },
    {
      id: 'lights',
      name: 'Smart Lights',
      type: 'lights' as const,
      status: 'standby' as const,
      power_w: 45,
      flexibility: 'low' as const,
      priority: 3,
      schedulable: false,
      room: 'Wohnzimmer'
    }
  ];

  const recommendations = [
    {
      id: 'rec_001',
      type: 'cost_saving' as const,
      title: 'Waschmaschine verschieben',
      description: 'Verschieben Sie die Waschmaschine auf 14:00 Uhr für maximale PV-Nutzung und Kosteneinsparung',
      confidence: 87,
      priority: 'high' as const,
      estimated_savings_eur: 0.85,
      co2_reduction_kg: 0.3,
      energy_saved_kwh: 2.5,
      time_horizon: '6h' as const,
      valid_until: new Date(Date.now() + 6 * 60 * 60 * 1000),
      reasoning: [
        'PV-Prognose zeigt Peak um 14:00 Uhr mit 5.2 kW',
        'Strompreis aktuell hoch (0.35 €/kWh), Mittags nur 0.22 €/kWh',
        'Gerät ist als hochflexibel markiert'
      ],
      data_sources: ['Wetter-API', 'Strompreis-API', 'Geräteprofil'],
      actions: [
        { label: 'Akzeptieren', type: 'accept' as const },
        { label: 'Planen', type: 'schedule' as const },
        { label: 'Ablehnen', type: 'dismiss' as const }
      ]
    },
    {
      id: 'rec_002',
      type: 'sustainability' as const,
      title: 'Batterieentladung optimieren',
      description: 'Entladen Sie die Batterie zwischen 18:00-20:00 Uhr, um Netzstrom zu vermeiden',
      confidence: 92,
      priority: 'medium' as const,
      co2_reduction_kg: 1.2,
      energy_saved_kwh: 5.0,
      time_horizon: '24h' as const,
      reasoning: [
        'Batterie ist zu 75% geladen',
        'Abendspitze mit hoher CO₂-Intensität erwartet',
        'PV-Überschuss morgen zum Nachladen verfügbar'
      ],
      data_sources: ['Batterie-Telemetrie', 'Stromnetz-API', 'PV-Prognose'],
      actions: [
        { label: 'Aktivieren', type: 'accept' as const },
        { label: 'Ignorieren', type: 'dismiss' as const }
      ]
    },
    {
      id: 'rec_003',
      type: 'charging' as const,
      title: 'EV-Ladeleistung erhöhen',
      description: 'Erhöhen Sie die EV-Ladeleistung auf 11 kW, PV-Überschuss verfügbar',
      confidence: 95,
      priority: 'critical' as const,
      estimated_savings_eur: 2.50,
      co2_reduction_kg: 0.8,
      time_horizon: 'immediate' as const,
      reasoning: [
        'Aktuelle PV-Leistung: 4.2 kW, nur 2.8 kW im Haus verbraucht',
        '1.4 kW werden ins Netz eingespeist (0.08 €/kWh)',
        'EV lädt aktuell nur mit 7 kW, kann auf 11 kW erhöht werden'
      ],
      data_sources: ['PV-Inverter', 'Smart Meter', 'Wallbox'],
      actions: [
        { label: 'Jetzt erhöhen', type: 'accept' as const },
        { label: 'Nicht jetzt', type: 'dismiss' as const }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-6 text-white shadow-2xl">
          <h1 className="text-4xl font-bold mb-2">🎨 UI/UX Demo - EnergyFlowHub_EV</h1>
          <p className="text-blue-100">Interaktive Demonstration aller neuen Komponenten und Icons</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setTab('icons')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              tab === 'icons' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            📦 Icon System
          </button>
          <button
            onClick={() => setTab('charging')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              tab === 'charging' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            🔌 Charging Station
          </button>
          <button
            onClick={() => setTab('energy-flow')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              tab === 'energy-flow' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            ⚡ Energy Flow
          </button>
          <button
            onClick={() => setTab('smart-home')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              tab === 'smart-home' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            🏠 Smart Home
          </button>
          <button
            onClick={() => setTab('ai')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              tab === 'ai' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            🤖 AI Recommendations
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {tab === 'icons' && (
            <>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Icon System</h2>
                
                {/* Charging Station Icons */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Charging Station Status</h3>
                  <div className="flex gap-4 flex-wrap">
                    <div className="text-center">
                      <ChargingStationIcon size={60} status="idle" />
                      <p className="text-sm mt-2">Idle</p>
                    </div>
                    <div className="text-center">
                      <ChargingStationIcon size={60} status="charging" animated />
                      <p className="text-sm mt-2">Charging</p>
                    </div>
                    <div className="text-center">
                      <ChargingStationIcon size={60} status="v2h" animated />
                      <p className="text-sm mt-2">V2H</p>
                    </div>
                    <div className="text-center">
                      <ChargingStationIcon size={60} status="error" />
                      <p className="text-sm mt-2">Error</p>
                    </div>
                  </div>
                </div>

                {/* Battery Icons */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Battery Status</h3>
                  <div className="flex gap-4 flex-wrap">
                    <div className="text-center">
                      <BatteryIcon size={60} level={95} />
                      <p className="text-sm mt-2">95%</p>
                    </div>
                    <div className="text-center">
                      <BatteryIcon size={60} level={50} charging />
                      <p className="text-sm mt-2">50% Charging</p>
                    </div>
                    <div className="text-center">
                      <BatteryIcon size={60} level={15} />
                      <p className="text-sm mt-2">15% Low</p>
                    </div>
                  </div>
                </div>

                {/* Energy Flow Arrows */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Energy Flow Arrows</h3>
                  <div className="flex gap-4 flex-wrap items-center">
                    <EnergyFlowArrow direction="right" size={40} animated color="#10B981" />
                    <EnergyFlowArrow direction="left" size={40} animated color="#EF4444" />
                    <EnergyFlowArrow direction="up" size={40} animated color="#3B82F6" />
                    <EnergyFlowArrow direction="down" size={40} animated color="#F59E0B" />
                    <EnergyFlowArrow direction="bidirectional" size={40} animated color="#6366F1" />
                  </div>
                </div>

                {/* System Icons */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">System Icons</h3>
                  <div className="flex gap-4 flex-wrap">
                    <div className="text-center">
                      <SolarPanelIcon size={60} generating />
                      <p className="text-sm mt-2">Solar</p>
                    </div>
                    <div className="text-center">
                      <GridIcon size={60} mode="import" />
                      <p className="text-sm mt-2">Grid Import</p>
                    </div>
                    <div className="text-center">
                      <GridIcon size={60} mode="export" />
                      <p className="text-sm mt-2">Grid Export</p>
                    </div>
                    <div className="text-center">
                      <HouseIcon size={60} consuming />
                      <p className="text-sm mt-2">House</p>
                    </div>
                    <div className="text-center">
                      <EVIcon size={60} status="charging" />
                      <p className="text-sm mt-2">EV</p>
                    </div>
                  </div>
                </div>

                {/* Status Badges */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Status Badges</h3>
                  <div className="flex gap-2 flex-wrap">
                    <StatusBadge status="success" label="Online" icon="🟢" pulse />
                    <StatusBadge status="warning" label="Warnung" icon="⚠️" />
                    <StatusBadge status="error" label="Fehler" icon="❌" />
                    <StatusBadge status="info" label="Info" icon="ℹ️" />
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === 'charging' && (
            <ChargingStationStatus
              name="Demo Wallbox"
              power_kw={7.2}
              voltage_v={230}
              current_a={32}
              ev_soc={65}
              ev_range_km={280}
              charging={true}
              max_power_kw={11}
              estimated_time_remaining_min={45}
              energy_delivered_kwh={12.5}
              session_cost_eur={3.75}
            />
          )}

          {tab === 'energy-flow' && (
            <EnhancedEnergyFlow data={energyFlowData} />
          )}

          {tab === 'smart-home' && (
            <EnhancedSmartHomeDashboard
              devices={smartHomeDevices}
              onDeviceControl={(deviceId, action) => {
                console.log(`Device ${deviceId}: ${action}`);
                alert(`Gerät ${deviceId}: ${action}`);
              }}
              onPriorityChange={(deviceId, priority) => {
                console.log(`Device ${deviceId} priority: ${priority}`);
              }}
            />
          )}

          {tab === 'ai' && (
            <AIRecommendationsWidget
              recommendations={recommendations}
              onActionClick={(recId, actionType, payload) => {
                console.log(`Recommendation ${recId}: ${actionType}`, payload);
                alert(`Empfehlung ${recId}: ${actionType}`);
              }}
              maxDisplay={10}
            />
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>EnergyFlowHub_EV UI/UX Enhancement Package v1.0</p>
          <p className="mt-1">Alle Komponenten sind produktionsbereit und vollständig typisiert</p>
        </div>
      </div>
    </div>
  );
};

export default UIUXDemo;
