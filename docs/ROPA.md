# Record of Processing Activities (RoPA) - EnergyFlowHub

## Controller
- Name: [Your Org]
- Contact: [security@example.com]

## Processing activity: Credential storage and management
- Purpose: Store provider/cloud API credentials used by device adapters
- Categories of data: API keys, client secrets
- Legal basis: Contractual necessity / legitimate interests (document rationale)
- Recipients: None (credentials are stored encrypted). Cloud KMS sees KMS usage logs.
- International transfers: KMS region and provider specifics; document if keys in other jurisdictions.
- Retention: encrypted backups retained for 90 days by default; logs retained per CloudTrail policy.

## Technical and organisational measures
- Envelope encryption using AWS KMS
- Backups in `data/backups` with restricted permissions
- CloudTrail logging for all KMS operations
- IAM least-privilege for service accounts

