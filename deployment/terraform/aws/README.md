# Terraform templates — AWS CloudTrail, KMS and IAM hardening

This folder contains opinionated Terraform templates to provision:

- An AWS KMS key for application secrets with automatic rotation enabled.
- An S3 bucket plus CloudTrail (multi-region) to record management events.
- CloudTrail -> CloudWatch Logs pipeline and a metric filter + alarm for KMS usage (Decrypt/GenerateDataKey).
- Minimal IAM policy/role for backend runtime with KMS least-privilege (`kms:Decrypt`, `kms:GenerateDataKey*`, `kms:DescribeKey`).
- EventBridge rule + SNS topic/subscription for on-call notifications when the KMS usage alarm enters `ALARM`.

These templates are intended as a secure starting point. Review policies and principals before applying in production.

Usage:

1. Install Terraform (>=1.0).
2. Configure AWS credentials (preferably via an instance profile or an assigned role).
3. From this directory:

```bash
terraform init
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars with your account-specific values
terraform plan -out plan.tfplan -var-file="terraform.tfvars"

terraform apply plan.tfplan
```

IRSA example (EKS)

```bash
terraform plan -out plan.tfplan \
  -var 'compute_target=irsa' \
  -var 'irsa_oidc_provider_arn=arn:aws:iam::123456789012:oidc-provider/oidc.eks.eu-central-1.amazonaws.com/id/EXAMPLE' \
  -var 'irsa_oidc_subject_key=oidc.eks.eu-central-1.amazonaws.com/id/EXAMPLE:sub' \
  -var 'irsa_service_account_subject=system:serviceaccount:energyflowhub:backend' \
  -var 'oncall_email=oncall@example.com'
```

Notes & security guidance
- Use an IAM user/role with limited rights to run Terraform. Consider using separate management account.
- The CloudTrail S3 bucket is configured with encryption and a restrictive bucket policy.
- The KMS key has rotation enabled; use the rewrap script to rewrap application envelopes when rotating keys.
- If `oncall_email` is set, AWS sends a subscription confirmation email that must be accepted before alerts are delivered.
