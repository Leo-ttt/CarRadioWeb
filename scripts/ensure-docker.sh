#!/bin/bash
# Production only: ensure Docker Engine + Compose are installed (one-time).
# Called from deploy-flarum.sh when AUTO_INSTALL_DOCKER=1. Requires sudo for first-time install.
set -e

update_status() { echo "STATUS:$1 LOG:$2"; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

update_status "deploying_pull" "Checking Docker..."
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  update_status "deploying_pull" "Docker already installed."
  exit 0
fi

update_status "deploying_pull" "Installing Docker Engine (one-time, may take 1-2 min)..."
if [[ $EUID -ne 0 ]]; then
  if sudo -n true 2>/dev/null; then
    sudo sh -c 'curl -fsSL https://get.docker.com | sh'
    sudo usermod -aG docker "$(whoami)" 2>/dev/null || true
  else
    update_status "failed" "Docker not installed. Run once: sudo $SCRIPT_DIR/ensure-docker.sh"
    exit 1
  fi
else
  curl -fsSL https://get.docker.com | sh
  [[ -n "${SUDO_USER:-}" ]] && usermod -aG docker "$SUDO_USER" 2>/dev/null || true
fi

# Run the rest of the deploy in a process that has the docker group (so docker commands work in this session)
update_status "deploying_pull" "Docker installed. Proceeding with Flarum deploy..."
exec sg docker -c "cd $SCRIPT_DIR/.. && AUTO_INSTALL_DOCKER=0 bash $SCRIPT_DIR/deploy-flarum.sh"
