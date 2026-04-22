"""
Device Adapters package
"""
__version__ = "1.0.0"
__author__ = "EMS Development Team"

# Importiere nur Basis‑Typen hier, konkrete Adapter lazy via factory
from .base import BaseDeviceAdapter, DeviceData

__all__ = [
    "BaseDeviceAdapter",
    "DeviceData",
]