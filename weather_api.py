"""
Weather API integration for real-time weather forecasting
Supports OpenWeatherMap API for live data and adaptive PV generation
"""
import os
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import json


class WeatherAPI:
    """
    Interface to OpenWeatherMap API for weather data
    Falls back to synthetic data if API key is not available
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize weather API client
        
        Args:
            api_key: OpenWeatherMap API key (optional, uses env var if not provided)
        """
        self.api_key = api_key or os.getenv('OPENWEATHERMAP_API_KEY')
        self.base_url = "https://api.openweathermap.org/data/2.5"
        self.use_api = self.api_key is not None
        
    def get_current_weather(self, lat: float = 51.5, lon: float = 10.0) -> Dict:
        """
        Get current weather conditions
        
        Args:
            lat: Latitude (default: 51.5, Central Germany)
            lon: Longitude (default: 10.0, Central Germany)
            
        Returns:
            Dictionary with weather data
        """
        if not self.use_api:
            return self._get_synthetic_current_weather()
        
        try:
            url = f"{self.base_url}/weather"
            params = {
                'lat': lat,
                'lon': lon,
                'appid': self.api_key,
                'units': 'metric'
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            return {
                'temperature': data['main']['temp'],
                'cloud_cover': data['clouds']['all'] / 100.0,  # 0-1 scale
                'wind_speed': data['wind']['speed'],
                'humidity': data['main']['humidity'],
                'pressure': data['main']['pressure'],
                'description': data['weather'][0]['description'],
                'timestamp': datetime.utcfromtimestamp(data['dt']),
                'sunrise': datetime.utcfromtimestamp(data['sys']['sunrise']),
                'sunset': datetime.utcfromtimestamp(data['sys']['sunset'])
            }
        except Exception as e:
            print(f"Weather API error: {e}. Falling back to synthetic data.")
            return self._get_synthetic_current_weather()
    
    def get_forecast(self, lat: float = 51.5, lon: float = 10.0, days: int = 7) -> List[Dict]:
        """
        Get weather forecast for next days
        
        Args:
            lat: Latitude
            lon: Longitude
            days: Number of days (max 7 for free tier)
            
        Returns:
            List of hourly weather forecasts
        """
        if not self.use_api:
            return self._get_synthetic_forecast(days)
        
        try:
            url = f"{self.base_url}/forecast"
            params = {
                'lat': lat,
                'lon': lon,
                'appid': self.api_key,
                'units': 'metric',
                'cnt': min(days * 8, 40)  # 3-hour intervals, max 40 entries (5 days)
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            forecast = []
            for item in data['list']:
                forecast.append({
                    'timestamp': datetime.utcfromtimestamp(item['dt']),
                    'temperature': item['main']['temp'],
                    'cloud_cover': item['clouds']['all'] / 100.0,
                    'wind_speed': item['wind']['speed'],
                    'humidity': item['main']['humidity'],
                    'pressure': item['main']['pressure'],
                    'description': item['weather'][0]['description'],
                    'precipitation': item.get('rain', {}).get('3h', 0) / 3.0  # mm/hour
                })
            
            return forecast
        except Exception as e:
            print(f"Weather forecast API error: {e}. Falling back to synthetic data.")
            return self._get_synthetic_forecast(days)
    
    def _get_synthetic_current_weather(self) -> Dict:
        """Generate synthetic weather data when API is unavailable"""
        import random
        
        hour = datetime.now().hour
        
        # Daytime temperature pattern
        base_temp = 15 + 10 * (1 - abs(hour - 12) / 12)
        
        return {
            'temperature': base_temp + random.gauss(0, 2),
            'cloud_cover': random.uniform(0.2, 0.7),
            'wind_speed': random.uniform(2, 8),
            'humidity': random.uniform(40, 80),
            'pressure': 1013 + random.gauss(0, 5),
            'description': 'partly cloudy',
            'timestamp': datetime.now(),
            'sunrise': datetime.now().replace(hour=6, minute=0),
            'sunset': datetime.now().replace(hour=20, minute=0)
        }
    
    def _get_synthetic_forecast(self, days: int) -> List[Dict]:
        """Generate synthetic forecast when API is unavailable"""
        import random
        
        forecast = []
        now = datetime.now()
        
        for hour_offset in range(days * 24):
            timestamp = now + timedelta(hours=hour_offset)
            hour = timestamp.hour
            
            # Temperature pattern
            base_temp = 15 + 10 * (1 - abs(hour - 12) / 12)
            
            # Cloud cover with some persistence
            if hour_offset == 0:
                cloud_cover = random.uniform(0.2, 0.7)
            else:
                # Previous cloud cover with some variation
                prev_cloud = forecast[-1]['cloud_cover']
                cloud_cover = max(0, min(1, prev_cloud + random.gauss(0, 0.1)))
            
            forecast.append({
                'timestamp': timestamp,
                'temperature': base_temp + random.gauss(0, 3),
                'cloud_cover': cloud_cover,
                'wind_speed': random.uniform(2, 10),
                'humidity': random.uniform(40, 85),
                'pressure': 1013 + random.gauss(0, 5),
                'description': 'variable',
                'precipitation': 0 if random.random() > 0.15 else random.uniform(0, 2)
            })
        
        return forecast
    
    def get_pv_irradiance_factor(self, cloud_cover: float, hour: int) -> float:
        """
        Calculate PV generation factor based on weather conditions
        
        Args:
            cloud_cover: Cloud cover fraction (0-1)
            hour: Hour of day (0-23)
            
        Returns:
            PV generation factor (0-1)
        """
        # Base solar angle factor
        if hour < 6 or hour > 20:
            solar_factor = 0
        else:
            # Simplified solar angle (peak at noon)
            solar_factor = max(0, (1 - abs(hour - 12) / 8) ** 0.5)
        
        # Cloud attenuation (clear sky = 1.0, fully cloudy = 0.2)
        clear_sky_factor = 1.0 - (0.8 * cloud_cover)
        
        return solar_factor * clear_sky_factor


# Singleton instance
_weather_api = None

def get_weather_api() -> WeatherAPI:
    """Get or create global weather API instance"""
    global _weather_api
    if _weather_api is None:
        _weather_api = WeatherAPI()
    return _weather_api
