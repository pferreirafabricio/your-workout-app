#!/bin/bash

set -euo pipefail

COMPOSE_FILE="docker-compose.e2e.yml"
PROJECT_NAME="super-fit-e2e-${USER:-user}-$(date +%s)-$$"

cleanup() {
  echo "Tearing down ephemeral e2e containers..."
  COMPOSE_PROJECT_NAME="$PROJECT_NAME" docker compose -f "$COMPOSE_FILE" down -v --remove-orphans >/dev/null 2>&1 || true
}

trap cleanup EXIT INT TERM

echo "Starting ephemeral e2e stack (Postgres + app containers)..."
COMPOSE_PROJECT_NAME="$PROJECT_NAME" docker compose -f "$COMPOSE_FILE" up -d --build --wait

APP_ENDPOINT="$(COMPOSE_PROJECT_NAME="$PROJECT_NAME" docker compose -f "$COMPOSE_FILE" port app 3000 | tail -n 1)"
PLAYWRIGHT_PORT="$(echo "$APP_ENDPOINT" | sed 's/.*://')"

if [ -z "$PLAYWRIGHT_PORT" ]; then
  echo "Unable to resolve app port mapping for e2e run."
  exit 1
fi

echo "Running Playwright against containerized app..."
PLAYWRIGHT_BASE_URL="http://localhost:${PLAYWRIGHT_PORT}" bunx playwright test "$@"
