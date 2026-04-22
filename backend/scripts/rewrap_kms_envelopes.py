#!/usr/bin/env python3
"""
Rewrap KMS envelope-encrypted values in config YAML to a new KMS key.

Behavior:
- Scans `config/config.yaml` for values encrypted with the KMS envelope format
  produced by `backend.secrets.encrypt_value` (JSON wrapper with `dk` and `v`).
- For each matching envelope (optionally limited by `--match-kid`), it will
  decrypt the data key via KMS, decrypt the payload locally, generate a new
  data key with the provided `--new-kms-key-id`, re-encrypt the payload and
  write the new envelope with the new `kid`.

This script supports `--dry-run` and makes a timestamped backup before applying.
"""
import argparse
import os
import json
import base64
from pathlib import Path
from datetime import datetime

try:
    import boto3
    from botocore.exceptions import BotoCoreError, ClientError
except Exception:
    boto3 = None

try:
    import yaml
except Exception:
    yaml = None

from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def find_envelopes(obj, path=()):
    """Yield tuples (parent, key, wrapper_json_str, full_path) for each
    dict entry that looks like the __encrypted__ structure used by the app.
    """
    if isinstance(obj, dict):
        for k, v in obj.items():
            if isinstance(v, dict) and v.get("__encrypted__") and isinstance(v.get("v"), str):
                yield (obj, k, v.get("v"), ".".join(list(path) + [str(k)]))
            else:
                yield from find_envelopes(v, path + (str(k),))
    elif isinstance(obj, list):
        for idx, item in enumerate(obj):
            yield from find_envelopes(item, path + (str(idx),))


def load_config(path: Path):
    if yaml is None:
        raise RuntimeError("PyYAML is required: please install pyyaml")
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def dump_config(cfg, path: Path):
    if yaml is None:
        raise RuntimeError("PyYAML is required: please install pyyaml")
    with open(path, "w", encoding="utf-8") as f:
        yaml.safe_dump(cfg, f, default_flow_style=False, sort_keys=False)


def rewrap(config_path: Path, new_kms_key_id: str, match_kid: str = None, backup_dir: Path = None, dry_run: bool = True, region: str = None):
    if boto3 is None:
        raise RuntimeError("boto3 is required to perform KMS operations")

    cfg = load_config(config_path)
    found = list(find_envelopes(cfg))
    if not found:
        print("No encrypted envelopes found in config.")
        return 0

    kms_client = boto3.client("kms", region_name=region) if region else boto3.client("kms")

    changes = []
    for parent, key, token_str, full_path in found:
        try:
            wrapper = json.loads(token_str)
        except Exception:
            print(f"Skipping non-JSON token at {full_path}")
            continue
        if not wrapper.get("dk"):
            print(f"Skipping token without dk at {full_path}")
            continue
        kid = wrapper.get("kid")
        if match_kid and kid != match_kid:
            # skip non-matching kid
            continue

        print(f"Found envelope at {full_path} (kid={kid})")

        # Decrypt the existing encrypted data key
        try:
            encrypted_dk = base64.b64decode(wrapper.get("dk"))
            resp = kms_client.decrypt(CiphertextBlob=encrypted_dk)
            old_data_key = resp["Plaintext"]
        except (BotoCoreError, ClientError) as e:
            print(f"KMS decrypt failed for {full_path}: {e}")
            continue

        # Decrypt payload
        try:
            payload_b64 = wrapper.get("v")
            data = base64.urlsafe_b64decode(payload_b64)
            nonce = data[:12]
            ct = data[12:]
            aesgcm = AESGCM(old_data_key)
            plaintext = aesgcm.decrypt(nonce, ct, None).decode("utf-8")
        except Exception as e:
            print(f"Failed to decrypt payload at {full_path}: {e}")
            continue

        # Generate new data key under new KMS key
        try:
            resp2 = kms_client.generate_data_key(KeyId=new_kms_key_id, KeySpec="AES_256")
            new_plain = resp2["Plaintext"]
            new_encrypted_blob = resp2["CiphertextBlob"]
        except (BotoCoreError, ClientError) as e:
            print(f"KMS generate_data_key failed for {full_path}: {e}")
            continue

        # Encrypt with new data key
        try:
            aesgcm2 = AESGCM(new_plain)
            new_nonce = os.urandom(12)
            new_ct = aesgcm2.encrypt(new_nonce, plaintext.encode("utf-8"), None)
            new_payload = base64.urlsafe_b64encode(new_nonce + new_ct).decode("ascii")
            new_wrapper = {
                "v": new_payload,
                "dk": base64.b64encode(new_encrypted_blob).decode("ascii"),
                "kid": str(new_kms_key_id),
                "alg": "AES-256-GCM+KMS",
            }
        except Exception as e:
            print(f"Failed to re-encrypt payload for {full_path}: {e}")
            continue

        changes.append((parent, key, json.dumps(new_wrapper), full_path, kid))

    if not changes:
        print("No envelopes matched the provided criteria; nothing to do.")
        return 0

    print(f"Prepared {len(changes)} changes.")
    if dry_run:
        for _, _, new_tok, full_path, old_kid in changes:
            print(f"DRY-RUN: would rewrap {full_path} (old_kid={old_kid}) -> new_kid={new_kms_key_id}")
        return 0

    # Backup current config
    if backup_dir:
        backup_dir.mkdir(parents=True, exist_ok=True)
        ts = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
        backup_path = backup_dir / f"config.yaml.backup.{ts}"
        dump_config(cfg, backup_path)
        try:
            os.chmod(str(backup_path), 0o600)
        except Exception:
            pass
        print(f"Wrote backup to {backup_path}")

    # Apply changes in-memory
    for parent, key, new_tok, full_path, old_kid in changes:
        parent[key]["v"] = new_tok

    # Atomically write new config
    tmp = config_path.with_suffix(".tmp")
    dump_config(cfg, tmp)
    try:
        os.chmod(str(tmp), 0o600)
    except Exception:
        pass
    tmp.replace(config_path)
    print(f"Applied {len(changes)} rewraps and updated {config_path}")
    return len(changes)


def main():
    p = Path(__file__).resolve()
    default_cfg = p.parents[1] / "config" / "config.yaml"
    default_backup = p.parents[1] / "data" / "backups"

    ap = argparse.ArgumentParser(description="Rewrap KMS envelope-encrypted values to a new KMS key")
    ap.add_argument("--config", default=str(default_cfg), help="Path to config.yaml")
    ap.add_argument("--new-kms-key-id", required=True, help="Target KMS KeyId ARN/ID to rewrap to")
    ap.add_argument("--match-kid", help="Only rewrap envelopes that currently have this kid (optional)")
    ap.add_argument("--backup-dir", default=str(default_backup), help="Directory to store a timestamped backup")
    ap.add_argument("--region", help="AWS region for KMS client (optional)")
    ap.add_argument("--apply", action="store_true", help="Perform changes (default is dry-run)")
    ap.add_argument("--yes", action="store_true", help="Skip confirmation when applying")
    args = ap.parse_args()

    if not args.apply:
        print("Running in dry-run mode. Use --apply to make changes.")

    if args.apply and not args.yes:
        confirm = input(f"This will modify {args.config} and backup to {args.backup_dir}. Proceed? [y/N]: ")
        if confirm.lower() != "y":
            print("Aborted by user.")
            return

    changed = rewrap(Path(args.config), args.new_kms_key_id, match_kid=args.match_kid, backup_dir=Path(args.backup_dir), dry_run=not args.apply, region=args.region)
    print(f"Done. Changes applied: {changed}")


if __name__ == "__main__":
    main()
