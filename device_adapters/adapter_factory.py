# ...existing code...
from typing import Type, Dict, Optional

def _try_import(name: str, module: str):
    try:
        m = __import__(f"device_adapters.{module}", fromlist=[name])
        return getattr(m, name)
    except Exception:
        return None

# Versuche Adapter- Klassen lazy zu laden (vermeidet Zirkularimporte / side-effects beim Paketimport)
HyundaiAdapter = _try_import("HyundaiAdapter", "hyundai_adapter")
TeslaAdapter = _try_import("TeslaAdapter", "ev.tesla_adapter")

class AdapterFactory:
    """Factory für Device Adapter"""
    _adapters: Dict[str, Type] = {}

    # Registriere nur vorhandene Adapter
    if HyundaiAdapter is not None:
        _adapters["hyundai"] = HyundaiAdapter
    if TeslaAdapter is not None:
        _adapters["tesla"] = TeslaAdapter

    @classmethod
    def get_adapter(cls, device_type: str):
        adapter_class = cls._adapters.get(device_type.lower())
        if adapter_class:
            return adapter_class()
        # Versuche beim Bedarf dynamisch zu importieren
        # (erlaubt nachträgliche Registrierung ohne Neustart)
        raise ValueError(f"Unknown device type: {device_type}")

    @classmethod
    def register_adapter(cls, name: str, adapter_class: Type):
        cls._adapters[name.lower()] = adapter_class

def list_adapters() -> Dict[str, str]:
    return {k: v.__name__ for k, v in AdapterFactory._adapters.items()}
# ...existing code...