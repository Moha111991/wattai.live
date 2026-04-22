"""
Intelligenter Energie-Manager mit automatischer Priorisierung
Verteilt PV-Energie optimal auf: Direktnutzung > Batteriespeicher (Priorität!) > E-Auto > Netz
"""

import numpy as np
from datetime import datetime

class SmartEnergyManager:
    """
    Intelligente Energieverteilung mit Prioritäten
    """
    
    def __init__(self, battery_capacity, ev_capacity, battery_power=5.0, ev_charge_power=11.0,
                 ev_onboard_limit=11.0, coupling_type="dc_coupled", pv_to_battery_eff=0.99, 
                 battery_to_load_eff=0.96, battery_to_ev_eff=0.99, ev_v2g_eff=0.95, 
                 bidirectional_charging=True, night_charging_start=22, night_charging_end=6,
                 prefer_night_charging=True):
        """
        Args:
            battery_capacity: Batteriekapazität in kWh
            ev_capacity: E-Auto Batteriekapazität in kWh
            battery_power: Lade-/Entladeleistung Batterie in kW
            ev_charge_power: Ladeleistung E-Auto (Wallbox) in kW
            ev_onboard_limit: Onboard-Charger Limit in kW (7.4 oder 11.0)
            coupling_type: "ac_coupled" oder "dc_coupled"
            pv_to_battery_eff: Effizienz PV → Batterie
            battery_to_load_eff: Effizienz Batterie → Haushalt
            battery_to_ev_eff: Effizienz Batterie → E-Auto
            ev_v2g_eff: V2G Round-trip Effizienz
            bidirectional_charging: Bidirektionales Laden möglich
            night_charging_start: Beginn Nachtladefenster (Standard: 22 Uhr)
            night_charging_end: Ende Nachtladefenster (Standard: 6 Uhr)
            prefer_night_charging: Bevorzuge Nachtladung für günstige Tarife
        """
        self.battery_capacity = battery_capacity
        self.ev_capacity = ev_capacity
        self.battery_power = battery_power
        self.ev_charge_power = ev_charge_power
        self.ev_onboard_limit = ev_onboard_limit
        self.coupling_type = coupling_type
        self.pv_to_battery_eff = pv_to_battery_eff
        self.battery_to_load_eff = battery_to_load_eff
        self.battery_to_ev_eff = battery_to_ev_eff
        self.ev_v2g_eff = ev_v2g_eff
        self.bidirectional_charging = bidirectional_charging
        self.night_charging_start = night_charging_start
        self.night_charging_end = night_charging_end
        self.prefer_night_charging = prefer_night_charging
    
    def is_night_charging_time(self, hour):
        """
        Prüft ob aktuelle Stunde im Nachtladefenster liegt (günstige Tarife)
        
        Args:
            hour: Aktuelle Stunde (0-23)
            
        Returns:
            True wenn Nachtladung, False sonst
        """
        start = self.night_charging_start
        end = self.night_charging_end
        
        if start <= end:
            # Normales Fenster z.B. 22-23
            return start <= hour < end
        else:
            # Über Mitternacht z.B. 22-6
            return hour >= start or hour < end
    
    def get_max_ev_charge_power(self):
        """
        Berechnet maximale EV-Ladeleistung (Minimum aus Wallbox und Onboard-Limit)
        
        Returns:
            Maximale Ladeleistung in kW
        """
        return min(self.ev_charge_power, self.ev_onboard_limit)
        
    def distribute_energy(self, pv_generation, household_load, hp_load, battery_soc, 
                         ev_soc, ev_present, hour, season="summer", grid_price=0.30):
        """
        Verteilt verfügbare PV-Energie nach intelligenten Prioritäten
        
        NEUE PRIORITÄTEN:
        1. Wärmepumpe/Heizung (höchste Priorität im Winter) - aus PV + Batterie
           - Nur wenn E-Auto SOC >= 50% (sonst Auto Vorrang)
        2. Haushalt (zweite Priorität) - aus PV + Batterie
        3. E-Auto laden (niedrigste Priorität) - aus PV-Überschuss
           - Nur 20-80% SOC
           - Nachts oder tagsüber wenn PV verfügbar
        
        Bei PV-Mangel:
        1. Wärmepumpe aus Batterie (wenn Auto >= 50%)
        2. Haushalt aus Batterie
        3. E-Auto laden nachts (22-6 Uhr, 20-80% SOC) aus Batterie/Netz
        4. V2G möglich bei Spitzenlast
        
        Args:
            pv_generation: PV-Erzeugung in kW
            household_load: Haushaltsverbrauch in kW
            hp_load: Wärmepumpen-Last in kW
            battery_soc: Batterie-SOC (0-1)
            ev_soc: E-Auto SOC (0-1)
            ev_present: Ist E-Auto anwesend?
            hour: Aktuelle Stunde (0-23)
            season: Jahreszeit (summer/winter/spring)
            grid_price: Aktueller Strompreis in €/kWh (default: 0.30)
            
        Returns:
            Dictionary mit Energieflüssen
        """
        timestep = 1.0  # 1 Stunde
        
        # Verfügbare Energie
        available_pv = pv_generation
        
        # Initialisierung
        result = {
            'direct_use': 0.0,
            'battery_charge': 0.0,
            'battery_discharge': 0.0,
            'ev_charge': 0.0,
            'ev_discharge': 0.0,
            'grid_import': 0.0,
            'grid_export': 0.0,
            'battery_soc': battery_soc,
            'ev_soc': ev_soc,
            'self_consumption': 0.0,
            'autarky': 0.0,
            'v2g_active': False,
            'conversion_losses': 0.0
        }
        
        # NEUE PRIORITÄTSLOGIK
        # Prüfen ob Wärmepumpe Vorrang hat (Auto >= 50%)
        hp_priority_allowed = ev_soc >= 0.50
        
        # SCHRITT 1: Wärmepumpe versorgen (HÖCHSTE PRIORITÄT)
        hp_covered = 0.0
        if hp_load > 0 and hp_priority_allowed:
            # Erst von PV
            hp_from_pv = min(available_pv, hp_load)
            hp_covered += hp_from_pv
            available_pv -= hp_from_pv
            result['direct_use'] += hp_from_pv
            
            # Falls PV nicht reicht -> Batterie nutzen
            if hp_covered < hp_load and battery_soc > 0.20:
                hp_remaining = hp_load - hp_covered
                max_battery_discharge = min(
                    hp_remaining / self.battery_to_load_eff,
                    self.battery_power,
                    (battery_soc - 0.20) * self.battery_capacity / timestep
                )
                battery_loss = max_battery_discharge * (1 - self.battery_to_load_eff)
                result['conversion_losses'] += battery_loss
                hp_from_battery = max_battery_discharge * self.battery_to_load_eff
                result['battery_discharge'] += max_battery_discharge
                result['battery_soc'] = battery_soc - (max_battery_discharge * timestep / self.battery_capacity)
                battery_soc = result['battery_soc']
                hp_covered += hp_from_battery
        
        # SCHRITT 2: Haushalt versorgen (ZWEITE PRIORITÄT)
        household_covered = 0.0
        if household_load > 0:
            # Erst von PV
            household_from_pv = min(available_pv, household_load)
            household_covered += household_from_pv
            available_pv -= household_from_pv
            result['direct_use'] += household_from_pv
            
            # Falls PV nicht reicht -> Batterie nutzen
            if household_covered < household_load and battery_soc > 0.20:
                household_remaining = household_load - household_covered
                max_battery_discharge = min(
                    household_remaining / self.battery_to_load_eff,
                    self.battery_power,
                    (battery_soc - 0.20) * self.battery_capacity / timestep
                )
                battery_loss = max_battery_discharge * (1 - self.battery_to_load_eff)
                result['conversion_losses'] += battery_loss
                household_from_battery = max_battery_discharge * self.battery_to_load_eff
                result['battery_discharge'] += max_battery_discharge
                result['battery_soc'] = battery_soc - (max_battery_discharge * timestep / self.battery_capacity)
                battery_soc = result['battery_soc']
                household_covered += household_from_battery
        
        # SCHRITT 4: Fehlende Last aus Netz importieren
        total_load = hp_load + household_load
        total_covered = hp_covered + household_covered
        remaining_load = total_load - total_covered
        
        if remaining_load > 0:
            result['grid_import'] = remaining_load
        
        # SCHRITT 5: PV-Überschuss verwalten
        # Priorität: Batterie laden (bis 90%), dann E-Auto (20-80%)
        remaining_pv = available_pv
        if remaining_pv > 0:
            # Batterie laden bis 90%
            battery_target = 0.90
            battery_ev_share_threshold = 0.80
            battery_priority_target = 0.90
            if battery_soc < battery_target:
                max_battery_charge = min(
                    remaining_pv,
                    self.battery_power,
                    (battery_target - battery_soc) * self.battery_capacity / timestep
                )
                result['battery_charge'] = max_battery_charge
                # Konversionsverluste PV→Batterie
                conversion_loss = max_battery_charge * (1 - self.pv_to_battery_eff)
                result['conversion_losses'] += conversion_loss
                # Tatsächlich gespeicherte Energie (nach Verlusten)
                battery_stored = max_battery_charge * self.pv_to_battery_eff
                remaining_pv -= max_battery_charge
                result['battery_soc'] = battery_soc + (battery_stored * timestep / self.battery_capacity)
            
            # PHASE B: Batterie 80-90% - Batterie und E-Auto teilen sich PV-Überschuss
            # (Wird auch nach Phase A ausgeführt, falls Batterie inzwischen >=80%)
            if remaining_pv > 0 and result['battery_soc'] >= battery_ev_share_threshold and result['battery_soc'] < battery_priority_target:
                # Winter: E-Auto bevorzugt nachts laden
                ev_charge_allowed = True
                if season == "winter":
                    ev_charge_allowed = hour in [22, 23, 0, 1, 2, 3, 4, 5, 6] or remaining_pv > 3.0
                
                if ev_present and ev_soc < 0.8 and ev_charge_allowed:
                    # Angestrebte Aufteilung: 50% Batterie, 50% E-Auto
                    # Batterie-Anteil berechnen
                    battery_share = min(
                        remaining_pv * 0.5,
                        self.battery_power,
                        (battery_priority_target - result['battery_soc']) * self.battery_capacity / timestep
                    )
                    
                    # E-Auto-Anteil berechnen (angestrebt: restliche 50%)
                    ev_target_share = remaining_pv * 0.5
                    max_ev_power = self.get_max_ev_charge_power()
                    ev_share = min(
                        ev_target_share,
                        max_ev_power,
                        (0.8 - ev_soc) * self.ev_capacity / timestep
                    )
                    
                    # Falls E-Auto nicht alles nutzen kann → Rest geht zurück zur Batterie
                    unused_ev_share = ev_target_share - ev_share
                    if unused_ev_share > 0 and result['battery_soc'] < battery_priority_target:
                        battery_bonus = min(
                            unused_ev_share,
                            self.battery_power - battery_share,
                            (battery_priority_target - result['battery_soc']) * self.battery_capacity / timestep - (battery_share * timestep / self.battery_capacity)
                        )
                        battery_share += battery_bonus
                    
                    # Energie verteilen mit Konversionsverlusten
                    result['battery_charge'] += battery_share
                    # Konversionsverluste PV→Batterie
                    battery_loss = battery_share * (1 - self.pv_to_battery_eff)
                    result['conversion_losses'] += battery_loss
                    battery_stored = battery_share * self.pv_to_battery_eff
                    result['battery_soc'] += (battery_stored * timestep / self.battery_capacity)
                    
                    # E-Auto: Direkt von PV mit Konversionsverlusten (geringer bei DC-gekoppelt)
                    result['ev_charge'] = ev_share
                    # Verluste bei PV→EV (AC: 10%, DC: 5%)
                    pv_to_ev_eff = 0.90 if self.coupling_type == "ac_coupled" else 0.95
                    ev_loss = ev_share * (1 - pv_to_ev_eff)
                    result['conversion_losses'] += ev_loss
                    ev_stored = ev_share * pv_to_ev_eff
                    result['ev_soc'] = ev_soc + (ev_stored * timestep / self.ev_capacity)
                    remaining_pv -= (battery_share + ev_share)
                else:
                    # Kein E-Auto oder nicht ladeberechtigt → Batterie bekommt alles bis 90%
                    max_battery_charge = min(
                        remaining_pv,
                        self.battery_power,
                        (battery_priority_target - result['battery_soc']) * self.battery_capacity / timestep
                    )
                    result['battery_charge'] += max_battery_charge
                    # Konversionsverluste
                    battery_loss = max_battery_charge * (1 - self.pv_to_battery_eff)
                    result['conversion_losses'] += battery_loss
                    battery_stored = max_battery_charge * self.pv_to_battery_eff
                    remaining_pv -= max_battery_charge
                    result['battery_soc'] += (battery_stored * timestep / self.battery_capacity)
            
            # PHASE C: Batterie >= 90% - E-Auto hat Priorität, dann Batterie bis 100%
            if remaining_pv > 0 and result['battery_soc'] >= battery_priority_target:
                ev_charge_allowed = True
                if season == "winter":
                    ev_charge_allowed = hour in [22, 23, 0, 1, 2, 3, 4, 5, 6] or remaining_pv > 3.0
                
                if ev_present and ev_soc < 0.8 and ev_charge_allowed:
                    max_ev_power = self.get_max_ev_charge_power()
                    max_ev_charge = min(
                        remaining_pv,
                        max_ev_power,
                        (0.8 - ev_soc) * self.ev_capacity / timestep
                    )
                    # E-Auto laden mit Konversionsverlusten (AC: 10%, DC: 5%)
                    pv_to_ev_eff = 0.90 if self.coupling_type == "ac_coupled" else 0.95
                    ev_loss = max_ev_charge * (1 - pv_to_ev_eff)
                    result['conversion_losses'] += ev_loss
                    ev_stored = max_ev_charge * pv_to_ev_eff
                    
                    if result['ev_charge'] == 0:  # Noch nicht geladen in Phase B
                        result['ev_charge'] = max_ev_charge
                        result['ev_soc'] = ev_soc + (ev_stored * timestep / self.ev_capacity)
                    else:  # Bereits in Phase B geladen
                        result['ev_charge'] += max_ev_charge
                        result['ev_soc'] += (ev_stored * timestep / self.ev_capacity)
                    remaining_pv -= max_ev_charge
                
                # Restlicher Überschuss: Batterie bis 100%
                if remaining_pv > 0 and result['battery_soc'] < 1.0:
                    max_battery_top_charge = min(
                        remaining_pv,
                        self.battery_power,
                        (1.0 - result['battery_soc']) * self.battery_capacity / timestep
                    )
                    result['battery_charge'] += max_battery_top_charge
                    # Konversionsverluste
                    battery_loss = max_battery_top_charge * (1 - self.pv_to_battery_eff)
                    result['conversion_losses'] += battery_loss
                    battery_stored = max_battery_top_charge * self.pv_to_battery_eff
                    remaining_pv -= max_battery_top_charge
                    result['battery_soc'] += (battery_stored * timestep / self.battery_capacity)
            
            # Priorität 3: Überschuss abregelung (keine Netzeinspeisung)
            # Überschüssige PV-Energie wird nicht ins Netz eingespeist
            if remaining_pv > 0:
                result['grid_export'] = 0.0  # Keine Einspeisung
                # remaining_pv wird abgeregelt (nicht genutzt)
        
        # SCHRITT 3: Bei Lastüberschuss - Intelligente Entladung
        elif remaining_load > 0:
            # Priorität 1: Batterie entladen (falls SOC > 20%)
            if battery_soc > 0.2:
                max_battery_discharge = min(
                    remaining_load,
                    self.battery_power,
                    (battery_soc - 0.2) * self.battery_capacity / timestep
                )
                result['battery_discharge'] = max_battery_discharge
                # Konversionsverluste Batterie→Last
                discharge_loss = max_battery_discharge * (1 - self.battery_to_load_eff)
                result['conversion_losses'] += discharge_loss
                effective_discharge = max_battery_discharge * self.battery_to_load_eff
                remaining_load -= effective_discharge
                result['battery_soc'] = battery_soc - (max_battery_discharge * timestep / self.battery_capacity)
            
            # Priorität 2: V2G (Vehicle-to-Grid) zur Spitzenlast-Unterstützung
            if remaining_load > 2.0 and ev_present and result['ev_soc'] >= 0.7:
                # V2G Aktivierungsbedingungen (KEIN Preis-Check):
                # 1. Mindestlast > 2 kW (signifikanter Bedarf)
                # 2. E-Auto SOC >= 70% (ausreichend geladen)
                # 3. Batterie-SOC < 50% (Batterie braucht Unterstützung)
                # 4. Spitzenlastzeiten: 6-9 Uhr und 17-21 Uhr
                # Zweck: Spitzenlast decken + Batterie unterstützen (KEIN Netz-Export!)
                
                is_peak_hours = (6 <= hour <= 9) or (17 <= hour <= 21)
                battery_needs_support = result['battery_soc'] < 0.5
                
                # V2G aktivieren wenn alle Bedingungen erfüllt sind
                if is_peak_hours and battery_needs_support:
                    # Maximale V2G-Leistung berechnen
                    max_v2g_power = min(
                        self.ev_charge_power * 0.8,  # V2G etwas geringere Leistung (8.8 kW)
                        (result['ev_soc'] - 0.6) * self.ev_capacity / timestep  # Mindestens 60% im Auto lassen
                    )
                    
                    # SCHRITT 1: Haushalt/Wärmepumpe versorgen
                    power_for_loads = min(remaining_load, max_v2g_power)
                    result['ev_discharge'] = power_for_loads
                    # V2G Konversionsverluste
                    v2g_loss = power_for_loads * (1 - self.ev_v2g_eff)
                    result['conversion_losses'] += v2g_loss
                    effective_v2g = power_for_loads * self.ev_v2g_eff
                    remaining_load -= effective_v2g
                    result['ev_soc'] = result['ev_soc'] - (power_for_loads * timestep / self.ev_capacity)
                    max_v2g_power -= power_for_loads
                    
                    # SCHRITT 2: Restliche V2G-Leistung in Batterie laden (falls Kapazität vorhanden)
                    if max_v2g_power > 0 and result['battery_soc'] < 1.0:
                        power_for_battery = min(
                            max_v2g_power,
                            self.battery_power,
                            (1.0 - result['battery_soc']) * self.battery_capacity / timestep
                        )
                        result['ev_discharge'] += power_for_battery
                        result['battery_charge'] += power_for_battery
                        # V2G→Batterie Konversionsverluste
                        v2g_battery_loss = power_for_battery * (1 - self.ev_v2g_eff)
                        result['conversion_losses'] += v2g_battery_loss
                        effective_power = power_for_battery * self.ev_v2g_eff
                        result['battery_soc'] += (effective_power * timestep / self.battery_capacity)
                        result['ev_soc'] -= (power_for_battery * timestep / self.ev_capacity)
                    
                    # V2G aktiv markieren
                    if result['ev_discharge'] > 0:
                        result['v2g_active'] = True
                        # WICHTIG: Kein Netz-Export während V2G!
                        result['grid_export'] = 0.0
            
            # Priorität 3: Netzbezug als letztes Mittel
            if remaining_load > 0:
                result['grid_import'] = remaining_load
        
        # SCHRITT 4: Nachtladen des E-Autos (kombiniert aus Batterie + Netz)
        # E-Auto lädt nachts aus Batterie UND Netz (20% → 80% SOC)
        if pv_generation < 0.1 and ev_present and result['ev_soc'] < 0.8 and result['ev_soc'] >= 0.2:
            # Nachts (keine PV): E-Auto lädt ohne Batterie-Bedingung
            # Bevorzugt nachts laden (22-6 Uhr) für günstigere Tarife
            is_night = self.is_night_charging_time(hour)
            
            if is_night and result['ev_charge'] == 0:  # Nur wenn noch nicht durch PV geladen
                # Maximale EV-Ladeleistung (Minimum aus Wallbox und Onboard-Limit)
                max_ev_power = self.get_max_ev_charge_power()
                
                # Benötigte Ladeenergie für E-Auto
                ev_charge_needed = min(
                    max_ev_power,
                    (0.8 - result['ev_soc']) * self.ev_capacity / timestep
                )
                
                # STUFE 1: Aus Batterie laden (falls verfügbar und SOC > 20%)
                battery_to_ev = 0.0
                if result['battery_soc'] > 0.2:
                    battery_to_ev = min(
                        ev_charge_needed,
                        self.battery_power,  # Max. Entladeleistung Batterie
                        (result['battery_soc'] - 0.2) * self.battery_capacity / timestep
                    )
                    result['battery_discharge'] += battery_to_ev
                    # Konversionsverluste Batterie→E-Auto
                    battery_ev_loss = battery_to_ev * (1 - self.battery_to_ev_eff)
                    result['conversion_losses'] += battery_ev_loss
                    effective_battery_to_ev = battery_to_ev * self.battery_to_ev_eff
                    result['battery_soc'] -= (battery_to_ev * timestep / self.battery_capacity)
                    ev_charge_needed -= effective_battery_to_ev
                
                # STUFE 2: Rest aus dem Netz laden (bis max_ev_power Gesamtleistung)
                grid_to_ev = 0.0
                if ev_charge_needed > 0:
                    # Gesamtleistung begrenzt auf max. EV-Ladeleistung
                    remaining_ev_capacity = max_ev_power - battery_to_ev
                    grid_to_ev = min(ev_charge_needed, remaining_ev_capacity)
                    result['grid_import'] += grid_to_ev
                
                # E-Auto SOC aktualisieren (berücksichtigt Konversionsverluste)
                effective_battery_charge = battery_to_ev * self.battery_to_ev_eff
                # Netz→E-Auto hat je nach Kopplung unterschiedliche Verluste (AC: 10%, DC: 5%)
                grid_to_ev_eff = 0.90 if self.coupling_type == "ac_coupled" else 0.95
                grid_ev_loss = grid_to_ev * (1 - grid_to_ev_eff)
                result['conversion_losses'] += grid_ev_loss
                effective_grid_charge = grid_to_ev * grid_to_ev_eff
                total_ev_charge = battery_to_ev + grid_to_ev
                result['ev_charge'] = total_ev_charge
                result['ev_soc'] = result['ev_soc'] + ((effective_battery_charge + effective_grid_charge) * timestep / self.ev_capacity)
        
        # Metriken berechnen
        total_consumption = total_load
        direct_use = result['direct_use']
        self_consumption = direct_use + result['battery_discharge'] + result['ev_discharge']
        
        result['self_consumption'] = self_consumption
        result['autarky'] = self_consumption / total_consumption if total_consumption > 0 else 0
        
        return result
    
    def calculate_peak_load_risk(self, hour, season, hp_load, ev_charge, total_load):
        """
        Bewertet Spitzenlast-Risiko (besonders Winter)
        
        Args:
            hour: Stunde (0-23)
            season: Jahreszeit
            hp_load: Wärmepumpen-Last in kW
            ev_charge: E-Auto Ladung in kW
            total_load: Gesamtlast in kW
            
        Returns:
            Risiko-Level (0-1) und Beschreibung
        """
        risk_level = 0.0
        description = "Normale Last"
        
        # Winter-Spitzenlast-Zeiten
        if season == "winter":
            # Morgen (6-9 Uhr): Wärmepumpe + Haushalt
            if 6 <= hour <= 9:
                risk_level += 0.3
                description = "Morgen-Spitzenlast (Heizung + Haushalt)"
            
            # Abend (17-21 Uhr): Wärmepumpe + Haushalt + E-Auto
            if 17 <= hour <= 21:
                risk_level += 0.4
                description = "Abend-Spitzenlast (Heizung + E-Auto + Haushalt)"
            
            # Gleichzeitiges Laden + Heizen
            if hp_load > 3.0 and ev_charge > 5.0:
                risk_level += 0.3
                description = "Kritisch: Gleichzeitiges Heizen und E-Auto Laden"
        
        # Gesamtlast-Bewertung
        if total_load > 15.0:
            risk_level = min(1.0, risk_level + 0.2)
            description = "Sehr hohe Gesamtlast"
        elif total_load > 10.0:
            risk_level = min(1.0, risk_level + 0.1)
        
        return min(1.0, risk_level), description
    
    def optimize_charging_schedule(self, pv_forecast, load_forecast, hours=24):
        """
        Optimiert Ladeplan für E-Auto basierend auf PV-Prognose
        
        Args:
            pv_forecast: PV-Prognose für nächste Stunden (Array)
            load_forecast: Last-Prognose (Array)
            hours: Anzahl Stunden zu planen
            
        Returns:
            Optimaler Ladeplan
        """
        schedule = []
        
        for i in range(min(hours, len(pv_forecast))):
            pv = pv_forecast[i]
            load = load_forecast[i]
            surplus = pv - load
            
            # Laden wenn Überschuss verfügbar
            max_ev_power = self.get_max_ev_charge_power()
            if surplus > 2.0:  # Mindestens 2 kW Überschuss
                schedule.append({
                    'hour': i,
                    'recommended_charge_power': min(surplus, max_ev_power),
                    'reason': 'PV-Überschuss verfügbar',
                    'priority': 'hoch'
                })
            elif surplus > 0:
                schedule.append({
                    'hour': i,
                    'recommended_charge_power': min(surplus, max_ev_power * 0.5),
                    'reason': 'Geringer PV-Überschuss',
                    'priority': 'mittel'
                })
        
        return schedule
