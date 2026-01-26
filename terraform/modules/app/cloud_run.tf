# ------------------------------------------------------------------------------
# Data Sources
# ------------------------------------------------------------------------------
data "google_project" "project" {
}

# ------------------------------------------------------------------------------
# Cloud Run Service
# ------------------------------------------------------------------------------
resource "google_cloud_run_service" "main" {
  name     = var.service_name
  location = var.region
  project  = var.project_id

  template {
    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale"      = "20"
        "run.googleapis.com/startup-cpu-boost"  = "true"
      }
    }
    spec {
      timeout_seconds = 300
      # Use default Compute Engine SA by omitting service_account_name or explicitly setting it to default
      # service_account_name = "${data.google_project.project.number}-compute@developer.gserviceaccount.com"
      
      containers {
        # Deploy from Artifact Registry
        image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.cloud_run_source_deploy.repository_id}/${var.service_name}:latest"
        
        env {
          name = "DATABASE_URL"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.database_url.secret_id
              key  = "latest"
            }
          }
        }
        dynamic "env" {
          for_each = var.custom_domain != "" ? [1] : []
          content {
            name  = "NUXT_PUBLIC_BASE_URL"
            value = "https://${var.custom_domain}"
          }
        }
        env {
          name = "DISCORD_WEBHOOK_URL"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.discord_webhook_url.secret_id
              key  = "latest"
            }
          }
        }
        env {
          name = "GA_TRACKING_ID"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.ga_tracking_id.secret_id
              key  = "latest"
            }
          }
        }
        env {
          name = "GITHUB_CLIENT_ID"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.github_client_id.secret_id
              key  = "latest"
            }
          }
        }
        env {
          name = "GITHUB_SECRET"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.github_secret.secret_id
              key  = "latest"
            }
          }
        }
        env {
          name = "MICROCMS_API_KEY"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.microcms_api_key.secret_id
              key  = "latest"
            }
          }
        }
        env {
          name = "MICROCMS_SERVICE_DOMAIN"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.microcms_service_domain.secret_id
              key  = "latest"
            }
          }
        }
        env {
          name = "NUXT_SESSION_PASSWORD"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.nuxt_session_password.secret_id
              key  = "latest"
            }
          }
        }
        env {
          name = "TURNSTILE_SECRET_KEY"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.turnstile_secret_key.secret_id
              key  = "latest"
            }
          }
        }
        env {
          name = "TURNSTILE_SITE_KEY"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.turnstile_site_key.secret_id
              key  = "latest"
            }
          }
        }
        env {
          name = "ADMIN_COMMENT_CREDENTIAL"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.admin_comment_credential.secret_id
              key  = "latest"
            }
          }
        }
        
        ports {
          container_port = 3000
        }

        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }
        
        startup_probe {
          initial_delay_seconds = 0
          timeout_seconds      = 240
          period_seconds       = 240
          failure_threshold    = 1
          tcp_socket {
            port = 3000
          }
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

resource "google_cloud_run_service_iam_member" "noauth" {
  location = google_cloud_run_service.main.location
  project  = google_cloud_run_service.main.project
  service  = google_cloud_run_service.main.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_domain_mapping" "custom_domain" {
  count    = var.custom_domain != "" ? 1 : 0
  location = google_cloud_run_service.main.location
  project  = google_cloud_run_service.main.project
  name     = var.custom_domain

  metadata {
    namespace = google_cloud_run_service.main.project
  }

  spec {
    route_name = google_cloud_run_service.main.name
  }
}
