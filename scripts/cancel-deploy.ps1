param()

$ErrorActionPreference = "Stop"

Set-Location (Split-Path -Parent $PSScriptRoot)

Write-Output "Stopping and removing Flarum containers, networks, and volumes..."
docker compose -f docker-compose.flarum.yml down -v --remove-orphans
Write-Output "Flarum deployment cleanup successful."

