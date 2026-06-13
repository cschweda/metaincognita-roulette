#!/usr/bin/env bash
#
# start-dev-server.sh — stop any running dev server, wipe build caches, start fresh.
#
# Targets the Metaincognita stack (Nuxt 4 + Vite, default port 3000). Process killing is
# scoped to THIS project's dev port and directory, so sibling metaincognita apps are never
# touched. The repo is engine-only until the UI phase (Plan 2) adds Nuxt and an `npm run dev`
# script; until then this still stops strays and wipes caches, then reports cleanly.
#
# Usage:
#   ./start-dev-server.sh             # port 3000
#   PORT=4000 ./start-dev-server.sh   # custom port
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"
PORT="${PORT:-3000}"

bold() { printf '\033[1m%s\033[0m\n' "$1"; }

# 1) Stop any existing dev server ---------------------------------------------------------
bold "▸ Stopping existing dev server(s)…"

# a) Whatever is bound to the dev port — precise, frees the port for a fresh start.
port_pids="$(lsof -ti tcp:"$PORT" 2>/dev/null || true)"
if [ -n "$port_pids" ]; then
  echo "  port $PORT held by PID(s): $port_pids — killing"
  kill -9 $port_pids 2>/dev/null || true
fi

# b) Any nuxt/vite dev process launched from THIS project directory (scoped to $ROOT, so
#    other projects' dev servers are left alone).
proj_pids="$(ps ax -o pid=,command= 2>/dev/null | grep -E 'nuxt|vite' | grep -F "$ROOT" | grep -v grep | awk '{print $1}' || true)"
if [ -n "$proj_pids" ]; then
  echo "  this project's dev process(es): $proj_pids — killing"
  kill -9 $proj_pids 2>/dev/null || true
fi
echo "  done."

# 2) Wipe caches --------------------------------------------------------------------------
bold "▸ Wiping build caches…"
rm -rf .nuxt .output .nitro .cache dist \
       node_modules/.vite node_modules/.cache node_modules/.vitest 2>/dev/null || true
echo "  cleared .nuxt .output .nitro .cache dist node_modules/.{vite,cache,vitest}"

# 3) Start fresh --------------------------------------------------------------------------
has_dev="$(node -e "process.stdout.write(require('./package.json').scripts?.dev ? '1' : '')" 2>/dev/null || true)"
if [ -z "$has_dev" ]; then
  bold "⚠ No \"dev\" script in package.json yet."
  echo "  This repo is engine-only; the Nuxt UI and \`pnpm dev\` arrive in Plan 2 (the UI phase)."
  echo "  Caches are wiped and port $PORT is free — re-run this once the app is scaffolded."
  exit 0
fi

bold "▸ Starting dev server on http://localhost:$PORT …"
exec pnpm dev -- --port "$PORT"
