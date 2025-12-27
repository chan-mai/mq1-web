locals {
  # Prefix: PROD_ or STG_
  secret_prefix = "${upper(var.environment)}_"
}
