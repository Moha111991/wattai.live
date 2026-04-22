#!/usr/bin/env python3
"""
Prune old backup files from the backups directory.

Intended to be run from cron or CI. Supports dry-run and configurable retention.
"""
import argparse
from pathlib import Path
from datetime import datetime, timedelta
import os


def prune(backups_dir: Path, retention_days: int, dry_run: bool = True):
    if not backups_dir.exists():
        print(f"Backups directory {backups_dir} does not exist; nothing to do.")
        return 0
    cutoff = datetime.utcnow() - timedelta(days=retention_days)
    removed = 0
    for p in backups_dir.iterdir():
        try:
            mtime = datetime.utcfromtimestamp(p.stat().st_mtime)
        except Exception:
            continue
        if mtime < cutoff:
            if dry_run:
                print(f"DRY-RUN: would remove {p} (mtime={mtime.isoformat()})")
            else:
                try:
                    p.unlink()
                    print(f"Removed {p}")
                    removed += 1
                except Exception as e:
                    print(f"Failed to remove {p}: {e}")
    return removed


def main():
    ap = argparse.ArgumentParser(description="Prune backup files older than a retention window")
    ap.add_argument("--backups-dir", default="data/backups", help="Backups directory")
    ap.add_argument("--retention-days", type=int, default=90, help="Retention in days")
    ap.add_argument("--apply", action="store_true", help="Actually delete files (default is dry-run)")
    args = ap.parse_args()

    backups_dir = Path(args.backups_dir)
    removed = prune(backups_dir, args.retention_days, dry_run=not args.apply)
    if args.apply:
        print(f"Removed {removed} files")
    else:
        print("Dry-run complete.")


if __name__ == "__main__":
    main()
