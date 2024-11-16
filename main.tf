# main .tf

# Primary provider for us-east-1, used for CloudFront and ACM
provider "aws" {
  region = "us-east-1"  # CloudFront and ACM require us-east-1
}

# Additional provider configuration for us-east-2
provider "aws" {
    alias  = "us_east_2"
    region = "us-east-2"  # S3 bucket is in us-east-2
}

# Data Source for Existing S3 Bucket in us-east-2
data "aws_s3_bucket" "frontend_bucket" {
  bucket   = "chromaxen-dev-test"
  provider = aws.us_east_2         # Specify provider for us-east-2
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "frontend_distribution" {
  origin {
    domain_name = data.aws_s3_bucket.frontend_bucket.bucket_regional_domain_name
    origin_id   = "S3-Frontend"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.origin_access_identity.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CloudFront distribution for Chromaxen frontend"
  default_root_object = "index.html"

  lifecycle {
      prevent_destroy = true
    }

  aliases = ["chromaxen.com", "www.chromaxen.com"]  # Custom domain and subdomain

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-Frontend"
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

    viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.chromaxen_certificate.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = {
    Name = "Chromaxen CloudFront Distribution"
  }
}

# ACM Certificate for HTTPS (created in us-east-1 for CloudFront compatibility)
# (covering both chromaxen.com and www.chromaxen.com)
resource "aws_acm_certificate" "chromaxen_certificate" {
  domain_name               = "chromaxen.com"
  subject_alternative_names = ["www.chromaxen.com"]
  validation_method         = "DNS"

  lifecycle {
    prevent_destroy = true
  }

  tags = {
    Name = "Chromaxen Certificate"
  }
}

# Wait for Certificate Validation to Complete (using for_each for dynamic records)
resource "aws_acm_certificate_validation" "chromaxen_cert_validation" {
  certificate_arn         = aws_acm_certificate.chromaxen_certificate.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# Route 53 validation records for each domain validation option
resource "aws_route53_record" "cert_validation" {
  for_each = { for dvo in aws_acm_certificate.chromaxen_certificate.domain_validation_options : dvo.domain_name => dvo }

  zone_id = aws_route53_zone.chromaxen_zone.zone_id
  name    = each.value.resource_record_name
  type    = each.value.resource_record_type
  records = [each.value.resource_record_value]
  ttl     = 300
}

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "origin_access_identity" {
  comment = "OAI for Chromaxen Frontend"
}

# S3 Bucket Policy for Public Access (Testing Only)
resource "aws_s3_bucket_policy" "frontend_public_policy" {
  bucket = data.aws_s3_bucket.frontend_bucket.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect    = "Allow",
        Action    = ["s3:GetObject"],
        Resource  = ["${data.aws_s3_bucket.frontend_bucket.arn}/*"],
        Principal = "*"
      }
    ]
  })
  provider = aws.us_east_2  # Specify provider for us-east-2

  lifecycle {
    prevent_destroy = true
  }
}

# Route 53 Hosted Zone
resource "aws_route53_zone" "chromaxen_zone" {
  name = "chromaxen.com"
  lifecycle {
    prevent_destroy = true
  }
}

# A Record (Alias) for the root domain pointing to CloudFront
resource "aws_route53_record" "root_alias" {
  zone_id = aws_route53_zone.chromaxen_zone.zone_id
  name    = "chromaxen.com"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.frontend_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.frontend_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}

# CNAME Record for www subdomain pointing to CloudFront
resource "aws_route53_record" "www_cname" {
  zone_id = aws_route53_zone.chromaxen_zone.zone_id
  name    = "www.chromaxen.com"
  type    = "CNAME"
  ttl     = 300
  records = [aws_cloudfront_distribution.frontend_distribution.domain_name]
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.frontend_distribution.domain_name
}

resource "aws_dynamodb_table" "high_scores" {
  name         = "HighScores"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "game"
  range_key    = "score_id"

  attribute {
    name = "game"
    type = "S"
  }

  attribute {
    name = "score_id"
    type = "S"
  }

  attribute {
    name = "moves"
    type = "N"
  }

  global_secondary_index {
    name               = "GameMovesIndex"
    hash_key           = "game"
    range_key          = "moves"
    projection_type    = "ALL"
  }

  tags = {
    Environment = "production"
  }
}

resource "aws_iam_role" "lambda_role" {
  name = "chromaxen_lambda_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Effect = "Allow",
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_policy_attachment" "lambda_policy_attach" {
  name       = "lambda_policy_attach"
  roles      = [aws_iam_role.lambda_role.name]
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_dynamodb_policy" {
  name = "lambda_dynamodb_policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:ListTables",
          "dynamodb:DescribeTable"
        ],
        Effect   = "Allow",
        Resource = [
          aws_dynamodb_table.high_scores.arn,
          "${aws_dynamodb_table.high_scores.arn}/index/*"
        ]
      }
    ]
  })
}

resource "aws_lambda_function" "chromaxen_backend" {
  filename         = "${path.module}/lambda_function_payload.zip"
  function_name    = "ChromaxenBackend"
  role             = aws_iam_role.lambda_role.arn
  handler          = "main.handler"
  runtime          = "python3.9"
  timeout          = 30

  source_code_hash = filebase64sha256("${path.module}/lambda_function_payload.zip")

  environment {
    variables = {
      ENVIRONMENT = "production"
    }
  }
}

# AWS API Gateway REST API
resource "aws_api_gateway_rest_api" "api_gateway" {
  name = "ChromaxenAPI"
}

# API Resource
resource "aws_api_gateway_resource" "api_resource" {
  rest_api_id = aws_api_gateway_rest_api.api_gateway.id
  parent_id   = aws_api_gateway_rest_api.api_gateway.root_resource_id
  path_part   = "{proxy+}"
}

# API Method
resource "aws_api_gateway_method" "api_method" {
  rest_api_id   = aws_api_gateway_rest_api.api_gateway.id
  resource_id   = aws_api_gateway_resource.api_resource.id
  http_method   = "ANY"
  authorization = "NONE"
}

# API Integration
resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id             = aws_api_gateway_rest_api.api_gateway.id
  resource_id             = aws_api_gateway_resource.api_resource.id
  http_method             = aws_api_gateway_method.api_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.chromaxen_backend.invoke_arn
}

# Lambda Permission for API Gateway
resource "aws_lambda_permission" "api_gateway_permission" {
  function_name = aws_lambda_function.chromaxen_backend.function_name
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api_gateway.execution_arn}/*/*"
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "api_deployment" {
  depends_on = [
    aws_api_gateway_integration.lambda_integration
  ]
  rest_api_id = aws_api_gateway_rest_api.api_gateway.id
  stage_name  = "prod"
}

# Output the Invoke URL
output "api_gateway_invoke_url" {
  value = "${aws_api_gateway_deployment.api_deployment.invoke_url}"
}

resource "aws_api_gateway_method" "options_method" {
  rest_api_id   = aws_api_gateway_rest_api.api_gateway.id
  resource_id   = aws_api_gateway_resource.api_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_integration" {
  rest_api_id             = aws_api_gateway_rest_api.api_gateway.id
  resource_id             = aws_api_gateway_resource.api_resource.id
  http_method             = aws_api_gateway_method.options_method.http_method
  type                    = "MOCK"
  request_templates       = {
    "application/json" = "{\"statusCode\": 200}"
  }

  depends_on = [aws_api_gateway_method.options_method]
}

resource "aws_api_gateway_method_response" "options_response" {
  rest_api_id = aws_api_gateway_rest_api.api_gateway.id
  resource_id = aws_api_gateway_resource.api_resource.id
  http_method = aws_api_gateway_method.options_method.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.api_gateway.id
  resource_id = aws_api_gateway_resource.api_resource.id
  http_method = aws_api_gateway_method.options_method.http_method
  status_code = aws_api_gateway_method_response.options_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'*'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}
