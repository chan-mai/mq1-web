# ------------------------------------------------------------------------------
# Artifact Registry
# ------------------------------------------------------------------------------
resource "google_artifact_registry_repository" "cloud_run_source_deploy" {
  description   = "Cloud Run Source Deployments ${var.environment}"
  format        = "DOCKER"
  labels        = { managed-by-cnrm = "true" }
  location      = var.region
  mode          = "STANDARD_REPOSITORY"
  project       = var.project_id
  repository_id = var.artifact_registry_id
}
