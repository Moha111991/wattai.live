import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict
from energy_system import EnergySystem


class TimeSeriesGenerator:
    """
    Generiert realistische Zeitreihen für das Energiemanagementsystem
    """
    
    def __init__(self, energy_system: EnergySystem):
        self.energy_system = energy_system
    
    def generate_scenario_data(self, start_date: datetime, days: int, 
                               scenario: str = "summer") -> pd.DataFrame:
        """
        Generiert vollständige Zeitreihendaten für ein Szenario
        
        Args:
            start_date: Startdatum
            days: Anzahl Tage
            scenario: "summer", "winter", "spring"
        
        Returns:
            DataFrame mit allen Zeitreihen
        """
        # Zeitindex erstellen
        timestamps = [start_date + timedelta(hours=h) for h in range(days * 24)]
        
        data = {
            'timestamp': timestamps,
            'pv_generation': [],
            'household_load': [],
            'hp_load': [],
            'ev_present': [],
            'grid_price': [],
            'temperature': [],
            'hour': [],
            'day_of_week': [],
            'is_weekend': []
        }
        
        for ts in timestamps:
            # PV Erzeugung
            pv_gen = self.energy_system.get_pv_generation(ts, scenario)
            data['pv_generation'].append(pv_gen)
            
            # Haushaltslast
            household = self.energy_system.get_household_load(ts)
            data['household_load'].append(household)
            
            # Wärmepumpe
            hp = self.energy_system.get_heat_pump_load(ts, scenario)
            data['hp_load'].append(hp)
            
            # E-Auto Anwesenheit
            _, ev_present = self.energy_system.get_ev_charging_need(ts)
            data['ev_present'].append(1 if ev_present else 0)
            
            # Strompreis
            grid_price = self.energy_system.get_dynamic_grid_price(ts)
            data['grid_price'].append(grid_price)
            
            # Temperatur (für Szenario-Kontext)
            if scenario == "summer":
                temp = np.random.normal(25, 5)
            elif scenario == "winter":
                temp = np.random.normal(2, 4)
            else:
                temp = np.random.normal(12, 6)
            data['temperature'].append(temp)
            
            # Zeit-Features
            data['hour'].append(ts.hour)
            data['day_of_week'].append(ts.weekday())
            data['is_weekend'].append(1 if ts.weekday() >= 5 else 0)
        
        return pd.DataFrame(data)
    
    def generate_user_profiles(self) -> List[Dict]:
        """
        Erstellt verschiedene Nutzerprofile für Szenarien
        """
        profiles = [
            {
                'name': 'Pendler (Werktag)',
                'description': 'Fährt werktags zur Arbeit, Auto abends zu Hause',
                'ev_usage_pattern': 'weekday_commuter',
                'annual_km': 15000,
                'home_hours': list(range(18, 24)) + list(range(0, 7))
            },
            {
                'name': 'Home-Office',
                'description': 'Arbeitet von zu Hause, Auto meist da',
                'ev_usage_pattern': 'home_office',
                'annual_km': 8001,
                'home_hours': list(range(0, 24))
            },
            {
                'name': 'Vielfahrer',
                'description': 'Hohe Fahrleistung, häufiges Laden nötig',
                'ev_usage_pattern': 'high_mileage',
                'annual_km': 25000,
                'home_hours': list(range(20, 24)) + list(range(0, 6))
            },
            {
                'name': 'Wochenend-Nutzer',
                'description': 'Nutzt Auto hauptsächlich am Wochenende',
                'ev_usage_pattern': 'weekend',
                'annual_km': 6000,
                'home_hours': list(range(0, 24))
            }
        ]
        
        return profiles
    
    def generate_summary_statistics(self, df: pd.DataFrame) -> Dict:
        """
        Berechnet Zusammenfassungsstatistiken für Zeitreihendaten
        """
        stats = {
            'pv_total': df['pv_generation'].sum(),
            'pv_mean': df['pv_generation'].mean(),
            'pv_max': df['pv_generation'].max(),
            'household_total': df['household_load'].sum(),
            'household_mean': df['household_load'].mean(),
            'household_max': df['household_load'].max(),
            'hp_total': df['hp_load'].sum(),
            'hp_mean': df['hp_load'].mean(),
            'grid_price_mean': df['grid_price'].mean(),
            'grid_price_max': df['grid_price'].max(),
            'grid_price_min': df['grid_price'].min(),
            'ev_home_percentage': (df['ev_present'].sum() / len(df)) * 100
        }
        
        return stats


def create_sample_datasets(output_dir: str = "./data"):
    """
    Erstellt Beispiel-Datensätze für verschiedene Szenarien
    """
    import os
    
    # Verzeichnis erstellen
    os.makedirs(output_dir, exist_ok=True)
    
    # Energiesystem initialisieren
    energy_system = EnergySystem()
    generator = TimeSeriesGenerator(energy_system)
    
    # Szenarien definieren
    scenarios = [
        ('summer', datetime(2024, 7, 1), 7, 'Sommer'),
        ('winter', datetime(2024, 1, 1), 7, 'Winter'),
        ('spring', datetime(2024, 4, 1), 7, 'Frühling')
    ]
    
    datasets = {}
    
    for scenario, start_date, days, name in scenarios:
        print(f"Generiere {name}-Szenario...")
        df = generator.generate_scenario_data(start_date, days, scenario)
        
        # Speichern
        filename = f"{output_dir}/{scenario}_scenario.csv"
        df.to_csv(filename, index=False)
        
        # Statistiken
        stats = generator.generate_summary_statistics(df)
        datasets[name] = {'df': df, 'stats': stats}
        
        print(f"  - {name}: {len(df)} Datenpunkte erstellt")
        print(f"  - PV Total: {stats['pv_total']:.2f} kWh")
        print(f"  - Haushalt Total: {stats['household_total']:.2f} kWh")
    
    return datasets
