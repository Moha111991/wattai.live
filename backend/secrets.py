import os
import base64
import json
from typing import Any, Dict

from pathlib import Path

from hashlib import sha256
import json
import base64 as _b64

try:
    import boto3
    from botocore.exceptions import BotoCoreError, ClientError
except Exception:
    boto3 = None
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


SALT_FILE = os.path.join(os.path.dirname(__file__), "..", "data", ".secrets_salt")


def _get_or_create_salt() -> bytes:
    p = Path(SALT_FILE)
    p.parent.mkdir(parents=True, exist_ok=True)
    if p.exists():
        return p.read_bytes()
    salt = os.urandom(16)
    # write with restricted permissions where possible
    try:
        p.write_bytes(salt)
        try:
            os.chmod(str(p), 0o600)
        except Exception:
            pass
    except Exception:
        # fallback: ignore write errors (env-based key still works)
        pass
    return salt


def _derive_key() -> bytes:
    """Derive a 32-byte AES key from environment.

    Priority:
    - If SECRETS_KEY is set (base64 urlsafe), use it directly.
    - Else if SECRETS_PASSPHRASE is set, derive using PBKDF2 + local salt.
    - Else raise RuntimeError.
    """
    env_key = os.getenv("SECRETS_KEY")
    if env_key:
        try:
            return base64.urlsafe_b64decode(env_key)
        except Exception:
            raise RuntimeError("Invalid SECRETS_KEY; must be urlsafe-base64 of 32 bytes")

    passphrase = os.getenv("SECRETS_PASSPHRASE")
    if not passphrase:
        raise RuntimeError("SECRETS_KEY or SECRETS_PASSPHRASE must be set")
    salt = _get_or_create_salt()
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=200_000,
    )
    return kdf.derive(passphrase.encode("utf-8"))


def encrypt_value(plaintext: str) -> str:
    """
    Encrypt a string. Behavior depends on SECRETS_PROVIDER env var:
    - If provider is 'aws_kms' and boto3 is available, use AWS KMS GenerateDataKey
      (envelope encryption). Return a JSON string containing: v (base64 nonce+ct),
      dk (base64 kms-encrypted data key), kid (kms key id) and alg.
    - Otherwise fall back to local AES-GCM using derived key and return a urlsafe base64 token
    (backwards-compatible).
    """
    provider = os.getenv("SECRETS_PROVIDER", "local")
    if provider == "aws_kms":
        kms_key_id = os.getenv("AWS_KMS_KEY_ID")
        if not kms_key_id:
            raise RuntimeError("AWS_KMS_KEY_ID must be set when SECRETS_PROVIDER=aws_kms")
        if boto3 is None:
            raise RuntimeError("boto3 is required for aws_kms provider but it's not installed")
        # Generate a data key from KMS (plaintext + ciphertext blob)
        try:
            kms = boto3.client("kms")
            resp = kms.generate_data_key(KeyId=kms_key_id, KeySpec="AES_256")
            data_key = resp["Plaintext"]
            encrypted_data_key = resp["CiphertextBlob"]
        except (BotoCoreError, ClientError) as e:
            raise RuntimeError("KMS GenerateDataKey failed") from e

        aesgcm = AESGCM(data_key)
        nonce = os.urandom(12)
        ct = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
        payload = _b64.urlsafe_b64encode(nonce + ct).decode("ascii")
        wrapper = {
            "v": payload,
            "dk": _b64.b64encode(encrypted_data_key).decode("ascii"),
            "kid": str(kms_key_id),
            "alg": "AES-256-GCM+KMS",
        }
        return json.dumps(wrapper)

    # local fallback
    key = _derive_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ct = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    payload = nonce + ct
    return base64.urlsafe_b64encode(payload).decode("ascii")


def decrypt_value(token: str) -> str:
    # Token may be either:
    # - legacy urlsafe-base64 of nonce+ct (local provider)
    # - a JSON string with {v: base64(nonce+ct), dk: base64(kms_ciphertext), kid, alg}
    try:
        obj = json.loads(token)
    except Exception:
        obj = None

    if isinstance(obj, dict) and obj.get("dk"):
        # Envelope decryption via AWS KMS
        if boto3 is None:
            raise RuntimeError("boto3 is required to decrypt KMS-wrapped data keys")
        try:
            encrypted_dk = _b64.b64decode(obj.get("dk"))
            kms = boto3.client("kms")
            resp = kms.decrypt(CiphertextBlob=encrypted_dk)
            data_key = resp["Plaintext"]
        except (BotoCoreError, ClientError) as e:
            raise RuntimeError("KMS Decrypt failed") from e

        payload_b64 = obj.get("v")
        try:
            data = _b64.urlsafe_b64decode(payload_b64)
            nonce = data[:12]
            ct = data[12:]
            aesgcm = AESGCM(data_key)
            pt = aesgcm.decrypt(nonce, ct, None)
            return pt.decode("utf-8")
        except Exception as e:
            raise RuntimeError("Decryption failed (envelope)") from e

    # legacy local decryption
    key = _derive_key()
    aesgcm = AESGCM(key)
    try:
        data = base64.urlsafe_b64decode(token)
        nonce = data[:12]
        ct = data[12:]
        pt = aesgcm.decrypt(nonce, ct, None)
        return pt.decode("utf-8")
    except Exception as e:
        raise RuntimeError("Decryption failed") from e


SENSITIVE_NAMES = {"api_key", "password", "token", "client_secret", "secret"}


def _encrypt_if_needed(value: Any) -> Any:
    if isinstance(value, str) and value:
        return {"__encrypted__": True, "v": encrypt_value(value)}
    return value


def protect_config_for_dump(cfg: Dict[str, Any]) -> Dict[str, Any]:
    """Return a copy of cfg where sensitive keys are encrypted.

    Recursively traverse mappings and encrypt any value whose key name
    matches SENSITIVE_NAMES. This supports nested structures like
    adapters.<id>.cloud.api_key.
    """
    out = json.loads(json.dumps(cfg))  # deep copy via JSON

    def _recurse(obj):
        if isinstance(obj, dict):
            for k in list(obj.keys()):
                v = obj.get(k)
                if k.lower() in SENSITIVE_NAMES and v is not None:
                    obj[k] = _encrypt_if_needed(v)
                else:
                    _recurse(v)
        elif isinstance(obj, list):
            for item in obj:
                _recurse(item)

    _recurse(out)
    return out


def unprotect_config_after_load(cfg: Dict[str, Any]) -> Dict[str, Any]:
    out = cfg

    def _recurse(obj):
        if isinstance(obj, dict):
            for k, v in list(obj.items()):
                if isinstance(v, dict) and v.get("__encrypted__"):
                    try:
                        obj[k] = decrypt_value(v.get("v"))
                    except Exception:
                        # leave as-is on decryption error
                        pass
                else:
                    _recurse(v)
        elif isinstance(obj, list):
            for idx, item in enumerate(obj):
                if isinstance(item, dict) and item.get("__encrypted__"):
                    try:
                        obj[idx] = decrypt_value(item.get("v"))
                    except Exception:
                        pass
                else:
                    _recurse(item)

    _recurse(out)
    return out
