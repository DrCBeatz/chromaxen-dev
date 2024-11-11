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
