"""
Universal Adapter System for PV Inverters
Supports:
- Fronius
- SMA
- Kostal
- Huawei
- SolarEdge
- GoodWe
- Sungrow
- Enphase (Micro-Inverters)
"""

from typing import List, Dict, Any, Optional
import random
import time


# ---------------------------------------------------
# Base-Class für alle Wechselrichter-Adapter
# ---------------------------------------------------

class InverterAdapter:
    def __init__(
        self,
        manufacturer: str,
        model: str,
        peak_power_kw: float,
        ip: Optional[str] = None,
        connection: str = "local",  # local, modbus, cloud
        api_key: Optional[str] = None,
        port: int = 502
    ):
        self.manufacturer = manufacturer
        self.model = model
        self.peak_power_kw = peak_power_kw
        self.ip = ip
        self.port = port
        self.connection = connection
        self.api_key = api_key

    def get_info(self) -> Dict[str, Any]:
        return {
            "manufacturer": self.manufacturer,
            "model": self.model,
            "peak_power_kw": self.peak_power_kw,
            "connection": self.connection,
            "ip": self.ip,
            "port": self.port,
        }

    def read_realtime(self) -> Dict[str, Any]:
        """
        Wird in abgeleiteten Klassen überschrieben (HTTP, Modbus, Cloud).

        """
        Produktionsfähige Adapter-Struktur für PV-Wechselrichter (KI-EMS/LMS)
        Hersteller: Fronius, SMA, Kostal, Huawei, SolarEdge, GoodWe, Sungrow, Enphase
        Protokolle: HTTP API, Modbus/TCP, Cloud API
        Base-Class, Adapter-Klassen, JSON-Liste für Frontend, FastAPI-ready
        """
        from typing import List, Dict, Any, Optional
        import requests

        class InverterBase:
            def __init__(self, manufacturer: str, model: str, peak_power_kw: float, ip: Optional[str] = None, connection: str = "local"):
                self.manufacturer = manufacturer
                self.model = model
                self.peak_power_kw = peak_power_kw
                self.ip = ip
                self.connection = connection

            def get_info(self) -> Dict[str, Any]:
                return {
                    "manufacturer": self.manufacturer,
                    "model": self.model,
                    "peak_power_kw": self.peak_power_kw,
                    "ip": self.ip,
                    "connection": self.connection
                }

            def read_realtime(self) -> Dict[str, Any]:
                raise NotImplementedError()

        # HTTP API Adapter (Fronius, Kostal, SolarEdge)
        class HTTPInverterAdapter(InverterBase):
            def read_realtime(self) -> Dict[str, Any]:
                # Beispiel: Fronius Solar API
                if self.manufacturer == "Fronius":
                    try:
                        url = f"http://{self.ip}/solar_api/v1/GetInverterRealtimeData.cgi?Scope=Device&DeviceId=1"
                        resp = requests.get(url, timeout=3)
                        data = resp.json()
                        return {
                            "timestamp": data.get("Head", {}).get("Timestamp"),
                            "pv_power_w": data.get("Body", {}).get("PAC", {}).get("Value", 0),
                            "pv_today_kwh": data.get("Body", {}).get("DAY_ENERGY", {}).get("Value", 0)
                        }
                    except Exception as e:
                        return {"error": str(e)}
                # Weitere Hersteller/Modelle analog
                return {"error": "Not implemented"}

        # Modbus/TCP Adapter (SMA, Sungrow, GoodWe, Huawei)
        class ModbusInverterAdapter(InverterBase):
            def read_realtime(self) -> Dict[str, Any]:
                # Hier: Modbus/TCP Abfrage (z.B. mit pymodbus)
                # Dummy-Daten für Demo
                return {
                    "timestamp": "2025-11-13T12:00:00",
                    "pv_power_w": 4200,
                    "pv_today_kwh": 14.2
                }

        # Cloud API Adapter (SolarEdge Cloud, Enphase, Huawei FusionSolar)
        class CloudInverterAdapter(InverterBase):
            def read_realtime(self) -> Dict[str, Any]:
                # Beispiel: SolarEdge Cloud API
                # Dummy-Daten für Demo
                return {
                    "timestamp": "2025-11-13T12:00:00",
                    "pv_power_w": 3900,
                    "pv_today_kwh": 13.1
                }

        # Komplette JSON-Liste für das Frontend (Hersteller, Modelle, Protokoll)
        INVERTER_LIST: List[Dict[str, Any]] = [
            {"manufacturer": "Fronius", "models": [
                {"model": "Symo 5.0-3-M", "peak_power_kw": 5.0, "protocol": "http"},
                {"model": "Primo 3.0-1", "peak_power_kw": 3.0, "protocol": "http"}
            ]},
            {"manufacturer": "SMA", "models": [
                {"model": "Sunny Tripower 8.0", "peak_power_kw": 8.0, "protocol": "modbus"},
                {"model": "Sunny Boy 5.0", "peak_power_kw": 5.0, "protocol": "modbus"}
            ]},
            {"manufacturer": "Kostal", "models": [
                {"model": "Plenticore Plus 5.5", "peak_power_kw": 5.5, "protocol": "http"}
            ]},
            {"manufacturer": "Huawei", "models": [
                {"model": "SUN2000-5KTL-M1", "peak_power_kw": 5.0, "protocol": "modbus"},
                {"model": "FusionSolar", "peak_power_kw": 10.0, "protocol": "cloud"}
            ]},
            {"manufacturer": "SolarEdge", "models": [
                {"model": "SE5000H", "peak_power_kw": 5.0, "protocol": "http"},
                {"model": "Cloud", "peak_power_kw": 10.0, "protocol": "cloud"}
            ]},
            {"manufacturer": "GoodWe", "models": [
                {"model": "GW5000D-NS", "peak_power_kw": 5.0, "protocol": "modbus"}
            ]},
            {"manufacturer": "Sungrow", "models": [
                {"model": "SG5K-D", "peak_power_kw": 5.0, "protocol": "modbus"}
            ]},
            {"manufacturer": "Enphase", "models": [
                {"model": "IQ7+", "peak_power_kw": 0.29, "protocol": "cloud"}
            ]}
        ]

        # FastAPI-ready: Beispiel-Endpunkt für die JSON-Liste
        def get_inverter_list() -> List[Dict[str, Any]]:
            return INVERTER_LIST
class SungrowAdapter(InverterAdapter):
    def read_realtime(self):
        return {
            **super().read_realtime(),
            "protocol": "Modbus/TCP (Sungrow)"
        }


class GoodWeAdapter(InverterAdapter):
    def read_realtime(self):
        return {
            **super().read_realtime(),
            "protocol": "GoodWe SEMS API / Modbus"
        }


class EnphaseAdapter(InverterAdapter):
    def read_realtime(self):
        return {
            **super().read_realtime(),
            "protocol": "Enphase Enlighten Cloud API"
        }


# ---------------------------------------------------
# Frontend-Liste aller unterstützten Modelle
# ---------------------------------------------------

INVERTER_MODELS: Dict[str, List[Dict[str, Any]]] = {
    "Fronius": [
        {"model": "Symo 5.0-3-M", "peak_power_kw": 5.0},
        {"model": "Primo 3.0-1", "peak_power_kw": 3.0},
        {"model": "Symo GEN24 6.0", "peak_power_kw": 6.0}
    ],
    "SMA": [
        {"model": "Sunny Tripower 8.0", "peak_power_kw": 8.0},
        {"model": "Sunny Boy 5.0", "peak_power_kw": 5.0},
        {"model": "Sunny Tripower X 12.0", "peak_power_kw": 12.0}
    ],
    "Kostal": [
        {"model": "Plenticore Plus 5.5", "peak_power_kw": 5.5},
        {"model": "PIKO MP Plus 4.6", "peak_power_kw": 4.6}
    ],
    "Huawei": [
        {"model": "SUN2000-5KTL-M1", "peak_power_kw": 5.0},
        {"model": "SUN2000-8KTL-M2", "peak_power_kw": 8.0}
    ],
    "SolarEdge": [
        {"model": "SE5000H", "peak_power_kw": 5.0},
        {"model": "SE6000H", "peak_power_kw": 6.0}
    ],
    "GoodWe": [
        {"model": "GW5000D-NS", "peak_power_kw": 5.0},
        {"model": "GW6000-EH", "peak_power_kw": 6.0}
    ],
    "Sungrow": [
        {"model": "SG5K-D", "peak_power_kw": 5.0},
        {"model": "SG8K-D", "peak_power_kw": 8.0}
    ],
    "Enphase": [
        {"model": "IQ7+", "peak_power_kw": 0.29},
        {"model": "IQ8M", "peak_power_kw": 0.30}
    ]
}


# ---------------------------------------------------
# Factory zum Erzeugen des richtigen Adapters
# ---------------------------------------------------

def create_inverter_adapter(manufacturer: str, model: str, peak_power_kw: float, **kwargs):
    classes = {
        "Fronius": FroniusAdapter,
        "SMA": SMAAdapter,
        "Kostal": KostalAdapter,
        "Huawei": HuaweiAdapter,
        "SolarEdge": SolarEdgeAdapter,
        "GoodWe": GoodWeAdapter,
        "Sungrow": SungrowAdapter,
        "Enphase": EnphaseAdapter
    }
    cls = classes.get(manufacturer, InverterAdapter)
    return cls(manufacturer, model, peak_power_kw, **kwargs)


# Beispiel-Auswahlliste für Frontend/Onboarding
INVERTER_MODELS: Dict[str, List[Dict[str, Any]]] = {
    "Fronius": [
        {"model": "Symo 5.0-3-M", "peak_power_kw": 5.0},
        {"model": "Primo 3.0-1", "peak_power_kw": 3.0}
    ],
    "SMA": [
        {"model": "Sunny Tripower 8.0", "peak_power_kw": 8.0},
        {"model": "Sunny Boy 5.0", "peak_power_kw": 5.0}
    ],
    "Kostal": [
        {"model": "Plenticore Plus 5.5", "peak_power_kw": 5.5}
    ],
    "Huawei": [
        {"model": "SUN2000-5KTL-M1", "peak_power_kw": 5.0}
    ],
    "SolarEdge": [
        {"model": "SE5000H", "peak_power_kw": 5.0}
    ]
}

# Für das Frontend: Hersteller-Auswahl, Modell-Auswahl, Leistung
# Die Adapter-Instanz kann dann im Backend provisioniert und angebunden werden.
