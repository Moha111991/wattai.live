import aiohttp
import logging
from typing import Dict, Optional
from datetime import datetime
import os

logger = logging.getLogger(__name__)

class HyundaiAdapter:
    """Hyundai Bluelink API Integration (Ioniq, Kona Electric)"""
    
    def __init__(self):
        self.base_url = "https://api.hyundaiusa.com/v2"
        self.api_key = os.getenv("HYUNDAI_API_KEY")
        self.session_id = None
        self.device_id = os.getenv("HYUNDAI_DEVICE_ID")
    
    async def authenticate(self) -> bool:
        """Authenticate with Hyundai Bluelink"""
        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                async with session.post(
                    f"{self.base_url}/auth/login",
                    json={"deviceId": self.device_id},
                    headers=headers
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        self.session_id = data.get("sessionId")
                        logger.info("✅ Hyundai authentication successful")
                        return True
        except Exception as e:
            logger.error(f"❌ Hyundai auth failed: {e}")
            return False
    
    async def get_battery_status(self) -> Optional[Dict]:
        """Get current battery status"""
        try:
            async with aiohttp.ClientSession() as session:
                headers = {"Authorization": f"Bearer {self.session_id}"}
                async with session.get(
                    f"{self.base_url}/vehicles/battery",
                    headers=headers
                ) as resp:
                    if resp.status == 200:
                        return await resp.json()
        except Exception as e:
            logger.error(f"❌ Failed to get battery status: {e}")
            return None
    
    async def start_charging(self, amperage: int = 16) -> bool:
        """Start EV charging"""
        try:
            async with aiohttp.ClientSession() as session:
                headers = {"Authorization": f"Bearer {self.session_id}"}
                async with session.post(
                    f"{self.base_url}/vehicles/charging/start",
                    json={"amperage": amperage},
                    headers=headers
                ) as resp:
                    return resp.status == 200
        except Exception as e:
            logger.error(f"❌ Charging start failed: {e}")
            return False
    
    async def stop_charging(self) -> bool:
        """Stop EV charging"""
        try:
            async with aiohttp.ClientSession() as session:
                headers = {"Authorization": f"Bearer {self.session_id}"}
                async with session.post(
                    f"{self.base_url}/vehicles/charging/stop",
                    headers=headers
                ) as resp:
                    return resp.status == 200
        except Exception as e:
            logger.error(f"❌ Charging stop failed: {e}")
            return False
    
    async def set_charging_schedule(self, start_time: str, end_time: str) -> bool:
        """Set delayed charging schedule (HH:MM format)"""
        try:
            async with aiohttp.ClientSession() as session:
                headers = {"Authorization": f"Bearer {self.session_id}"}
                async with session.post(
                    f"{self.base_url}/vehicles/charging/schedule",
                    json={"startTime": start_time, "endTime": end_time},
                    headers=headers
                ) as resp:
                    return resp.status == 200
        except Exception as e:
            logger.error(f"❌ Schedule setting failed: {e}")
            return False