# Incident Response & Breach Notification Playbook

## Purpose
Describe steps to follow in case of a suspected data breach affecting credentials or personal data.

## Roles & Contacts
- Incident Lead: [name, email, phone]
- Data Protection Officer: [name, email]
- Cloud provider contact: AWS Support / Account Manager

## Immediate actions (0-24h)
1. Contain: revoke exposed keys (adapter keys), rotate KMS keys if possible, disable affected services.
2. Preserve evidence: snapshot config, system logs, CloudTrail, network logs.
3. Notify internal stakeholders.

## Investigation (24-72h)
- Triage logs, identify scope and affected data subjects, determine exfiltration likelihood.

## Notification
- If personal data breach under GDPR: notify supervisory authority within 72 hours unless unlikely to result in risk to rights/freedoms.
- Notify affected data subjects where high risk.

## Post-incident
- Root cause analysis, patching, and improvements. Update this playbook.

## Templates
- Notification email templates (internal, regulator, data subjects) should be stored in a secure place.

