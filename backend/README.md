Secure audit logging
====================

This folder contains the project's tamper-proof audit logging implementation.

Quick notes
-----------

- The main implementation is in `backend/secure_logging.py`.
- The logger supports two modes:
  - DB-backed using SQLAlchemy (recommended for production). Configure `DATABASE_URL`.
  - File-backed JSONL fallback (`data/audit_logs.jsonl`) for simple/dev setups when SQLAlchemy is not available.

Importer script
---------------

A one-off importer script is provided to migrate any existing `data/audit_logs.jsonl` into the DB in a safe, idempotent way.

Usage (from project root):

```bash
# use the project's venv Python
./.venv/bin/python backend/scripts/import_audit_jsonl.py

# if you need to force the import even when DB is non-empty (dangerous):
./.venv/bin/python backend/scripts/import_audit_jsonl.py --force
```

What the importer does
- If `data/audit_logs.jsonl` does not exist, it does nothing.
- If the DB table `audit_logs` already has records, it skips the import by default (to prevent duplicates).
- If it imports entries successfully, it archives the original JSONL to `data/audit_logs.jsonl.imported.<unix_ts>`.

Notes
-----
- For production, set `DATABASE_URL` to your Postgres (or other) DB. The logger will mask credentials in logs.
- If you want the importer to run as part of a deployment flow or a migration, you can call the script from your deploy pipeline.
