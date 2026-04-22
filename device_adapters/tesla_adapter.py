import aiohttp
import logging
from typing import Dict, Optional
import os

logger = logging.getLogger(__name__)

class TeslaAdapter:
    """Tesla Fleet API Integration"""
    
    def __init__(self):
        self.api_key = os.getenv("TESLA_API_KEY")
        self.vehicle_id = os.getenv("TESLA_VEHICLE_ID")
        self.base_url = "https://api.tesla.com/api/1/vehicles"
    
    async def get_vehicle_data(self) -> Optional[Dict]:
        """Get complete vehicle data"""
        try:
            async with aiohttp.ClientSession() as session:
                headers = {"Authorization": f"Bearer {self.api_key}"}
                async with session.get(
                    f"{self.base_url}/{self.vehicle_id}/vehicle_data",
                    headers=headers
                ) as resp:
                    if resp.status == 200:
                        return await resp.json()
        except Exception as e:
            logger.error(f"❌ Tesla data fetch failed: {e}")
            return None
    
    async def start_charging(self) -> bool:
        """Start charging"""
        try:
            async with aiohttp.ClientSession() as session:
                headers = {"Authorization": f"Bearer {self.api_key}"}
                async with session.post(
                    f"{self.base_url}/{self.vehicle_id}/command/charge_start",
                    headers=headers
                ) as resp:
                    return resp.status == 200
        except Exception as e:
            logger.error(f"❌ Tesla charge start failed: {e}")
            return False
    
    async def set_charge_limit(self, limit: int) -> bool:
        """Set charge limit (0-100%)"""
        try:
            async with aiohttp.ClientSession() as session:
                headers = {"Authorization": f"Bearer {self.api_key}"}
                async with session.post(
                    f"{self.base_url}/{self.vehicle_id}/command/set_charge_limit",
                    json={"percent": limit},
                    headers=headers
                ) as resp:
                    return resp.status == 200
        except Exception as e:
            logger.error(f"❌ Charge limit setting failed: {e}")
            return False