import pytest
from device_adapters.adapter_factory import AdapterFactory, list_adapters

def test_adapter_factory_api():
    assert hasattr(AdapterFactory, "get_adapter")
    assert hasattr(AdapterFactory, "register_adapter")

def test_unknown_device_raises():
    with pytest.raises(ValueError):
        AdapterFactory.get_adapter("nonexistent_device")

def test_list_adapters_returns_dict():
    adapters = list_adapters()
    assert isinstance(adapters, dict)
