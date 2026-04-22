terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.0"
    }
  }
}

provider "aws" {
  region = var.region
}

locals {
  name_prefix = "${var.project_name}"
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Create an encrypted S3 bucket for CloudTrail
resource "aws_s3_bucket" "cloudtrail_bucket" {
  bucket = var.log_bucket_name != "" ? var.log_bucket_name : "${local.name_prefix}-cloudtrail-logs-${random_id.bucket_suffix.hex}"
  force_destroy = false

  tags = {
    Project = var.project_name
    Managed = "terraform"
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_bucket_pab" {
  bucket                  = aws_s3_bucket.cloudtrail_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "cloudtrail_bucket_versioning" {
  bucket = aws_s3_bucket.cloudtrail_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_bucket_sse" {
  bucket = aws_s3_bucket.cloudtrail_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.efh_kms.arn
    }
  }
}

data "aws_iam_policy_document" "cloudtrail_bucket_policy" {
  statement {
    sid    = "AWSCloudTrailAclCheck"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions = ["s3:GetBucketAcl"]
    resources = [
      aws_s3_bucket.cloudtrail_bucket.arn,
    ]
  }

  statement {
    sid    = "AWSCloudTrailWrite"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions = ["s3:PutObject"]
    resources = [
      "${aws_s3_bucket.cloudtrail_bucket.arn}/AWSLogs/${data.aws_caller_identity.current.account_id}/*",
    ]
    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }
}

resource "aws_s3_bucket_policy" "cloudtrail_bucket_policy" {
  bucket = aws_s3_bucket.cloudtrail_bucket.id
  policy = data.aws_iam_policy_document.cloudtrail_bucket_policy.json
}

# KMS key for application secrets
resource "aws_kms_key" "efh_kms" {
  description         = "KMS key for EnergyFlowHub encrypted secrets"
  enable_key_rotation = true

  policy = data.aws_iam_policy_document.kms_policy.json
}

data "aws_iam_policy_document" "kms_policy" {
  statement {
    sid = "EnableRootPermissionsAndIAMDelegation"
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }
    actions = ["kms:*"]
    resources = ["*"]
  }

  dynamic "statement" {
    for_each = var.allowed_principals
    content {
      sid = "AllowBackendUse-${substr(replace(statement.value, "/", "-"), 0, 8)}"
      principals {
        type        = "AWS"
        identifiers = [statement.value]
      }
      actions = ["kms:Decrypt", "kms:GenerateDataKey", "kms:GenerateDataKeyWithoutPlaintext"]
      resources = ["*"]
    }
  }
}

resource "aws_kms_alias" "efh_kms_alias" {
  name          = "alias/${var.project_name}-secrets"
  target_key_id = aws_kms_key.efh_kms.key_id
}

# CloudTrail
resource "aws_cloudtrail" "efh_trail" {
  name                          = var.trail_name
  s3_bucket_name                = aws_s3_bucket.cloudtrail_bucket.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
}

# CloudWatch Log Group for CloudTrail events (optional)
resource "aws_cloudwatch_log_group" "cloudtrail_logs" {
  name              = "/aws/cloudtrail/${var.trail_name}"
  retention_in_days = 365
}

data "aws_iam_policy_document" "cloudtrail_assume" {
  statement {
    effect = "Allow"
    actions = [
      "sts:AssumeRole",
    ]
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "cloudtrail_to_cw" {
  name               = "${var.project_name}-cloudtrail-to-cw"
  assume_role_policy = data.aws_iam_policy_document.cloudtrail_assume.json
}

data "aws_iam_policy_document" "cloudtrail_to_cw_policy" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = [
      "${aws_cloudwatch_log_group.cloudtrail_logs.arn}:*",
    ]
  }
}

resource "aws_iam_role_policy" "cloudtrail_to_cw_policy" {
  name   = "${var.project_name}-cloudtrail-cw-inline"
  role   = aws_iam_role.cloudtrail_to_cw.id
  policy = data.aws_iam_policy_document.cloudtrail_to_cw_policy.json
}

resource "aws_cloudtrail" "efh_trail" {
  depends_on = [
    aws_s3_bucket_policy.cloudtrail_bucket_policy,
    aws_iam_role_policy.cloudtrail_to_cw_policy,
  ]

  name                          = var.trail_name
  s3_bucket_name                = aws_s3_bucket.cloudtrail_bucket.id
  cloud_watch_logs_group_arn    = "${aws_cloudwatch_log_group.cloudtrail_logs.arn}:*"
  cloud_watch_logs_role_arn     = aws_iam_role.cloudtrail_to_cw.arn
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  is_logging                    = true
}

# Metric Filter and Alarm for suspicious KMS usage
resource "aws_cloudwatch_log_metric_filter" "kms_decrypt_filter" {
  name           = "KMSDecryptEvents"
  log_group_name = aws_cloudwatch_log_group.cloudtrail_logs.name

  pattern = "{ ($.eventName = \"Decrypt\") || ($.eventName = \"GenerateDataKey\") || ($.eventName = \"GenerateDataKeyWithoutPlaintext\") }"

  metric_transformation {
    name      = "KMSApiCalls"
    namespace = "EFH/Security"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "kms_usage_alarm" {
  alarm_name          = "EFH-KMS-Unusual-Usage"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = aws_cloudwatch_log_metric_filter.kms_decrypt_filter.metric_transformation[0].name
  namespace           = aws_cloudwatch_log_metric_filter.kms_decrypt_filter.metric_transformation[0].namespace
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Alert when KMS Decrypt/GenerateDataKey calls exceed threshold within 5 minutes"
}
