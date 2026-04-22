variable "region" {
  description = "AWS region"
  type        = string
  default     = "eu-central-1"
}

variable "project_name" {
  description = "Prefix for resource names"
  type        = string
  default     = "efh"
}

variable "allowed_principals" {
  description = "List of ARNs that should be allowed to use the KMS key (e.g. backend IAM role)"
  type        = list(string)
  default     = []
}

variable "trail_name" {
  description = "CloudTrail name"
  type        = string
  default     = "efh-trail"
}

variable "log_bucket_name" {
  description = "S3 bucket to store CloudTrail logs (override to provide an existing bucket)"
  type        = string
  default     = ""
}

variable "compute_target" {
  description = "Where backend role will run: ecs, ec2, or irsa"
  type        = string
  default     = "ecs"

  validation {
    condition     = contains(["ecs", "ec2", "irsa"], var.compute_target)
    error_message = "compute_target must be one of: ecs, ec2, irsa."
  }
}

variable "backend_role_name" {
  description = "IAM role name for backend service"
  type        = string
  default     = "efh-backend-kms-role"
}

variable "irsa_oidc_provider_arn" {
  description = "OIDC provider ARN for IRSA (required only when compute_target=irsa)"
  type        = string
  default     = ""
}

variable "irsa_oidc_subject_key" {
  description = "OIDC token subject key, usually <oidc-provider-host>:sub"
  type        = string
  default     = ""
}

variable "irsa_service_account_subject" {
  description = "IRSA subject, e.g. system:serviceaccount:namespace:serviceaccount"
  type        = string
  default     = ""
}

variable "sns_topic_name" {
  description = "SNS topic name for security/on-call alerts"
  type        = string
  default     = "efh-security-alerts"
}

variable "oncall_email" {
  description = "Email subscription endpoint for SNS alerts (leave empty to skip subscription creation)"
  type        = string
  default     = ""
}
