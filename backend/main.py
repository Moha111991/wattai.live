"""Canonical FastAPI entrypoint for the backend.

Deduplicated, single-app backend with key endpoints used by frontend and adapters.
"""

from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional
from uuid import uuid4
import asyncio
import hashlib
import json
import logging
import os

from fastapi import Body, Depends, FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import APIKeyHeader
from fastapi.staticfiles import StaticFiles
from fastapi.websockets import WebSocket
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter

from backend.secure_logging import get_audit_logger

LOG = logging.getLogger("uvicorn.error")

redis_client: Optional[Any] = None
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")


@asynccontextmanager
async def lifespan(_: FastAPI):
    await _startup_runtime()
    try:
        yield
    finally:
        if redis_client is not None:
            try:
                if hasattr(redis_client, "aclose"):
                    await redis_client.aclose()
                else:
                    await redis_client.close()
            except Exception:
                pass


app = FastAPI(lifespan=lifespan)

API_KEY = os.getenv("API_KEY", "mein_geheimer_schulkey123")
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
ADAPTER_KEYS_FILE = os.path.join(os.path.dirname(__file__), "../data/adapter_keys.json")


def _load_adapter_keys() -> Dict[str, Dict[str, Any]]:
    try:
        if os.path.exists(ADAPTER_KEYS_FILE):
            with open(ADAPTER_KEYS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        LOG.exception("Failed to load adapter keys file")
    return {}


def _verify_key(plain: str) -> Optional[str]:
    """Return key_id if a non-revoked adapter key matches, else None."""
    keys = _load_adapter_keys()
    for kid, entry in keys.items():
        if entry.get("revoked"):
            continue
        hashval = entry.get("key_hash")
        if not hashval:
            continue
        try:
            salt_hex, h = hashval.split("$", 1)
        except Exception:
            continue
        candidate = hashlib.pbkdf2_hmac("sha256", plain.encode(), bytes.fromhex(salt_hex), 200_000).hex()
        if candidate == h:
            return kid
    return None


def get_api_key(api_key: Optional[str] = Depends(api_key_header)) -> str:
    if api_key != API_KEY:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Ungültiger API-Key")
    return api_key


async def verify_adapter_or_admin(api_key: Optional[str] = Depends(api_key_header)) -> str:
    if not api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing API key")
    if api_key == API_KEY:
        return "admin"
    kid = _verify_key(api_key)
    if kid:
        return kid
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Ungültiger Adapter/API-Key")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

frontend_public = os.path.join(os.path.dirname(__file__), "../frontend/public")
if os.path.isdir(os.path.abspath(frontend_public)):
    app.mount("/static", StaticFiles(directory=os.path.abspath(frontend_public)), name="static")

_ALLOWED_IPS = os.getenv("ALLOWED_IPS", "").strip()
ALLOWED_IPS = set([ip.strip() for ip in _ALLOWED_IPS.split(",") if ip.strip()]) if _ALLOWED_IPS else None
_ALLOW_INSECURE = os.getenv("ALLOW_INSECURE", "false").lower() in ("1", "true", "yes")


def _get_client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def _is_local_request(request: Request) -> bool:
    host = (request.client.host if request.client else "") or ""
    return host in {"127.0.0.1", "::1", "localhost"}


async def _audit_request(request: Request) -> None:
    try:
        logger = get_audit_logger()
        client_ip = _get_client_ip(request)
        api_key = request.headers.get("x-api-key") or ""
        user_id = "admin" if api_key == API_KEY else "anonymous"
        if user_id != "admin" and api_key:
            kid = _verify_key(api_key)
            if kid:
                user_id = f"adapter:{kid[:8]}"
        logger.log_api_access(user_id=user_id, endpoint=str(request.url.path), method=request.method, ip_address=client_ip)
    except Exception:
        LOG.exception("audit failed")


@app.middleware("http")
async def security_middleware(request: Request, call_next: Callable[..., Any]):
    proto = request.headers.get("x-forwarded-proto", request.url.scheme)
    if not _ALLOW_INSECURE and proto != "https" and not _is_local_request(request):
        return JSONResponse(status_code=426, content={"error": "Use HTTPS for all requests"})

    if ALLOWED_IPS is not None:
        client_ip = _get_client_ip(request)
        if client_ip not in ALLOWED_IPS:
            return JSONResponse(status_code=403, content={"error": "IP not allowed"})

    response = await call_next(request)
    response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "no-referrer")

    try:
        await _audit_request(request)
    except Exception:
        pass

    return response


clients: List[WebSocket] = []
app_state: Dict[str, Any] = {"config": {}}
dynamic_adapters: Dict[str, Dict[str, Any]] = {}
pending_connections: Dict[str, Dict[str, Any]] = {}
influx_writer: Optional[Any] = None
rate_limiter_enabled: bool = False


DEFAULT_SMARTHOME_DEVICES: Dict[str, Dict[str, Any]] = {
    "washing_machine": {
        "id": "washing_machine",
        "name": "Waschmaschine",
        "type": "appliance",
        "status": "standby",
        "power_w": 0.0,
        "flexibility": "hoch",
        "source": "default",
        "last_seen": None,
    },
    "light_groups": {
        "id": "light_groups",
        "name": "Lichtgruppen",
        "type": "lighting",
        "status": "standby",
        "power_w": 0.0,
        "flexibility": "niedrig",
        "source": "default",
        "last_seen": None,
    },
}


def _ensure_smarthome_devices() -> Dict[str, Dict[str, Any]]:
    devices = app_state.setdefault("smarthome_devices", {})
    for dev_id, base in DEFAULT_SMARTHOME_DEVICES.items():
        devices.setdefault(dev_id, dict(base))
    return devices


def _to_float(value: Any) -> Optional[float]:
    if value is None:
        return None
    try:
        return float(value)
    except Exception:
        return None


def _normalize_smarthome_status(value: Any) -> str:
    v = str(value or "").strip().lower()
    if v in {"on", "running", "active", "aktiv", "1", "true"}:
        return "aktiv"
    if v in {"off", "idle", "standby", "0", "false"}:
        return "standby"
    if v in {"offline", "disconnected", "error", "fault"}:
        return "offline"
    return "standby"


def _normalize_flexibility(value: Any) -> str:
    v = str(value or "").strip().lower()
    if v in {"hoch", "high"}:
        return "hoch"
    if v in {"niedrig", "low"}:
        return "niedrig"
    return "mittel"


def _canonical_smarthome_id(device_id: str, name: str) -> str:
    merged = f"{device_id} {name}".lower()
    if "wasch" in merged:
        return "washing_machine"
    if "licht" in merged or "light" in merged:
        return "light_groups"
    normalized = _normalize_id(device_id or name or "smarthome_device")
    return normalized or "smarthome_device"


def _ingest_smarthome_device(data: Dict[str, Any]) -> None:
    device_type = str(data.get("device_type") or data.get("type") or "").lower()
    category = str(data.get("category") or "").lower()
    name = str(data.get("name") or "").strip()
    device_id = str(data.get("device_id") or data.get("device") or data.get("id") or "").strip()

    topic = str(data.get("topic") or "").strip().lower()

    should_handle = (
        category == "smarthome"
        or device_type in {"smarthome", "light", "lighting", "lightgroup", "washing_machine", "appliance", "switch"}
        or topic.startswith("energy/home/")
    )
    if not should_handle:
        return

    if topic.startswith("energy/home/"):
        # Format: energy/home/<device_id>/<metric>
        parts = topic.split("/")
        if len(parts) >= 4:
            device_id = device_id or parts[2]
            metric = parts[3]
            if metric == "power_w":
                data["power_w"] = data.get("payload") if data.get("power_w") is None else data.get("power_w")
            elif metric == "status":
                data["status"] = data.get("payload") if data.get("status") is None else data.get("status")
            elif metric == "flexibility":
                data["flexibility"] = data.get("payload") if data.get("flexibility") is None else data.get("flexibility")

    canonical_id = _canonical_smarthome_id(device_id, name)
    devices = _ensure_smarthome_devices()
    existing = devices.get(canonical_id, {})

    power_w = _to_float(data.get("power_w"))
    status = _normalize_smarthome_status(data.get("status"))
    flexibility = _normalize_flexibility(data.get("flexibility") or existing.get("flexibility"))

    if power_w is not None and data.get("status") is None:
        status = "aktiv" if power_w > 0 else "standby"

    devices[canonical_id] = {
        "id": canonical_id,
        "name": name or existing.get("name") or canonical_id,
        "type": device_type or existing.get("type") or "smarthome",
        "status": status,
        "power_w": power_w if power_w is not None else existing.get("power_w", 0.0),
        "flexibility": flexibility,
        "source": data.get("source") or "ingest",
        "last_seen": data.get("timestamp") or datetime.utcnow().isoformat(),
        "raw": data.get("raw") or existing.get("raw"),
    }

try:
    from .config_service import load_config

    app_state["config"] = load_config()
except Exception:
    pass


async def _save_pending_connections() -> None:
    if not redis_client:
        return
    try:
        await redis_client.set("pending_connections", json.dumps(pending_connections))
    except Exception:
        LOG.exception("Failed to save pending_connections to Redis")


async def _load_pending_connections() -> None:
    if not redis_client:
        return
    try:
        val = await redis_client.get("pending_connections")
        if val:
            pending_connections.clear()
            pending_connections.update(json.loads(val))
    except Exception:
        LOG.exception("Failed to load pending_connections from Redis")


async def _startup_runtime() -> None:
    global redis_client, rate_limiter_enabled
    _ensure_smarthome_devices()
    try:
        import redis.asyncio as aioredis

        redis_client = await aioredis.from_url(REDIS_URL)
        await FastAPILimiter.init(redis_client)
        rate_limiter_enabled = True
        await _load_pending_connections()
    except Exception:
        LOG.info("Redis not available; pending_connections persistence disabled")


async def _optional_rate_limit_ingest(request: Request, response: Response) -> None:
    if not rate_limiter_enabled:
        return
    await RateLimiter(times=60, seconds=60)(request, response)


async def _optional_rate_limit_connect(request: Request, response: Response) -> None:
    if not rate_limiter_enabled:
        return
    await RateLimiter(times=20, seconds=60)(request, response)


def _register_dynamic_adapter(data: Dict[str, Any]) -> None:
    device_id = data.get("device_id") or data.get("device") or data.get("id")
    if not device_id:
        return

    if device_id in dynamic_adapters:
        dynamic_adapters[device_id]["last_seen"] = data.get("timestamp") or datetime.utcnow().isoformat()
        return

    dynamic_adapters[device_id] = {
        "id": device_id,
        "type": (data.get("device_type") or data.get("type") or "generic").lower(),
        "name": data.get("name") or device_id,
        "source": "dynamic",
        "status": "online",
        "last_seen": data.get("timestamp"),
    }

    req_id = data.get("request_id")
    if req_id and req_id in pending_connections:
        pending_connections[req_id]["status"] = "connected"
        pending_connections[req_id]["device_id"] = device_id
        pending_connections[req_id]["last_seen"] = data.get("timestamp")
        asyncio.create_task(_save_pending_connections())
        asyncio.create_task(
            _broadcast_connection_event(
                {
                    "type": "connection_update",
                    "request_id": req_id,
                    "status": "connected",
                    "device_id": device_id,
                }
            )
        )


@app.post("/api/ingest", dependencies=[Depends(_optional_rate_limit_ingest)])
async def ingest_measurement(request: Request, api_key: str = Depends(verify_adapter_or_admin)):
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="invalid json")

    if isinstance(data, dict):
        _register_dynamic_adapter(data)
        _ingest_smarthome_device(data)

    if isinstance(data, list):
        for item in data:
            if isinstance(item, dict):
                _register_dynamic_adapter(item)
                _ingest_smarthome_device(item)

    if not influx_writer:
        return {"status": "ok", "warning": "InfluxDB nicht verfügbar"}

    try:
        await influx_writer.write(data)
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def _broadcast_connection_event(event: Dict[str, Any]) -> None:
    for ws in list(clients):
        try:
            await ws.send_json(event)
        except Exception:
            try:
                await ws.close()
            except Exception:
                pass
            if ws in clients:
                clients.remove(ws)


def _normalize_id(value: Any) -> str:
    return str(value).replace(" ", "").replace("_", "").replace("-", "").lower()


@app.get("/")
async def root():
    return {"message": "LoopIQ backend is running."}


@app.get("/devices")
async def get_devices():
    config = app_state.get("config", {}) or {}
    adapters = config.get("adapters", {}) or {}
    devices = [dict(id=k, **v) for k, v in adapters.items()]
    for dev_id, meta in dynamic_adapters.items():
        if not any(d.get("id") == dev_id for d in devices):
            devices.append(meta)
    return {"devices": devices}


@app.get("/smarthome/devices")
async def get_smarthome_devices():
    devices_map = _ensure_smarthome_devices()
    devices = list(devices_map.values())

    active_count = sum(1 for d in devices if d.get("status") == "aktiv")
    flexible_count = sum(1 for d in devices if d.get("flexibility") == "hoch")
    total_power = sum(_to_float(d.get("power_w")) or 0.0 for d in devices)

    return {
        "devices": devices,
        "summary": {
            "active_count": active_count,
            "flexible_count": flexible_count,
            "total_power_w": round(total_power, 2),
        },
    }


@app.get("/devices/{device_id}/details")
async def get_device_details(device_id: str):
    config = app_state.get("config", {}) or {}
    adapters = config.get("adapters", {}) or {}
    dev = adapters.get(device_id)
    if dev:
        return {"device_id": device_id, **dev}
    dyn = dynamic_adapters.get(device_id)
    if dyn:
        return {"device_id": device_id, "type": dyn.get("type"), "online": True}
    raise HTTPException(status_code=404, detail="Device not found")


@app.post("/devices/{device_id}/connect", dependencies=[Depends(_optional_rate_limit_connect)])
async def connect_device(device_id: str, payload: Optional[Dict[str, Any]] = Body(None)):
    body = payload or {}
    request_id = body.get("request_id") or str(uuid4())
    pending_connections[request_id] = {
        "device_id": device_id,
        "status": "pending",
        "created_at": datetime.utcnow().isoformat(),
        "params": body,
    }
    asyncio.create_task(_save_pending_connections())
    asyncio.create_task(
        _broadcast_connection_event(
            {
                "type": "connection_update",
                "request_id": request_id,
                "status": "pending",
                "device_id": device_id,
                "created_at": pending_connections[request_id]["created_at"],
            }
        )
    )
    return {"request_id": request_id, "status": "pending"}


@app.get("/connections/{request_id}")
async def get_connection_status(request_id: str):
    info = pending_connections.get(request_id)
    if not info:
        raise HTTPException(status_code=404, detail="Connection not found")
    return info


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)
    try:
        await websocket.send_json({"message": "WebSocket connection established"})
        while True:
            await asyncio.sleep(60)
    except Exception:
        pass
    finally:
        if websocket in clients:
            clients.remove(websocket)


@app.api_route("/ev/profiles", methods=["GET", "POST", "PUT", "DELETE"])
async def ev_profiles_endpoint(request: Request, body: Optional[dict] = Body(None)):
    config = app_state.get("config", {}) or {}
    ev_profiles = config.get("ev_profiles", {})
    method = request.method

    if method == "GET":
        return {"ev_profiles": ev_profiles, "active_ev_id": config.get("active_ev_id")}

    data = body or await request.json()

    if method == "POST":
        ev_id = data.get("id")
        profile = data.get("profile")
        if not ev_id or not profile:
            return JSONResponse(status_code=400, content={"error": "Missing 'id' or 'profile' in request."})
        ev_profiles[ev_id] = profile
        app_state["config"]["ev_profiles"] = ev_profiles
        return {"status": "saved", "ev_profiles": ev_profiles}

    if method == "PUT":
        ev_id = data.get("id")
        if not ev_id:
            for k in ev_profiles:
                ev_profiles[k]["active"] = False
            app_state["config"]["ev_profiles"] = ev_profiles
            return {"status": "deactivated_all", "active_id": None, "ev_profiles": ev_profiles}

        target = next((k for k in ev_profiles if _normalize_id(k) == _normalize_id(ev_id)), None)
        if not target:
            return JSONResponse(status_code=404, content={"error": "Profile not found."})
        for k in ev_profiles:
            ev_profiles[k]["active"] = k == target
        app_state["config"]["ev_profiles"] = ev_profiles
        return {"status": "activated", "active_id": target, "ev_profiles": ev_profiles}

    if method == "DELETE":
        ev_id = data.get("id")
        if not ev_id:
            return JSONResponse(status_code=404, content={"error": "Profile not found."})
        match = next((k for k in ev_profiles if _normalize_id(k) == _normalize_id(ev_id)), None)
        if not match:
            return JSONResponse(status_code=404, content={"error": "Profile not found."})
        del ev_profiles[match]
        app_state["config"]["ev_profiles"] = ev_profiles
        return {"status": "deleted", "ev_profiles": ev_profiles}

    return JSONResponse(status_code=405, content={"error": "Method not allowed."})


@app.get("/api/alarms")
async def api_alarms_stub():
    return JSONResponse(content={"alarms": []})


@app.get("/history/pv")
async def history_pv_stub(hours: int = 24, raster: int = 0):
    return JSONResponse(content={"history": []})


@app.get("/history/consumption")
async def history_consumption_stub(hours: int = 24, raster: int = 0):
    return JSONResponse(content={"history": []})


@app.get("/history/battery")
async def history_battery_stub(hours: int = 24, raster: int = 0):
    return JSONResponse(content={"history": []})


@app.get("/battery/status")
async def battery_status_stub():
    return {"status": "ok"}


try:
    from backend.admin_keys_router import router as admin_keys_router

    app.include_router(admin_keys_router)
    LOG.info("Included admin_keys_router")
except Exception as e:
    LOG.exception("Could not include admin_keys_router: %s", e)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
