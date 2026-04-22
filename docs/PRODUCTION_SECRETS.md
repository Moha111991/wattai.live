Production secrets and KMS guidance
===================================

This document describes recommended production practices for storing and rotating secrets, protecting backups, transport hardening (Nginx TLS) and a short DPIA checklist (Germany / BDSG / GDPR).

1) Secret storage strategy
--------------------------
- Use a centrally managed KMS/Secrets Manager in production (AWS KMS + Secrets Manager, HashiCorp Vault, Google KMS/Secret Manager, Azure Key Vault).
- Use envelope encryption (recommended): generate a per-record/data key (AES-256), encrypt data locally with AES-GCM, and use KMS to encrypt the data key. Store the ciphertext data key (dk) and the payload (v) together.
- App runtime should never persist long-term plaintext master keys. Use instance profiles / IAM roles or short-lived credentials.
- For small deployments, the existing env-based fallback (SECRETS_KEY / SECRETS_PASSPHRASE) is acceptable, but ensure the host is well-secured and keys are provisioned out of band.

2) File permissions and backups
------------------------------
- Salt file: `data/.secrets_salt` should be owned by the service user and set to 0600.
  - Example:
    ```bash
    chown efh:efh data/.secrets_salt
    chmod 600 data/.secrets_salt
    ```
- Backups created by the migration tool are encrypted (envelope) and the file mode should be 0600. Store backups in a restricted directory (e.g. `data/backups`) with 0700 on the directory.
  - Example:
    ```bash
    mkdir -p data/backups
    chown efh:efh data/backups
    chmod 700 data/backups
    ```
- Minimise who can run migration scripts. Use OS groups (e.g. `efh-admins`) and IAM policies for KMS access.

3) Key rotation and `kid` metadata
----------------------------------
- Use KMS key aliases or versions and include a `kid` field in encrypted blobs to identify which KMS key wrapped the data key.
- Rotate master keys on a regular schedule (e.g. 90-365 days) depending on policy. Re-wrap data keys with the new master key (cheap) rather than re-encrypting payloads.
- Keep at most one previous master key for emergency rollback.

4) AWS-specific notes (KMS)
---------------------------
- The repo supports an `aws_kms` provider. Set:
  - `SECRETS_PROVIDER=aws_kms`
  - `AWS_KMS_KEY_ID=alias/your-key` (or full KeyId)
- IAM policy must grant `kms:GenerateDataKey` and `kms:Decrypt` for the key.
- Prefer instance profiles or short-lived credentials for the service.

5) Running the migration (safe steps)
-------------------------------------
- Inspect candidates first:
  ```bash
  ./.venv/bin/python -m backend.scripts.migrate_config_encrypt --dry-run
  ```
- When ready, run apply with provider and key id (no `--force` unless you verified placeholders):
  ```bash
  export SECRETS_PROVIDER=aws_kms
  export AWS_KMS_KEY_ID=alias/efh-secrets
  ./.venv/bin/python -m backend.scripts.migrate_config_encrypt --apply
  ```
- The migration will write an encrypted backup and atomically replace `config/config.yaml`. Confirm backup exists under `config/` and has mode 0600.

6) Transport hardening (Nginx)
------------------------------
- Always terminate TLS at a reverse proxy (Nginx) or use a cloud load balancer; enforce HTTPS and HSTS.
- Minimal Nginx TLS config (modern):
  ```nginx
  ssl_protocols TLSv1.3 TLSv1.2;
  ssl_ciphers 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256';
  ssl_prefer_server_ciphers on;
  add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
  add_header X-Frame-Options "DENY" always;
  add_header X-Content-Type-Options "nosniff" always;
  ```
- Use OCSP stapling, certificate automation (Let's Encrypt or ACM) and keep OpenSSL / Nginx up-to-date.
- Require TLS for outbound provider integrations (httpx verifies certificates by default). Consider mTLS for critical provider integrations.

7) DPIA & Contracts (short checklist for Germany / BDSG / GDPR)
---------------------------------------------------------------
- Scope: describe data categories (smart-meter readings, identifiers), purpose, retention and legal basis.
- Necessity & proportionality: justify processing and consider pseudonymisation.
- Risk assessment: identify risks to data subjects and technical/organisational measures (encryption, access control, logging, breach response).
- Data Processing Agreements (DPA): with cloud providers, analytics vendors and any subprocessors.
- Data localisation: ensure lawful transfers and SCCs if transferring outside the EU.
- Retention & deletion: implement retention policies and secure deletion.
- Incident response: define breach notification timelines and contacts.

8) Next steps / optional implementations
---------------------------------------
- Implement a `rotate_kms_keys.py` script that re-wraps `dk` fields from an old KMS key to a new one.
- Add automated CI checks for secrets-provider integration (mock KMS) and unit tests for `secrets.decrypt_value` / `encrypt_value`.

If you want, I can create the rotation script and/or add CI tests next.
