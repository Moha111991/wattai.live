import requests
from typing import Dict, Any

class CloudDeviceAdapter:
    def __init__(self, api_base_url: str, api_key: str):
        self.api_base_url = api_base_url
        self.api_key = api_key

    def get_status(self, device_id: str) -> Dict[str, Any]:
        url = f"{self.api_base_url}/devices/{device_id}/status"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        resp = requests.get(url, headers=headers, timeout=5)
        resp.raise_for_status()
        return resp.json()

    def get_telemetry(self, device_id: str) -> Dict[str, Any]:
        url = f"{self.api_base_url}/devices/{device_id}/telemetry"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        resp = requests.get(url, headers=headers, timeout=5)
        resp.raise_for_status()
        return resp.json()

    def send_command(self, device_id: str, command: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        url = f"{self.api_base_url}/devices/{device_id}/command"
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        payload = {"command": command, "params": params or {}}
        resp = requests.post(url, headers=headers, json=payload, timeout=5)
        resp.raise_for_status()
        return resp.json()
