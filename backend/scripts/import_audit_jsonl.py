#!/usr/bin/env python3
"""
One-off importer: migrate legacy `data/audit_logs.jsonl` into the SQLAlchemy-backed
`audit_logs` table. This is a safe, idempotent helper that will:

- Skip import if no JSONL exists.
- Skip import if the DB already contains entries (to avoid duplicates).
- Archive the JSONL file to `data/audit_logs.jsonl.imported.<ts>` after a successful import.

Usage (from project root):

  ./.venv/bin/python backend/scripts/import_audit_jsonl.py

The script will add the project root to sys.path so it works from any working directory.
"""
from __future__ import annotations
import os
import sys
import argparse

# Ensure project root is importable
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from backend.secure_logging import SecureAuditLogger
import logging

logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(message)s')


def main():
    parser = argparse.ArgumentParser(description='Import legacy audit JSONL into DB (idempotent)')
    parser.add_argument('--force', action='store_true', help='(NOT RECOMMENDED) force import even if DB not empty')
    args = parser.parse_args()

    logger = SecureAuditLogger()

    # If SQLAlchemy isn't available or session maker isn't configured, abort
    if not getattr(logger, '_session_maker', None):
        print('Database-backed audit logging is not available in this environment. Aborting.')
        return 2

    # If not forced and DB contains entries, skip
    try:
        session = logger._session_maker()
        try:
            count = session.query(logger.AuditLogModel if hasattr(logger, 'AuditLogModel') else None).count()
        except Exception:
            # Fallback: query directly on model defined in module
            from backend.secure_logging import AuditLogModel
            count = session.query(AuditLogModel).count()
        finally:
            session.close()
    except Exception as e:
        print('Failed to query DB to determine import necessity:', e)
        return 1

    if count > 0 and not args.force:
        print('DB already contains entries (count={}). Skipping import. Use --force to override.'.format(count))
        return 0

    # Call the import helper on the logger (this is the same logic used in the module)
    try:
        logger._import_jsonl_to_db()
        print('Import completed (check logs for details).')
        return 0
    except Exception as e:
        print('Import failed:', e)
        return 1


if __name__ == '__main__':
    sys.exit(main())
