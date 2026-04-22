from fastapi import APIRouter, Body, HTTPException, Header
import os
import json
import threading
import hashlib
import base64
from uuid import uuid4
from datetime import datetime
from typing import Dict, Any, Optional

router = APIRouter()

_lock = threading.Lock()
ADAPTER_KEYS_FILE = os.path.join(os.path.dirname(__file__), "../data/adapter_keys.json")
ADMIN_API_KEY = os.getenv("API_KEY", "mein_geheimer_schulkey123")

def _load_keys() -> Dict[str, Dict[str, Any]]:
    try:
        if os.path.exists(ADAPTER_KEYS_FILE):
            with open(ADAPTER_KEYS_FILE, "r") as f:
                return json.load(f)
    except Exception:
        pass
    return {}

def _save_keys(d: Dict[str, Dict[str, Any]]):
    try:
        os.makedirs(os.path.dirname(ADAPTER_KEYS_FILE), exist_ok=True)
        with open(ADAPTER_KEYS_FILE, "w") as f:
            json.dump(d, f, indent=2)
    except Exception:
        pass

def _hash_key(plain: str, salt_hex: Optional[str] = None) -> str:
    salt = bytes.fromhex(salt_hex) if salt_hex else os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", plain.encode(), salt, 200_000)
    return salt.hex() + "$" + dk.hex()

def _verify_key(plain: str) -> Optional[str]:
    keys = _load_keys()
    for kid, e in keys.items():
        if e.get("revoked"):
            continue
        kv = e.get("key_hash")
        if not kv:
            continue
        try:
            salt_hex, h = kv.split("$", 1)
        except Exception:
            continue
        cand = hashlib.pbkdf2_hmac("sha256", plain.encode(), bytes.fromhex(salt_hex), 200_000).hex()
        if cand == h:
            return kid
    return None

def _require_admin(api_key: Optional[str]):
    if api_key != ADMIN_API_KEY:
        raise HTTPException(status_code=401, detail="unauthorized")


@router.post("/admin/adapter-keys")
async def create_adapter_key(payload: Dict[str, Any] = Body(None), x_api_key: Optional[str] = Header(None)):
    _require_admin(x_api_key)
    body = payload or {}
    device_id = body.get("device_id")
    if not device_id:
        raise HTTPException(status_code=400, detail="device_id required")
    plain = base64.urlsafe_b64encode(os.urandom(24)).decode().rstrip("=")
    kid = str(uuid4())
    h = _hash_key(plain)
    entry = {"key_id": kid, "device_id": device_id, "key_hash": h, "created_at": datetime.utcnow().isoformat(), "last_4": plain[-4:], "revoked": False}
    with _lock:
        keys = _load_keys()
        keys[kid] = entry
        _save_keys(keys)
    return {"key_id": kid, "device_id": device_id, "key": plain}


@router.get("/admin/adapter-keys")
async def list_adapter_keys(x_api_key: Optional[str] = Header(None)):
    _require_admin(x_api_key)
    keys = _load_keys()
    out = []
    for kid, e in keys.items():
        out.append({"key_id": kid, "device_id": e.get("device_id"), "created_at": e.get("created_at"), "revoked": bool(e.get("revoked")), "masked": "****" + (e.get("last_4") or "")})
    return {"keys": out}


@router.post("/admin/adapter-keys/{key_id}/revoke")
async def revoke_adapter_key(key_id: str, x_api_key: Optional[str] = Header(None)):
    _require_admin(x_api_key)
    with _lock:
        keys = _load_keys()
        if key_id not in keys:
            raise HTTPException(status_code=404, detail="key not found")
        keys[key_id]["revoked"] = True
        keys[key_id]["revoked_at"] = datetime.utcnow().isoformat()
        _save_keys(keys)
    return {"key_id": key_id, "revoked": True}


@router.post("/admin/adapter-keys/validate")
async def validate_adapter_key(payload: Dict[str, Any] = Body(None)):
    body = payload or {}
    key = body.get("key")
    if not key:
        raise HTTPException(status_code=400, detail="key required")
    kid = _verify_key(key)
    return {"valid": bool(kid), "key_id": kid}
