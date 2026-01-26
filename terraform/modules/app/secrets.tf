# ------------------------------------------------------------------------------
# Secret Manager
# ------------------------------------------------------------------------------

resource "google_secret_manager_secret" "database_url" {
  labels    = { managed-by-cnrm = "true" }
  project   = data.google_project.project.number
  secret_id = "${local.secret_prefix}DATABASE_URL"
  replication {
    auto {}
  }
}
resource "google_secret_manager_secret_version" "database_url" {
  secret      = google_secret_manager_secret.database_url.id
  secret_data = var.database_url
}

resource "google_secret_manager_secret" "discord_webhook_url" {
  labels    = { managed-by-cnrm = "true" }
  project   = data.google_project.project.number
  secret_id = "${local.secret_prefix}DISCORD_WEBHOOK_URL"
  replication {
    auto {}
  }
}
resource "google_secret_manager_secret_version" "discord_webhook_url" {
  secret      = google_secret_manager_secret.discord_webhook_url.id
  secret_data = var.discord_webhook_url
}

resource "google_secret_manager_secret" "ga_tracking_id" {
  labels    = { managed-by-cnrm = "true" }
  project   = data.google_project.project.number
  secret_id = "${local.secret_prefix}GA_TRACKING_ID"
  replication {
    auto {}
  }
}
resource "google_secret_manager_secret_version" "ga_tracking_id" {
  secret      = google_secret_manager_secret.ga_tracking_id.id
  secret_data = var.ga_tracking_id
}

resource "google_secret_manager_secret" "github_client_id" {
  labels    = { managed-by-cnrm = "true" }
  project   = data.google_project.project.number
  secret_id = "${local.secret_prefix}GITHUB_CLIENT_ID"
  replication {
    auto {}
  }
}
resource "google_secret_manager_secret_version" "github_client_id" {
  secret      = google_secret_manager_secret.github_client_id.id
  secret_data = var.github_client_id
}

resource "google_secret_manager_secret" "github_secret" {
  labels    = { managed-by-cnrm = "true" }
  project   = data.google_project.project.number
  secret_id = "${local.secret_prefix}GITHUB_SECRET"
  replication {
    auto {}
  }
}
resource "google_secret_manager_secret_version" "github_secret" {
  secret      = google_secret_manager_secret.github_secret.id
  secret_data = var.github_secret
}

resource "google_secret_manager_secret" "microcms_api_key" {
  labels    = { managed-by-cnrm = "true" }
  project   = data.google_project.project.number
  secret_id = "${local.secret_prefix}MICROCMS_API_KEY"
  replication {
    auto {}
  }
}
resource "google_secret_manager_secret_version" "microcms_api_key" {
  secret      = google_secret_manager_secret.microcms_api_key.id
  secret_data = var.microcms_api_key
}

resource "google_secret_manager_secret" "microcms_service_domain" {
  labels    = { managed-by-cnrm = "true" }
  project   = data.google_project.project.number
  secret_id = "${local.secret_prefix}MICROCMS_SERVICE_DOMAIN"
  replication {
    auto {}
  }
}
resource "google_secret_manager_secret_version" "microcms_service_domain" {
  secret      = google_secret_manager_secret.microcms_service_domain.id
  secret_data = var.microcms_service_domain
}

resource "google_secret_manager_secret" "nuxt_session_password" {
  labels    = { managed-by-cnrm = "true" }
  project   = data.google_project.project.number
  secret_id = "${local.secret_prefix}NUXT_SESSION_PASSWORD"
  replication {
    auto {}
  }
}
resource "google_secret_manager_secret_version" "nuxt_session_password" {
  secret      = google_secret_manager_secret.nuxt_session_password.id
  secret_data = var.nuxt_session_password
}

resource "google_secret_manager_secret" "turnstile_secret_key" {
  labels    = { managed-by-cnrm = "true" }
  project   = data.google_project.project.number
  secret_id = "${local.secret_prefix}TURNSTILE_SECRET_KEY"
  replication {
    auto {}
  }
}
resource "google_secret_manager_secret_version" "turnstile_secret_key" {
  secret      = google_secret_manager_secret.turnstile_secret_key.id
  secret_data = var.turnstile_secret_key
}

resource "google_secret_manager_secret" "turnstile_site_key" {
  labels    = { managed-by-cnrm = "true" }
  project   = data.google_project.project.number
  secret_id = "${local.secret_prefix}TURNSTILE_SITE_KEY"
  replication {
    auto {}
  }
}
resource "google_secret_manager_secret_version" "turnstile_site_key" {
  secret      = google_secret_manager_secret.turnstile_site_key.id
  secret_data = var.turnstile_site_key
}

resource "google_secret_manager_secret" "admin_comment_credential" {
  labels    = { managed-by-cnrm = "true" }
  project   = data.google_project.project.number
  secret_id = "${local.secret_prefix}ADMIN_COMMENT_CREDENTIAL"
  replication {
    auto {}
  }
}
resource "google_secret_manager_secret_version" "admin_comment_credential" {
  secret      = google_secret_manager_secret.admin_comment_credential.id
  secret_data = var.admin_comment_credential
}
