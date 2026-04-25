#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

create_config() {
  local config_name="$1"
  local config_file="$2"

  if ! docker config inspect "$config_name" >/dev/null 2>&1; then
    docker config create "$config_name" "$config_file" >/dev/null
  fi
}

PROMETHEUS_CONFIG_FILE="$ROOT_DIR/monitoring/prometheus.yml"
PROMETHEUS_ALERT_RULES_FILE="$ROOT_DIR/monitoring/alert.rules"
ALERTMANAGER_CONFIG_FILE="$ROOT_DIR/monitoring/alertmanager.yml"
LOKI_CONFIG_FILE="$ROOT_DIR/monitoring/loki-config.yaml"
PROMTAIL_CONFIG_FILE="$ROOT_DIR/monitoring/promtail-config.yaml"
GRAFANA_DATASOURCES_FILE="$ROOT_DIR/monitoring/grafana/provisioning/datasources/datasources.yml"
PROMETHEUS_CONFIG_NAME="prometheus_config"
PROMETHEUS_ALERT_RULES_NAME="prometheus_alert_rules"
ALERTMANAGER_CONFIG_NAME="alertmanager_config"
LOKI_CONFIG_NAME="loki_config"
PROMTAIL_CONFIG_NAME="promtail_config"
GRAFANA_DATASOURCES_CONFIG_NAME="grafana_datasources"

create_config "$PROMETHEUS_CONFIG_NAME" "$PROMETHEUS_CONFIG_FILE"
create_config "$PROMETHEUS_ALERT_RULES_NAME" "$PROMETHEUS_ALERT_RULES_FILE"
create_config "$ALERTMANAGER_CONFIG_NAME" "$ALERTMANAGER_CONFIG_FILE"
create_config "$LOKI_CONFIG_NAME" "$LOKI_CONFIG_FILE"
create_config "$PROMTAIL_CONFIG_NAME" "$PROMTAIL_CONFIG_FILE"
create_config "$GRAFANA_DATASOURCES_CONFIG_NAME" "$GRAFANA_DATASOURCES_FILE"

cat <<EOF
PROMETHEUS_CONFIG_NAME=$PROMETHEUS_CONFIG_NAME
PROMETHEUS_ALERT_RULES_NAME=$PROMETHEUS_ALERT_RULES_NAME
ALERTMANAGER_CONFIG_NAME=$ALERTMANAGER_CONFIG_NAME
LOKI_CONFIG_NAME=$LOKI_CONFIG_NAME
PROMTAIL_CONFIG_NAME=$PROMTAIL_CONFIG_NAME
GRAFANA_DATASOURCES_CONFIG_NAME=$GRAFANA_DATASOURCES_CONFIG_NAME
EOF
