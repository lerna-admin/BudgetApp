#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-4010}"
HOST="${HOST:-0.0.0.0}"

echo "Starting Prism mock server on ${HOST}:${PORT}..."
npx --yes @stoplight/prism-cli@5 mock documentation/api/openapi.yaml --port "${PORT}" --host "${HOST}"
