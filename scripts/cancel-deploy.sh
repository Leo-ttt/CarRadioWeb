#!/bin/bash
# This script stops and removes all containers, networks, and volumes
# defined in the docker-compose.flarum.yml file.

set -e

# Navigate to the project root directory
cd "$(dirname "$0")/.."

echo "Stopping and removing Flarum containers, networks, and volumes..."

# The -v flag is crucial for removing the named volumes and ensuring a clean state.
docker-compose -f docker-compose.flarum.yml down -v --remove-orphans

echo "Flarum deployment cleanup successful."
