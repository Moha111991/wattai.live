import os, yaml
from pathlib import Path

DEFAULT = {
    "ev_profiles": {},
    "active_ev_id": None,
    "adapters": {},
    "settings": {
        "timezone": "Europe/Berlin",
        "currency": "EUR",
        "demo_mode": False
    }
}

def load_config():
    path = os.getenv("EFH_CONFIG_PATH", "config/config.yaml")
    p = Path(path)
    if not p.exists():
        return DEFAULT.copy()
    try:
        with p.open("r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
        # Decrypt any protected fields if secrets helper is available
        try:
            from backend.secrets import unprotect_config_after_load
            data = unprotect_config_after_load(data)
        except Exception:
            # if secrets not configured, continue with raw data
            pass

        merged = DEFAULT.copy()
        for k, v in data.items():
            merged[k] = v
        return merged
    except Exception as e:
        print("[config] Fehler, verwende Defaults:", e)
        return DEFAULT.copy()