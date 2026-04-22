# Data Protection Impact Assessment (DPIA) - EnergyFlowHub

This is a short DPIA template focused on provider credentials and KMS usage.

## 1. Project Overview
- System: EnergyFlowHub (EMS for EV, battery, PV)
- Purpose: Orchestrate device adapters, manage charging, and provide UI/mobile control.

## 2. Data categories
- Device identifiers (non-sensitive)
- Provider API credentials (API keys, client secrets) — confidential
- Telemetry data (energy, SOC) — personal only if linked to a person

## 3. Processing & purposes
- Credentials used to poll device/cloud APIs and control devices.
- Encrypted at rest using envelope encryption (KMS) or local AES-GCM.

## 4. Risk assessment and mitigations
- Risk: Credential exfiltration from config files -> Mitigation: KMS envelope encryption, restrictive file permissions (0700/0600), backups encrypted.
- Risk: Unauthorized KMS use -> Mitigation: CloudTrail logging, IAM least-privilege, key rotation.

## 5. Data retention
- Config backups retained per policy (e.g., 90 days). Sensitive backups are encrypted.

## 6. Data subject rights & DPIA outcome
- Low-to-medium risk once mitigations in place. Recommend further penetration testing and periodic audits.

