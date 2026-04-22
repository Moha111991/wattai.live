locals {
  backend_assume_service = (
    var.compute_target == "ec2" ? "ec2.amazonaws.com" :
    var.compute_target == "ecs" ? "ecs-tasks.amazonaws.com" :
    null
  )
}

# ---------- Backend IAM role (minimal KMS access) ----------
data "aws_iam_policy_document" "backend_assume_role" {
  dynamic "statement" {
    for_each = local.backend_assume_service != null ? [1] : []
    content {
      effect = "Allow"
      actions = [
        "sts:AssumeRole",
      ]
      principals {
        type        = "Service"
        identifiers = [local.backend_assume_service]
      }
    }
  }

  dynamic "statement" {
    for_each = var.compute_target == "irsa" ? [1] : []
    content {
      effect = "Allow"
      actions = [
        "sts:AssumeRoleWithWebIdentity",
      ]
      principals {
        type        = "Federated"
        identifiers = [var.irsa_oidc_provider_arn]
      }

      condition {
        test     = "StringEquals"
        variable = "${var.irsa_oidc_subject_key}"
        values   = [var.irsa_service_account_subject]
      }
    }
  }
}

resource "aws_iam_role" "backend_kms_role" {
  name               = var.backend_role_name
  assume_role_policy = data.aws_iam_policy_document.backend_assume_role.json
}

data "aws_iam_policy_document" "backend_kms_min_policy" {
  statement {
    sid    = "AllowKmsDecryptAndDataKey"
    effect = "Allow"
    actions = [
      "kms:Decrypt",
      "kms:GenerateDataKey",
      "kms:GenerateDataKeyWithoutPlaintext",
      "kms:DescribeKey",
    ]
    resources = [
      aws_kms_key.efh_kms.arn,
    ]
  }
}

resource "aws_iam_policy" "backend_kms_min_policy" {
  name   = "${var.project_name}-backend-kms-min"
  policy = data.aws_iam_policy_document.backend_kms_min_policy.json
}

resource "aws_iam_role_policy_attachment" "backend_kms_min_policy_attach" {
  role       = aws_iam_role.backend_kms_role.name
  policy_arn = aws_iam_policy.backend_kms_min_policy.arn
}

# ---------- EventBridge + SNS alert path ----------
resource "aws_sns_topic" "security_alerts" {
  name = var.sns_topic_name
}

resource "aws_sns_topic_subscription" "security_alerts_email" {
  count     = var.oncall_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "email"
  endpoint  = var.oncall_email
}

resource "aws_cloudwatch_event_rule" "kms_alarm_to_eventbridge" {
  name        = "${var.project_name}-kms-alarm-state-change"
  description = "Route KMS CloudWatch alarm ALARM state changes to SNS"

  event_pattern = jsonencode({
    source      = ["aws.cloudwatch"],
    detail-type = ["CloudWatch Alarm State Change"],
    detail = {
      alarmName = [aws_cloudwatch_metric_alarm.kms_usage_alarm.alarm_name],
      state = {
        value = ["ALARM"]
      }
    }
  })
}

resource "aws_cloudwatch_event_target" "kms_alarm_to_sns_target" {
  rule      = aws_cloudwatch_event_rule.kms_alarm_to_eventbridge.name
  target_id = "SendToSnsSecurityAlerts"
  arn       = aws_sns_topic.security_alerts.arn
}

data "aws_iam_policy_document" "sns_topic_policy" {
  statement {
    sid    = "AllowEventBridgePublish"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com"]
    }
    actions = ["sns:Publish"]
    resources = [
      aws_sns_topic.security_alerts.arn,
    ]
    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values   = [aws_cloudwatch_event_rule.kms_alarm_to_eventbridge.arn]
    }
  }
}

resource "aws_sns_topic_policy" "security_alerts_policy" {
  arn    = aws_sns_topic.security_alerts.arn
  policy = data.aws_iam_policy_document.sns_topic_policy.json
}
