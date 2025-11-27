#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_APP="${ROOT}/web-app"

if [[ -x "${HOME}/.local/node-v20.11.1-linux-x64/bin/node" ]]; then
	export PATH="${HOME}/.local/node-v20.11.1-linux-x64/bin:${PATH}"
fi

cd "${WEB_APP}"
corepack enable >/dev/null 2>&1 || true

echo "▶ Installing dependencies with pnpm..."
pnpm install

echo "▶ Initializing local database (SQLite seed)..."
pnpm db:init

DEV_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
if [[ -z "${DEV_IP}" ]]; then
	DEV_IP="127.0.0.1"
fi

echo "▶ Launching web app (Next.js dev API)..."
echo "   ↳ Accede desde: http://localhost:3000 o http://${DEV_IP}:3000 (el puerto puede variar si está ocupado)"
unset NEXT_PUBLIC_API_BASE_URL
unset NEXT_PUBLIC_API_STRICT_BASE
unset NEXT_PUBLIC_API_FORCE_BASE
HOST=0.0.0.0 pnpm dev
