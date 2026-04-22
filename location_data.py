"""
Standort-basierte Energiedaten für Deutschland
Enthält PV-Erträge, Strompreise und regionale Parameter
"""

LOCATION_DATA = {
    "München": {
        "region": "Bayern",
        "latitude": 48.1351,
        "longitude": 11.5820,
        "pv_yield_kwh_per_kwp": 1040,  # kWh/kWp jährlich
        "electricity_price_eur_per_kwh": 0.32,
        "feed_in_tariff_eur_per_kwh": 0.082,
        "avg_sunshine_hours": 1801,
        "climate_zone": "continental"
    },
    "Berlin": {
        "region": "Berlin-Brandenburg",
        "latitude": 52.5200,
        "longitude": 13.4050,
        "pv_yield_kwh_per_kwp": 950,
        "electricity_price_eur_per_kwh": 0.33,
        "feed_in_tariff_eur_per_kwh": 0.082,
        "avg_sunshine_hours": 1626,
        "climate_zone": "temperate"
    },
    "Hamburg": {
        "region": "Norddeutschland",
        "latitude": 53.5511,
        "longitude": 9.9937,
        "pv_yield_kwh_per_kwp": 920,
        "electricity_price_eur_per_kwh": 0.34,
        "feed_in_tariff_eur_per_kwh": 0.082,
        "avg_sunshine_hours": 1557,
        "climate_zone": "oceanic"
    },
    "Frankfurt": {
        "region": "Hessen",
        "latitude": 50.1109,
        "longitude": 8.6821,
        "pv_yield_kwh_per_kwp": 1000,
        "electricity_price_eur_per_kwh": 0.31,
        "feed_in_tariff_eur_per_kwh": 0.082,
        "avg_sunshine_hours": 1662,
        "climate_zone": "temperate"
    },
    "Stuttgart": {
        "region": "Baden-Württemberg",
        "latitude": 48.7758,
        "longitude": 9.1829,
        "pv_yield_kwh_per_kwp": 1050,
        "electricity_price_eur_per_kwh": 0.32,
        "feed_in_tariff_eur_per_kwh": 0.082,
        "avg_sunshine_hours": 1807,
        "climate_zone": "continental"
    },
    "Köln": {
        "region": "Nordrhein-Westfalen",
        "latitude": 50.9375,
        "longitude": 6.9603,
        "pv_yield_kwh_per_kwp": 970,
        "electricity_price_eur_per_kwh": 0.33,
        "feed_in_tariff_eur_per_kwh": 0.082,
        "avg_sunshine_hours": 1504,
        "climate_zone": "oceanic"
    },
    "Düsseldorf": {
        "region": "Nordrhein-Westfalen",
        "latitude": 51.2277,
        "longitude": 6.7735,
        "pv_yield_kwh_per_kwp": 970,
        "electricity_price_eur_per_kwh": 0.33,
        "feed_in_tariff_eur_per_kwh": 0.082,
        "avg_sunshine_hours": 1504,
        "climate_zone": "oceanic"
    },
    "Dresden": {
        "region": "Sachsen",
        "latitude": 51.0504,
        "longitude": 13.7373,
        "pv_yield_kwh_per_kwp": 980,
        "electricity_price_eur_per_kwh": 0.31,
        "feed_in_tariff_eur_per_kwh": 0.082,
        "avg_sunshine_hours": 1654,
        "climate_zone": "continental"
    },
    "Leipzig": {
        "region": "Sachsen",
        "latitude": 51.3397,
        "longitude": 12.3731,
        "pv_yield_kwh_per_kwp": 980,
        "electricity_price_eur_per_kwh": 0.31,
        "feed_in_tariff_eur_per_kwh": 0.082,
        "avg_sunshine_hours": 1654,
        "climate_zone": "continental"
    },
    "Hannover": {
        "region": "Niedersachsen",
        "latitude": 52.3759,
        "longitude": 9.7320,
        "pv_yield_kwh_per_kwp": 950,
        "electricity_price_eur_per_kwh": 0.32,
        "feed_in_tariff_eur_per_kwh": 0.082,
        "avg_sunshine_hours": 1587,
        "climate_zone": "temperate"
    },
    "Nürnberg": {
        "region": "Bayern",
        "latitude": 49.4521,
        "longitude": 11.0767,
        "pv_yield_kwh_per_kwp": 1030,
        "electricity_price_eur_per_kwh": 0.32,
        "feed_in_tariff_eur_per_kwh": 0.082,
        "avg_sunshine_hours": 1766,
        "climate_zone": "continental"
    },
    "Freiburg": {
        "region": "Baden-Württemberg",
        "latitude": 47.9990,
        "longitude": 7.8421,
        "pv_yield_kwh_per_kwp": 1100,  # Höchster PV-Ertrag in Deutschland
        "electricity_price_eur_per_kwh": 0.32,
        "feed_in_tariff_eur_per_kwh": 0.082,
        "avg_sunshine_hours": 1740,
        "climate_zone": "continental"
    }
}

# Familiengröße-basierte Verbrauchsprofile
HOUSEHOLD_PROFILES = {
    1: {
        "name": "1-Personen Haushalt",
        "annual_consumption_kwh": 1800,
        "heat_pump_annual_kwh": 2500,  # Kleinere Wohnfläche
        "ev_annual_km": 10000,  # Durchschnittliche Fahrleistung
        "ev_consumption_kwh_per_100km": 18,
        "recommended_battery_kwh": 5,
        "description": "Single-Haushalt, ca. 50m² Wohnfläche",
        "living_area_m2": 50,
        "ceiling_height_m": 2.5,
        "building_volume_m3": 125
    },
    2: {
        "name": "2-Personen Haushalt",
        "annual_consumption_kwh": 2800,
        "heat_pump_annual_kwh": 3500,
        "ev_annual_km": 12000,
        "ev_consumption_kwh_per_100km": 18,
        "recommended_battery_kwh": 7,
        "description": "Paar/Kleinhaushalt, ca. 80m² Wohnfläche",
        "living_area_m2": 80,
        "ceiling_height_m": 2.5,
        "building_volume_m3": 200
    },
    3: {
        "name": "3-Personen Haushalt",
        "annual_consumption_kwh": 3500,
        "heat_pump_annual_kwh": 4500,
        "ev_annual_km": 15000,
        "ev_consumption_kwh_per_100km": 18,
        "recommended_battery_kwh": 10,
        "description": "Familie mit 1 Kind, ca. 110m² Wohnfläche",
        "living_area_m2": 110,
        "ceiling_height_m": 2.5,
        "building_volume_m3": 275
    },
    4: {
        "name": "4-Personen Haushalt",
        "annual_consumption_kwh": 4200,
        "heat_pump_annual_kwh": 5500,
        "ev_annual_km": 18001,
        "ev_consumption_kwh_per_100km": 18,
        "recommended_battery_kwh": 12,
        "description": "Familie mit 2 Kindern, ca. 140m² Wohnfläche",
        "living_area_m2": 140,
        "ceiling_height_m": 2.5,
        "building_volume_m3": 350
    }
}

def get_location_info(city_name):
    """
    Gibt Standortinformationen für eine Stadt zurück
    
    Args:
        city_name: Name der Stadt
        
    Returns:
        Dictionary mit Standortdaten oder None
    """
    return LOCATION_DATA.get(city_name)

# Gebäude-Dämmungsklassen mit spezifischem Wärmebedarf
# Formel: Wärmebedarf (kW) = Wohnfläche (m²) × spezifischer Wärmebedarf (kW/m²)
INSULATION_CLASSES = {
    "schlecht": {
        "name": "Altbau (schlecht gedämmt)",
        "specific_heat_demand_kw_per_m2": 0.12,  # 120 W/m²
        "description": "Baujahr vor 1980, keine Sanierung, einfache Verglasung, 0.12 kW/m²",
        "u_value_wall": 1.4,  # W/(m²·K)
        "u_value_window": 2.8
    },
    "mittel": {
        "name": "Standard (mittel gedämmt)",
        "specific_heat_demand_kw_per_m2": 0.08,  # 80 W/m²
        "description": "Baujahr 1980-2000 oder teilsaniert, Doppelverglasung, 0.08 kW/m²",
        "u_value_wall": 0.8,
        "u_value_window": 1.3
    },
    "gut": {
        "name": "Neubau (gut gedämmt)",
        "specific_heat_demand_kw_per_m2": 0.04,  # 40 W/m²
        "description": "Baujahr ab 2000, KfW-Standard, Dreifachverglasung, 0.04 kW/m²",
        "u_value_wall": 0.24,
        "u_value_window": 0.9
    }
}

# Wärmepumpen-Typen mit typischen COP-Werten
HEAT_PUMP_TYPES = {
    "ground": {
        "name": "Erdwärmepumpe",
        "cop_min": 4.0,
        "cop_max": 5.0,
        "cop_reference": 4.5,  # COP konstanter (Erdreich ~10°C)
        "description": "Nutzt Erdreich als Wärmequelle, COP 4-5",
        "icon": "🌍"
    },
    "air": {
        "name": "Luftwärmepumpe",
        "cop_min": 2.0,
        "cop_max": 3.0,
        "cop_reference": 2.5,  # COP bei 0°C Außentemperatur
        "description": "Nutzt Außenluft als Wärmequelle, COP 2-3",
        "icon": "💨"
    },
    "ac": {
        "name": "Klimaanlage",
        "cop_min": 2.0,
        "cop_max": 3.0,
        "cop_reference": 2.8,  # COP/EER für Kühlung besser
        "description": "Klimaanlage (hauptsächlich Kühlen), COP 2-3",
        "icon": "❄️"
    }
}

def get_household_profile(family_size):
    """
    Gibt Verbrauchsprofil für Familiengröße zurück
    
    Args:
        family_size: Anzahl der Personen (1-4)
        
    Returns:
        Dictionary mit Verbrauchsprofil oder None
    """
    return HOUSEHOLD_PROFILES.get(family_size)

def get_insulation_class(insulation_type):
    """
    Gibt Dämmungsklasse zurück
    
    Args:
        insulation_type: "schlecht", "mittel" oder "gut"
        
    Returns:
        Dictionary mit Dämmungsinformationen
    """
    return INSULATION_CLASSES.get(insulation_type, INSULATION_CLASSES["mittel"])

def calculate_recommended_pv_size(family_size, location):
    """
    Berechnet empfohlene PV-Größe basierend auf Verbrauch und Standort
    
    Args:
        family_size: Anzahl der Personen
        location: Standortname
        
    Returns:
        Empfohlene PV-Leistung in kWp
    """
    profile = get_household_profile(family_size)
    loc_data = get_location_info(location)
    
    if not profile or not loc_data:
        return None
    
    # Gesamtverbrauch berechnen
    total_annual_kwh = (
        profile['annual_consumption_kwh'] + 
        profile['heat_pump_annual_kwh'] + 
        (profile['ev_annual_km'] * profile['ev_consumption_kwh_per_100km'] / 100)
    )
    
    # PV-Größe für 70-80% Deckung des Jahresverbrauchs
    target_coverage = 0.75
    pv_yield = loc_data['pv_yield_kwh_per_kwp']
    
    recommended_kwp = (total_annual_kwh * target_coverage) / pv_yield
    
    # Auf 0.5 kWp runden
    return round(recommended_kwp * 2) / 2

def calculate_battery_size(pv_power_kwp, family_size):
    """
    Berechnet empfohlene Batteriegröße
    
    Faustregel: 1 kWh Speicher pro 1 kWp PV-Leistung
    Minimum basierend auf Familiengröße
    
    Args:
        pv_power_kwp: PV-Leistung in kWp
        family_size: Anzahl der Personen
        
    Returns:
        Empfohlene Batteriekapazität in kWh
    """
    profile = get_household_profile(family_size)
    if not profile:
        return 10  # Default
    
    # Methode 1: 1 kWh pro kWp
    battery_by_pv = pv_power_kwp
    
    # Methode 2: Basierend auf Haushaltsprofil
    battery_by_profile = profile['recommended_battery_kwh']
    
    # Nimm das Maximum der beiden Methoden
    recommended_kwh = max(battery_by_pv, battery_by_profile)
    
    # Auf ganze kWh runden
    return round(recommended_kwh)

def get_available_cities():
    """Gibt Liste aller verfügbaren Städte zurück"""
    return sorted(list(LOCATION_DATA.keys()))

def calculate_monthly_ev_consumption(family_size):
    """
    Berechnet monatlichen E-Auto Verbrauch
    
    Args:
        family_size: Anzahl der Personen
        
    Returns:
        Monatlicher Verbrauch in kWh
    """
    profile = get_household_profile(family_size)
    if not profile:
        return 0
    
    annual_km = profile['ev_annual_km']
    consumption_per_100km = profile['ev_consumption_kwh_per_100km']
    
    annual_kwh = (annual_km / 100) * consumption_per_100km
    monthly_kwh = annual_kwh / 12
    
    return monthly_kwh

def get_seasonal_factors():
    """
    Saisonale Faktoren für PV-Ertrag und Wärmepumpe
    
    Returns:
        Dictionary mit monatlichen Faktoren
    """
    return {
        "summer": {
            "pv_factor": 1.3,  # 30% mehr Ertrag im Sommer
            "hp_factor": 0.3,  # 70% weniger Wärmebedarf
            "ev_charging_hours": [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6],  # Abends/Nachts
        },
        "winter": {
            "pv_factor": 0.6,  # 40% weniger Ertrag im Winter
            "hp_factor": 1.5,  # 50% mehr Wärmebedarf
            "ev_charging_hours": [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6],
        },
        "spring": {
            "pv_factor": 1.0,  # Durchschnitt
            "hp_factor": 0.8,  # Leicht reduziert
            "ev_charging_hours": [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6],
        },
        "autumn": {
            "pv_factor": 0.9,
            "hp_factor": 0.9,
            "ev_charging_hours": [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6],
        }
    }

# Fahrzeugdaten: Hersteller, Modelle und Batteriekapazitäten
VEHICLE_DATA = {
    "Tesla": {
        "Model 3 Standard Range": {
            "capacity_kwh": 60.0,
            "charge_time_20_80": 4.5,  # Stunden mit 11 kW Wallbox
            "efficiency_kwh_per_100km": 14.5
        },
        "Model 3 Long Range": {
            "capacity_kwh": 75.0,
            "charge_time_20_80": 5.5,
            "efficiency_kwh_per_100km": 15.0
        },
        "Model Y": {
            "capacity_kwh": 75.0,
            "charge_time_20_80": 5.5,
            "efficiency_kwh_per_100km": 16.5
        }
    },
    "Volkswagen": {
        "ID.3": {
            "capacity_kwh": 58.0,
            "charge_time_20_80": 4.5,
            "efficiency_kwh_per_100km": 15.5
        },
        "ID.4": {
            "capacity_kwh": 77.0,
            "charge_time_20_80": 5.5,
            "efficiency_kwh_per_100km": 17.5
        },
        "e-Golf": {
            "capacity_kwh": 35.8,
            "charge_time_20_80": 3.0,
            "efficiency_kwh_per_100km": 13.8
        }
    },
    "BMW": {
        "i3": {
            "capacity_kwh": 42.2,
            "charge_time_20_80": 3.5,
            "efficiency_kwh_per_100km": 13.1
        },
        "iX3": {
            "capacity_kwh": 80.0,
            "charge_time_20_80": 5.5,
            "efficiency_kwh_per_100km": 17.8
        },
        "i4": {
            "capacity_kwh": 83.9,
            "charge_time_20_80": 6.0,
            "efficiency_kwh_per_100km": 16.1
        }
    },
    "Mercedes": {
        "EQA": {
            "capacity_kwh": 66.5,
            "charge_time_20_80": 5.0,
            "efficiency_kwh_per_100km": 16.6
        },
        "EQC": {
            "capacity_kwh": 80.0,
            "charge_time_20_80": 5.5,
            "efficiency_kwh_per_100km": 20.8
        }
    },
    "Audi": {
        "e-tron": {
            "capacity_kwh": 71.0,
            "charge_time_20_80": 5.0,
            "efficiency_kwh_per_100km": 19.6
        },
        "Q4 e-tron": {
            "capacity_kwh": 77.0,
            "charge_time_20_80": 5.5,
            "efficiency_kwh_per_100km": 18.0
        }
    },
    "Hyundai": {
        "Kona Electric": {
            "capacity_kwh": 64.0,
            "charge_time_20_80": 4.5,
            "efficiency_kwh_per_100km": 14.7
        },
        "Ioniq 5": {
            "capacity_kwh": 72.6,
            "charge_time_20_80": 5.0,
            "efficiency_kwh_per_100km": 16.8
        }
    },
    "Nissan": {
        "Leaf": {
            "capacity_kwh": 40.0,
            "charge_time_20_80": 3.5,
            "efficiency_kwh_per_100km": 15.0
        },
        "Leaf e+": {
            "capacity_kwh": 62.0,
            "charge_time_20_80": 4.5,
            "efficiency_kwh_per_100km": 15.9
        }
    },
    "Renault": {
        "Zoe": {
            "capacity_kwh": 52.0,
            "charge_time_20_80": 4.0,
            "efficiency_kwh_per_100km": 16.5
        },
        "Megane E-Tech": {
            "capacity_kwh": 60.0,
            "charge_time_20_80": 4.5,
            "efficiency_kwh_per_100km": 15.4
        }
    },
    "Benutzerdefiniert": {
        "Eigene Eingabe": {
            "capacity_kwh": 50.0,
            "charge_time_20_80": 4.5,
            "efficiency_kwh_per_100km": 16.0
        }
    }
}

def get_vehicle_manufacturers():
    """
    Liefert Liste aller verfügbaren Fahrzeughersteller
    
    Returns:
        List[str]: Liste der Hersteller
    """
    return list(VEHICLE_DATA.keys())

def get_vehicle_models(manufacturer):
    """
    Liefert Modelle für einen bestimmten Hersteller
    
    Args:
        manufacturer: Name des Herstellers
        
    Returns:
        List[str]: Liste der Modelle
    """
    if manufacturer in VEHICLE_DATA:
        return list(VEHICLE_DATA[manufacturer].keys())
    return []

def get_vehicle_data(manufacturer, model):
    """
    Liefert Daten für ein bestimmtes Fahrzeugmodell
    
    Args:
        manufacturer: Name des Herstellers
        model: Name des Modells
        
    Returns:
        dict: Fahrzeugdaten (Kapazität, Ladezeit, Effizienz)
    """
    if manufacturer in VEHICLE_DATA and model in VEHICLE_DATA[manufacturer]:
        return VEHICLE_DATA[manufacturer][model]
    return {
        "capacity_kwh": 50.0,
        "charge_time_20_80": 4.5,
        "efficiency_kwh_per_100km": 16.0
    }

def get_building_specs(family_size):
    """
    Gibt Gebäudespezifikationen basierend auf Familiengröße zurück
    
    Args:
        family_size: Anzahl der Personen (1-4)
        
    Returns:
        Dictionary mit Gebäudedaten (Fläche, Volumen, etc.)
    """
    profile = get_household_profile(family_size)
    if not profile:
        return {
            "living_area_m2": 100,
            "ceiling_height_m": 2.5,
            "building_volume_m3": 250
        }
    
    return {
        "living_area_m2": profile["living_area_m2"],
        "ceiling_height_m": profile["ceiling_height_m"],
        "building_volume_m3": profile["building_volume_m3"]
    }

def calculate_charging_time(capacity_kwh, charging_power_kw=11.0, coupling_type="ac_coupled"):
    """
    Berechnet die Ladezeit von 20% bis 80% SOC unter Berücksichtigung von Ladeverlusten
    
    Formel: Ladezeit = (Kapazität * 0.6) / (Ladeleistung / Effizienz)
    
    Args:
        capacity_kwh: Batteriekapazität in kWh
        charging_power_kw: Ladeleistung in kW (Standard: 11 kW Wallbox)
        coupling_type: "ac_coupled" oder "dc_coupled"
            - AC-gekoppelt: 10% Ladeverluste (90% Effizienz, Standard)
            - DC-gekoppelt: 5% Ladeverluste (95% Effizienz, bidirektional V2H)
    
    Returns:
        dict mit:
            - charge_time_h: Ladezeit in Stunden
            - energy_required_kwh: Benötigte Energie inkl. Verluste in kWh
            - efficiency: Ladeeffizienz
            - power_required_kw: Tatsächlich benötigte Leistung in kW
    
    Beispiel:
        BMW i3 (42.2 kWh) mit AC-gekoppelt:
        - Nutzbare Energie: 42.2 × 0.6 = 25.32 kWh
        - Effizienz: 90%
        - Benötigte Energie: 25.32 / 0.9 = 28.13 kWh
        - Ladezeit: 28.13 / 11 = 2.56 h ≈ 2.6 h
        - Verluste: 28.13 - 25.32 = 2.81 kWh
    """
    # Effizienz basierend auf Kopplungstyp
    if coupling_type == "dc_coupled":
        efficiency = 0.95  # 5% Verluste (bidirektional V2H)
    else:  # ac_coupled
        efficiency = 0.90  # 10% Verluste (Standard)
    
    # Energie für 20% bis 80% SOC
    usable_energy_kwh = capacity_kwh * 0.6
    
    # Tatsächlich benötigte Energie inkl. Verluste
    energy_required_kwh = usable_energy_kwh / efficiency
    
    # Tatsächlich benötigte Leistung (wird nicht erreicht, nur zur Info)
    power_required_kw = charging_power_kw / efficiency
    
    # Ladezeit berechnen: Benötigte Energie / Ladeleistung
    # Oder äquivalent: Nutzbare Energie / (Ladeleistung × Effizienz)
    charge_time_h = energy_required_kwh / charging_power_kw
    
    return {
        "charge_time_h": round(charge_time_h, 2),
        "energy_required_kwh": round(energy_required_kwh, 2),
        "efficiency": efficiency,
        "power_required_kw": round(power_required_kw, 2),
        "losses_kwh": round(energy_required_kwh - usable_energy_kwh, 2)
    }
