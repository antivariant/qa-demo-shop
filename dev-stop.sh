#!/usr/bin/env bash
set -euo pipefail

port_open() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    if lsof -ti tcp:"${port}" >/dev/null 2>&1; then
      return 0
    fi
  fi
  if command -v nc >/dev/null 2>&1; then
    if nc -z 127.0.0.1 "${port}" >/dev/null 2>&1; then
      return 0
    fi
  fi
  (echo >/dev/tcp/127.0.0.1/"${port}") >/dev/null 2>&1
}

stop_port() {
  local port="$1"
  local pids
  if ! command -v lsof >/dev/null 2>&1; then
    return 0
  fi
  if [[ "${DEV_STOP_USE_SUDO:-0}" == "1" ]] && command -v sudo >/dev/null 2>&1 && sudo -n true 2>/dev/null; then
    pids="$(sudo -n lsof -ti tcp:"${port}" 2>/dev/null || true)"
  else
    pids="$(lsof -ti tcp:"${port}" 2>/dev/null || true)"
  fi
  if [[ -n "${pids}" ]]; then
    echo "Stopping processes on port ${port}: ${pids}"
    if ! kill ${pids} 2>/dev/null; then
      if command -v sudo >/dev/null 2>&1; then
        sudo -n kill ${pids} 2>/dev/null || true
      fi
    fi
    for _ in $(seq 1 10); do
      if ! port_open "${port}"; then
        return 0
      fi
      sleep 0.3
    done
    if ! kill -9 ${pids} 2>/dev/null; then
      if command -v sudo >/dev/null 2>&1; then
        sudo -n kill -9 ${pids} 2>/dev/null || true
      fi
    fi
  fi
}

verify_ports_closed() {
  local ports=("$@")
  local busy=()
  for _ in $(seq 1 10); do
    busy=()
    for port in "${ports[@]}"; do
      if port_open "${port}"; then
        busy+=("${port}")
      fi
    done
    if [[ "${#busy[@]}" -eq 0 ]]; then
      return 0
    fi
    sleep 0.3
  done
  if [[ "${#busy[@]}" -gt 0 ]]; then
    echo "Ports still in use: ${busy[*]}"
    if [[ "${DEV_STOP_USE_SUDO:-0}" == "1" ]]; then
      echo "If this is local dev, run: sudo -v && DEV_STOP_USE_SUDO=1 ./dev-stop.sh"
    else
      echo "If this is local dev, run: sudo -v && DEV_STOP_USE_SUDO=1 ./dev-stop.sh"
    fi
    exit 1
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

verify_ports_closed 3000 3100 3030 8080 9099 8180 9199 4000 4100

echo "Done."
