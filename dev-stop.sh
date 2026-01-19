#!/usr/bin/env bash
set -euo pipefail

stop_port() {
  local port="$1"
  local pids
  pids="$(lsof -ti tcp:"${port}" 2>/dev/null || true)"
  if [[ -n "${pids}" ]]; then
    echo "Stopping processes on port ${port}: ${pids}"
    kill ${pids} || true
  fi
}

echo "Stopping dev services..."
stop_port 3000
stop_port 3100
stop_port 3030
stop_port 8080
stop_port 9099
stop_port 8180
stop_port 9199
stop_port 4000
stop_port 4100

echo "Done."
