#!/bin/bash

set -e

# Development script for abacus-document-parser
# Usage: ./scripts/dev.sh [up|down] [--reset-deps]

COMPOSE_FILE="docker-compose.dev.yml"
RESET_DEPS=false

for arg in "$@"; do
  if [ "$arg" = "--reset-deps" ]; then
    RESET_DEPS=true
  fi
done

case "${1}" in
  "up")
    echo "Shutting down existing services..."
    docker compose -f $COMPOSE_FILE down

    if [ "$RESET_DEPS" = true ]; then
      echo "Resetting dependency volume..."
      docker volume rm demo_bun_node_modules >/dev/null 2>&1 || true
    fi

    echo "Starting full development environment with watch mode..."

    # Run tsr watch in background and docker compose watch in foreground
    bunx tsr watch &
    TSR_PID=$!

    # Trap to kill tsr watch when script exits
    trap "kill $TSR_PID 2>/dev/null" EXIT

    USER_ID=$(id -u) GROUP_ID=$(id -g) docker compose --env-file ".env.local" -f $COMPOSE_FILE watch
    ;;
  "down")
    echo "Shutting down Docker services..."
    docker compose -f $COMPOSE_FILE down
    ;;
  *)
    echo "Usage: $0 [up|down] [--reset-deps]"
    echo "  up       - Start development environment"
    echo "  down     - Shut down all services"
    echo "  --reset-deps - Remove dependency volume before starting"
    exit 1
    ;;
esac
