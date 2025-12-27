# ------------------------------------------------------------------------------
# Cloud Build Trigger
# ------------------------------------------------------------------------------
resource "google_cloudbuild_trigger" "main" {
  description = "Build and deploy to Cloud Run service ${var.service_name} on push to ${var.trigger_branch_regex}"
  filename    = "cloudbuild.yaml"
  location    = "global"
  name        = var.cloudbuild_trigger_name
  project     = var.project_id
  
  github {
    name  = "mq1-web"
    owner = "chan-mai"
    push {
      branch = var.trigger_branch_regex
    }
  }

  substitutions = {
    "_AR_HOSTNAME"   = "${var.region}-docker.pkg.dev"
    "_AR_REPOSITORY" = google_artifact_registry_repository.cloud_run_source_deploy.repository_id
    "_DEPLOY_REGION" = var.region
    "_PLATFORM"      = "managed"
    "_SERVICE"       = var.service_name
    "_SECRET_PREFIX" = local.secret_prefix
  }

  # Use default service account for build triggers
  service_account = "projects/${var.project_id}/serviceAccounts/${data.google_project.project.number}-compute@developer.gserviceaccount.com"


  tags = [
    "gcp-cloud-build-deploy-cloud-run",
    "gcp-cloud-build-deploy-cloud-run-managed",
    var.service_name
  ]
}
