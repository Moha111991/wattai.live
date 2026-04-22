output "kms_key_id" {
  description = "KMS Key id"
  value       = aws_kms_key.efh_kms.key_id
}

output "kms_key_arn" {
  description = "KMS Key ARN"
  value       = aws_kms_key.efh_kms.arn
}

output "cloudtrail_bucket" {
  description = "S3 bucket used for CloudTrail logs"
  value       = aws_s3_bucket.cloudtrail_bucket.bucket
}

output "backend_role_arn" {
  description = "IAM role ARN for backend KMS access"
  value       = aws_iam_role.backend_kms_role.arn
}

output "sns_topic_arn" {
  description = "SNS topic for security alerts"
  value       = aws_sns_topic.security_alerts.arn
}

output "eventbridge_rule_arn" {
  description = "EventBridge rule ARN for KMS alarm transitions"
  value       = aws_cloudwatch_event_rule.kms_alarm_to_eventbridge.arn
}
