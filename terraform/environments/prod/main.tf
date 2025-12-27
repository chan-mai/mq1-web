terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

variable "project_id" {
  default = "mq1-web"
}

variable "region" {
  default = "asia-northeast1"
}

# Secrets
variable "database_url" { sensitive = true }
variable "discord_webhook_url" { sensitive = true }
variable "ga_tracking_id" { sensitive = true }
variable "github_client_id" { sensitive = true }
variable "github_secret" { sensitive = true }
variable "microcms_api_key" { sensitive = true }
variable "microcms_service_domain" { sensitive = true }
variable "nuxt_session_password" { sensitive = true }
variable "turnstile_secret_key" { sensitive = true }
variable "turnstile_site_key" { sensitive = true }

module "app" {
  source = "../../modules/app"

  project_id           = var.project_id
  region               = var.region
  service_name         = "prod-mq1-web"
  environment          = "prod"
  trigger_branch_regex = "^develop$"
  
  # Pass secrets
  database_url            = var.database_url
  discord_webhook_url     = var.discord_webhook_url
  ga_tracking_id          = var.ga_tracking_id
  github_client_id        = var.github_client_id
  github_secret           = var.github_secret
  microcms_api_key        = var.microcms_api_key
  microcms_service_domain = var.microcms_service_domain
  nuxt_session_password   = var.nuxt_session_password
  turnstile_secret_key    = var.turnstile_secret_key
  turnstile_site_key      = var.turnstile_site_key
  
  artifact_registry_id    = "cloud-run-source-deploy-prod"
  cloudbuild_trigger_name = "mq1-web-prod-trigger"
  
  custom_domain = "mq1.dev"
}
