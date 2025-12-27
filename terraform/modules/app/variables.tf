variable "project_id" {
  description = "The Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "The Google Cloud region"
  type        = string
  default     = "asia-northeast1"
}

variable "service_name" {
  description = "The Cloud Run service name"
  type        = string
}

variable "environment" {
  description = "The environment name (prod, stg)"
  type        = string
}

variable "trigger_branch_regex" {
  description = "The regex for the branch to trigger Cloud Build"
  type        = string
}

variable "artifact_registry_id" {
  description = "The Artifact Registry repository ID"
  type        = string
}

variable "cloudbuild_trigger_name" {
  description = "The Cloud Build trigger name"
  type        = string
}

variable "custom_domain" {
  description = "Custom domain to map to the Cloud Run service (empty string to disable)"
  type        = string
  default     = ""
}

# --- Secrets ---
variable "database_url" {
  type      = string
  sensitive = true
}

variable "discord_webhook_url" {
  type      = string
  sensitive = true
}

variable "ga_tracking_id" {
  type      = string
  sensitive = true
}

variable "github_client_id" {
  type      = string
  sensitive = true
}

variable "github_secret" {
  type      = string
  sensitive = true
}

variable "microcms_api_key" {
  type      = string
  sensitive = true
}

variable "microcms_service_domain" {
  type      = string
  sensitive = true
}

variable "nuxt_session_password" {
  type      = string
  sensitive = true
}

variable "turnstile_secret_key" {
  type      = string
  sensitive = true
}

variable "turnstile_site_key" {
  type      = string
  sensitive = true
}
