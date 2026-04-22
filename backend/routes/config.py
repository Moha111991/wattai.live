from fastapi import APIRouter, Body
import yaml

router = APIRouter()

@router.post("/config/adapter")
def add_adapter(name: str = Body(...), ip: str = Body(...), poll_interval: int = Body(10)):
    config_path = "config/config.yaml"
    with open(config_path, "r") as f:
        config = yaml.safe_load(f)
    config["adapters"][name] = {
        "enabled": True,
        "ip": ip,
        "poll_interval": poll_interval
    }
    with open(config_path, "w") as f:
        yaml.safe_dump(config, f)
    return {"status": "updated", "adapter": config["adapters"][name]}