import streamlit as st
import os
import time
import requests
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
from datetime import datetime, timedelta
from energy_system import EnergySystem, RuleBasedController, SmartController
from rl_environment import EnergyManagementEnv
from dqn_agent import DQNAgent, PPOAgent
from data_generator import TimeSeriesGenerator
from database import save_simulation_run, get_simulation_runs, get_timeseries_data, save_training_metrics, get_training_history
from report_generator import EnergyReportGenerator, create_energy_schedule_export
from location_data import (
    get_location_info, get_household_profile, calculate_recommended_pv_size,
    calculate_battery_size, get_available_cities, calculate_monthly_ev_consumption,
    get_vehicle_manufacturers, get_vehicle_models, get_vehicle_data,
    calculate_charging_time
)
from smart_energy_manager import SmartEnergyManager

def simulate_thermal_system(wohnflaeche_m2, daemmstandard, system_typ, jahreszeit, modus="auto"):
    """
    Berechnet den Stromverbrauch und COP (Effizienz) eines thermischen Systems
    (Wärmepumpe oder Klimaanlage) in Abhängigkeit von Gebäudeparametern und Jahreszeit.

    Parameter:
    ----------
    wohnflaeche_m2 : float
        Beheizte oder klimatisierte Wohnfläche [m²]
    daemmstandard : str
        'gut', 'mittel', 'schlecht'
    system_typ : str
        'Luft' (Luft-Wärmepumpe), 'Erd' (Erdwärmepumpe), 'Klima' (Klimaanlage)
    jahreszeit : str
        'winter', 'fruehling', 'sommer'
    modus : str
        'heizen', 'kühlen', 'auto' (automatische Umschaltung)

    Rückgabe:
    ---------
    dict mit:
        - 'annual_demand_kWh' : jährlicher Energiebedarf
        - 'daily_kWh' : täglicher Stromverbrauch
        - 'cop' : Effizienz (COP/EER)
        - 'temp_avg' : Durchschnittstemperatur
        - 'betrieb' : effektiver Betriebsmodus
        - 'cooling_load_kw' : Kühlleistung (nur bei Kühlung)
    """

    # Heiz-/Kühlbedarf pro m² nach Dämmstandard (kWh/m²*a)
    heat_demand_map = {"gut": 40, "mittel": 70, "schlecht": 120}
    cool_demand_map = {"gut": 10, "mittel": 20, "schlecht": 30}

    # Durchschnittliche Außentemperatur (°C) pro Jahreszeit
    temp_avg_map = {"winter": 0.0, "fruehling": 10.0, "sommer": 20.0}

    temp = temp_avg_map[jahreszeit]
    heat_demand_per_m2 = heat_demand_map[daemmstandard]
    cool_demand_per_m2 = cool_demand_map[daemmstandard]

    # Basis-COP / EER bei Referenzbedingungen
    # (COP: Coefficient of Performance fürs Heizen, EER: fürs Kühlen)
    base_eff = {
        "Luft": {"heizen": 3.0, "kühlen": 3.2},
        "Erd": {"heizen": 4.2, "kühlen": 4.0},
        "Klima": {"heizen": 2.8, "kühlen": 3.5}
    }

    # Temperaturabhängige Korrektur
    if system_typ == "Luft":
        heat_cop = base_eff["Luft"]["heizen"] + (temp - 2) * 0.06
        cool_cop = base_eff["Luft"]["kühlen"] - (temp - 25) * 0.05  # bei höheren Temp. schlechter
    elif system_typ == "Erd":
        heat_cop = base_eff["Erd"]["heizen"] + (temp - 5) * 0.03
        cool_cop = base_eff["Erd"]["kühlen"] - (temp - 15) * 0.02
    else:  # Klimaanlage
        heat_cop = base_eff["Klima"]["heizen"] + (temp - 5) * 0.04
        cool_cop = base_eff["Klima"]["kühlen"] - (temp - 25) * 0.05

    # Begrenzung auf realistische COP-Werte
    heat_cop = max(2.0, min(heat_cop, 6.0))
    cool_cop = max(2.0, min(cool_cop, 6.0))

    # Automatikmodus: Heizen im Winter, Kühlen im Sommer
    if modus == "auto":
        if jahreszeit == "winter":
            modus_effektiv = "heizen"
        elif jahreszeit == "sommer":
            modus_effektiv = "kühlen"
        else:
            modus_effektiv = "heizen" if temp < 12 else "kühlen"
    else:
        modus_effektiv = modus

    # Energiebedarf & Verbrauchsberechnung
    if modus_effektiv == "heizen":
        annual_demand = wohnflaeche_m2 * heat_demand_per_m2
        cop = heat_cop
        cooling_load_kw = 0.0
    else:
        annual_demand = wohnflaeche_m2 * cool_demand_per_m2
        cop = cool_cop
        # Kühlleistung in kW (für Anzeige)
        cooling_load_kw = wohnflaeche_m2 * (cool_demand_per_m2 / 1000)  # in kW

    annual_electricity_kWh = annual_demand / cop

    # Anteil des Jahresverbrauchs für die Jahreszeit
    season_factor = {"winter": 0.6, "fruehling": 0.25, "sommer": 0.15}
    daily_kWh = (annual_electricity_kWh * season_factor[jahreszeit]) / 90  # 3 Monate

    return {
        "annual_demand_kWh": annual_demand,
        "annual_electricity_kWh": annual_electricity_kWh,
        "daily_kWh": round(daily_kWh, 2),
        "cop": round(cop, 2),
        "temp_avg": temp,
        "betrieb": modus_effektiv,
        "cooling_load_kw": round(cooling_load_kw, 2)
    }

def save_to_database(df, control_strategy, scenario, start_date, simulation_days, config):
    """Helper function to save simulation results to database"""
    try:
        # Prepare run metadata
        run_data = {
            'run_name': f"{control_strategy} - {scenario} - {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            'scenario': scenario,
            'control_strategy': control_strategy,
            'start_time': datetime.combine(start_date, datetime.min.time()),
            'end_time': datetime.combine(start_date, datetime.min.time()) + timedelta(days=simulation_days),
            'duration_days': simulation_days,
            'pv_power': config['pv_power'],
            'battery_capacity': config['battery_capacity'],
            'ev_capacity': config['ev_capacity'],
            'ev_charge_power': config['ev_charge_power'],
            'hp_annual_consumption': config['hp_annual'],
            'household_annual_consumption': config.get('household_annual', 4000.0),
            'total_cost': df['cost'].sum(),
            'total_co2': df.get('co2', df.get('co2_emissions', pd.Series([0]))).sum(),
            # Energiegewichtete KPIs
            'autarky_degree': 1.0 - (df['grid_import'].sum() / df.get('total_load', pd.Series([1])).sum()) if df.get('total_load', pd.Series([1])).sum() > 0 else 1.0,
            'self_consumption_rate': df.get('self_consumption', pd.Series([0])).sum() / df['pv_generation'].sum() if df['pv_generation'].sum() > 0 else 0.0,
            'grid_import_total': df['grid_import'].sum(),
            'grid_export_total': df['grid_export'].sum(),
            'pv_generation_total': df['pv_generation'].sum(),
            'config_json': config
        }
        
        # Prepare time-series data
        timeseries_data = []
        for _, row in df.iterrows():
            ts_entry = {
                'timestamp': row['timestamp'],
                'pv_generation': row['pv_generation'],
                'household_load': row['household_load'],
                'ev_charging': row.get('ev_charge', 0.0),
                'hp_consumption': row.get('hp_load', 0.0),
                'total_consumption': row.get('total_load', 0.0),
                'battery_soc': row['battery_soc'],
                'battery_charge': row.get('battery_charge', 0.0),
                'battery_discharge': row.get('battery_discharge', 0.0),
                'ev_soc': row['ev_soc'],
                'ev_present': row.get('ev_present', False),
                'grid_import': row['grid_import'],
                'grid_export': row['grid_export'],
                'grid_price': row['grid_price'],
                'v2g_discharge': row.get('ev_discharge', 0.0),
                'v2g_active': row.get('v2g_active', False),
                'cost': row['cost'],
                'co2_emissions': row.get('co2', 0.0),
                'cloud_cover': row.get('cloud_cover', 0.0),
                'temperature': row.get('temperature', 20.0)
            }
            timeseries_data.append(ts_entry)
        
        # Save to database
        run_id = save_simulation_run(run_data, timeseries_data)
        return run_id
    except Exception as e:
        st.warning(f"Konnte Simulation nicht in Datenbank speichern: {str(e)}")
        return None

# Seiten-Konfiguration
st.set_page_config(
    page_title="KI-basiertes Energiemanagementsystem",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Titel
st.title("⚡ KI-basiertes Energiemanagementsystem")
st.markdown("""
Optimierung von E-Auto Ladeinfrastruktur mit PV, Batterie und Wärmepumpe/Klimaanlage
""")

# Sidebar für Konfiguration
st.sidebar.header("🔧 Intelligente Systemkonfiguration")

# SCHRITT 1: Standort wählen
st.sidebar.subheader("📍 Standort")
available_cities = get_available_cities()
selected_city = st.sidebar.selectbox(
    "Wohnort auswählen",
    available_cities,
    index=available_cities.index("München") if "München" in available_cities else 0,
    help="Ihr Standort bestimmt PV-Erträge und Strompreise"
)

location_info = get_location_info(selected_city)

# SCHRITT 2: Familiengröße wählen
st.sidebar.subheader("👨‍👩‍👧‍👦 Haushalt")
family_size = st.sidebar.radio(
    "Familiengröße",
    [1, 2, 3, 4],
    format_func=lambda x: f"{x} Person{'en' if x > 1 else ''}",
    horizontal=True,
    help="Bestimmt automatisch Haushalt-, Wärmepumpen- und E-Auto-Verbrauch"
)

household_profile = get_household_profile(family_size)

# SCHRITT 3: Systemarchitektur
st.sidebar.subheader("⚙️ Systemarchitektur")

col1, col2 = st.sidebar.columns(2)

with col1:
    coupling_type = st.sidebar.radio(
        "PV-Kopplung",
        ["dc_coupled", "ac_coupled"],
        format_func=lambda x: {
            "dc_coupled": "🔷 DC-gekoppelt",
            "ac_coupled": "🔶 AC-gekoppelt"
        }[x],
        help="""
        **DC-gekoppelt (empfohlen):**
        • 95% Effizienz plus (V2H)
        • Bidirektionales Laden möglich
        
        **AC-gekoppelt:**
        • 90% Effizienz (Standard)
        • Kein bidirektionales Laden
        """
    )

with col2:
    hp_mode = st.sidebar.radio(
        "Betriebsmodus",
        ["heating", "cooling", "auto"],
        format_func=lambda x: {
            "heating": "🔥 Nur Heizen",
            "cooling": "❄️ Nur Kühlen",
            "auto": "🔄 Automatisch"
        }[x],
        help="""
        **Nur Heizen:**
        • Wärmepumpe/Klimaanlage im Heizmodus
        • Für Winter optimiert
        
        **Nur Kühlen:**
        • Klimaanlage aktiv
        • Für Sommer optimiert
        
        **Automatisch:**
        • Saisonal angepasst
        • Sommer → Kühlen
        • Winter → Heizen
        """
    )

# Gebäude-Spezifikationen
st.sidebar.subheader("🏠 Gebäude")

# Wohnfläche
building_area_m2 = st.sidebar.slider(
    "Wohnfläche (m²)",
    min_value=50,
    max_value=300,
    value=household_profile['living_area_m2'],
    step=10,
    help="Wohnfläche des Gebäudes bestimmt den Wärmebedarf"
)

# Gebäude-Dämmung
from location_data import INSULATION_CLASSES, HEAT_PUMP_TYPES, get_insulation_class
insulation_options = {
    "schlecht": "🏚️ Altbau (0.12 kW/m²)",
    "mittel": "🏠 Standard (0.08 kW/m²)",
    "gut": "🏡 Neubau (0.04 kW/m²)"
}
insulation_type = st.sidebar.selectbox(
    "Gebäude-Dämmung",
    options=list(insulation_options.keys()),
    format_func=lambda x: insulation_options[x],
    index=1,
    help="""
    **Altbau:** 0.12 kW/m² spezifischer Wärmebedarf
    **Standard:** 0.08 kW/m² spezifischer Wärmebedarf  
    **Neubau:** 0.04 kW/m² spezifischer Wärmebedarf
    
    Formel: Wärmebedarf (kW) = Wohnfläche (m²) × spezifischer Wärmebedarf (kW/m²)
    Beispiel Standard 120m²: 120 × 0.08 = 9.6 kW
    """
)

# Wärmepumpentyp
hp_type = st.sidebar.selectbox(
    "Wärmepumpen-/Klimaanlagentyp",
    options=list(HEAT_PUMP_TYPES.keys()),
    format_func=lambda x: f"{HEAT_PUMP_TYPES[x]['icon']} {HEAT_PUMP_TYPES[x]['name']}",
    index=0,
    help="""
    **🌍 Erdwärmepumpe:** Nutzt Erdreich, COP 4-5, sehr effizient
    **💨 Luftwärmepumpe:** Nutzt Außenluft, COP 2-3, günstiger
    **❄️ Klimaanlage:** Hauptsächlich Kühlung, COP/EER 2-3
    
    Die Effizienz hängt stark von der Außentemperatur ab.
    """
)

# Berechne und zeige Wärmebedarf
insulation_info = get_insulation_class(insulation_type)
hp_info = HEAT_PUMP_TYPES[hp_type]
calculated_heat_demand_kw = building_area_m2 * insulation_info['specific_heat_demand_kw_per_m2']

st.sidebar.info(f"""
**📊 Berechneter Wärmebedarf:**
- Wohnfläche: {building_area_m2} m²
- Spez. Bedarf: {insulation_info['specific_heat_demand_kw_per_m2']:.2f} kW/m²
- **Wärmebedarf: {calculated_heat_demand_kw:.1f} kW**
- WP-Typ: {hp_info['name']}
- COP-Bereich: {hp_info['cop_min']}-{hp_info['cop_max']}
""")

# Effizienz-Anzeige basierend auf Auswahl
col1, col2 = st.sidebar.columns(2)

with col1:
    if coupling_type == "dc_coupled":
        st.success("**✅ DC:** 95% Effizienz plus (V2H)")
    else:
        st.warning("**⚠️ AC:** 90% Effizienz (Standard)")

with col2:
    if hp_mode == "heating":
        st.info("**🔥 Heizen:** COP 2.5-5.0")
    elif hp_mode == "cooling":
        st.info("**❄️ Kühlen:** EER 3.0-6.0")
    else:
        st.info("**🔄 Auto:** Saisonabhängig")

# SCHRITT 4: Szenario & Dauer
st.sidebar.subheader("📅 Simulation")
scenario = st.sidebar.selectbox(
    "Jahreszeit",
    ["summer", "winter", "spring"],
    format_func=lambda x: {"summer": "☀️ Sommer", "winter": "❄️ Winter", "spring": "🌸 Frühling"}[x],
    help="Beeinflusst PV-Ertrag und Wärmebedarf"
)

# Zeiteinheit auswählen
time_unit = st.sidebar.radio(
    "Zeiteinheit",
    ["⏱️ Stunden", "📅 Tage"],
    index=1,
    horizontal=True,
    help="Wählen Sie zwischen stündlicher oder täglicher Simulation"
)

if time_unit == "⏱️ Stunden":
    duration_option = st.sidebar.select_slider(
        "Simulationsdauer",
        options=[1, 6, 12, 24, 48, 72],
        value=24,
        format_func=lambda x: f"{x} Stunde{'n' if x > 1 else ''}",
        help="Für kurze Zeiträume und detaillierte Analysen"
    )
    simulation_hours = duration_option
    simulation_days = duration_option / 24
    duration_label = f"{duration_option} Stunde{'n' if duration_option > 1 else ''}"
else:  # Tage
    duration_option = st.sidebar.select_slider(
        "Simulationsdauer",
        options=[1, 2, 3, 5, 7, 14, 30, 60, 90],
        value=30,
        format_func=lambda x: f"{x} Tag{'e' if x > 1 else ''}",
        help="Für realistische Langzeit-Analysen"
    )
    simulation_days = duration_option
    simulation_hours = duration_option * 24
    duration_label = f"{duration_option} Tag{'e' if duration_option > 1 else ''}"

# SCHRITT 5: Automatische Berechnungen
st.sidebar.subheader("⚙️ Automatisch ermittelte Parameter")

# PV-Größe berechnen
recommended_pv = calculate_recommended_pv_size(family_size, selected_city)
# Minimum PV: 3 kWp, Maximum: 30 kWp
min_pv = 3.0
default_pv = max(min_pv, float(recommended_pv)) if recommended_pv else 10.0
pv_power = st.sidebar.number_input(
    "PV-Leistung (kWp)",
    min_pv, 30.0, 
    default_pv, 
    0.5,
    help=f"Empfohlen: {recommended_pv:.1f} kWp für {family_size}-Personen Haushalt in {selected_city}"
)

# Batterie-Größe berechnen
recommended_battery = calculate_battery_size(pv_power, family_size)
battery_capacity = st.sidebar.number_input(
    "Batteriekapazität (kWh)",
    5.0, 20.0,
    float(recommended_battery),
    1.0,
    help="Basierend auf PV-Größe (1 kWh pro kWp)"
)

# E-Auto Auswahl
st.sidebar.subheader("🚗 E-Auto")
manufacturers = get_vehicle_manufacturers()
selected_manufacturer = st.sidebar.selectbox(
    "Hersteller",
    manufacturers,
    index=0,
    help="Wählen Sie den Fahrzeughersteller"
)

models = get_vehicle_models(selected_manufacturer)
selected_model = st.sidebar.selectbox(
    "Modell",
    models,
    index=0,
    help="Wählen Sie das Fahrzeugmodell"
)

vehicle_data = get_vehicle_data(selected_manufacturer, selected_model)
ev_capacity = vehicle_data['capacity_kwh']
ev_charge_power = 11.0  # Standard-Wallbox

# Onboard-Ladeleistungslimit
ev_onboard_limit = st.sidebar.selectbox(
    "Onboard-Ladeleistung",
    [7.4, 11.0],
    index=1,
    format_func=lambda x: f"{x:.1f} kW",
    help="""
    **Onboard-Charger-Limit:**
    • 7.4 kW: Ältere E-Autos (z.B. BMW i3 60 Ah, Nissan Leaf)
    • 11.0 kW: Moderne E-Autos (Standard)
    
    Die tatsächliche Ladeleistung ist das Minimum aus Wallbox und Onboard-Limit.
    """
)

# Nachtladefenster (optional)
with st.sidebar.expander("🌙 Nachtladung (optional)"):
    prefer_night_charging = st.checkbox(
        "Bevorzuge Nachtladung",
        value=True,
        help="Lädt E-Auto bevorzugt nachts während günstiger Stromtarife (0-6 Uhr)"
    )
    
    col_night1, col_night2 = st.columns(2)
    with col_night1:
        night_charging_start = st.number_input(
            "Start (Uhr)",
            0, 23, 22, 1,
            help="Beginn des Nachtladefensters"
        )
    with col_night2:
        night_charging_end = st.number_input(
            "Ende (Uhr)",
            0, 23, 6, 1,
            help="Ende des Nachtladefensters"
        )

# Berechne Ladezeiten für beide Systeme (wird später basierend auf coupling_type ausgewählt)
charge_time_ac = calculate_charging_time(ev_capacity, ev_charge_power, "ac_coupled")
charge_time_dc = calculate_charging_time(ev_capacity, ev_charge_power, "dc_coupled")
max_charge_power = min(ev_charge_power, ev_onboard_limit)

# Info zur Ladezeit mit beiden Varianten
st.sidebar.info(f"""
**E-Auto Eigenschaften:**
- 🔋 Kapazität: {ev_capacity:.1f} kWh
- 📊 Verbrauch: {vehicle_data['efficiency_kwh_per_100km']:.1f} kWh/100km
- ⚡ Max. Ladeleistung: {max_charge_power:.1f} kW

**⏱️ Ladezeit (20-80%) mit {max_charge_power:.1f} kW:**
- 🔷 DC-gekoppelt: {charge_time_dc['charge_time_h']:.1f} h ({charge_time_dc['losses_kwh']:.1f} kWh Verluste)
- 🔶 AC-gekoppelt: {charge_time_ac['charge_time_h']:.1f} h ({charge_time_ac['losses_kwh']:.1f} kWh Verluste)

*DC: 95% Effizienz plus (V2H), AC: 90% Effizienz (Standard)*
""")

# Manuelle Kapazitätseingabe für benutzerdefinierte Fahrzeuge
if selected_manufacturer == "Benutzerdefiniert":
    ev_capacity = st.sidebar.number_input(
        "Batteriekapazität (kWh)", 
        30.0, 120.0, 
        float(ev_capacity), 
        5.0,
        help="Geben Sie die Batteriekapazität Ihres Fahrzeugs ein"
    )

# Jahresverbräuche aus Profil
household_annual = household_profile['annual_consumption_kwh']

# Mapping der UI-Parameter auf Funktionsparameter
scenario_mapping = {
    "summer": "sommer",
    "winter": "winter",
    "spring": "fruehling"
}

mode_mapping = {
    "heating": "heizen",
    "cooling": "kühlen",
    "auto": "auto"
}

# System-Typ direkt aus Wärmepumpentyp ableiten
system_typ = "Luft" if hp_type == "air" else "Erd"

# Berechnung mit temperatur- und jahreszeitabhängigem COP
hp_result = simulate_thermal_system(
    wohnflaeche_m2=building_area_m2,
    daemmstandard=insulation_type,
    system_typ=system_typ,
    jahreszeit=scenario_mapping[scenario],
    modus=mode_mapping[hp_mode]
)

# Ergebnisse extrahieren
hp_annual = hp_result['annual_electricity_kWh']
hp_daily = hp_result['daily_kWh']
hp_cop_seasonal = hp_result['cop']
hp_temp_avg = hp_result['temp_avg']
hp_betrieb = hp_result['betrieb']
cooling_load_kw = hp_result['cooling_load_kw']

# Debug-Ausgabe für Wärmepumpenberechnung
betrieb_emoji = "🔥" if hp_betrieb == "heizen" else "❄️"
if cooling_load_kw > 0:
    print(f"{betrieb_emoji} Thermisches System: {hp_daily:.1f} kWh/Tag bei COP={hp_cop_seasonal} (Temp: {hp_temp_avg:.0f}°C, {hp_betrieb}, {cooling_load_kw:.1f} kW Kühllast)")
else:
    print(f"{betrieb_emoji} Thermisches System: {hp_daily:.1f} kWh/Tag bei COP={hp_cop_seasonal} (Temp: {hp_temp_avg:.0f}°C, {hp_betrieb})")

ev_annual_kwh = (household_profile['ev_annual_km'] * 
                 household_profile['ev_consumption_kwh_per_100km'] / 100)

# E-Auto Fahrparameter für täglichen Zyklus
ev_daily_km = household_profile['ev_annual_km'] / 365.0  # Durchschnittliche Tagesfahrstrecke
ev_consumption_kwh_per_100km = household_profile['ev_consumption_kwh_per_100km']

# Steuerungs-Modus
st.sidebar.subheader("🤖 Steuerung")
control_mode = st.sidebar.radio(
    "Steuerungsmodus",
    ["Intelligente Regelung", "KI-Agent (DQN)", "Vergleich"],
    help="Intelligente Regelung nutzt automatische Energiepriorisierung"
)

# Erweiterte Einstellungen (optional)
with st.sidebar.expander("🔧 Erweiterte Einstellungen"):
    st.markdown("**Standort-Informationen**")
    st.info(f"""
    - Region: {location_info['region']}
    - PV-Ertrag: {location_info['pv_yield_kwh_per_kwp']} kWh/kWp
    - Strompreis: {location_info['electricity_price_eur_per_kwh']:.2f} €/kWh
    - Einspeisevergütung: {location_info['feed_in_tariff_eur_per_kwh']:.3f} €/kWh
    """)
    
    st.markdown("**Verbrauchsprofil**")
    from location_data import get_building_specs
    building_specs = get_building_specs(family_size)
    
    # Betriebsmodus-Info vorbereiten
    betrieb_emoji = "🔥" if hp_betrieb == "heizen" else "❄️"
    betrieb_text = "Heizen" if hp_betrieb == "heizen" else "Kühlen"
    
    # Kühllast-Info für die Anzeige vorbereiten
    cooling_info = ""
    if cooling_load_kw > 0:
        cooling_info = f"\n      - ❄️ **Kühllast: {cooling_load_kw:.1f} kW**"
    
    # System-Typ anzeigen
    system_info = {
        "Luft": "Luftwärmepumpe",
        "Erd": "Erdwärmepumpe", 
        "Klima": "Klimaanlage"
    }
    
    st.info(f"""
    - **Gebäude:** {building_specs['living_area_m2']:.0f} m² Wohnfläche ({building_specs['building_volume_m3']:.0f} m³)
    - Haushalt: {household_annual:.0f} kWh/Jahr
    - {system_info[system_typ]}: {hp_annual:.0f} kWh/Jahr
      - {betrieb_emoji} **Betrieb:** {betrieb_text} ({scenario_mapping[scenario]})
      - 📊 Tagesbedarf: {hp_daily:.1f} kWh/Tag{cooling_info}
      - ⚡ COP/EER: {hp_cop_seasonal:.2f} bei {hp_temp_avg:.0f}°C Außentemperatur
    - E-Auto: {ev_annual_kwh:.0f} kWh/Jahr ({household_profile['ev_annual_km']} km)
    - **Gesamt: {household_annual + hp_annual + ev_annual_kwh:.0f} kWh/Jahr**
    """)
    
    # Manuelle Überschreibung
    manual_override = st.checkbox("Manuelle Parameter-Eingabe")
    if manual_override:
        household_annual = st.number_input("Haushalt (kWh/Jahr)", 1000.0, 8001.0, float(household_annual), 100.0)
        hp_annual = st.number_input("Wärmepumpe/Klimaanlage (kWh/Jahr)", 1000.0, 10000.0, float(hp_annual), 100.0)
        ev_capacity = st.number_input("E-Auto Kapazität (kWh)", 30.0, 100.0, float(ev_capacity), 5.0)

# Initialisierung Session State
if 'simulation_run' not in st.session_state:
    st.session_state.simulation_run = False
    st.session_state.results = None

# Hauptbereich
tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([
    "🎯 Simulation", 
    "📈 Analyse", 
    "🤖 KI-Training",
    "📚 Dokumentation",
    "🗄️ Historie",
    "🚗 Mein E-Auto"
])

with tab1:
    st.header("⚡ Intelligente Energie-Simulation")
    
    # Konfigurationsübersicht
    st.info(f"""
    **📍 Standort:** {selected_city} ({location_info['region']}) | 
    **👨‍👩‍👧‍👦 Haushalt:** {family_size} Person{'en' if family_size > 1 else ''} | 
    **📅 Simulation:** {duration_label} ({scenario.title()}) | 
    **💰 Strompreis:** {location_info['electricity_price_eur_per_kwh']:.2f} €/kWh
    """)
    
    col1, col2, col3 = st.columns([1, 1, 1])
    
    with col1:
        st.metric(
            "🌞 PV-Anlage", 
            f"{pv_power:.1f} kWp",
            help=f"Erwarteter Ertrag: {pv_power * location_info['pv_yield_kwh_per_kwp']:.0f} kWh/Jahr"
        )
        st.metric(
            "🔋 Batteriespeicher",
            f"{battery_capacity:.0f} kWh",
            help="Optimiert für Tages-Eigenverbrauch"
        )
    
    with col2:
        st.metric(
            "🏠 Haushaltverbrauch",
            f"{household_annual:.0f} kWh/Jahr",
            help=f"Basierend auf {family_size}-Personen Haushalt"
        )
        st.metric(
            "💨 Wärmepumpe/Klimaanlage",
            f"{hp_annual:.0f} kWh/Jahr",
            help="Temperaturabhängiger Betrieb"
        )
    
    with col3:
        st.metric(
            "🚗 E-Auto",
            f"{ev_capacity:.0f} kWh ({household_profile['ev_annual_km']/1000:.0f}k km/Jahr)",
            help=f"Verbrauch: ~{ev_annual_kwh:.0f} kWh/Jahr"
        )
        total_annual = household_annual + hp_annual + ev_annual_kwh
        pv_coverage = (pv_power * location_info['pv_yield_kwh_per_kwp'] / total_annual * 100) if total_annual > 0 else 0
        st.metric(
            "♻️ PV-Deckung",
            f"{pv_coverage:.0f}%",
            help=f"Anteil des Gesamtverbrauchs ({total_annual:.0f} kWh/Jahr) durch PV gedeckt"
        )
    
    st.divider()
    
    # Simulationsstart
    col_sim1, col_sim2 = st.columns([2, 1])
    
    with col_sim1:
        st.subheader("Simulationseinstellungen")
        
        start_date = st.date_input(
            "Startdatum",
            value=datetime(2024, 7, 1) if scenario == "summer" else 
                  datetime(2024, 1, 1) if scenario == "winter" else
                  datetime(2024, 4, 1),
            help="Startzeitpunkt der Simulation"
        )
        
        # Initialer SOC
        col_a, col_b = st.columns(2)
        with col_a:
            init_battery_soc = st.slider(
                "Batterie-SOC (Start)", 
                0, 100, 50,
                help="Anfangsladung des Batteriespeichers (optimal: 20-90% für Lebensdauer)"
            ) / 100
        with col_b:
            init_ev_soc = st.slider(
                "E-Auto SOC (Start)", 
                0, 100, 50,
                help="Anfangsladung des E-Autos (empfohlen: 20-80%)"
            ) / 100
    
    with col_sim2:
        st.subheader("⚡ Optimierte Energiepriorisierung")
        st.success("""
        **Ziele: Max. Eigenverbrauch & Autarkie**
        
        **☀️ TAGSÜBER (6-22 Uhr):**
        1. 🏠 Haushalt + 🌡️ WP (Direktnutzung)
        2. 🔋 **Batterie → 90%** (Reserve!)
        3. 🚗 **E-Auto → 95%** (ab 70% Batt.)
           - Langsam 80-95%: 5.5 kW
           - Normal <80%: 11 kW
        4. 🔋 Batterie → 100% (wenn E-Auto ≥80%)
        5. ⛔ Überschuss abregeln
        
        **🌙 NACHTS (22-6 Uhr):**
        1. 🔋 Batterie → Lasten (bis 20% Reserve)
        2. 🚗 **E-Auto günstig laden (0-6h)**
        3. 🔋 Batterie laden:
           - 0-6h: → 80%
           - Sonst: → 50%
        4. 🔄 V2G bei Spitzenlast
        5. 🌐 Netz nur bei Batt. <20%
        
        **📊 Effizienz-Features:**
        - Batterie-Schonung: 20-90% SOC
        - PV-Eigenverbrauch: >90%
        - Autarkiegrad: >80%
        """)
    
    # Simulation starten
    if st.button("🚀 Simulation starten", type="primary", use_container_width=True):
        with st.spinner("Simulation läuft..."):
            # Gebäudespezifikationen aus Familiengröße
            from location_data import get_building_specs, get_insulation_class
            building_specs = get_building_specs(family_size)
            insulation_info = get_insulation_class(insulation_type)
            
            # Energiesystem mit allen Parametern initialisieren
            energy_system = EnergySystem(
                use_live_weather=True,  # Nutze OpenWeatherMap API
                coupling_type=coupling_type, 
                hp_mode=hp_mode,
                hp_type=hp_type,
                location_lat=location_info['latitude'],
                location_lon=location_info['longitude'],
                building_area_m2=building_area_m2,
                building_volume_m3=building_specs['building_volume_m3'],
                specific_heat_demand_kw_per_m2=insulation_info['specific_heat_demand_kw_per_m2']
            )
            
            # System-Parameter
            energy_system.pv_power = pv_power
            energy_system.battery_capacity = battery_capacity
            energy_system.ev_capacity = ev_capacity
            energy_system.ev_charge_power = ev_charge_power
            energy_system.ev_onboard_limit = ev_onboard_limit
            energy_system.night_charging_start = night_charging_start
            energy_system.night_charging_end = night_charging_end
            energy_system.prefer_night_charging = prefer_night_charging
            
            # E-Auto Fahrparameter (KRITISCH für täglichen Ladezyklus!)
            energy_system.ev_daily_km = ev_daily_km
            energy_system.ev_consumption_kwh_per_100km = ev_consumption_kwh_per_100km
            
            # Verbrauchswerte aus Profil
            energy_system.household_annual_consumption = household_annual
            energy_system.hp_annual_consumption = hp_annual
            
            # PV-Ertrag und Strompreise aus Standort
            energy_system.pv_yield_kwh_per_kwp = location_info['pv_yield_kwh_per_kwp']
            energy_system.grid_price = location_info['electricity_price_eur_per_kwh']
            energy_system.feed_in_tariff = location_info['feed_in_tariff_eur_per_kwh']
            
            # SOC initialisieren
            energy_system.battery_soc = init_battery_soc
            energy_system.ev_soc = init_ev_soc
            
            # Konfiguration für Datenbank speichern
            config = {
                'pv_power': pv_power,
                'battery_capacity': battery_capacity,
                'ev_capacity': ev_capacity,
                'ev_charge_power': ev_charge_power,
                'hp_annual': hp_annual,
                'household_annual': household_annual,
                'location': selected_city,
                'family_size': family_size,
                'building_area_m2': building_specs['living_area_m2'],
                'building_volume_m3': building_specs['building_volume_m3'],
                'grid_price': location_info['electricity_price_eur_per_kwh'],
                'feed_in_tariff': location_info['feed_in_tariff_eur_per_kwh'],
                'coupling_type': coupling_type,
                'hp_mode': hp_mode,
                'hp_type': hp_type,
                'use_live_weather': True
            }
            
            # Controller wählen
            if control_mode == "Intelligente Regelung":
                controller = SmartController()
                
                # Simulation durchführen
                results = []
                current_time = datetime.combine(start_date, datetime.min.time())
                
                for hour in range(int(simulation_hours)):
                    # Aktuelle Werte abrufen
                    pv_gen = energy_system.get_pv_generation(current_time, scenario)
                    household_load = energy_system.get_household_load(current_time)
                    
                    # Action bestimmen mit SmartController
                    action = controller.get_action(
                        energy_system, current_time, pv_gen, household_load, scenario
                    )
                    
                    # Schritt ausführen
                    state = energy_system.step(action, current_time, scenario)
                    results.append(state)
                    
                    current_time += timedelta(hours=1)
                
                st.session_state.results = pd.DataFrame(results)
                st.session_state.simulation_run = True
                st.session_state.control_mode = "Intelligente Regelung"
                
                # Save to database
                run_id = save_to_database(st.session_state.results, "Intelligente Regelung", scenario, start_date, simulation_days, config)
                if run_id:
                    st.session_state.last_run_id = run_id
                
            elif control_mode == "Regelbasiert":
                controller = RuleBasedController()
                
                # Simulation durchführen
                results = []
                current_time = datetime.combine(start_date, datetime.min.time())
                
                for hour in range(int(simulation_hours)):
                    # Aktuelle Werte abrufen
                    pv_gen = energy_system.get_pv_generation(current_time, scenario)
                    household_load = energy_system.get_household_load(current_time)
                    
                    # Action bestimmen
                    action = controller.get_action(
                        energy_system, current_time, pv_gen, household_load, scenario
                    )
                    
                    # Schritt ausführen
                    state = energy_system.step(action, current_time, scenario)
                    results.append(state)
                    
                    current_time += timedelta(hours=1)
                
                st.session_state.results = pd.DataFrame(results)
                st.session_state.simulation_run = True
                st.session_state.control_mode = "Regelbasiert"
                
                # Save to database (config already defined above)
                run_id = save_to_database(st.session_state.results, "Regelbasiert", scenario, start_date, simulation_days, config)
                if run_id:
                    st.session_state.last_run_id = run_id
                
            elif control_mode == "KI-Agent (DQN)":
                # RL Environment
                env = EnergyManagementEnv(
                    energy_system,
                    datetime.combine(start_date, datetime.min.time()),
                    scenario,
                    episode_length=int(simulation_hours)
                )
                
                # DQN Agent auswählen
                agent = DQNAgent(
                    state_dim=8,
                    action_dim=3,
                    learning_rate=0.001,
                    gamma=0.95
                )
                
                # Training
                st.info("🎓 KI-Agent (DQN) wird trainiert (100 Episoden)...")
                training_rewards = agent.train(env, episodes=100, verbose=False)
                
                # Test-Episode mit trainiertem Agent
                energy_system.battery_soc = init_battery_soc
                energy_system.ev_soc = init_ev_soc
                obs = env.reset()
                results = []
                done = False
                
                while not done:
                    action = agent.get_action(obs, training=False)
                    obs, reward, done, info = env.step(action)
                    results.append(info['state'])
                
                st.session_state.results = pd.DataFrame(results)
                st.session_state.simulation_run = True
                st.session_state.control_mode = "KI-Agent (DQN)"
                st.session_state.training_rewards = training_rewards
                
                # Save to database (config already defined above)
                run_id = save_to_database(st.session_state.results, "KI-Agent (DQN)", scenario, start_date, simulation_days, config)
                if run_id:
                    st.session_state.last_run_id = run_id
                
            else:  # Vergleich
                st.info("🔄 Vergleichsmodus: Intelligente Regelung vs. Regelbasiert")
                
                # Regelbasierte Simulation
                energy_system_rule = EnergySystem(
                    use_live_weather=True,
                    coupling_type=coupling_type,
                    hp_mode=hp_mode,
                    hp_type=hp_type,
                    location_lat=location_info['latitude'],
                    location_lon=location_info['longitude'],
                    building_area_m2=building_area_m2,
                    building_volume_m3=building_specs['building_volume_m3'],
                    specific_heat_demand_kw_per_m2=insulation_info['specific_heat_demand_kw_per_m2']
                )
                energy_system_rule.pv_power = pv_power
                energy_system_rule.battery_capacity = battery_capacity
                energy_system_rule.ev_capacity = ev_capacity
                energy_system_rule.ev_charge_power = ev_charge_power
                energy_system_rule.ev_onboard_limit = ev_onboard_limit
                energy_system_rule.night_charging_start = night_charging_start
                energy_system_rule.night_charging_end = night_charging_end
                energy_system_rule.prefer_night_charging = prefer_night_charging
                energy_system_rule.ev_daily_km = ev_daily_km
                energy_system_rule.ev_consumption_kwh_per_100km = ev_consumption_kwh_per_100km
                energy_system_rule.household_annual_consumption = household_annual
                energy_system_rule.hp_annual_consumption = hp_annual
                energy_system_rule.pv_yield_kwh_per_kwp = location_info['pv_yield_kwh_per_kwp']
                energy_system_rule.grid_price = location_info['electricity_price_eur_per_kwh']
                energy_system_rule.feed_in_tariff = location_info['feed_in_tariff_eur_per_kwh']
                energy_system_rule.battery_soc = init_battery_soc
                energy_system_rule.ev_soc = init_ev_soc
                
                controller = RuleBasedController()
                results_rule = []
                current_time = datetime.combine(start_date, datetime.min.time())
                
                for hour in range(int(simulation_hours)):
                    pv_gen = energy_system_rule.get_pv_generation(current_time, scenario)
                    household_load = energy_system_rule.get_household_load(current_time)
                    action = controller.get_action(
                        energy_system_rule, current_time, pv_gen, household_load, scenario
                    )
                    state = energy_system_rule.step(action, current_time, scenario)
                    results_rule.append(state)
                    current_time += timedelta(hours=1)
                
                # Intelligente Regelung Simulation
                energy_system_smart = EnergySystem(
                    use_live_weather=True,
                    coupling_type=coupling_type,
                    hp_mode=hp_mode,
                    hp_type=hp_type,
                    location_lat=location_info['latitude'],
                    location_lon=location_info['longitude'],
                    building_area_m2=building_area_m2,
                    building_volume_m3=building_specs['building_volume_m3'],
                    specific_heat_demand_kw_per_m2=insulation_info['specific_heat_demand_kw_per_m2']
                )
                energy_system_smart.pv_power = pv_power
                energy_system_smart.battery_capacity = battery_capacity
                energy_system_smart.ev_capacity = ev_capacity
                energy_system_smart.ev_charge_power = ev_charge_power
                energy_system_smart.ev_onboard_limit = ev_onboard_limit
                energy_system_smart.night_charging_start = night_charging_start
                energy_system_smart.night_charging_end = night_charging_end
                energy_system_smart.prefer_night_charging = prefer_night_charging
                energy_system_smart.ev_daily_km = ev_daily_km
                energy_system_smart.ev_consumption_kwh_per_100km = ev_consumption_kwh_per_100km
                energy_system_smart.household_annual_consumption = household_annual
                energy_system_smart.hp_annual_consumption = hp_annual
                energy_system_smart.pv_yield_kwh_per_kwp = location_info['pv_yield_kwh_per_kwp']
                energy_system_smart.grid_price = location_info['electricity_price_eur_per_kwh']
                energy_system_smart.feed_in_tariff = location_info['feed_in_tariff_eur_per_kwh']
                energy_system_smart.battery_soc = init_battery_soc
                energy_system_smart.ev_soc = init_ev_soc
                
                controller_smart = SmartController()
                results_smart = []
                current_time_smart = datetime.combine(start_date, datetime.min.time())
                
                st.info("⚡ Simuliere intelligente Energieverteilung...")
                for hour in range(int(simulation_hours)):
                    pv_gen = energy_system_smart.get_pv_generation(current_time_smart, scenario)
                    household_load = energy_system_smart.get_household_load(current_time_smart)
                    action = controller_smart.get_action(
                        energy_system_smart, current_time_smart, pv_gen, household_load, scenario
                    )
                    state = energy_system_smart.step(action, current_time_smart, scenario)
                    results_smart.append(state)
                    current_time_smart += timedelta(hours=1)
                
                # Beide Ergebnisse speichern
                st.session_state.results = pd.DataFrame(results_rule)
                st.session_state.results_comparison = pd.DataFrame(results_smart)
                st.session_state.simulation_run = True
                st.session_state.control_mode = "Vergleich"
                
                # Save both to database (config already defined above)
                run_id_rule = save_to_database(st.session_state.results, "Regelbasiert", scenario, start_date, simulation_days, config)
                run_id_smart = save_to_database(st.session_state.results_comparison, "Intelligente Regelung", scenario, start_date, simulation_days, config)
                if run_id_rule and run_id_smart:
                    st.session_state.last_run_ids = [run_id_rule, run_id_smart]
        
        st.success("✅ Simulation abgeschlossen!")
        st.rerun()
    
    # Ergebnisse anzeigen
    if st.session_state.simulation_run and st.session_state.results is not None:
        st.divider()
        st.subheader("📊 Simulationsergebnisse")
        
        df = st.session_state.results
        
        # KPIs
        col1, col2, col3, col4, col5, col6 = st.columns(6)
        
        with col1:
            total_cost = df['cost'].sum()
            st.metric("Gesamtkosten", f"{total_cost:.2f} €")
        
        with col2:
            total_co2 = df['co2'].sum()
            st.metric("CO₂-Emissionen", f"{total_co2:.2f} kg")
        
        with col3:
            total_conversion_losses = df.get('conversion_losses', pd.Series([0] * len(df))).sum()
            coupling_label = "DC" if coupling_type == "dc_coupled" else "AC"
            st.metric("Konversionsverluste", f"{total_conversion_losses:.2f} kWh", 
                     delta=f"{coupling_label}-gekoppelt", delta_color="normal")
        
        with col4:
            # Energiegewichteter Autarkiegrad: 1 - Σgrid_import / Σtotal_load
            total_grid_import = df['grid_import'].sum()
            total_load_sum = df['total_load'].sum()
            avg_autarky = (1.0 - (total_grid_import / total_load_sum)) * 100 if total_load_sum > 0 else 100
            autarky_status = "✅" if avg_autarky >= 80 else "⚠️" if avg_autarky >= 70 else "❌"
            st.metric(f"{autarky_status} Autarkiegrad", f"{avg_autarky:.1f} %",
                     help="Ziel: >80% (grün) - Energiegewichtet")
        
        with col5:
            # Energiegewichteter PV-Eigenverbrauch: ΣPV_self / ΣPV_gen
            total_pv_gen = df['pv_generation'].sum()
            total_self_consumption = df['self_consumption'].sum()
            avg_self_consumption = (total_self_consumption / total_pv_gen) * 100 if total_pv_gen > 0 else 0
            self_cons_status = "✅" if avg_self_consumption >= 90 else "⚠️" if avg_self_consumption >= 80 else "❌"
            st.metric(f"{self_cons_status} PV-Eigenverbrauch", f"{avg_self_consumption:.1f} %",
                     help="Ziel: >90% (grün) - Energiegewichtet")
        
        with col6:
            grid_import_total = df['grid_import'].sum()
            st.metric("Netzbezug", f"{grid_import_total:.1f} kWh")
        
        # Optimierungs-KPIs (neu)
        if 'battery_in_optimal_range' in df.columns:
            st.divider()
            st.subheader("⚙️ Optimierungs-KPIs")
            
            col1, col2, col3, col4 = st.columns(4)
            
            with col1:
                battery_health_ratio = df['battery_in_optimal_range'].mean() * 100
                battery_health_icon = "✅" if battery_health_ratio >= 85 else "⚠️"
                st.metric(
                    f"{battery_health_icon} Batterie 20-90% SOC",
                    f"{battery_health_ratio:.1f} %",
                    help="Anteil der Zeit in optimalem SOC-Bereich (20-90%)"
                )
            
            with col2:
                pv_total = df['pv_generation'].sum()
                pv_curtailed_total = df.get('pv_curtailed', pd.Series([0] * len(df))).sum()
                pv_utilization = ((pv_total - pv_curtailed_total) / pv_total * 100) if pv_total > 0 else 0
                pv_util_icon = "✅" if pv_utilization >= 95 else "⚠️"
                st.metric(
                    f"{pv_util_icon} PV-Nutzungsgrad",
                    f"{pv_utilization:.1f} %",
                    help="Anteil der PV-Energie, der nicht abgeregelt wurde"
                )
            
            with col3:
                if 'is_cheap_night' in df.columns:
                    cheap_night_charging = df[df['is_cheap_night'] == True]['ev_charge'].sum()
                    total_ev_charging = df['ev_charge'].sum()
                    cheap_charging_ratio = (cheap_night_charging / total_ev_charging * 100) if total_ev_charging > 0 else 0
                    st.metric(
                        "🌙 Günstiges EV-Laden",
                        f"{cheap_charging_ratio:.1f} %",
                        help="Anteil EV-Ladung in günstiger Zeit (0-6 Uhr)"
                    )
            
            with col4:
                avg_battery_reserve = (df['battery_soc'] >= 0.20).mean() * 100
                reserve_icon = "✅" if avg_battery_reserve >= 95 else "⚠️"
                st.metric(
                    f"{reserve_icon} Batterie-Reserve",
                    f"{avg_battery_reserve:.1f} %",
                    help="Anteil der Zeit mit >20% Batterie-Reserve"
                )
        
        # SOC-Status (State of Charge) - Ladezustände
        st.divider()
        st.subheader("🔋 Ladezustände (SOC - State of Charge)")
        
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            current_battery_soc = df['battery_soc'].iloc[-1] * 100
            battery_health = "✅" if 20 <= current_battery_soc <= 80 else "⚠️"
            st.metric(
                f"{battery_health} Batterie-SOC (aktuell)", 
                f"{current_battery_soc:.1f} %",
                help="Optimaler Bereich: 20-80% für längere Lebensdauer"
            )
        
        with col2:
            avg_battery_soc = df['battery_soc'].mean() * 100
            st.metric(
                "Batterie-SOC (Durchschnitt)", 
                f"{avg_battery_soc:.1f} %"
            )
        
        with col3:
            current_ev_soc = df['ev_soc'].iloc[-1] * 100
            ev_health = "✅" if 20 <= current_ev_soc <= 80 else "⚠️"
            st.metric(
                f"{ev_health} E-Auto SOC (aktuell)", 
                f"{current_ev_soc:.1f} %",
                help="Optimaler Bereich: 20-80% für längere Lebensdauer"
            )
        
        with col4:
            avg_ev_soc = df['ev_soc'].mean() * 100
            st.metric(
                "E-Auto SOC (Durchschnitt)", 
                f"{avg_ev_soc:.1f} %"
            )
        
        # Warnungen bei kritischen SOC-Werten
        if current_battery_soc < 20 or current_ev_soc < 20:
            st.warning("⚠️ **Achtung Tiefentladung**: SOC unter 20% kann die Batterielebensdauer verkürzen!")
        if current_battery_soc > 80 or current_ev_soc > 80:
            st.info("ℹ️ **Hinweis**: SOC über 80% - Für optimale Batteriegesundheit wird der Bereich 20-80% empfohlen.")
        
        # Energiefluss-Diagramm
        st.subheader("🔄 Energiefluss über Zeit")
        
        fig = make_subplots(
            rows=3, cols=1,
            subplot_titles=('Erzeugung & Verbrauch', 'Batteriezustände (SOC)', 'Netz-Interaktion'),
            vertical_spacing=0.1,
            row_heights=[0.4, 0.3, 0.3]
        )
        
        # Plot 1: Erzeugung und Verbrauch
        fig.add_trace(
            go.Scatter(x=df.index, y=df['pv_generation'], name='PV-Erzeugung',
                      fill='tozeroy', line=dict(color='gold')),
            row=1, col=1
        )
        fig.add_trace(
            go.Scatter(x=df.index, y=df['household_load'], name='Haushalt',
                      line=dict(color='blue')),
            row=1, col=1
        )
        fig.add_trace(
            go.Scatter(x=df.index, y=df['hp_load'], name='Wärmepumpe/Klimaanlage',
                      line=dict(color='orange')),
            row=1, col=1
        )
        fig.add_trace(
            go.Scatter(x=df.index, y=df['ev_charge'], name='E-Auto Laden',
                      line=dict(color='green')),
            row=1, col=1
        )
        
        # Plot 2: SOC mit optimalen Bereichen
        fig.add_trace(
            go.Scatter(x=df.index, y=df['battery_soc']*100, name='Batterie-SOC',
                      line=dict(color='purple', width=2)),
            row=2, col=1
        )
        
        # Optimale SOC-Bereiche für Batteriegesundheit (20-80%)
        fig.add_hrect(y0=20, y1=80, 
                     fillcolor="lightgreen", opacity=0.15,
                     layer="below", line_width=0,
                     row=2, col=1)
        
        # Warnung bei niedrigem SOC (<20%)
        fig.add_hrect(y0=0, y1=20, 
                     fillcolor="red", opacity=0.1,
                     layer="below", line_width=0,
                     annotation_text="Tiefentladung vermeiden", 
                     annotation_position="bottom left",
                     row=2, col=1)
        
        # Warnung bei hohem SOC (>80%)
        fig.add_hrect(y0=80, y1=100, 
                     fillcolor="orange", opacity=0.1,
                     layer="below", line_width=0,
                     row=2, col=1)
        
        # Plot 3: Netz (nur Netzbezug, keine Einspeisung)
        fig.add_trace(
            go.Scatter(x=df.index, y=df['grid_import'], name='Netzbezug',
                      fill='tozeroy', line=dict(color='red')),
            row=3, col=1
        )
        
        fig.update_xaxes(title_text="Stunde", row=3, col=1)
        fig.update_yaxes(title_text="Leistung (kW)", row=1, col=1)
        fig.update_yaxes(title_text="SOC (%)", row=2, col=1)
        fig.update_yaxes(title_text="Leistung (kW)", row=3, col=1)
        
        fig.update_layout(height=900, showlegend=True)
        st.plotly_chart(fig, use_container_width=True)
        
        # Batterie-Zyklenfestigkeit und Degradation
        st.divider()
        st.subheader("🔋 Batterie-Zyklenfestigkeit und Degradation")
        st.caption("Tracking der akkumulierten Zyklen und Gesundheitszustand (SOH) für Stromspeicher und E-Auto-Batterie")
        
        # Prüfe ob Degradationsdaten vorhanden sind
        has_degradation_data = all(col in df.columns for col in ['battery_cycles', 'battery_health', 'ev_cycles', 'ev_health'])
        
        if has_degradation_data:
            fig_deg = make_subplots(
                rows=2, cols=1,
                subplot_titles=('Akkumulierte Batterie-Zyklen', 'Batterie-Gesundheitszustand (SOH)'),
                vertical_spacing=0.15,
                row_heights=[0.5, 0.5]
            )
            
            # Plot 1: Akkumulierte Zyklen
            fig_deg.add_trace(
                go.Scatter(x=df.index, y=df['battery_cycles'], name='Stromspeicher Zyklen',
                          line=dict(color='purple', width=2)),
                row=1, col=1
            )
            fig_deg.add_trace(
                go.Scatter(x=df.index, y=df['ev_cycles'], name='E-Auto Zyklen',
                          line=dict(color='green', width=2)),
                row=1, col=1
            )
            
            # Plot 2: Gesundheitszustand (SOH)
            fig_deg.add_trace(
                go.Scatter(x=df.index, y=df['battery_health']*100, name='Stromspeicher SOH',
                          line=dict(color='purple', width=2)),
                row=2, col=1
            )
            fig_deg.add_trace(
                go.Scatter(x=df.index, y=df['ev_health']*100, name='E-Auto SOH',
                          line=dict(color='green', width=2)),
                row=2, col=1
            )
            
            # Markiere kritische Schwelle bei 80% SOH (End-of-Life)
            fig_deg.add_hline(y=80, line_dash="dash", line_color="red", 
                             annotation_text="End-of-Life (80%)", 
                             annotation_position="bottom right",
                             row=2, col=1)
            
            # Markiere optimalen Bereich (>90% SOH)
            fig_deg.add_hrect(y0=90, y1=100, 
                             fillcolor="lightgreen", opacity=0.15,
                             layer="below", line_width=0,
                             annotation_text="Optimal", 
                             annotation_position="top right",
                             row=2, col=1)
            
            fig_deg.update_xaxes(title_text="Stunde", row=2, col=1)
            fig_deg.update_yaxes(title_text="Vollzyklen", row=1, col=1)
            fig_deg.update_yaxes(title_text="SOH (%)", row=2, col=1)
            
            fig_deg.update_layout(height=600, showlegend=True)
            st.plotly_chart(fig_deg, use_container_width=True)
            
            # KPI-Zusammenfassung
            col1, col2, col3, col4 = st.columns(4)
            
            with col1:
                st.metric("🔋 Stromspeicher Zyklen", f"{df['battery_cycles'].iloc[-1]:.1f}", 
                         help="Akkumulierte Vollzyklen des Stromspeichers")
            with col2:
                st.metric("🔋 Stromspeicher SOH", f"{df['battery_health'].iloc[-1]*100:.1f}%",
                         help="State of Health (Restkapazität vs. Anfangskapazität)")
            with col3:
                st.metric("🚗 E-Auto Zyklen", f"{df['ev_cycles'].iloc[-1]:.1f}",
                         help="Akkumulierte Vollzyklen der E-Auto-Batterie")
            with col4:
                st.metric("🚗 E-Auto SOH", f"{df['ev_health'].iloc[-1]*100:.1f}%",
                         help="State of Health (Restkapazität vs. Anfangskapazität)")
        else:
            st.info("📊 Degradationsdaten nicht verfügbar. Simulation neu starten um Zyklenfestigkeit zu tracken.")
        
        # Vergleichsmodus Zusatzinformationen
        if st.session_state.control_mode == "Vergleich" and 'results_comparison' in st.session_state:
            st.divider()
            st.subheader("⚖️ Vergleich: Regelbasiert vs. KI-Agent")
            
            df_ai = st.session_state.results_comparison
            
            # Vergleichs-KPIs
            col1, col2, col3, col4, col5 = st.columns(5)
            
            cost_rule = df['cost'].sum()
            cost_ai = df_ai['cost'].sum()
            cost_savings = ((cost_rule - cost_ai) / cost_rule * 100) if cost_rule > 0 else 0
            
            co2_rule = df['co2'].sum()
            co2_ai = df_ai['co2'].sum()
            co2_reduction = ((co2_rule - co2_ai) / co2_rule * 100) if co2_rule > 0 else 0
            
            with col1:
                st.metric("KI-Agent Kosten", f"{cost_ai:.2f} €", 
                         f"{cost_savings:+.1f}%" if cost_savings != 0 else "0%")
            
            with col2:
                st.metric("KI-Agent CO₂", f"{co2_ai:.2f} kg",
                         f"{co2_reduction:+.1f}%" if co2_reduction != 0 else "0%")
            
            with col3:
                # Energiegewichtete Autarkie
                autarky_ai = (1.0 - (df_ai['grid_import'].sum() / df_ai['total_load'].sum())) * 100 if df_ai['total_load'].sum() > 0 else 100
                autarky_rule = (1.0 - (df['grid_import'].sum() / df['total_load'].sum())) * 100 if df['total_load'].sum() > 0 else 100
                autarky_diff = autarky_ai - autarky_rule
                st.metric("KI-Agent Autarkie", f"{autarky_ai:.1f} %",
                         f"{autarky_diff:+.1f}%")
            
            with col4:
                # Energiegewichteter Eigenverbrauch
                self_cons_ai = (df_ai['self_consumption'].sum() / df_ai['pv_generation'].sum()) * 100 if df_ai['pv_generation'].sum() > 0 else 0
                self_cons_rule = (df['self_consumption'].sum() / df['pv_generation'].sum()) * 100 if df['pv_generation'].sum() > 0 else 0
                self_cons_diff = self_cons_ai - self_cons_rule
                st.metric("KI-Agent Eigenverbrauch", f"{self_cons_ai:.1f} %",
                         f"{self_cons_diff:+.1f}%")
            
            with col5:
                grid_ai = df_ai['grid_import'].sum()
                grid_diff = ((df['grid_import'].sum() - grid_ai) / df['grid_import'].sum() * 100) if df['grid_import'].sum() > 0 else 0
                st.metric("KI-Agent Netzbezug", f"{grid_ai:.1f} kWh",
                         f"{grid_diff:+.1f}%")
            
            # Vergleichsdiagramme
            comparison_data = pd.DataFrame({
                'Metrik': ['Kosten (€)', 'CO₂ (kg)', 'Autarkie (%)', 'Eigenverbrauch (%)'],
                'Regelbasiert': [cost_rule, co2_rule, autarky_rule, self_cons_rule],
                'KI-Agent': [cost_ai, co2_ai, autarky_ai, self_cons_ai]
            })
            
            fig_comp = px.bar(comparison_data, x='Metrik', y=['Regelbasiert', 'KI-Agent'],
                             barmode='group', title='Vergleich Regelbasiert vs. KI-Agent')
            st.plotly_chart(fig_comp, use_container_width=True)
        
        # AC vs. DC Systemvergleich
        st.divider()
        st.subheader("🔌 AC- vs. DC-gekoppelte Systemarchitektur")
        
        st.markdown("""
        **Vergleich der Systemarchitekturen:**
        - **DC-gekoppelt**: Höhere Effizienz (Direkt: 98%, Speicher: 95%), bidirektionales Laden möglich
        - **AC-gekoppelt**: Standard-Architektur (Direkt: 97%, Speicher: 85%), einfachere Installation
        """)
        
        if st.button("⚡ AC vs. DC Vergleich starten", type="secondary", use_container_width=True):
            with st.spinner("Simuliere beide Systemarchitekturen parallel..."):
                # AC-gekoppeltes System
                from location_data import get_building_specs, get_insulation_class
                building_specs = get_building_specs(family_size)
                insulation_info = get_insulation_class(insulation_type)
                
                energy_system_ac = EnergySystem(
                    use_live_weather=True,
                    coupling_type="ac_coupled",
                    hp_mode=hp_mode,
                    hp_type=hp_type,
                    location_lat=location_info['latitude'],
                    location_lon=location_info['longitude'],
                    building_area_m2=building_area_m2,
                    building_volume_m3=building_specs['building_volume_m3'],
                    specific_heat_demand_kw_per_m2=insulation_info['specific_heat_demand_kw_per_m2']
                )
                energy_system_ac.pv_power = pv_power
                energy_system_ac.battery_capacity = battery_capacity
                energy_system_ac.ev_capacity = ev_capacity
                energy_system_ac.ev_charge_power = ev_charge_power
                energy_system_ac.ev_onboard_limit = ev_onboard_limit
                energy_system_ac.night_charging_start = night_charging_start
                energy_system_ac.night_charging_end = night_charging_end
                energy_system_ac.prefer_night_charging = prefer_night_charging
                energy_system_ac.ev_daily_km = ev_daily_km
                energy_system_ac.ev_consumption_kwh_per_100km = ev_consumption_kwh_per_100km
                energy_system_ac.household_annual_consumption = household_annual
                energy_system_ac.hp_annual_consumption = hp_annual
                energy_system_ac.pv_yield_kwh_per_kwp = location_info['pv_yield_kwh_per_kwp']
                energy_system_ac.grid_price = location_info['electricity_price_eur_per_kwh']
                energy_system_ac.feed_in_tariff = location_info['feed_in_tariff_eur_per_kwh']
                energy_system_ac.battery_soc = init_battery_soc
                energy_system_ac.ev_soc = init_ev_soc
                
                # DC-gekoppeltes System
                energy_system_dc = EnergySystem(
                    use_live_weather=True,
                    coupling_type="dc_coupled",
                    hp_mode=hp_mode,
                    hp_type=hp_type,
                    location_lat=location_info['latitude'],
                    location_lon=location_info['longitude'],
                    building_area_m2=building_area_m2,
                    building_volume_m3=building_specs['building_volume_m3'],
                    specific_heat_demand_kw_per_m2=insulation_info['specific_heat_demand_kw_per_m2']
                )
                energy_system_dc.pv_power = pv_power
                energy_system_dc.battery_capacity = battery_capacity
                energy_system_dc.ev_capacity = ev_capacity
                energy_system_dc.ev_charge_power = ev_charge_power
                energy_system_dc.ev_onboard_limit = ev_onboard_limit
                energy_system_dc.night_charging_start = night_charging_start
                energy_system_dc.night_charging_end = night_charging_end
                energy_system_dc.prefer_night_charging = prefer_night_charging
                energy_system_dc.ev_daily_km = ev_daily_km
                energy_system_dc.ev_consumption_kwh_per_100km = ev_consumption_kwh_per_100km
                energy_system_dc.household_annual_consumption = household_annual
                energy_system_dc.hp_annual_consumption = hp_annual
                energy_system_dc.pv_yield_kwh_per_kwp = location_info['pv_yield_kwh_per_kwp']
                energy_system_dc.grid_price = location_info['electricity_price_eur_per_kwh']
                energy_system_dc.feed_in_tariff = location_info['feed_in_tariff_eur_per_kwh']
                energy_system_dc.battery_soc = init_battery_soc
                energy_system_dc.ev_soc = init_ev_soc
                
                # Gleicher Controller für beide Systeme
                from energy_system import SmartController
                controller = SmartController()
                
                # AC Simulation
                results_ac = []
                current_time = datetime.combine(start_date, datetime.min.time())
                for hour in range(int(simulation_hours)):
                    pv_gen = energy_system_ac.get_pv_generation(current_time, scenario)
                    household_load = energy_system_ac.get_household_load(current_time)
                    action = controller.get_action(energy_system_ac, current_time, pv_gen, household_load, scenario)
                    state = energy_system_ac.step(action, current_time, scenario)
                    results_ac.append(state)
                    current_time += timedelta(hours=1)
                
                # DC Simulation
                results_dc = []
                current_time = datetime.combine(start_date, datetime.min.time())
                for hour in range(int(simulation_hours)):
                    pv_gen = energy_system_dc.get_pv_generation(current_time, scenario)
                    household_load = energy_system_dc.get_household_load(current_time)
                    action = controller.get_action(energy_system_dc, current_time, pv_gen, household_load, scenario)
                    state = energy_system_dc.step(action, current_time, scenario)
                    results_dc.append(state)
                    current_time += timedelta(hours=1)
                
                df_ac = pd.DataFrame(results_ac)
                df_dc = pd.DataFrame(results_dc)
                
                # Speichere in Session State
                st.session_state.results_ac_dc_comparison = {
                    'ac': df_ac,
                    'dc': df_dc
                }
        
        # Zeige AC vs. DC Vergleich wenn verfügbar
        if 'results_ac_dc_comparison' in st.session_state:
            df_ac = st.session_state.results_ac_dc_comparison['ac']
            df_dc = st.session_state.results_ac_dc_comparison['dc']
            
            st.success("✅ AC vs. DC Vergleich abgeschlossen!")
            
            # KPI-Vergleich
            col1, col2, col3, col4, col5 = st.columns(5)
            
            # Nutzbare PV-Energie
            usable_pv_ac = df_ac.get('usable_pv_energy', pd.Series([0])).sum()
            usable_pv_dc = df_dc.get('usable_pv_energy', pd.Series([0])).sum()
            usable_pv_diff = ((usable_pv_dc - usable_pv_ac) / usable_pv_ac * 100) if usable_pv_ac > 0 else 0
            
            with col1:
                st.metric(
                    "DC: Nutzbare PV-Energie",
                    f"{usable_pv_dc:.1f} kWh",
                    f"+{usable_pv_diff:.1f}% vs AC"
                )
            
            # Autarkiegrad
            autarky_ac = (1.0 - (df_ac['grid_import'].sum() / df_ac['total_load'].sum())) * 100 if df_ac['total_load'].sum() > 0 else 100
            autarky_dc = (1.0 - (df_dc['grid_import'].sum() / df_dc['total_load'].sum())) * 100 if df_dc['total_load'].sum() > 0 else 100
            autarky_diff = autarky_dc - autarky_ac
            
            with col2:
                st.metric(
                    "DC: Autarkiegrad",
                    f"{autarky_dc:.1f}%",
                    f"+{autarky_diff:.1f}% vs AC"
                )
            
            # Kosten
            cost_ac = df_ac['cost'].sum()
            cost_dc = df_dc['cost'].sum()
            cost_savings = ((cost_ac - cost_dc) / cost_ac * 100) if cost_ac > 0 else 0
            
            with col3:
                st.metric(
                    "DC: Kostenersparnis",
                    f"{cost_dc:.2f} €",
                    f"-{cost_savings:.1f}% vs AC"
                )
            
            # Direktnutzungsanteil
            direct_use_ac = df_ac.get('direct_use_ratio', pd.Series([0])).mean() * 100
            direct_use_dc = df_dc.get('direct_use_ratio', pd.Series([0])).mean() * 100
            
            with col4:
                st.metric(
                    "DC: Direktnutzung",
                    f"{direct_use_dc:.1f}%",
                    help="Anteil der PV-Energie, der direkt genutzt wird (ohne Speicher)"
                )
            
            # Verluste
            pv_curtailed_ac = df_ac.get('pv_curtailed', pd.Series([0])).sum()
            pv_curtailed_dc = df_dc.get('pv_curtailed', pd.Series([0])).sum()
            loss_reduction = ((pv_curtailed_ac - pv_curtailed_dc) / pv_curtailed_ac * 100) if pv_curtailed_ac > 0 else 0
            
            with col5:
                st.metric(
                    "DC: Geringere Verluste",
                    f"{pv_curtailed_dc:.1f} kWh",
                    f"-{loss_reduction:.1f}% vs AC"
                )
            
            # Visualisierungen
            st.subheader("📊 Detaillierter Vergleich")
            
            # Nutzbare PV-Energie über Zeit
            fig_usable = go.Figure()
            fig_usable.add_trace(go.Scatter(
                x=df_ac.index,
                y=df_ac.get('usable_pv_energy', pd.Series([0] * len(df_ac))).cumsum(),
                name='AC-gekoppelt',
                line=dict(color='orange', width=2)
            ))
            fig_usable.add_trace(go.Scatter(
                x=df_dc.index,
                y=df_dc.get('usable_pv_energy', pd.Series([0] * len(df_dc))).cumsum(),
                name='DC-gekoppelt',
                line=dict(color='blue', width=2)
            ))
            fig_usable.update_layout(
                title="Nutzbare PV-Energie (kumuliert)",
                xaxis_title="Stunde",
                yaxis_title="Energie (kWh)",
                hovermode='x unified'
            )
            st.plotly_chart(fig_usable, use_container_width=True)
            
            # Balkendiagramm Vergleich
            comparison_df = pd.DataFrame({
                'Metrik': ['Nutzbare PV (kWh)', 'Autarkie (%)', 'Kosten (€)', 'Abgeregelt (kWh)'],
                'AC-gekoppelt': [usable_pv_ac, autarky_ac, cost_ac, pv_curtailed_ac],
                'DC-gekoppelt': [usable_pv_dc, autarky_dc, cost_dc, pv_curtailed_dc]
            })
            
            fig_bar = px.bar(
                comparison_df,
                x='Metrik',
                y=['AC-gekoppelt', 'DC-gekoppelt'],
                barmode='group',
                title='AC vs. DC Systemvergleich',
                labels={'value': 'Wert', 'variable': 'System'}
            )
            st.plotly_chart(fig_bar, use_container_width=True)

with tab2:
    st.header("📈 Detaillierte Analyse")
    
    if st.session_state.simulation_run and st.session_state.results is not None:
        df = st.session_state.results
        
        # Tägliche Aufschlüsselung
        st.subheader("📅 Tägliche Zusammenfassung")
        
        # Tag hinzufügen
        df['day'] = df.index // 24
        
        # Basis-Aggregation
        daily_stats = df.groupby('day').agg({
            'pv_generation': 'sum',
            'household_load': 'sum',
            'hp_load': 'sum',
            'ev_charge': 'sum',
            'grid_import': 'sum',
            'total_load': 'sum',
            'self_consumption': 'sum',
            'cost': 'sum',
            'co2': 'sum'
        }).round(2)
        
        # Energiegewichtete KPIs berechnen
        daily_stats['Autarkie (%)'] = ((1.0 - (daily_stats['grid_import'] / daily_stats['total_load'])) * 100).fillna(100).round(1)
        daily_stats['Eigenverbrauch (%)'] = ((daily_stats['self_consumption'] / daily_stats['pv_generation']) * 100).fillna(0).round(1)
        
        # Spalten umbenennen
        daily_stats = daily_stats.rename(columns={
            'pv_generation': 'PV-Erzeugung (kWh)',
            'household_load': 'Haushalt (kWh)',
            'hp_load': 'Wärmepumpe/Klimaanlage (kWh)',
            'ev_charge': 'E-Auto Laden (kWh)',
            'grid_import': 'Netzbezug (kWh)',
            'cost': 'Kosten (€)',
            'co2': 'CO₂ (kg)'
        })
        
        # Nicht benötigte Spalten entfernen
        daily_stats = daily_stats[['PV-Erzeugung (kWh)', 'Haushalt (kWh)', 'Wärmepumpe/Klimaanlage (kWh)',
                                   'E-Auto Laden (kWh)', 'Netzbezug (kWh)', 'Kosten (€)', 'CO₂ (kg)',
                                   'Autarkie (%)', 'Eigenverbrauch (%)']]
        
        st.dataframe(daily_stats, use_container_width=True)
        
        # Visualisierungen
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("💰 Kosten pro Tag")
            fig_cost = px.bar(
                daily_stats.reset_index(),
                x='day',
                y='Kosten (€)',
                labels={'day': 'Tag', 'Kosten (€)': 'Kosten (€)'}
            )
            fig_cost.update_layout(showlegend=False)
            st.plotly_chart(fig_cost, use_container_width=True)
        
        with col2:
            st.subheader("🌱 CO₂-Emissionen pro Tag")
            fig_co2 = px.bar(
                daily_stats.reset_index(),
                x='day',
                y='CO₂ (kg)',
                labels={'day': 'Tag', 'CO₂ (kg)': 'CO₂ (kg)'},
                color='CO₂ (kg)',
                color_continuous_scale='Reds'
            )
            st.plotly_chart(fig_co2, use_container_width=True)
        
        # Energiebilanz
        st.subheader("⚖️ Energiebilanz")
        
        total_pv = df['pv_generation'].sum()
        total_household = df['household_load'].sum()
        total_hp = df['hp_load'].sum()
        total_ev = df['ev_charge'].sum()
        total_grid_import = df['grid_import'].sum()
        total_grid_export = df['grid_export'].sum()
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("**⚡ Energiequellen**")
            st.caption("Woher kommt die Energie?")
            fig_gen = go.Figure(data=[go.Pie(
                labels=['☀️ PV-Erzeugung', '🌐 Netzbezug'],
                values=[total_pv, total_grid_import],
                hole=0.3,
                marker=dict(colors=['#FFD700', '#DC143C'])
            )])
            fig_gen.update_layout(height=300, showlegend=True)
            st.plotly_chart(fig_gen, use_container_width=True)
        
        with col2:
            st.markdown("**🔌 Energieverwendung**")
            st.caption("Wohin fließt die Energie?")
            total_consumption = total_household + total_hp + total_ev
            fig_cons = go.Figure(data=[go.Pie(
                labels=['🏠 Haushalt', '💨 Wärmepumpe/Klimaanlage', '🚗 E-Auto Laden'],
                values=[total_household, total_hp, total_ev],
                hole=0.3,
                marker=dict(colors=['#4169E1', '#FF6347', '#32CD32'])
            )])
            fig_cons.update_layout(height=300, showlegend=True)
            st.plotly_chart(fig_cons, use_container_width=True)
            
        # Erklärung hinzufügen
        st.info("""
        **📊 Erklärung der Energiebilanz:**
        
        **Links (Energiequellen):** Zeigt, woher die Energie kommt:
        - ☀️ **PV-Erzeugung:** Von der Solaranlage erzeugte Energie
        - 🌐 **Netzbezug:** Aus dem Stromnetz bezogene Energie (nur bei Energiedefizit)
        
        **Rechts (Energieverwendung):** Zeigt, wohin die Energie fließt:
        - 🏠 **Haushalt:** Stromverbrauch für Haushaltsgeräte
        - 💨 **Wärmepumpe/Klimaanlage:** Heiz- oder Kühlenergie
        - 🚗 **E-Auto Laden:** Ladeenergie für das Elektroauto
        
        **Hinweis:** Es erfolgt keine Netzeinspeisung. Überschüssige PV-Energie wird abgeregelt.
        """)
        
        # V2G Statistiken
        if 'v2g_active' in df.columns:
            v2g_hours = df['v2g_active'].sum()
            v2g_percentage = (v2g_hours / len(df)) * 100
            
            st.subheader("🔄 Bidirektionales Laden (V2G)")
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("V2G Stunden", f"{v2g_hours:.0f}")
            with col2:
                st.metric("V2G Anteil", f"{v2g_percentage:.1f} %")
            with col3:
                ev_discharge_total = df['ev_discharge'].sum()
                st.metric("Rückspeisung gesamt", f"{ev_discharge_total:.1f} kWh")
    else:
        st.info("👆 Bitte starten Sie zuerst eine Simulation im Tab 'Simulation'")

with tab3:
    st.header("🤖 KI-Agent Training")
    
    tab_current, tab_history = st.tabs(["📈 Aktuelles Training", "🗄️ Trainingshistorie"])
    
    with tab_current:
        st.markdown("""
        Der KI-Agent nutzt Reinforcement Learning (vereinfachter DQN-Ansatz), um optimale
        Steuerungsstrategien zu erlernen. Die Reward-Funktion optimiert:
        
        - ⚡ **Kosten**: Minimierung der Stromkosten
        - 🌱 **CO₂**: Reduzierung der CO₂-Emissionen
        - 🏠 **Autarkie**: Maximierung des Eigenverbrauchs
        - 🔋 **Komfort**: Optimale Batteriezustände
        """)
        
        if st.session_state.simulation_run and ("KI-Agent" in st.session_state.control_mode or st.session_state.control_mode == "Vergleich"):
            st.subheader("📊 Trainingsverlauf")
            
            training_rewards = st.session_state.training_rewards
            
            fig_training = go.Figure()
            fig_training.add_trace(go.Scatter(
                y=training_rewards,
                mode='lines',
                name='Episode Reward',
                line=dict(color='blue', width=1)
            ))
            
            # Moving Average
            window = 10
            if len(training_rewards) >= window:
                moving_avg = pd.Series(training_rewards).rolling(window=window).mean()
                fig_training.add_trace(go.Scatter(
                    y=moving_avg,
                    mode='lines',
                    name=f'{window}-Episode Moving Average',
                    line=dict(color='red', width=2)
                ))
            
            fig_training.update_layout(
                xaxis_title="Episode",
                yaxis_title="Gesamter Reward",
                height=400
            )
            st.plotly_chart(fig_training, use_container_width=True)
            
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Start Reward", f"{training_rewards[0]:.2f}")
            with col2:
                st.metric("End Reward", f"{training_rewards[-1]:.2f}")
            with col3:
                if abs(training_rewards[0]) > 1e-6:
                    improvement = ((training_rewards[-1] - training_rewards[0]) / abs(training_rewards[0])) * 100
                    st.metric("Verbesserung", f"{improvement:.1f} %")
                else:
                    st.metric("Verbesserung", "n/a")
        else:
            st.info("🎯 Starten Sie eine Simulation mit 'KI-Agent (DQN)' oder 'KI-Agent (PPO)' Modus im Tab 'Simulation'")
            
            st.subheader("🎓 Training-Optionen")
            
            col1, col2 = st.columns(2)
            with col1:
                train_episodes = st.number_input("Trainings-Episoden", 50, 1000, 100, 50)
                learning_rate = st.number_input("Lernrate", 0.001, 0.1, 0.01, 0.001, format="%.3f")
            
            with col2:
                epsilon = st.number_input("Exploration Rate", 0.01, 0.5, 0.1, 0.01)
                gamma = st.number_input("Discount Factor", 0.8, 0.99, 0.95, 0.01)
            
            st.info("💡 Tipp: Mehr Episoden führen zu besseren Ergebnissen, dauern aber länger")
    
    with tab_history:
        st.subheader("📊 Historische Trainingsmetriken")
        
        # Fetch training history from database
        try:
            col1, col2 = st.columns(2)
            with col1:
                agent_filter = st.selectbox("Agent-Typ", ["Alle", "DQN", "PPO"])
            with col2:
                limit_episodes = st.slider("Anzahl Episoden", 100, 5000, 1000, 100)
            
            agent_type_filter = None if agent_filter == "Alle" else agent_filter
            training_history = get_training_history(agent_type=agent_type_filter, limit=limit_episodes)
            
            if training_history:
                st.success(f"📈 {len(training_history)} Trainings-Episoden gefunden")
                
                # Convert to DataFrame
                history_data = []
                for record in training_history:
                    history_data.append({
                        'Episode': record.episode,
                        'Agent': record.agent_type,
                        'Reward': record.episode_reward,
                        'Kosten': record.episode_cost,
                        'CO2': record.episode_co2,
                        'Epsilon': record.epsilon,
                        'Avg(100)': record.avg_reward_100,
                        'Datum': record.timestamp
                    })
                
                df_history = pd.DataFrame(history_data)
                
                # Plot rewards over episodes
                fig_rewards = go.Figure()
                
                # Group by agent type if "Alle" selected
                if agent_filter == "Alle" and 'Agent' in df_history.columns:
                    for agent in df_history['Agent'].unique():
                        agent_data = df_history[df_history['Agent'] == agent]
                        fig_rewards.add_trace(go.Scatter(
                            x=agent_data['Episode'],
                            y=agent_data['Reward'],
                            mode='lines',
                            name=f'{agent} Reward',
                            opacity=0.5
                        ))
                        if 'Avg(100)' in agent_data.columns:
                            fig_rewards.add_trace(go.Scatter(
                                x=agent_data['Episode'],
                                y=agent_data['Avg(100)'],
                                mode='lines',
                                name=f'{agent} Avg(100)',
                                line=dict(width=3)
                            ))
                else:
                    fig_rewards.add_trace(go.Scatter(
                        x=df_history['Episode'],
                        y=df_history['Reward'],
                        mode='lines',
                        name='Episode Reward',
                        line=dict(color='blue', width=1),
                        opacity=0.5
                    ))
                    if 'Avg(100)' in df_history.columns:
                        fig_rewards.add_trace(go.Scatter(
                            x=df_history['Episode'],
                            y=df_history['Avg(100)'],
                            mode='lines',
                            name='Moving Average (100)',
                            line=dict(color='red', width=3)
                        ))
                
                fig_rewards.update_layout(
                    title="Training Performance über Episoden",
                    xaxis_title="Episode",
                    yaxis_title="Reward",
                    hovermode='x unified',
                    height=400
                )
                st.plotly_chart(fig_rewards, use_container_width=True)
                
                # Cost and CO2 trends
                col_a, col_b = st.columns(2)
                with col_a:
                    fig_cost = go.Figure()
                    fig_cost.add_trace(go.Scatter(
                        x=df_history['Episode'],
                        y=df_history['Kosten'],
                        mode='lines',
                        name='Kosten',
                        line=dict(color='orange')
                    ))
                    fig_cost.update_layout(title="Kosten pro Episode", xaxis_title="Episode", 
                                          yaxis_title="Kosten (€)", height=300)
                    st.plotly_chart(fig_cost, use_container_width=True)
                
                with col_b:
                    fig_co2 = go.Figure()
                    fig_co2.add_trace(go.Scatter(
                        x=df_history['Episode'],
                        y=df_history['CO2'],
                        mode='lines',
                        name='CO2',
                        line=dict(color='green')
                    ))
                    fig_co2.update_layout(title="CO2-Emissionen pro Episode", xaxis_title="Episode", 
                                         yaxis_title="CO2 (kg)", height=300)
                    st.plotly_chart(fig_co2, use_container_width=True)
                
                # Statistics
                st.divider()
                st.subheader("📈 Trainingsstatistiken")
                
                col1, col2, col3, col4 = st.columns(4)
                with col1:
                    st.metric("Beste Reward", f"{df_history['Reward'].max():.2f}")
                with col2:
                    st.metric("Durchschn. Reward", f"{df_history['Reward'].mean():.2f}")
                with col3:
                    st.metric("Niedrigste Kosten", f"{df_history['Kosten'].min():.2f}€")
                with col4:
                    st.metric("Niedrigste CO2", f"{df_history['CO2'].min():.2f}kg")
                
                # Download option
                csv = df_history.to_csv(index=False)
                st.download_button(
                    label="📥 Trainingsdaten als CSV herunterladen",
                    data=csv,
                    file_name=f"training_history_{agent_filter}_{datetime.now().strftime('%Y%m%d')}.csv",
                    mime="text/csv"
                )
            else:
                st.info("Noch keine Trainingsmetriken in der Datenbank. Führen Sie ein Training durch!")
        
        except Exception as e:
            st.error(f"Fehler beim Laden der Trainingshistorie: {str(e)}")

with tab4:
    st.header("📚 Systemdokumentation")
    
    st.markdown("""
    ## Systemübersicht
    
    Dieses KI-basierte Energiemanagementsystem optimiert den Betrieb eines
    dezentralen Energiesystems bestehend aus:
    
    ### Komponenten
    
    #### 🌞 PV-Anlage
    - Nennleistung: 10 kW (konfigurierbar)
    - Realistische Erzeugungsprofile basierend auf pvlib
    - Saisonale Anpassungen für Sommer/Winter/Frühling
    
    #### 🔋 Batteriespeicher
    - Kapazität: 10 kWh (konfigurierbar)
    - Lade-/Entladeleistung: 5 kW
    - Wirkungsgrad: 95%
    - Intelligente Ladestrategie
    
    #### 🚗 Elektrofahrzeug
    - Batteriekapazität: 150 kWh
    - Ladeleistung: 11 kW
    - **Bidirektionales Laden (V2G)** unterstützt
    - Intelligente Ladeplanung
    
    #### 💨 Wärmepumpe/Klimaanlage
    - Jahresverbrauch: 4500 kWh
    - COP (Heizen): 2.5-5.0 / EER (Kühlen): 3.0-6.0
    - Temperaturabhängige Steuerung
    - 3 Betriebsmodi: Heizen, Kühlen, Automatisch
    
    #### 🏠 Haushalt
    - Jahresverbrauch: 4000 kWh
    - Realistische Lastprofile mit Tageszeit-Variation
    
    ### Intelligente Steuerungsregeln
    
    #### E-Auto Lademanagement
    - **Priorität 1**: Laden wenn SOC zwischen 20% und 75%
    - **Bidirektionales Laden**: Aktivierung wenn:
      - Strompreis > 30 Cent/kWh
      - Wärmepumpe/Klimaanlage ist aus
      - Batteriespeicher SOC ≥ 50%
      - E-Auto SOC ≥ 70%
    
    #### Spitzenlast-Schutz
    - V2G wird gestoppt wenn:
      - Haushaltslast > 5 kW UND
      - Batteriespeicher SOC < 60%
    
    ### Optimierungsziele
    
    1. **💰 Kostenminimierung**
       - Nutzung günstiger Strompreise
       - Maximale Eigenverbrauch-Optimierung
       - Vermeidung von Spitzenlast-Tarifen
    
    2. **🌱 CO₂-Reduktion**
       - Maximierung der PV-Nutzung
       - Minimierung des Netzbezugs
       - Intelligente Lastverschiebung
    
    3. **🏠 Autarkie-Maximierung**
       - Hoher Eigenverbrauchsanteil
       - Optimale Batterieausnutzung
       - Zeitliche Entkopplung von Erzeugung und Verbrauch
    
    ### KI-Algorithmus
    
    Das System nutzt **Reinforcement Learning** mit einem vereinfachten DQN-Ansatz:
    
    - **Observation Space**: Tageszeit, PV-Erzeugung, Lasten, SOC-Werte, Strompreise
    - **Action Space**: EV-Laderate, V2G Ein/Aus, WP Ein/Aus
    - **Reward Function**: Gewichtete Kombination aus Kosten, CO₂, Autarkie und Komfort
    
    ### Szenarien
    
    #### ☀️ Sommer
    - Hohe PV-Erzeugung
    - Niedriger Wärmebedarf
    - Optimale Bedingungen für Autarkie
    
    #### ❄️ Winter
    - Niedrige PV-Erzeugung
    - Hoher Wärmebedarf
    - Herausforderung: Netzabhängigkeit
    
    #### 🌸 Frühling/Herbst
    - Moderate PV-Erzeugung
    - Mittlerer Wärmebedarf
    - Ausgewogenes Szenario
    
    ### Metriken
    
    - **Autarkiegrad**: Anteil des Eigenverbrauchs am Gesamtverbrauch
    - **Eigenverbrauchsquote**: Anteil der PV-Erzeugung, der direkt verbraucht wird
    - **Kosten**: Gesamte Stromkosten (nur Netzbezug, keine Einspeisevergütung)
    - **CO₂-Bilanz**: Gesamte CO₂-Emissionen
    
    ### 🔋 SOC - State of Charge (Ladezustand)
    
    **Definition:**  
    Der SOC (State of Charge) beschreibt, wie viel Energie aktuell in einer Batterie gespeichert ist, 
    im Verhältnis zur maximal verfügbaren Kapazität. Er wird in Prozent (%) angegeben.
    
    **Berechnung:**
    ```
    SOC = 100 × (aktuell gespeicherte Energie / maximale Kapazität)
    ```
    
    **Beispiel:**
    - Batterie mit 75 kWh Gesamtkapazität (z.B. Tesla Model 3 Long Range)
    - Noch 37,5 kWh Energie vorhanden
    - SOC = (37,5 / 75) × 100 = **50%** → Batterie ist halb geladen
    
    #### Bedeutung im Energiemanagement:
    
    - **SOC = 100%**: Batterie vollständig geladen
    - **SOC = 0%**: Batterie leer - **Tiefentladung unbedingt vermeiden!**
    - **Optimaler Bereich: 20-80%** für maximale Batterieleben
    
    #### Anwendungen in dieser App:
    
    **1. E-Auto Lademanagement** 🚗
    - Zeigt aktuellen Ladezustand des Elektrofahrzeugs
    - Intelligente Ladeplanung basierend auf SOC
    - Optimierung für Netzstabilität
    
    **2. Batteriespeicher (PV-System)** 🔋
    - Steuerung von Lade- und Entladezyklen
    - Vermeidung von Tiefentladung (<20%)
    - Schonung bei Volladung (>80%)
    
    **3. Lademanagementsysteme** ⚡
    - Optimierung von Ladezeiten
    - Bidirektionales Laden (V2G) bei optimalem SOC
    - Lastmanagement zur Netzstabilisierung
    
    #### Gesundheitstipps für Batterien:
    
    ✅ **Empfohlen:**
    - SOC zwischen 20-80% halten
    - Langsames Laden bevorzugen
    - Extreme Temperaturen vermeiden
    
    ⚠️ **Vermeiden:**
    - Tiefentladung unter 20%
    - Dauerhafte Volladung über 80%
    - Schnellladen bei sehr niedrigem SOC
    
    ## Technologie-Stack
    
    - **Python**: Simulationskern
    - **Streamlit**: Interaktive Web-Oberfläche
    - **PVLib**: Realistische PV-Modellierung
    - **Plotly**: Interaktive Visualisierungen
    - **NumPy/Pandas**: Datenverarbeitung
    - **Custom RL**: Reinforcement Learning Implementierung
    """)
    
    st.divider()
    
    st.subheader("🔬 Für Entwickler")
    
    with st.expander("API-Integration"):
        st.markdown("""
        ### Integration in eigene Systeme
        
        Das System bietet folgende Python-Klassen für Entwickler:
        
        ```python
        from energy_system import EnergySystem, RuleBasedController
        from rl_environment import EnergyManagementEnv, SimpleRLAgent
        
        # Energiesystem initialisieren
        system = EnergySystem()
        
        # RL Environment erstellen
        env = EnergyManagementEnv(system, start_date, scenario)
        
        # Eigenen Agent trainieren
        agent = SimpleRLAgent()
        rewards = agent.train(env, episodes=1000)
        ```
        
        ### Datenexport
        
        Simulationsergebnisse können als CSV exportiert werden:
        - Zeitreihen aller Systemgrößen
        - Tägliche Aggregationen
        - KPI-Metriken
        """)
    
    with st.expander("Erweiterungsmöglichkeiten"):
        st.markdown("""
        ### Mögliche Erweiterungen
        
        1. **Erweiterte RL-Algorithmen**
           - Deep Q-Networks (DQN) mit PyTorch
           - Proximal Policy Optimization (PPO)
           - Actor-Critic Methoden
        
        2. **Wetter-APIs**
           - Integration von Wetterdaten
           - PV-Ertragsprognosen
           - Temperaturvorhersagen für Wärmepumpe
        
        3. **Dynamische Strompreise**
           - Anbindung an Day-Ahead Markt
           - Spot-Preis Integration
           - Regelenergiemarkt
        
        4. **Multi-Agenten Systeme**
           - Nachbarschafts-Energie-Trading
           - Lokale Energiegemeinschaften
           - Peer-to-Peer Energiehandel
        
        5. **Hardware-Integration**
           - MQTT für IoT-Geräte
           - Modbus für Wechselrichter
           - API für Wallboxen
        """)

with tab5:
    st.header("🗄️ Historische Simulationen")
    st.markdown("Durchsuchen und analysieren Sie frühere Simulationsläufe")
    
    col1, col2 = st.columns([1, 1])
    with col1:
        filter_scenario = st.selectbox(
            "Szenario filtern",
            ["Alle", "summer", "winter", "spring"],
            format_func=lambda x: x if x == "Alle" else {"summer": "☀️ Sommer", "winter": "❄️ Winter", "spring": "🌸 Frühling"}[x]
        )
    with col2:
        filter_strategy = st.selectbox(
            "Strategie filtern",
            ["Alle", "Regelbasiert", "KI-Agent (DQN)", "KI-Agent (PPO)"]
        )
    
    # Fetch historical runs
    try:
        scenario_filter = None if filter_scenario == "Alle" else filter_scenario
        strategy_filter = None if filter_strategy == "Alle" else filter_strategy
        
        historical_runs = get_simulation_runs(
            limit=100,
            scenario=scenario_filter,
            control_strategy=strategy_filter
        )
        
        if historical_runs:
            st.success(f"📊 {len(historical_runs)} Simulationen gefunden")
            
            # Display as table
            runs_data = []
            for run in historical_runs:
                runs_data.append({
                    'ID': run.id,
                    'Name': run.run_name,
                    'Szenario': run.scenario,
                    'Strategie': run.control_strategy,
                    'Datum': run.created_at.strftime('%Y-%m-%d %H:%M'),
                    'Dauer (Tage)': run.duration_days,
                    'Kosten (€)': f"{run.total_cost:.2f}",
                    'CO2 (kg)': f"{run.total_co2:.2f}",
                    'Autarkie (%)': f"{run.autarky_degree * 100:.1f}",
                    'Eigenverbrauch (%)': f"{run.self_consumption_rate * 100:.1f}"
                })
            
            df_runs = pd.DataFrame(runs_data)
            st.dataframe(df_runs, use_container_width=True)
            
            # Selection for detailed view
            st.divider()
            st.subheader("📈 Detailansicht")
            
            selected_id = st.selectbox(
                "Simulation auswählen",
                options=[run.id for run in historical_runs],
                format_func=lambda x: next((r.run_name for r in historical_runs if r.id == x), str(x))
            )
            
            if selected_id:
                # Load time-series data
                timeseries = get_timeseries_data(selected_id)
                
                if timeseries:
                    # Convert to DataFrame
                    ts_data = []
                    for ts in timeseries:
                        ts_data.append({
                            'timestamp': ts.timestamp,
                            'pv_generation': ts.pv_generation,
                            'household_load': ts.household_load,
                            'ev_charge': ts.ev_charging,
                            'hp_load': ts.hp_consumption,
                            'total_load': ts.total_consumption,
                            'battery_soc': ts.battery_soc,
                            'ev_soc': ts.ev_soc,
                            'grid_import': ts.grid_import,
                            'grid_export': ts.grid_export,
                            'cost': ts.cost,
                            'co2': ts.co2_emissions
                        })
                    
                    df_ts = pd.DataFrame(ts_data)
                    
                    # Create visualizations
                    tab_energy, tab_storage, tab_eco = st.tabs(["⚡ Energie", "🔋 Speicher", "💰 Wirtschaftlichkeit"])
                    
                    with tab_energy:
                        fig = go.Figure()
                        fig.add_trace(go.Scatter(x=df_ts['timestamp'], y=df_ts['pv_generation'], 
                                                mode='lines', name='PV-Erzeugung', line=dict(color='gold')))
                        fig.add_trace(go.Scatter(x=df_ts['timestamp'], y=df_ts['household_load'], 
                                                mode='lines', name='Haushalt', line=dict(color='blue')))
                        fig.add_trace(go.Scatter(x=df_ts['timestamp'], y=df_ts['ev_charge'], 
                                                mode='lines', name='E-Auto Laden', line=dict(color='green')))
                        fig.add_trace(go.Scatter(x=df_ts['timestamp'], y=df_ts['hp_load'], 
                                                mode='lines', name='Wärmepumpe/Klimaanlage', line=dict(color='orange')))
                        fig.update_layout(title="Energieflüsse", xaxis_title="Zeit", yaxis_title="Leistung (kW)", 
                                        hovermode='x unified', height=400)
                        st.plotly_chart(fig, use_container_width=True)
                    
                    with tab_storage:
                        fig = go.Figure()
                        fig.add_trace(go.Scatter(x=df_ts['timestamp'], y=df_ts['battery_soc']*100, 
                                                mode='lines', name='Batterie-SOC', line=dict(color='purple')))
                        fig.update_layout(title="Batteriezustand (SOC)", xaxis_title="Zeit", 
                                        yaxis_title="SOC (%)", hovermode='x unified', height=400)
                        st.plotly_chart(fig, use_container_width=True)
                    
                    with tab_eco:
                        col_a, col_b = st.columns(2)
                        with col_a:
                            fig = go.Figure()
                            fig.add_trace(go.Scatter(x=df_ts['timestamp'], y=df_ts['cost'].cumsum(), 
                                                    mode='lines', name='Kumulierte Kosten', 
                                                    line=dict(color='red'), fill='tozeroy'))
                            fig.update_layout(title="Kumulierte Kosten", xaxis_title="Zeit", 
                                            yaxis_title="Kosten (€)", height=300)
                            st.plotly_chart(fig, use_container_width=True)
                        
                        with col_b:
                            fig = go.Figure()
                            fig.add_trace(go.Scatter(x=df_ts['timestamp'], y=df_ts['co2'].cumsum(), 
                                                    mode='lines', name='Kumulierte CO2', 
                                                    line=dict(color='brown'), fill='tozeroy'))
                            fig.update_layout(title="Kumulierte CO2-Emissionen", xaxis_title="Zeit", 
                                            yaxis_title="CO2 (kg)", height=300)
                            st.plotly_chart(fig, use_container_width=True)
                    
                    # Download buttons
                    st.divider()
                    st.subheader("📥 Exportoptionen")
                    
                    col1, col2, col3 = st.columns(3)
                    
                    with col1:
                        # CSV Export (Raw Data)
                        csv = df_ts.to_csv(index=False)
                        st.download_button(
                            label="📊 CSV Daten",
                            data=csv,
                            file_name=f"simulation_{selected_id}_{datetime.now().strftime('%Y%m%d')}.csv",
                            mime="text/csv",
                            help="Rohdaten als CSV-Datei"
                        )
                    
                    with col2:
                        # Schedule Export with actual battery capacity
                        battery_capacity = selected_run.battery_capacity if hasattr(selected_run, 'battery_capacity') else 10.0
                        schedule_df = create_energy_schedule_export(df_ts, battery_capacity=battery_capacity, timestep_hours=1.0)
                        schedule_csv = schedule_df.to_csv(index=False)
                        st.download_button(
                            label="📅 Fahrplan CSV",
                            data=schedule_csv,
                            file_name=f"schedule_{selected_id}_{datetime.now().strftime('%Y%m%d')}.csv",
                            mime="text/csv",
                            help="Energie-Fahrplan mit Leistungsanweisungen"
                        )
                    
                    with col3:
                        # PDF Report Export
                        if st.button("📄 PDF Bericht", help="Umfassender PDF-Bericht erstellen"):
                            with st.spinner("PDF-Bericht wird erstellt..."):
                                try:
                                    report_gen = EnergyReportGenerator()
                                    
                                    # Prepare simulation data dict with full system config
                                    sim_data = {
                                        'id': selected_id,
                                        'agent_type': selected_run.control_strategy,
                                        'scenario': selected_run.scenario,
                                        'timestamp': selected_run.start_time,
                                        'duration_days': selected_run.duration_days,
                                        'total_cost': selected_run.total_cost,
                                        'total_co2': selected_run.total_co2,
                                        'autarky_rate': selected_run.autarky_degree,
                                        'pv_power': selected_run.pv_power,
                                        'battery_capacity': selected_run.battery_capacity,
                                        'ev_capacity': selected_run.ev_capacity,
                                        'ev_charge_power': selected_run.ev_charge_power,
                                        'hp_annual_consumption': selected_run.hp_annual_consumption,
                                        'household_annual_consumption': selected_run.household_annual_consumption
                                    }
                                    
                                    # Generate PDF
                                    pdf_buffer = report_gen.generate_simulation_report(sim_data, df_ts)
                                    
                                    st.download_button(
                                        label="⬇️ PDF herunterladen",
                                        data=pdf_buffer,
                                        file_name=f"energy_report_{selected_id}_{datetime.now().strftime('%Y%m%d')}.pdf",
                                        mime="application/pdf"
                                    )
                                    st.success("PDF-Bericht erfolgreich erstellt!")
                                except Exception as e:
                                    st.error(f"Fehler beim Erstellen des PDF-Berichts: {e}")
                else:
                    st.warning("Keine Zeitreihendaten für diese Simulation gefunden")
        else:
            st.info("Noch keine Simulationen in der Datenbank. Führen Sie eine Simulation durch, um Daten zu speichern.")
    
    except Exception as e:
        st.error(f"Fehler beim Laden der historischen Daten: {str(e)}")

with tab6:
    st.header("🚗 Mein E-Auto - Echtzeit Monitoring")
    st.markdown("Live-Überwachung der Batteriestände von E-Auto und Heimspeicher")
    
    st.info("""
    **📡 Funktionsweise:**
    - MQTT-fähige Geräte (Wallbox, OBD2-Dongle, Batterie-Management) senden SOC-Daten
    - FastAPI-Backend empfängt und verarbeitet die Daten
    - Diese Ansicht zeigt den aktuellen Status in Echtzeit
    """)
    
    backend_url = os.getenv("FASTAPI_BACKEND_URL", "http://localhost:8001")
    
    if 'soc_refresh_counter' not in st.session_state:
        st.session_state.soc_refresh_counter = 0
    
    col_refresh, col_status = st.columns([3, 1])
    
    with col_refresh:
        auto_refresh = st.checkbox("🔄 Auto-Refresh (alle 3 Sekunden)", value=True)
    
    with col_status:
        if st.button("🔃 Jetzt aktualisieren"):
            st.session_state.soc_refresh_counter += 1
    
    try:
        response = requests.get(f"{backend_url}/soc", timeout=3)
        
        if response.status_code == 200:
            data = response.json()
            ev_soc = data.get("ev_soc", 0.0)
            home_battery_soc = data.get("home_battery_soc", 0.0)
            
            st.success(f"✅ Verbunden mit Backend | Letztes Update: {datetime.now().strftime('%H:%M:%S')}")
            
            st.divider()
            
            col1, col2 = st.columns(2)
            
            with col1:
                st.subheader("🚗 E-Auto Batterie")
                st.metric(
                    label="Ladezustand (SOC)", 
                    value=f"{ev_soc:.1f}%",
                    delta=None,
                    help="Aktueller Batteriestand des Elektrofahrzeugs"
                )
                
                ev_color = "green" if ev_soc >= 60 else "orange" if ev_soc >= 20 else "red"
                st.progress(ev_soc / 100.0)
                
                if ev_soc >= 80:
                    st.success("✅ E-Auto ist ausreichend geladen")
                elif ev_soc >= 40:
                    st.info("ℹ️ E-Auto Ladung im normalen Bereich")
                elif ev_soc >= 20:
                    st.warning("⚠️ E-Auto sollte bald geladen werden")
                else:
                    st.error("🔋 E-Auto Ladung kritisch niedrig!")
                
                with st.expander("📊 Batterie-Details"):
                    estimated_capacity = ev_capacity if 'ev_capacity' in locals() else 60.0
                    estimated_kwh = (ev_soc / 100.0) * estimated_capacity
                    estimated_range = estimated_kwh * 5.0
                    
                    st.write(f"**Geschätzte Kapazität:** {estimated_capacity:.0f} kWh")
                    st.write(f"**Verfügbare Energie:** {estimated_kwh:.1f} kWh")
                    st.write(f"**Geschätzte Reichweite:** {estimated_range:.0f} km")
            
            with col2:
                st.subheader("🏠 Heimspeicher")
                st.metric(
                    label="Ladezustand (SOC)", 
                    value=f"{home_battery_soc:.1f}%",
                    delta=None,
                    help="Aktueller Batteriestand des Heimspeichers"
                )
                
                home_color = "green" if home_battery_soc >= 60 else "orange" if home_battery_soc >= 20 else "red"
                st.progress(home_battery_soc / 100.0)
                
                if home_battery_soc >= 80:
                    st.success("✅ Heimspeicher gut geladen")
                elif home_battery_soc >= 40:
                    st.info("ℹ️ Heimspeicher im normalen Bereich")
                elif home_battery_soc >= 20:
                    st.warning("⚠️ Heimspeicher Ladung niedrig")
                else:
                    st.error("🔋 Heimspeicher kritisch niedrig!")
                
                with st.expander("📊 Speicher-Details"):
                    estimated_capacity = battery_capacity if 'battery_capacity' in locals() else 10.0
                    estimated_kwh = (home_battery_soc / 100.0) * estimated_capacity
                    
                    st.write(f"**Speicherkapazität:** {estimated_capacity:.0f} kWh")
                    st.write(f"**Verfügbare Energie:** {estimated_kwh:.1f} kWh")
                    st.write(f"**Speichertyp:** Lithium-Ionen")
            
            st.divider()
            
            # ============================================================================
            # EDGE-AI FEATURES (KI-Modelle im Fahrzeug)
            # ============================================================================
            
            st.subheader("🤖 Edge-AI: Autonomes Energieverhalten")
            
            st.info("""
            **KI-Modelle im Fahrzeug** (Edge-AI mit TensorFlow Lite)
            
            Das Fahrzeug trifft **autonome Energieentscheidungen** ohne Cloud-Abhängigkeit:
            - ☀️ PV-Überschuss automatisch nutzen
            - 💰 Auf Strompreise reagieren
            - 🌡️ Wärmepumpe intelligent priorisieren
            - ⚡ V2G-Entladung bei hohen Preisen
            - 🔒 ISO 21434 Cybersecurity-konform
            """)
            
            # Edge-AI Status abrufen
            try:
                edge_ai_status_response = requests.get(f"{backend_url}/edge_ai/status", timeout=3)
                
                if edge_ai_status_response.status_code == 200:
                    edge_ai_status = edge_ai_status_response.json()
                    
                    col_ai1, col_ai2 = st.columns(2)
                    
                    with col_ai1:
                        model_loaded = edge_ai_status.get("model_loaded", False)
                        mode = edge_ai_status.get("mode", "unknown")
                        
                        if model_loaded:
                            st.success("✅ Edge-AI Modell aktiv (TensorFlow Lite)")
                            st.metric("Betriebsmodus", "🤖 KI-gesteuert")
                        else:
                            st.warning("⚠️ Regelbasierter Modus (Fallback)")
                            st.metric("Betriebsmodus", "📋 Heuristisch")
                    
                    with col_ai2:
                        capabilities = edge_ai_status.get("capabilities", {})
                        st.markdown("**Fähigkeiten:**")
                        for cap, enabled in capabilities.items():
                            icon = "✅" if enabled else "❌"
                            st.markdown(f"{icon} {cap.replace('_', ' ').title()}")
                    
                    st.divider()
                    
                    # Autonome Entscheidung anfordern
                    st.subheader("🚀 Autonome Entscheidung anfordern")
                    
                    col_params1, col_params2 = st.columns(2)
                    
                    with col_params1:
                        test_soc = st.slider("E-Auto SOC (%)", 0, 100, int(ev_soc), help="Aktueller Ladezustand")
                        test_pv = st.slider("PV-Leistung (kW)", 0.0, 15.0, 5.0, 0.5)
                    
                    with col_params2:
                        test_price = st.slider("Strompreis (€/kWh)", 0.10, 0.60, 0.30, 0.05)
                        test_co2 = st.slider("CO₂-Intensität (g/kWh)", 100, 500, 300, 50)
                    
                    if st.button("🤖 KI-Entscheidung treffen", type="primary"):
                        decision_payload = {
                            "ev_soc": float(test_soc),
                            "battery_temp": 20.0,
                            "pv_power": float(test_pv),
                            "grid_price": float(test_price),
                            "co2_intensity": float(test_co2)
                        }
                        
                        try:
                            decision_response = requests.post(
                                f"{backend_url}/edge_ai/decision",
                                json=decision_payload,
                                timeout=5
                            )
                            
                            if decision_response.status_code == 200:
                                decision_data = decision_response.json()
                                decision = decision_data.get("decision", {})
                                
                                action = decision.get("action", "unknown")
                                power_kw = decision.get("power_kw", 0.0)
                                confidence = decision.get("confidence", 0.0)
                                reasoning = decision.get("reasoning", "")
                                
                                # Action-spezifische Farben
                                action_colors = {
                                    "charge_slow": "🔵",
                                    "charge_fast": "⚡",
                                    "charge_solar": "☀️",
                                    "discharge_v2g": "🏠",
                                    "idle": "✓"
                                }
                                
                                action_icon = action_colors.get(action, "❓")
                                
                                st.success(f"**KI-Entscheidung:** {action_icon} {action.replace('_', ' ').upper()}")
                                
                                col_dec1, col_dec2, col_dec3 = st.columns(3)
                                
                                with col_dec1:
                                    st.metric("Leistung", f"{power_kw:+.1f} kW")
                                
                                with col_dec2:
                                    st.metric("Konfidenz", f"{confidence:.1%}")
                                
                                with col_dec3:
                                    mode_text = decision_data.get("mode", "unknown")
                                    st.metric("Modus", mode_text)
                                
                                st.info(f"**Begründung:** {reasoning}")
                                
                            else:
                                st.error(f"Fehler: HTTP {decision_response.status_code}")
                        
                        except Exception as e:
                            st.error(f"Fehler beim Abrufen der KI-Entscheidung: {e}")
                    
                    # Entscheidungshistorie
                    with st.expander("📜 Letzte KI-Entscheidungen"):
                        try:
                            history_response = requests.get(
                                f"{backend_url}/edge_ai/history?limit=5",
                                timeout=3
                            )
                            
                            if history_response.status_code == 200:
                                history_data = history_response.json()
                                history = history_data.get("history", [])
                                
                                if history:
                                    for idx, entry in enumerate(history[::-1]):  # Reverse for chronological order
                                        timestamp = entry.get("timestamp", "")
                                        action = entry.get("action", "")
                                        power = entry.get("power_kw", 0.0)
                                        confidence = entry.get("confidence", 0.0)
                                        
                                        st.markdown(f"""
                                        **{idx+1}.** {timestamp[:19]} | {action.replace('_', ' ').title()} | 
                                        {power:+.1f} kW | Konfidenz: {confidence:.0%}
                                        """)
                                else:
                                    st.info("Noch keine Entscheidungen getroffen")
                            
                        except Exception as e:
                            st.warning(f"Historie nicht verfügbar: {e}")
                    
                    # ============================================================================
                    # TELEMETRIE & FEDERATED LEARNING
                    # ============================================================================
                    
                    st.divider()
                    
                    st.subheader("📊 Telemetrie & KI-Verbesserung")
                    
                    st.info("""
                    **Federated Learning** - Helfen Sie mit, die KI zu verbessern!
                    
                    Mit Ihrer Einwilligung sammeln wir **anonymisierte Daten** zur Verbesserung 
                    der Edge-AI Modelle für alle Nutzer.
                    
                    **Datenschutz-Garantien (DSGVO-konform):**
                    - ✅ Keine Fahrzeug-IDs, VINs oder persönliche Daten
                    - ✅ Nur aggregierte Statistiken (z.B. "60% nutzen Solar Charging")
                    - ✅ Session-ID ändert sich bei Neustart
                    - ✅ Keine GPS-Koordinaten oder Standorte
                    - ✅ Jederzeit widerrufbar
                    """)
                    
                    # Telemetrie-Status abrufen
                    try:
                        telemetry_status_response = requests.get(
                            f"{backend_url}/telemetry/status",
                            timeout=3
                        )
                        
                        if telemetry_status_response.status_code == 200:
                            telemetry_status = telemetry_status_response.json().get("telemetry", {})
                            
                            telemetry_enabled = telemetry_status.get("enabled", False)
                            samples_collected = telemetry_status.get("samples_collected", 0)
                            session_id = telemetry_status.get("session_id", "N/A")
                            
                            col_tel1, col_tel2 = st.columns(2)
                            
                            with col_tel1:
                                if telemetry_enabled:
                                    st.success("✅ Telemetrie **AKTIV**")
                                else:
                                    st.warning("⚠️ Telemetrie **INAKTIV**")
                                
                                st.metric("Gesammelte Samples", samples_collected)
                            
                            with col_tel2:
                                st.metric("Session-ID", session_id[:8] + "...")
                                st.caption("Ändert sich bei jedem Neustart")
                            
                            # Opt-in/Opt-out Buttons
                            col_btn1, col_btn2 = st.columns(2)
                            
                            with col_btn1:
                                if not telemetry_enabled:
                                    if st.button("✅ Telemetrie aktivieren", type="primary"):
                                        try:
                                            opt_in_response = requests.post(
                                                f"{backend_url}/telemetry/opt-in",
                                                timeout=3
                                            )
                                            
                                            if opt_in_response.status_code == 200:
                                                st.success("Telemetrie aktiviert! 🎉")
                                                st.rerun()
                                            else:
                                                st.error(f"Fehler: HTTP {opt_in_response.status_code}")
                                        
                                        except Exception as e:
                                            st.error(f"Fehler beim Aktivieren: {e}")
                            
                            with col_btn2:
                                if telemetry_enabled:
                                    if st.button("🚫 Telemetrie deaktivieren"):
                                        try:
                                            opt_out_response = requests.post(
                                                f"{backend_url}/telemetry/opt-out",
                                                timeout=3
                                            )
                                            
                                            if opt_out_response.status_code == 200:
                                                st.success("Telemetrie deaktiviert - Alle Daten gelöscht")
                                                st.rerun()
                                            else:
                                                st.error(f"Fehler: HTTP {opt_out_response.status_code}")
                                        
                                        except Exception as e:
                                            st.error(f"Fehler beim Deaktivieren: {e}")
                            
                            # Retraining-Statistiken
                            with st.expander("📈 Federated Learning Status"):
                                try:
                                    stats_response = requests.get(
                                        f"{backend_url}/telemetry/stats",
                                        timeout=3
                                    )
                                    
                                    if stats_response.status_code == 200:
                                        stats = stats_response.json()
                                        retraining = stats.get("retraining", {})
                                        
                                        st.metric("Telemetrie-Batches", retraining.get("total_batches", 0))
                                        st.metric("Retraining-Intervall", f"{retraining.get('retrain_interval_days', 30)} Tage")
                                        
                                        last_retrain = retraining.get("last_retrain")
                                        if last_retrain:
                                            st.info(f"Letztes Retraining: {last_retrain[:10]}")
                                        else:
                                            st.info("Noch kein Retraining durchgeführt")
                                        
                                        next_eligible = retraining.get("next_retrain_eligible", False)
                                        if next_eligible:
                                            st.success("✅ Retraining kann durchgeführt werden")
                                        else:
                                            st.info("⏱️ Warte auf mehr Daten...")
                                
                                except Exception as e:
                                    st.warning(f"Stats nicht verfügbar: {e}")
                        
                        else:
                            st.warning("Telemetrie-Backend nicht verfügbar")
                    
                    except Exception as e:
                        st.warning(f"Telemetrie nicht erreichbar: {e}")
                
                else:
                    st.warning("⚠️ Edge-AI Backend nicht verfügbar")
            
            except requests.exceptions.ConnectionError:
                st.warning("⚠️ Edge-AI Backend nicht erreichbar")
            except Exception as e:
                st.error(f"Fehler: {str(e)}")
            
            st.divider()
            
            st.subheader("🔧 System-Konfiguration")
            
            st.code(f"""
Backend-URL: {backend_url}
MQTT-Broker: {os.getenv('MQTT_BROKER', 'test.mosquitto.org')}
MQTT-Topics: 
  - ems/ev/soc
  - ems/home_battery/soc
Edge-AI: TensorFlow Lite (models/edge_ai_model.tflite)
            """, language="yaml")
            
            with st.expander("ℹ️ Wie verbinde ich meine Geräte?"):
                st.markdown("""
                **1. E-Auto Integration:**
                - Via OBD2-Dongle mit MQTT-Fähigkeit
                - Hersteller-API (Tesla, VW, etc.)
                - Smart Wallbox mit integriertem Monitoring
                
                **2. Heimspeicher Integration:**
                - Battery Management System (BMS) mit MQTT
                - Wechselrichter mit integriertem Monitoring
                - Energiemanagementsystem des Herstellers
                
                **3. MQTT-Nachrichtenformat:**
                ```json
                {
                  "device": "ev",  // oder "home_battery"
                  "soc": 75.5      // Ladezustand in Prozent
                }
                ```
                
                **4. Test mit Simulator:**
                Verwenden Sie das mitgelieferte Simulator-Skript:
                ```bash
                python simulator/device_simulator.py
                ```
                """)
        
        else:
            st.error(f"❌ Backend-Fehler: HTTP {response.status_code}")
            st.info("Stellen Sie sicher, dass das FastAPI-Backend läuft: `uvicorn backend.main:app --port 8001`")
    
    except requests.exceptions.ConnectionError:
        st.warning("⚠️ Backend nicht erreichbar")
        st.info("""
        **Backend starten:**
        1. Terminal öffnen
        2. `uvicorn backend.main:app --port 8001` ausführen
        3. Diese Seite aktualisieren
        
        **MQTT-Bridge starten (optional):**
        ```bash
        python backend/mqtt_to_ws.py
        ```
        
        **Simulator starten (zum Testen):**
        ```bash
        python simulator/device_simulator.py
        ```
        """)
        
        col_demo1, col_demo2 = st.columns(2)
        with col_demo1:
            st.metric("🚗 E-Auto (Demo)", "-- %")
            st.progress(0.0)
        with col_demo2:
            st.metric("🏠 Heimspeicher (Demo)", "-- %")
            st.progress(0.0)
    
    except Exception as e:
        st.error(f"Fehler: {str(e)}")
    
    if auto_refresh:
        time.sleep(3)
        st.rerun()

# Footer
st.divider()
st.markdown("""
<div style='text-align: center; color: gray;'>
    ⚡ KI-basiertes Energiemanagementsystem | 
    Optimierung für dezentrale Energiesysteme mit PV, Batterie, E-Auto und Wärmepumpe/Klimaanlage
</div>
""", unsafe_allow_html=True)
