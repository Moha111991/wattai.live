import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, Tuple, Optional
import pvlib
from pvlib.location import Location
from weather_api import get_weather_api
from smart_energy_manager import SmartEnergyManager


class EnergySystem:
    """
    Energiemanagementsystem für PV, Batterie, E-Auto, Wärmepumpe und Haushalt
    """
    
    def __init__(self, use_live_weather: bool = False, coupling_type: str = "dc_coupled", hp_mode: str = "auto", 
                 hp_type: str = "air", location_lat: float = 52.52, location_lon: float = 13.41,
                 building_area_m2: float = 100, building_volume_m3: float = 250, 
                 specific_heat_demand_kw_per_m2: float = 0.08):
        """
        Args:
            use_live_weather: Live-Wetterdaten von OpenWeatherMap nutzen
            coupling_type: "ac_coupled" oder "dc_coupled"
                AC-gekoppelt: PV → Wechselrichter (DC→AC) → Batterie (AC→DC) → (DC→AC) → Verbraucher
                DC-gekoppelt: PV → DC-Bus → Batterie → bidirektionaler Wechselrichter → Verbraucher
            hp_mode: "heating", "cooling" oder "auto"
                heating: Nur Heizen (Wärmepumpe)
                cooling: Nur Kühlen (Klimaanlage)
                auto: Automatisch saisonal angepasst
            hp_type: "air" (Luftwärmepumpe, COP 2-3) oder "ground" (Erdwärmepumpe, COP 4-5)
            location_lat: Breitengrad des Standorts
            location_lon: Längengrad des Standorts
            building_area_m2: Wohnfläche in m²
            building_volume_m3: Gebäudevolumen in m³
            specific_heat_demand_kw_per_m2: Spezifischer Wärmebedarf (Neubau: 0.04, Standard: 0.08, Altbau: 0.12 kW/m²)
        """
        # System-Architektur
        self.coupling_type = coupling_type
        
        # Gebäudespezifikationen
        self.building_area_m2 = building_area_m2
        self.building_volume_m3 = building_volume_m3
        self.specific_heat_demand_kw_per_m2 = specific_heat_demand_kw_per_m2
        
        # Wärmepumpentyp
        self.hp_type = hp_type  # "air" oder "ground"
        
        # System-Spezifikationen
        self.pv_power = 10.0  # kW
        self.battery_capacity = 10.0  # kWh
        self.battery_soc = 0.5  # State of Charge (50%)
        self.battery_efficiency = 0.95  # Interne Batterie-Effizienz
        self.battery_max_charge_rate = 5.0  # kW
        self.battery_max_discharge_rate = 5.0  # kW
        
        # Batterie-Zyklenfestigkeit und Degradation
        self.battery_initial_capacity = 10.0  # kWh (Anfangskapazität)
        self.battery_cycles_total = 0.0  # Akkumulierte Vollzyklen
        self.battery_rated_cycles = 6000  # Nennzyklen bis 80% Restkapazität (LFP: 6000-8001)
        self.battery_health = 1.0  # Gesundheitszustand (1.0 = 100%)
        self.battery_previous_soc = 0.5  # Vorheriger SOC für DoD-Berechnung
        
        # Konversionsverluste abhängig von der Systemarchitektur
        if coupling_type == "ac_coupled":
            # AC-gekoppelt: Höhere Konversionsverluste (3 Umwandlungen)
            self.pv_direct_efficiency = 0.97  # PV → Direkt zu Verbrauchern (DC→AC)
            self.pv_storage_roundtrip_efficiency = 0.85  # PV → Speicher → Last (gesamt Round-trip)
            # Backwards-Kompatibilität: Alte Attribute als Aliases
            self.pv_to_battery_efficiency = 0.85
            self.battery_to_load_efficiency = 0.85
            self.battery_to_ev_efficiency = 0.85
            self.ev_v2g_efficiency = 0.85  # V2G Round-trip (AC-gekoppelt)
            self.bidirectional_charging = False  # Kein bidirektionales Laden
        else:  # dc_coupled
            # DC-gekoppelt: Geringere Konversionsverluste (1 Umwandlung)
            self.pv_direct_efficiency = 0.98  # PV → Direkt zu Verbrauchern (DC→AC einmal)
            self.pv_storage_roundtrip_efficiency = 0.95  # PV → Speicher → Last (gesamt Round-trip)
            # Backwards-Kompatibilität: Alte Attribute als Aliases
            self.pv_to_battery_efficiency = 0.95
            self.battery_to_load_efficiency = 0.95
            self.battery_to_ev_efficiency = 0.95
            self.ev_v2g_efficiency = 0.95  # V2G Round-trip (DC-gekoppelt)
            self.bidirectional_charging = True  # Bidirektionales Laden möglich
        
        # Weather API integration
        self.use_live_weather = use_live_weather
        self.weather_api = get_weather_api() if use_live_weather else None
        self.weather_cache = {}  # Cache weather data by date
        
        # Location (can be overridden)
        self.latitude = location_lat
        self.longitude = location_lon
        self.pv_yield_kwh_per_kwp = 950  # Annual PV yield per kWp
        
        # E-Auto Spezifikationen
        self.ev_capacity = 150.0  # kWh
        self.ev_soc = 0.5  # State of Charge (50%)
        self.ev_charge_power = 11.0  # kW (Wallbox-Leistung)
        self.ev_onboard_limit = 11.0  # kW (Onboard-Charger-Limit)
        self.ev_efficiency = 0.90
        self.ev_present = True  # Auto ist zu Hause
        self.ev_consumption_kwh_per_100km = 18.0  # kWh/100km
        self.ev_daily_km = 40.0  # Durchschnittliche tägliche Fahrtstrecke (Standard: ~15000 km/Jahr ÷ 365)
        
        # EV-Batterie-Zyklenfestigkeit und Degradation
        self.ev_initial_capacity = 150.0  # kWh (Anfangskapazität)
        self.ev_cycles_total = 0.0  # Akkumulierte Vollzyklen
        self.ev_rated_cycles = 2000  # Nennzyklen bis 80% Restkapazität (NMC: 1500-3000)
        self.ev_health = 1.0  # Gesundheitszustand (1.0 = 100%)
        self.ev_previous_soc = 0.5  # Vorheriger SOC für DoD-Berechnung
        
        # Nachtladefenster für günstiges Laden (22-6 Uhr)
        self.night_charging_start = 22  # Stunde
        self.night_charging_end = 6  # Stunde
        self.prefer_night_charging = True  # Bevorzuge Nachtladung
        
        # Wärmepumpe / Klimaanlage
        self.hp_mode = hp_mode  # "heating", "cooling", "auto"
        self.hp_annual_consumption = 4500.0  # kWh/Jahr
        self.hp_power = 3.0  # kW durchschnittliche Leistung
        self.hp_cop = 3.5  # Coefficient of Performance (Heizen)
        self.hp_eer = 4.0  # Energy Efficiency Ratio (Kühlen)
        
        # Haushalt
        self.household_annual_consumption = 4000.0  # kWh/Jahr
        
        # Strompreise und CO2
        self.grid_price = 0.30  # €/kWh
        self.feed_in_tariff = 0.08  # €/kWh Einspeisevergütung
        self.grid_co2 = 0.420  # kg CO2/kWh (deutscher Strommix)
        self.pv_co2 = 0.040  # kg CO2/kWh (Lifecycle)
        
        # Zeitschritt
        self.timestep = 1.0  # Stunden
        
    def get_pv_generation(self, timestamp: datetime, scenario: str = "summer") -> float:
        """
        Berechnet PV-Erzeugung basierend auf Zeitpunkt und Szenario
        Nutzt pvlib für realistische Simulation
        Optional: Live-Wetterdaten von OpenWeatherMap
        """
        # Standort aus System-Konfiguration (kann von app.py gesetzt werden)
        lat, lon = self.latitude, self.longitude
        location = Location(lat, lon, tz='Europe/Berlin', altitude=34)
        
        # Sonnenpositionen berechnen
        solar_position = location.get_solarposition(timestamp)
        
        # Nur bei Tag Erzeugung
        elevation = solar_position['apparent_elevation']
        if hasattr(elevation, 'iloc'):
            elevation_value = elevation.iloc[0]
        else:
            elevation_value = elevation[0] if isinstance(elevation, np.ndarray) else elevation
            
        if elevation_value <= 0:
            return 0.0
        
        # Einfaches Modell: Max-Leistung * sin(Elevation) * Wolkenfaktor
        elevation_rad = np.radians(elevation_value)
        base_generation = self.pv_power * np.sin(elevation_rad)
        
        # Wolkenfaktor: Nutze Live-Wetter wenn verfügbar, sonst Szenario
        if self.use_live_weather and self.weather_api:
            # Get weather data from API or cache
            date_key = timestamp.date()
            if date_key not in self.weather_cache:
                weather_data = self.weather_api.get_current_weather(lat, lon)
                self.weather_cache[date_key] = weather_data
            else:
                weather_data = self.weather_cache[date_key]
            
            # Use actual cloud cover from API
            cloud_cover = weather_data['cloud_cover']
            cloud_factor = 1.0 - (0.8 * cloud_cover)  # Full cloud reduces to 20% of clear sky
        else:
            # Saisonale und Wetter-Anpassung (synthetisch)
            if scenario == "summer":
                cloud_factor = np.random.uniform(0.7, 1.0)  # Weniger Wolken
            elif scenario == "winter":
                cloud_factor = np.random.uniform(0.3, 0.7)  # Mehr Wolken
                base_generation *= 0.7  # Kürzere Tage, niedrigerer Sonnenstand
            else:  # spring/autumn
                cloud_factor = np.random.uniform(0.5, 0.9)
            
        return max(0, base_generation * cloud_factor)
    
    def get_household_load(self, timestamp: datetime) -> float:
        """
        Simuliert Haushaltslast basierend auf Tageszeit
        """
        hour = timestamp.hour
        
        # Typisches Lastprofil für Haushalt
        base_load = self.household_annual_consumption / 8760  # Grundlast
        
        # Tageszeit-Multiplikatoren
        if 0 <= hour < 6:  # Nacht
            multiplier = 0.5
        elif 6 <= hour < 9:  # Morgen
            multiplier = 1.5
        elif 9 <= hour < 17:  # Tag
            multiplier = 0.8
        elif 17 <= hour < 22:  # Abend
            multiplier = 2.0
        else:  # Spätnacht
            multiplier = 0.7
            
        # Zufällige Schwankungen
        noise = np.random.uniform(0.8, 1.2)
        
        return base_load * multiplier * noise
    
    def calculate_heat_pump_cop(self, outdoor_temp: float, heat_demand: bool = True) -> float:
        """
        Berechnet temperaturabhängigen COP (Coefficient of Performance) der Wärmepumpe
        Unterscheidet zwischen Luftwärmepumpe (COP 2-3) und Erdwärmepumpe (COP 4-5)
        
        Args:
            outdoor_temp: Außentemperatur in °C
            heat_demand: True für Heizung, False für Warmwasser
            
        Returns:
            COP Wert (Luftwärmepumpe: 2.0-3.0, Erdwärmepumpe: 4.0-5.0)
        """
        # Zieltemperatur: 35°C Vorlauf für Fußbodenheizung, 55°C für Warmwasser
        target_temp = 35.0 if heat_demand else 55.0
        
        if self.hp_type == "ground":
            # Erdwärmepumpe: Konstante Quelltemperatur ~10°C (Erdreich)
            # Viel effizienter, da Temperaturdifferenz kleiner
            source_temp = 10.0  # Erdreich konstant bei ~10°C
            t_hot_k = target_temp + 273.15
            t_cold_k = source_temp + 273.15
            cop_carnot = t_hot_k / (t_hot_k - t_cold_k)
            
            # Erdwärmepumpen erreichen höhere Effizienz: 50-55%
            carnot_efficiency = 0.52
            cop_real = cop_carnot * carnot_efficiency
            
            # Erdwärmepumpe: COP 4.0-5.0
            cop_real = max(4.0, min(5.0, cop_real))
            
        else:  # "air" - Luftwärmepumpe
            # Luftwärmepumpe: Außentemperatur als Quelle
            # Effizienz sinkt stark bei kalter Außenluft
            t_hot_k = target_temp + 273.15
            t_cold_k = outdoor_temp + 273.15
            cop_carnot = t_hot_k / (t_hot_k - t_cold_k)
            
            # Luftwärmepumpen erreichen niedrigere Effizienz: 40-45%
            carnot_efficiency = 0.42
            cop_real = cop_carnot * carnot_efficiency
            
            # Luftwärmepumpe: COP 2.0-3.0
            cop_real = max(2.0, min(3.0, cop_real))
        
        return cop_real
    
    def get_heat_pump_load(self, timestamp: datetime, scenario: str = "summer") -> float:
        """
        Simuliert Wärmepumpen-/Klimaanlagen-Last basierend auf Jahreszeit, Tageszeit und Modus
        Mit temperaturabhängigem COP/EER wenn Live-Wetterdaten verfügbar
        Berücksichtigt Gebäudegröße für realistische Bedarfsberechnung
        """
        # Bestimme Betriebsmodus
        if self.hp_mode == "auto":
            # Automatisch basierend auf Jahreszeit
            operation_mode = "cooling" if scenario == "summer" else "heating"
        else:
            operation_mode = self.hp_mode
        
        hour = timestamp.hour
        
        # Hole Außentemperatur (Live oder synthetisch)
        if self.use_live_weather and self.weather_api:
            date_key = timestamp.date()
            if date_key not in self.weather_cache:
                weather_data = self.weather_api.get_current_weather(self.latitude, self.longitude)
                self.weather_cache[date_key] = weather_data
            else:
                weather_data = self.weather_cache[date_key]
            
            outdoor_temp = weather_data['temperature']
        else:
            # Synthetische Temperaturen basierend auf Szenario
            if scenario == "winter":
                outdoor_temp = -5 + 10 * np.random.random()  # -5 bis 5°C
            elif scenario == "summer":
                outdoor_temp = 20 + 10 * np.random.random()  # 20 bis 30°C
            else:  # spring/autumn
                outdoor_temp = 8 + 10 * np.random.random()  # 8 bis 18°C
        
        # Gebäudespezifischer Wärmebedarf nach neuer Formel:
        # Wärmebedarf (kW) = Wohnfläche (m²) × spezifischer Wärmebedarf (kW/m²)
        # Neubau: 0.04 kW/m², Standard: 0.08 kW/m², Altbau: 0.12 kW/m²
        base_heat_demand_kw = self.building_area_m2 * self.specific_heat_demand_kw_per_m2
        
        # Bestimme thermischen Bedarf basierend auf Betriebsmodus
        if operation_mode == "heating":
            # Heizgrenztemperatur: 15°C
            heating_threshold = 15.0
            indoor_target_temp = 21.0
            
            if outdoor_temp < heating_threshold:
                # Heizbedarf basierend auf Temperaturdifferenz
                temp_diff = indoor_target_temp - outdoor_temp
                # Normiere auf 20K Temperaturdifferenz (typisch -5°C außen, 21°C innen)
                normalized_temp_diff = temp_diff / 20.0
                thermal_power_kw = base_heat_demand_kw * normalized_temp_diff
                demand_factor = thermal_power_kw / (self.hp_annual_consumption / 8760)
                demand_factor = max(0, min(3.0, demand_factor))
            else:
                # Nur Warmwasser wenn über Heizgrenze
                demand_factor = 0.2
            
            # Tageszeit-Anpassung (höhere Last morgens und abends)
            # Aus Lademanagement-Script: Morgens 6-9h und Abends 17-21h Spitzen
            if 6 <= hour < 9:
                time_factor = 1.3  # Morgenspitze (Aufstehen, Duschen)
            elif 17 <= hour < 21:
                time_factor = 1.4  # Abendspitze (Kochen, Aktivität)
            elif 10 <= hour < 16:
                time_factor = 0.8  # Tagsüber reduziert
            else:
                time_factor = 0.5  # Nachts minimal
        else:  # cooling
            # Kühlgrenztemperatur: 22°C
            cooling_threshold = 22.0
            indoor_target_temp = 24.0  # Kühlziel
            
            if outdoor_temp > cooling_threshold:
                # Kühlbedarf basierend auf Temperaturdifferenz
                temp_diff = outdoor_temp - indoor_target_temp
                # Kühlbedarf ist geringer als Heizbedarf (weniger Temperaturdifferenz, 70%)
                normalized_temp_diff = temp_diff / 10.0  # Normiert auf 10K Differenz (32°C außen, 24°C innen)
                thermal_power_kw = base_heat_demand_kw * normalized_temp_diff * 0.7
                demand_factor = thermal_power_kw / (self.hp_annual_consumption / 8760)
                demand_factor = max(0, min(2.5, demand_factor))
            else:
                # Kein Kühlbedarf unter 22°C
                demand_factor = 0.05
            
            # Tageszeit-Anpassung (höhere Last mittags/nachmittags wenn es warm ist)
            if 11 <= hour < 18:
                time_factor = 1.8  # Peak cooling hours
            elif 18 <= hour < 22:
                time_factor = 1.2
            elif 22 <= hour or hour < 6:
                time_factor = 0.3  # Minimal cooling at night
            else:
                time_factor = 0.8
        
        # Berechne thermischen Bedarf (kWh thermisch)
        base_thermal_demand = self.hp_annual_consumption / 8760
        thermal_demand = base_thermal_demand * demand_factor * time_factor
        
        # Berechne COP/EER und elektrischen Bedarf
        if operation_mode == "heating":
            cop = self.calculate_heat_pump_cop(outdoor_temp, heat_demand=True)
            electrical_load = thermal_demand / cop
        else:  # cooling
            # EER für Kühlung (bei höheren Außentemperaturen ist EER niedriger)
            eer = self.calculate_heat_pump_cop(outdoor_temp, heat_demand=False)
            # Kühlen ist effizienter als Heizen bei gleicher Temperaturdifferenz
            eer = eer * 1.2  # EER typisch ~20% höher als COP
            eer = min(6.0, eer)  # Max EER 6.0
            electrical_load = thermal_demand / eer
        
        return electrical_load
    
    def update_battery_cycle_count(self, charge_kwh: float, discharge_kwh: float):
        """
        Berechnet und akkumuliert Batteriezyklen basierend auf Lade- und Entladevorgängen.
        Verwendet DoD (Depth of Discharge) zur Berechnung von Teilzyklen.
        
        Ein Vollzyklus = 100% DoD (komplette Entladung und Wiederaufladung)
        Teilzyklen werden akkumuliert: z.B. 2x 50% DoD = 1 Vollzyklus
        
        Args:
            charge_kwh: Geladene Energie in kWh
            discharge_kwh: Entladene Energie in kWh
        """
        # DoD als Anteil der Gesamtkapazität berechnen
        # Nimm den größeren Wert von Laden oder Entladen
        dod = max(charge_kwh, discharge_kwh) / self.battery_initial_capacity
        
        # Teilzyklus akkumulieren
        self.battery_cycles_total += dod
        
        # Degradation neu berechnen
        self.calculate_battery_degradation()
    
    def calculate_battery_degradation(self):
        """
        Berechnet Batterie-Degradation basierend auf akkumulierten Zyklen.
        
        Lineares Degradationsmodell:
        - Bei 0 Zyklen: 100% Gesundheit
        - Bei rated_cycles: 80% Gesundheit (typischer End-of-Life-Grenzwert)
        - Danach: weitere lineare Degradation bis 70% (nutzbar aber eingeschränkt)
        
        Typische Werte:
        - Stromspeicher (LFP): 6000-8001 Zyklen bis 80%
        - EV-Batterie (NMC): 1500-3000 Zyklen bis 80%
        """
        if self.battery_cycles_total <= self.battery_rated_cycles:
            # Linearer Verlust von 0 bis 20% über die Nennzyklen
            capacity_loss = (self.battery_cycles_total / self.battery_rated_cycles) * 0.20
            self.battery_health = 1.0 - capacity_loss
        else:
            # Nach Nennzyklen: weiterer Verlust bis 70% Minimum
            excess_cycles = self.battery_cycles_total - self.battery_rated_cycles
            additional_loss = (excess_cycles / self.battery_rated_cycles) * 0.10
            self.battery_health = max(0.70, 0.80 - additional_loss)
        
        # Aktualisiere effektive Kapazität basierend auf Gesundheitszustand
        self.battery_capacity = self.battery_initial_capacity * self.battery_health
    
    def update_ev_cycle_count(self, charge_kwh: float, discharge_kwh: float):
        """
        Berechnet und akkumuliert EV-Batteriezyklen.
        Gleiche Logik wie Stromspeicher, aber mit EV-spezifischen Parametern.
        
        Args:
            charge_kwh: Geladene Energie in kWh
            discharge_kwh: Entladene Energie in kWh (Fahren + V2G)
        """
        # DoD als Anteil der Gesamtkapazität berechnen
        dod = max(charge_kwh, discharge_kwh) / self.ev_initial_capacity
        
        # Teilzyklus akkumulieren
        self.ev_cycles_total += dod
        
        # Degradation neu berechnen
        self.calculate_ev_degradation()
    
    def calculate_ev_degradation(self):
        """
        Berechnet EV-Batterie-Degradation basierend auf akkumulierten Zyklen.
        
        EV-Batterien haben typischerweise niedrigere Zyklenfestigkeit als stationäre
        Speicher, da sie höheren Belastungen (Schnellladen, Temperatur) ausgesetzt sind.
        """
        if self.ev_cycles_total <= self.ev_rated_cycles:
            # Linearer Verlust von 0 bis 20% über die Nennzyklen
            capacity_loss = (self.ev_cycles_total / self.ev_rated_cycles) * 0.20
            self.ev_health = 1.0 - capacity_loss
        else:
            # Nach Nennzyklen: weiterer Verlust bis 70% Minimum
            excess_cycles = self.ev_cycles_total - self.ev_rated_cycles
            additional_loss = (excess_cycles / self.ev_rated_cycles) * 0.10
            self.ev_health = max(0.70, 0.80 - additional_loss)
        
        # Aktualisiere effektive Kapazität basierend auf Gesundheitszustand
        self.ev_capacity = self.ev_initial_capacity * self.ev_health
    
    def apply_daily_ev_discharge(self, timestamp: datetime) -> float:
        """
        Simuliert tägliche Entladung des E-Autos durch Fahren
        Gibt zurück: Energieverbrauch in kWh für diese Stunde
        """
        hour = timestamp.hour
        day_of_week = timestamp.weekday()
        
        # Täglicher Energiebedarf durch Fahren
        daily_energy_kwh = (self.ev_daily_km / 100.0) * self.ev_consumption_kwh_per_100km
        
        # Fahrmuster: Pendeln an Werktagen, reduziert am Wochenende
        if day_of_week >= 5:  # Wochenende
            daily_energy_kwh *= 0.5  # 50% der Werktags-Fahrtstrecke
        
        # Verteilung über den Tag:
        # 7-9h: Morgenpendelverkehr (60% der Tagesfahrt)
        # 17-19h: Abendpendelverkehr (40% der Tagesfahrt)
        if 7 <= hour < 9:
            # Morgenpendelverkehr: 60% der täglichen Strecke über 2 Stunden
            hourly_discharge = (daily_energy_kwh * 0.60) / 2.0
        elif 17 <= hour < 19:
            # Abendpendelverkehr: 40% der täglichen Strecke über 2 Stunden
            hourly_discharge = (daily_energy_kwh * 0.40) / 2.0
        else:
            hourly_discharge = 0.0
        
        return hourly_discharge
    
    def get_ev_charging_need(self, timestamp: datetime) -> Tuple[float, bool]:
        """
        Bestimmt ob E-Auto laden muss und wie viel
        Gibt zurück: (Ladebedarf in kWh, Auto ist anwesend)
        """
        hour = timestamp.hour
        day_of_week = timestamp.weekday()
        
        # Auto ist normalerweise nachts und am Wochenende zu Hause
        if 22 <= hour or hour < 7:  # Nacht
            present = True
        elif day_of_week >= 5:  # Wochenende
            present = np.random.random() > 0.3
        else:  # Werktag
            present = np.random.random() > 0.7
        
        if not present:
            return 0.0, False
        
        # Ladebedarf basierend auf SOC
        available_capacity = self.ev_capacity * (1.0 - self.ev_soc)
        
        return available_capacity, True
    
    def get_dynamic_grid_price(self, timestamp: datetime) -> float:
        """
        Dynamischer Strompreis basierend auf Tageszeit
        Höhere Preise in Spitzenlastzeiten
        """
        hour = timestamp.hour
        
        # Basispreis
        base_price = 0.25
        
        # Spitzenlastzeiten (teurer)
        if 17 <= hour < 21:  # Abend-Spitzenlast
            return base_price + 0.10  # 35 cent/kWh
        elif 11 <= hour < 14:  # Mittags-Spitzenlast
            return base_price + 0.05  # 30 cent/kWh
        else:  # Niedriglast
            return base_price - 0.05  # 20 cent/kWh
    
    def can_enable_v2g(self, household_load: float, grid_price: float, 
                       hp_active: bool) -> bool:
        """
        Prüft ob bidirektionales Laden (V2G) aktiviert werden kann
        
        Bedingungen:
        - EV SOC zwischen 20% und 75% (nach Laden)
        - Strompreis > 30 cent/kWh
        - Wärmepumpe ist aus
        - Batterie SOC >= 50%
        - EV SOC >= 70%
        """
        if not (0.20 <= self.ev_soc <= 0.80):
            return False
        
        if grid_price <= 0.30:
            return False
            
        if hp_active:
            return False
            
        if self.battery_soc < 0.50:
            return False
            
        if self.ev_soc < 0.70:
            return False
        
        # Zusätzliche Prüfung: V2G stoppen bei Spitzenlast und niedriger Batterie
        if household_load > 5.0 and self.battery_soc < 0.60:
            return False
            
        return True
    
    def step(self, action: Dict, timestamp: datetime, 
             scenario: str = "summer") -> Dict:
        """
        Simuliert einen Zeitschritt mit OPTIMIERTER Energiepriorisierung
        für maximalen Eigenverbrauch und Autarkiegrad
        
        TAGSÜBER (6-22 Uhr) - PV-Überschuss-Optimierung:
        1. Kritische Lasten: Haushalt + Wärmepumpe (Direktnutzung)
        2. Batterie → 90% (Reserve für Nacht)
        3. E-Auto → 95% (wenn Batterie >= 70%, langsam 80-95%)
        4. Batterie → 100% (nur wenn E-Auto >= 80%)
        5. Überschuss abregeln (Island Mode)
        
        NACHTS (22-6 Uhr) - Kostenoptimierung:
        1. Kritische Lasten aus Batterie (bis 20% Reserve)
        2. E-Auto laden in günstiger Zeit (0-6 Uhr bevorzugt)
        3. Batterie laden: 0-6 Uhr → 80%, sonst → 50%
        4. V2G bei Spitzenlast (wenn rentabel)
        5. Netzbezug nur wenn Batterie < 20%
        
        Optimierungsziele:
        - Maximaler PV-Eigenverbrauch (90%+)
        - Hoher Autarkiegrad (80%+)
        - Minimale Netzkosten
        - Batterie-Schonung (20-90% SOC)
        
        action: Dictionary mit Steuerungsentscheidungen
        Returns: Dictionary mit Systemzustand und Metriken
        """
        # Erzeugung
        pv_gen = self.get_pv_generation(timestamp, scenario)
        
        # Dynamischer Strompreis
        grid_price = self.get_dynamic_grid_price(timestamp)
        
        # Lastenermittlung
        household_load = self.get_household_load(timestamp)
        hp_load = self.get_heat_pump_load(timestamp, scenario) if action.get('hp_active', True) else 0
        
        # E-Auto Anwesenheit prüfen
        _, ev_present = self.get_ev_charging_need(timestamp)
        
        # Tägliche EV-Entladung durch Fahren (KRITISCH für täglichen Ladezyklus!)
        ev_drive_discharge = self.apply_daily_ev_discharge(timestamp)
        if ev_drive_discharge > 0:
            # SOC reduzieren durch Fahren (mit Effizienz-Verlust)
            ev_soc_reduction = ev_drive_discharge / self.ev_capacity
            self.ev_soc = max(0.0, self.ev_soc - ev_soc_reduction)
        
        # Verfügbare Energie und Bedarf tracken
        available_energy = pv_gen  # Start mit PV
        remaining_demand = 0.0
        
        # Tracking-Variablen
        battery_charge_actual = 0.0
        battery_discharge_actual = 0.0
        ev_charge_actual = 0.0
        ev_discharge_actual = 0.0
        ev_drive_discharge_actual = ev_drive_discharge  # Tracking der Fahrstrecken-Entladung
        grid_import = 0.0
        grid_export = 0.0
        
        # PHASE 1: Kritische Lasten decken (höchste Priorität)
        # Priorität 1: Haushaltslast
        if available_energy >= household_load:
            available_energy -= household_load
        else:
            remaining_demand += (household_load - available_energy)
            available_energy = 0
        
        # Priorität 2: Wärmepumpe
        if hp_load > 0:
            if available_energy >= hp_load:
                available_energy -= hp_load
            else:
                remaining_demand += (hp_load - available_energy)
                available_energy = 0
        
        # Tageszeit bestimmen für optimierte Strategie
        hour = timestamp.hour
        is_daytime = 6 <= hour < 22
        is_cheap_night = 0 <= hour < 6  # Günstige Nachtzeit für Laden
        
        # OPTIMIERTE ENERGIEVERTEILUNG TAGSÜBER
        if is_daytime:
            # PHASE A: Batterie bis 90% laden (Reserve für Nacht!)
            target_battery_soc = 0.90  # Nicht 100% - Reserve behalten
            
            if self.battery_soc < target_battery_soc and available_energy > 0:
                max_battery_charge = min(
                    available_energy,
                    self.battery_max_charge_rate,
                    (target_battery_soc - self.battery_soc) * self.battery_capacity / self.timestep
                )
                battery_charge_actual = max_battery_charge
                available_energy -= battery_charge_actual
                
                # SOC sofort aktualisieren
                self.battery_soc += (battery_charge_actual * self.battery_efficiency * self.timestep) / self.battery_capacity
                self.battery_soc = min(1.0, self.battery_soc)
                
                # Cycle-Tracking: Batterieladung
                if battery_charge_actual > 0:
                    charge_energy_kwh = battery_charge_actual * self.timestep
                    self.update_battery_cycle_count(charge_energy_kwh, 0)
            
            # PHASE B: E-Auto laden (wenn Batterie >= 70% SOC)
            # Intelligente Kaskadenlogik für optimalen Eigenverbrauch
            battery_sufficient = self.battery_soc >= 0.70
            ev_charge_enable = action.get('ev_charge_enable', True)
            
            if ev_present and ev_charge_enable and self.ev_soc < 0.95 and available_energy > 0:
                # Bestimme Ladeleistung basierend auf SOC
                if 0.80 <= self.ev_soc < 0.95:
                    charge_power = self.ev_charge_power * 0.5  # Langsam laden 80-95%
                else:
                    charge_power = self.ev_charge_power  # Normal laden unter 80%
                
                max_ev_charge = min(
                    charge_power,
                    (0.95 - self.ev_soc) * self.ev_capacity / self.timestep
                )
                
                # Laden wenn Batterie ausreichend geladen (>= 70%)
                if battery_sufficient:
                    ev_charge_actual = min(max_ev_charge, available_energy)
                    available_energy -= ev_charge_actual
                    
                    # Cycle-Tracking: EV-Ladung (tagsüber)
                    if ev_charge_actual > 0:
                        charge_energy_kwh = ev_charge_actual * self.timestep
                        self.update_ev_cycle_count(charge_energy_kwh, 0)
            
            # PHASE C: Batterie 90-100% (nur wenn E-Auto voll oder kein Überschuss)
            if self.battery_soc < 1.0 and available_energy > 0:
                max_battery_top_up = min(
                    available_energy,
                    self.battery_max_charge_rate,
                    (1.0 - self.battery_soc) * self.battery_capacity / self.timestep
                )
                # Nur wenn E-Auto >= 80% geladen oder E-Auto nicht da
                if not ev_present or self.ev_soc >= 0.80:
                    if battery_charge_actual == 0:  # Noch nicht geladen in Phase A
                        battery_charge_actual = max_battery_top_up
                    else:
                        battery_charge_actual += max_battery_top_up
                    available_energy -= max_battery_top_up
                    
                    self.battery_soc += (max_battery_top_up * self.battery_efficiency * self.timestep) / self.battery_capacity
                    self.battery_soc = min(1.0, self.battery_soc)
                    
                    # Cycle-Tracking: Batterie Top-Up
                    if max_battery_top_up > 0:
                        charge_energy_kwh = max_battery_top_up * self.timestep
                        self.update_battery_cycle_count(charge_energy_kwh, 0)
        
        # OPTIMIERTE ENERGIEVERTEILUNG NACHTS
        else:
            ev_charge_enable = action.get('ev_charge_enable', True)
            
            # E-Auto Laden: Günstige Zeiten nutzen (0-6 Uhr)
            if ev_present and ev_charge_enable and self.ev_soc < 0.80:
                # Bestimme Ladeleistung
                if 0.80 <= self.ev_soc < 0.95:
                    charge_power = self.ev_charge_power * 0.5
                else:
                    charge_power = self.ev_charge_power
                
                max_ev_charge = min(
                    charge_power,
                    (0.80 - self.ev_soc) * self.ev_capacity / self.timestep
                )
                
                # Bevorzugt in günstiger Zeit laden (0-6 Uhr)
                if is_cheap_night:
                    ev_charge_actual = max_ev_charge
                    remaining_demand += ev_charge_actual
                    # Cycle-Tracking: EV-Nachtladung
                    if ev_charge_actual > 0:
                        charge_energy_kwh = ev_charge_actual * self.timestep
                        self.update_ev_cycle_count(charge_energy_kwh, 0)
                # Oder wenn dringend (SOC < 30%)
                elif self.ev_soc < 0.30:
                    ev_charge_actual = max_ev_charge
                    remaining_demand += ev_charge_actual
                    # Cycle-Tracking: EV-Notladung
                    if ev_charge_actual > 0:
                        charge_energy_kwh = ev_charge_actual * self.timestep
                        self.update_ev_cycle_count(charge_energy_kwh, 0)
        
        # PHASE 2: V2G Check (nur wenn Bedingungen erfüllt)
        v2g_active = action.get('v2g_active', False)
        total_critical_load = household_load + hp_load
        
        if v2g_active and ev_present:
            # V2G Bedingungen prüfen (inkl. Peak Load Protection)
            if self.can_enable_v2g(total_critical_load, grid_price, action.get('hp_active', True)):
                # Check Peak Load Protection BEFORE V2G
                if total_critical_load <= 5.0 or self.battery_soc >= 0.60:
                    max_v2g_power = min(11.0, self.ev_soc * self.ev_capacity / self.timestep)
                    ev_discharge_actual = max_v2g_power
                    available_energy += ev_discharge_actual
                else:
                    v2g_active = False
            else:
                v2g_active = False
        
        # PHASE 3: OPTIMIERTES BATTERIEMANAGEMENT
        # Intelligente Entladestrategie: Reserve behalten
        min_battery_soc = 0.20  # Mindest-Reserve für Notfälle
        
        if remaining_demand > 0:
            # Batterie nur bis zur Reserve entladen (20%)
            available_battery_energy = max(0, (self.battery_soc - min_battery_soc) * self.battery_capacity / self.timestep)
            
            max_battery_discharge = min(
                remaining_demand,
                self.battery_max_discharge_rate,
                available_battery_energy
            )
            
            battery_discharge_actual = max_battery_discharge
            remaining_demand -= battery_discharge_actual
        
        # Nachts: Batterie intelligent laden
        if not is_daytime and available_energy > 0 and self.battery_soc < 1.0:
            # Bevorzugt in günstigen Zeiten (0-6 Uhr) auf 80% laden
            if is_cheap_night:
                target_soc_night = 0.80
            else:
                target_soc_night = 0.50  # Sonst nur bis 50%
            
            max_battery_charge_night = min(
                available_energy,
                self.battery_max_charge_rate,
                (target_soc_night - self.battery_soc) * self.battery_capacity / self.timestep
            )
            
            if battery_charge_actual == 0 and max_battery_charge_night > 0:
                battery_charge_actual = max_battery_charge_night
                available_energy -= battery_charge_actual
                
                self.battery_soc += (battery_charge_actual * self.battery_efficiency * self.timestep) / self.battery_capacity
                self.battery_soc = min(1.0, self.battery_soc)
                
                # Cycle-Tracking: Batterie-Nachtladung
                if battery_charge_actual > 0:
                    charge_energy_kwh = battery_charge_actual * self.timestep
                    self.update_battery_cycle_count(charge_energy_kwh, 0)
        
        # PHASE 4: Netzinteraktion
        if remaining_demand > 0:
            grid_import = remaining_demand
        
        # Keine Netzeinspeisung - überschüssige Energie wird abgeregelt
        if available_energy > 0:
            grid_export = 0.0  # Keine Einspeisung ins Netz
        
        # SOC Updates
        # Hinweis: battery_charge_actual wird bereits in Phase A angewendet!
        # Nur Entladung hier aktualisieren:
        if battery_discharge_actual > 0:
            self.battery_soc -= (battery_discharge_actual * self.timestep) / (self.battery_capacity * self.battery_efficiency)
            # Cycle-Tracking: Batterieentladung
            discharge_energy_kwh = battery_discharge_actual * self.timestep
            self.update_battery_cycle_count(0, discharge_energy_kwh)
        
        if ev_charge_actual > 0:
            self.ev_soc += (ev_charge_actual * self.ev_efficiency * self.timestep) / self.ev_capacity
        if ev_discharge_actual > 0:
            self.ev_soc -= (ev_discharge_actual * self.timestep) / (self.ev_capacity * self.ev_efficiency)
            # Cycle-Tracking: EV-Entladung (V2G)
            discharge_energy_kwh = ev_discharge_actual * self.timestep
            self.update_ev_cycle_count(0, discharge_energy_kwh)
        
        # Cycle-Tracking: EV-Fahren (tägliche Entladung)
        if ev_drive_discharge_actual > 0:
            # ev_drive_discharge ist bereits in kWh, nicht kW!
            self.update_ev_cycle_count(0, ev_drive_discharge_actual)
        
        # Begrenzungen
        self.battery_soc = np.clip(self.battery_soc, 0.0, 1.0)
        self.ev_soc = np.clip(self.ev_soc, 0.0, 1.0)
        
        # KPI-Tracking: SOC-Gesundheit
        battery_in_optimal_range = 0.20 <= self.battery_soc <= 0.90
        battery_reserve_ok = self.battery_soc >= 0.20
        
        # Kosten und CO2 Berechnung
        cost = (grid_import * grid_price - grid_export * self.feed_in_tariff) * self.timestep
        co2 = (grid_import * self.grid_co2 + pv_gen * self.pv_co2) * self.timestep
        
        # Gesamtlast
        total_load = household_load + hp_load + ev_charge_actual
        
        # KPI 1: PV-Eigenverbrauch (Ziel: >90%)
        # Tracking wie viel PV wohin fließt
        pv_remaining = pv_gen
        
        # 1. PV direkt zu Lasten (mit Direktnutzungs-Effizienz)
        pv_directly_consumed = min(pv_remaining, household_load + hp_load)
        pv_directly_consumed_usable = pv_directly_consumed * self.pv_direct_efficiency
        pv_remaining -= pv_directly_consumed
        
        # 2. PV zur Batterie (nur tagsüber in Phase A+C)
        pv_to_battery = min(battery_charge_actual, pv_remaining) if is_daytime else 0
        pv_remaining -= pv_to_battery
        
        # 3. PV zum E-Auto (nur tagsüber in Phase B)
        pv_to_ev = min(ev_charge_actual, pv_remaining) if is_daytime else 0
        pv_to_ev_usable = pv_to_ev * self.pv_direct_efficiency  # Direktnutzung
        pv_remaining -= pv_to_ev
        
        # 4. Nicht genutzter PV-Überschuss (abgeregelt)
        pv_curtailed = max(0, pv_remaining)
        
        # 5. Energie aus Speicher zu Lasten (mit Round-trip-Effizienz)
        # Nur die Energie, die tatsächlich aus dem Speicher kommt, wird mit Effizienz multipliziert
        storage_to_load = battery_discharge_actual * self.pv_storage_roundtrip_efficiency
        
        # Nutzbare PV-Energie (tatsächlich gelieferte Energie an Verbraucher)
        # = Direkte Nutzung + Von Speicher geliefert + Direkt ans E-Auto
        usable_pv_energy = pv_directly_consumed_usable + storage_to_load + pv_to_ev_usable
        
        # Gesamter PV-Eigenverbrauch (roh, ohne Effizienz)
        self_consumption = pv_directly_consumed + pv_to_battery + pv_to_ev
        # Wichtig: Nur berechnen wenn PV vorhanden, sonst None für spätere Aggregation
        self_consumption_rate = self_consumption / pv_gen if pv_gen > 0 else None
        
        # Direktnutzungsanteil (effizienzadjustiert, wichtig für AC vs. DC Vergleich)
        total_usable = pv_directly_consumed_usable + storage_to_load + pv_to_ev_usable
        direct_use_ratio = (pv_directly_consumed_usable + pv_to_ev_usable) / total_usable if total_usable > 0 else 0
        
        # KPI 2: Autarkiegrad (Ziel: >80%)
        autarky = 1.0 - (grid_import / total_load) if total_load > 0 else 1.0
        
        # KPI 3: Batterieeffizienz
        battery_cycle_efficiency = (battery_charge_actual + battery_discharge_actual) / (2 * self.battery_capacity) if self.battery_capacity > 0 else 0
        
        return {
            'timestamp': timestamp,
            'pv_generation': pv_gen,
            'household_load': household_load,
            'hp_load': hp_load,
            'ev_charge': ev_charge_actual,
            'ev_discharge': ev_discharge_actual,
            'ev_drive_discharge': ev_drive_discharge_actual,  # Neue Spalte: Fahrstrecken-Verbrauch
            'battery_charge': battery_charge_actual,
            'battery_discharge': battery_discharge_actual,
            'battery_soc': self.battery_soc,
            'ev_soc': self.ev_soc,
            # Batterie-Zyklenfestigkeit und Degradation
            'battery_cycles': self.battery_cycles_total,
            'battery_health': self.battery_health,
            'battery_capacity_current': self.battery_capacity,  # Aktuelle (degradierte) Kapazität
            'ev_cycles': self.ev_cycles_total,
            'ev_health': self.ev_health,
            'ev_capacity_current': self.ev_capacity,  # Aktuelle (degradierte) Kapazität
            'grid_import': grid_import,
            'grid_export': grid_export,
            'grid_price': grid_price,
            'cost': cost,
            'co2': co2,
            'self_consumption': self_consumption,
            'self_consumption_rate': self_consumption_rate,
            'autarky': autarky,
            'v2g_active': v2g_active,
            'total_load': total_load,
            'ev_present': ev_present,
            'conversion_losses': action.get('conversion_losses', 0.0),
            # KPI-Tracking
            'pv_directly_consumed': pv_directly_consumed,
            'pv_directly_consumed_usable': pv_directly_consumed_usable,
            'pv_to_battery': pv_to_battery,
            'pv_to_ev': pv_to_ev,
            'pv_to_ev_usable': pv_to_ev_usable,
            'pv_curtailed': pv_curtailed,
            'storage_to_load': storage_to_load,
            'usable_pv_energy': usable_pv_energy,
            'direct_use_ratio': direct_use_ratio,
            'battery_in_optimal_range': battery_in_optimal_range,
            'battery_reserve_ok': battery_reserve_ok,
            'battery_cycle_efficiency': battery_cycle_efficiency,
            'is_daytime': is_daytime,
            'is_cheap_night': is_cheap_night
        }


class RuleBasedController:
    """
    Regelbasierte Steuerung des Energiesystems
    Implementiert die spezifizierten Prioritäten und Regeln
    """
    
    def get_action(self, system: EnergySystem, timestamp: datetime, 
                   pv_gen: float, household_load: float, scenario: str) -> Dict[str, float]:
        """
        Bestimmt Steuerungsaktionen basierend auf Regeln
        """
        action = {}
        
        # Wärmepumpe: Immer aktiviert basierend auf Bedarf
        action['hp_active'] = True
        
        # EV Laden: Aktivieren wenn SOC zwischen 20% und 80%
        if 0.20 <= system.ev_soc < 0.80:
            action['ev_charge_enable'] = True
        else:
            action['ev_charge_enable'] = False
        
        # V2G prüfen
        grid_price = system.get_dynamic_grid_price(timestamp)
        action['v2g_active'] = system.can_enable_v2g(
            household_load, grid_price, action['hp_active']
        )
        
        return action


class SmartController:
    """
    Intelligente Steuerung mit automatischer Energiepriorisierung
    Nutzt SmartEnergyManager für optimale Energieverteilung
    """
    
    def __init__(self):
        self.energy_manager = None
        
    def get_action(self, system: EnergySystem, timestamp: datetime, 
                   pv_gen: float, household_load: float, scenario: str) -> Dict[str, float]:
        """
        Bestimmt Steuerungsaktionen mit intelligenter Energiepriorisierung
        
        Nutzt SmartEnergyManager für:
        - Direktnutzung > Batterie > E-Auto > Netz
        - V2G bei Spitzenlast (Winter)
        - Optimale SOC-Bereiche (20-80%)
        """
        # Lazy initialization des Energy Managers
        if self.energy_manager is None:
            self.energy_manager = SmartEnergyManager(
                battery_capacity=system.battery_capacity,
                ev_capacity=system.ev_capacity,
                battery_power=system.battery_max_charge_rate,
                ev_charge_power=system.ev_charge_power,
                ev_onboard_limit=getattr(system, 'ev_onboard_limit', 11.0),
                coupling_type=system.coupling_type,
                pv_to_battery_eff=system.pv_to_battery_efficiency,
                battery_to_load_eff=system.battery_to_load_efficiency,
                battery_to_ev_eff=system.battery_to_ev_efficiency,
                ev_v2g_eff=system.ev_v2g_efficiency,
                bidirectional_charging=system.bidirectional_charging,
                night_charging_start=getattr(system, 'night_charging_start', 22),
                night_charging_end=getattr(system, 'night_charging_end', 6),
                prefer_night_charging=getattr(system, 'prefer_night_charging', True)
            )
        
        # Wärmepumpen-Last abrufen
        hp_load = system.get_heat_pump_load(timestamp, scenario)
        
        # Aktuellen Strompreis abrufen
        grid_price = system.get_dynamic_grid_price(timestamp)
        
        # Intelligente Energieverteilung
        distribution = self.energy_manager.distribute_energy(
            pv_generation=pv_gen,
            household_load=household_load,
            hp_load=hp_load,
            battery_soc=system.battery_soc,
            ev_soc=system.ev_soc,
            ev_present=system.ev_present,
            hour=timestamp.hour,
            season=scenario,
            grid_price=grid_price
        )
        
        # Konvertiere zu Action-Format
        action = {
            'hp_active': hp_load > 0,
            'ev_charge_enable': distribution['ev_charge'] > 0,
            'v2g_active': distribution['v2g_active'],
            'battery_charge': distribution['battery_charge'],
            'battery_discharge': distribution['battery_discharge'],
            'ev_charge_power': distribution['ev_charge'],
            'ev_discharge_power': distribution['ev_discharge'],
            'grid_export': distribution['grid_export'],
            'grid_import': distribution['grid_import'],
            'direct_use': distribution['direct_use'],
            'self_consumption': distribution['self_consumption'],
            'autarky': distribution['autarky'],
            'conversion_losses': distribution.get('conversion_losses', 0.0)
        }
        
        return action
