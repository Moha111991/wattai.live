#!/usr/bin/env python3
"""
Migrate existing config/config.yaml by encrypting sensitive provider keys.

Usage:
  EFH_CONFIG_PATH=path/to/config.yaml SECRETS_PASSPHRASE=... \
    ./.venv/bin/python backend/scripts/migrate_config_encrypt.py

This script is idempotent and will back up the original file to
config/config.yaml.bak.<ts> before writing.
"""
import os
import sys
import time
import yaml
import argparse
import getpass
from pathlib import Path

project_root = Path(__file__).resolve().parents[1]
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

CONFIG_PATH = os.getenv("EFH_CONFIG_PATH", "config/config.yaml")


def _is_placeholder(value: str) -> bool:
    if not isinstance(value, str):
        return False
    v = value.strip()
    if not v:
        return True
    up = v.upper()
    # common placeholder heuristics
    if "YOUR_" in up or "REPLACE" in up:
        return True
    if up.startswith("YOUR"):
        return True
    if v.lower() in ("changeme", "dummy", "none", "placeholder"):
        return True
    # very short keys are suspicious
    if len(v) < 8:
        return True
    return False


def main(argv=None):
    parser = argparse.ArgumentParser(description="Encrypt sensitive fields in config.yaml (idempotent)")
    parser.add_argument("--dry-run", action="store_true", help="List config paths that would be encrypted and exit")
    parser.add_argument("--apply", action="store_true", help="Apply changes (write encrypted config). Requires SECRETS env set")
    parser.add_argument("--force", action="store_true", help="Force encrypting even obvious placeholders")
    parser.add_argument("--yes", action="store_true", help="Assume yes for prompts (use with --apply and/or --force)")
    parser.add_argument("--provider", choices=["local", "aws_kms"], help="Secrets provider to use (overrides SECRETS_PROVIDER env)")
    parser.add_argument("--kms-key-id", help="AWS KMS KeyId or alias to use when --provider=aws_kms (sets AWS_KMS_KEY_ID)")
    parser.add_argument("--backup-dir", help="Directory to write backups into (default: data/backups under project root)")
    parser.add_argument("--owner-uid", type=int, help="Owner UID to chown created backup/config files to (optional)")
    parser.add_argument("--owner-gid", type=int, help="Owner GID to chown created backup/config files to (optional)")
    args = parser.parse_args(argv)

    p = Path(CONFIG_PATH)
    if not p.exists():
        print(f"Config file not found: {p}")
        return 2

    try:
        with p.open("r", encoding="utf-8") as f:
            cfg = yaml.safe_load(f) or {}
    except Exception as e:
        print("Failed to read config:", e)
        return 1

    # Allow overriding provider/key via CLI (set env vars before importing secrets)
    if args.provider:
        os.environ["SECRETS_PROVIDER"] = args.provider
    if args.kms_key_id:
        os.environ["AWS_KMS_KEY_ID"] = args.kms_key_id

    # Try to import the secrets helper
    try:
        from backend.secrets import protect_config_for_dump
    except Exception as e:
        # For dry-run we can still proceed without secrets helper
        if args.dry_run:
            protect_config_for_dump = None
        else:
            print("Cannot import secrets helper or cryptography not configured:", e)
            print("Set SECRETS_KEY (base64) or SECRETS_PASSPHRASE in the environment and try again.")
            return 3
    # For dry-run we want to compute candidate paths without failing on missing env
    if args.dry_run:
        # Perform a recursive scan for sensitive keys anywhere in the config
        SENSITIVE_NAMES = {"api_key", "password", "token", "client_secret", "secret"}
        candidates = []

        def _scan(obj, prefix=""):
            if isinstance(obj, dict):
                for k, v in obj.items():
                    path = f"{prefix}.{k}" if prefix else k
                    if k.lower() in SENSITIVE_NAMES and v is not None:
                        candidates.append((path, v))
                    else:
                        _scan(v, path)
            elif isinstance(obj, list):
                for idx, item in enumerate(obj):
                    _scan(item, f"{prefix}[{idx}]")

        _scan(cfg)
        if not candidates:
            print("No sensitive fields found. Nothing to do.")
            return 0
        print("Candidate fields that would be encrypted:")
        for path, v in candidates:
            ph = _is_placeholder(v)
            print(f"- {path} (placeholder={ph})")
        return 0

    try:
        protected = protect_config_for_dump(cfg)
    except Exception as e:
        print("Encryption failed (missing env or invalid key):", e)
        print("Ensure SECRETS_KEY or SECRETS_PASSPHRASE is set in the environment.")
        return 4

    # Quick equality check: if no change, exit
    if protected == cfg:
        print("No sensitive fields found or already encrypted. Nothing to do.")
        return 0

    # Determine changed paths and whether they are placeholders
    changed = []
    adapters = cfg.get("adapters") or {}
    prot_adapters = protected.get("adapters") or {}
    for aid, meta in (adapters or {}).items():
        if not isinstance(meta, dict):
            continue
        meta2 = prot_adapters.get(aid, {}) or {}
        for k, v in meta.items():
            if k.lower() in {"api_key", "password", "token", "client_secret", "secret"}:
                newv = meta2.get(k)
                if newv != v:
                    is_ph = _is_placeholder(v)
                    changed.append({"path": f"adapters.{aid}.{k}", "placeholder": is_ph})

    if not changed:
        print("No sensitive fields detected to change.")
        return 0

    # Dry-run: just print changes
    if args.dry_run:
        print("The following fields would be encrypted:")
        for c in changed:
            print(f"- {c['path']} (placeholder={c['placeholder']})")
        print("Run with --apply to perform the migration. Use --force to include placeholders.")
        return 0

    # If any candidates are placeholders and not forcing, refuse
    placeholders = [c for c in changed if c.get("placeholder")]
    if placeholders and not args.force:
        print("Refusing to encrypt obvious placeholders. The following fields look like placeholders:")
        for c in placeholders:
            print(f"- {c['path']}")
        print("If you really want to encrypt them, re-run with --force --apply --yes")
        return 2

    if not args.apply:
        print("No --apply flag provided. Use --apply to write the encrypted config (safe dry-run by default).")
        return 0

    # Backup (write encrypted backup if possible)
    ts = int(time.time())
    # Prefer writing backups into a dedicated data/backups directory with
    # restrictive permissions (0700). This reduces accidental exposure.
    try:
        # Use explicit backup-dir if provided, otherwise prefer project_root/data/backups
        if args.backup_dir:
            backups_dir = Path(args.backup_dir)
            if not backups_dir.is_absolute():
                backups_dir = (project_root / backups_dir).resolve()
        else:
            backups_dir = project_root / "data" / "backups"

        backups_dir.mkdir(parents=True, exist_ok=True)
        try:
            os.chmod(str(backups_dir), 0o700)
        except Exception:
            pass
        # If owner uid/gid provided, enforce them; otherwise if running as root and
        # no explicit owner provided, default to root:root.
        try:
            stat = backups_dir.stat()
            target_uid = args.owner_uid if args.owner_uid is not None else (0 if hasattr(os, "getuid") and os.geteuid() == 0 else None)
            target_gid = args.owner_gid if args.owner_gid is not None else (0 if hasattr(os, "getuid") and os.geteuid() == 0 else None)
            if target_uid is not None and target_gid is not None:
                try:
                    os.chown(str(backups_dir), int(target_uid), int(target_gid))
                except Exception:
                    pass
            elif target_uid is not None:
                try:
                    os.chown(str(backups_dir), int(target_uid), stat.st_gid)
                except Exception:
                    pass
            elif target_gid is not None:
                try:
                    os.chown(str(backups_dir), stat.st_uid, int(target_gid))
                except Exception:
                    pass
        except Exception:
            # non-Unix environments may not support stat/chown; ignore
            pass
    except Exception:
        # Fall back to writing next to the config file if the backups dir can't be created
        backups_dir = p.parent

    bak_enc = backups_dir / (p.name + f".bak.{ts}.enc.yaml")
    try:
        # write encrypted backup (protected content) to bak_enc
        with bak_enc.open("w", encoding="utf-8") as f:
            yaml.safe_dump(protected, f, allow_unicode=True)
        try:
            # Restrict permissions on backup (owner-read/write)
            os.chmod(str(bak_enc), 0o600)
        except Exception:
            pass
        # If owner uid/gid provided or running as root, enforce ownership for the backup file
        try:
            stat = bak_enc.stat()
            target_uid = args.owner_uid if args.owner_uid is not None else (0 if hasattr(os, "getuid") and os.geteuid() == 0 else None)
            target_gid = args.owner_gid if args.owner_gid is not None else (0 if hasattr(os, "getuid") and os.geteuid() == 0 else None)
            if target_uid is not None and target_gid is not None:
                try:
                    os.chown(str(bak_enc), int(target_uid), int(target_gid))
                except Exception:
                    pass
            elif target_uid is not None:
                try:
                    os.chown(str(bak_enc), int(target_uid), stat.st_gid)
                except Exception:
                    pass
            elif target_gid is not None:
                try:
                    os.chown(str(bak_enc), stat.st_uid, int(target_gid))
                except Exception:
                    pass
        except Exception:
            pass
        print(f"Wrote encrypted backup to {bak_enc}")
    except Exception as e:
        print("Failed to write encrypted backup:", e)
        return 5
        try:
            os.chmod(str(p), 0o600)
        except Exception:
            pass
        # If owner uid/gid provided or running as root, ensure the config file ownership
        try:
            stat = p.stat()
            target_uid = args.owner_uid if args.owner_uid is not None else (0 if hasattr(os, "getuid") and os.geteuid() == 0 else None)
            target_gid = args.owner_gid if args.owner_gid is not None else (0 if hasattr(os, "getuid") and os.geteuid() == 0 else None)
            if target_uid is not None and target_gid is not None:
                try:
                    os.chown(str(p), int(target_uid), int(target_gid))
                except Exception:
                    pass
            elif target_uid is not None:
                try:
                    os.chown(str(p), int(target_uid), stat.st_gid)
                except Exception:
                    pass
            elif target_gid is not None:
                try:
                    os.chown(str(p), stat.st_uid, int(target_gid))
                except Exception:
                    pass
        except Exception:
            pass
        try:
            if hasattr(os, "getuid") and os.geteuid() == 0:
                try:
                    os.chown(str(p), 0, 0)
                except Exception:
                    pass
        except Exception:
            pass
        print(f"Wrote encrypted config to {p}")
    except Exception as e:
        print("Failed to write encrypted config:", e)
        # cleanup tmp
        try:
            if tmp.exists():
                tmp.unlink()
        except Exception:
            pass
        # Note: original file still exists since we only replace at the end
        return 6

    # Emit an audit log entry (best-effort)
    try:
        from backend.secure_logging import get_audit_logger
        logger = get_audit_logger()
        user = os.getenv("MIGRATION_USER") or getpass.getuser() or "cli"
        details = {"changed_paths": [c["path"] for c in changed], "force": bool(args.force)}
        logger.log_event(event_type="CONFIG_CHANGE", user_id=user, action="MIGRATE_CONFIG_ENCRYPT", details=details, ip_address="cli")
        print("Wrote audit log entry for migration (CONFIG_CHANGE)")
    except Exception:
        # not critical
        pass

    print("Migration completed successfully.")
    return 0


if __name__ == '__main__':
    sys.exit(main())
