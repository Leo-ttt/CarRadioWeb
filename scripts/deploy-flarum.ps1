param()

$ErrorActionPreference = "Stop"

function Update-Status {
  param(
    [Parameter(Mandatory=$true)][string]$Status,
    [Parameter(Mandatory=$true)][string]$Log
  )
  Write-Output ("STATUS:{0} LOG:{1}" -f $Status, $Log)
}

Set-Location (Split-Path -Parent $PSScriptRoot)

# Log messages in ASCII only so Node on Windows gets no encoding issues
Update-Status -Status "deploying_pull" -Log "Preparing environment..."

$appUrl = $null

if (Test-Path ".\backend\config.env") {
  $line = Select-String -Path ".\backend\config.env" -Pattern '^FRONTEND_URL=' -SimpleMatch | Select-Object -First 1
  if ($line) { $appUrl = ($line.Line -split '=',2)[1].Trim() }
}

if (-not $appUrl -and (Test-Path ".\.env")) {
  $line = Select-String -Path ".\.env" -Pattern '^VITE_APP_URL=' -SimpleMatch | Select-Object -First 1
  if ($line) { $appUrl = ($line.Line -split '=',2)[1].Trim() }
}

if (-not $appUrl -and $env:FRONTEND_URL) { $appUrl = $env:FRONTEND_URL }
if (-not $appUrl -and $env:VITE_APP_URL) { $appUrl = $env:VITE_APP_URL }

if (-not $appUrl) {
  Update-Status -Status "failed" -Log "Missing FRONTEND_URL. Set it in backend/config.env or VITE_APP_URL in .env"
  exit 1
}

$finalFlarumUrl = $null
try {
  $uri = [System.Uri]$appUrl
  $hostPart = $uri.Host
  $scheme = $uri.Scheme
  $port = $uri.Port

  if ($hostPart -like "*localhost*") {
    # 本地：Flarum 容器映射在 8888，用 localhost:8888 才能打开论坛；forum.localhost:3001 会落到 Vite 主站
    $finalFlarumUrl = "${scheme}://localhost:8888"
  } else {
    $mainDomain = $hostPart
    $finalFlarumUrl = "https://forum.$mainDomain"
  }
} catch {
  Update-Status -Status "failed" -Log ("Invalid FRONTEND_URL or VITE_APP_URL: " + $appUrl)
  exit 1
}

# 仅用字母数字，避免 + / = 在表单提交时被误解析导致 Access denied
$chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
$sb = New-Object System.Text.StringBuilder 24
for ($i = 0; $i -lt 24; $i++) { [void]$sb.Append($chars[(Get-Random -Maximum $chars.Length)]) }
$dbPassword = $sb.ToString()

@"
FLARUM_BASE_URL=$finalFlarumUrl
DB_PASSWORD=$dbPassword
"@ | Set-Content -Path ".\.env.flarum" -Encoding UTF8

# -v 删除命名卷（flarum_db_data、flarum_data），确保全新安装
$ErrorActionPreference = 'Continue'
docker compose -f docker-compose.flarum.yml --env-file .env.flarum down -v 2>&1 | Out-Null
Start-Sleep -Seconds 2
$ErrorActionPreference = 'Stop'
# 若曾用 mondedie 镜像，清理旧绑定目录
if (Test-Path ".\flarum\assets") { Remove-Item -Recurse -Force ".\flarum\assets" }
if (Test-Path ".\flarum\extensions") { Remove-Item -Recurse -Force ".\flarum\extensions" }

Update-Status -Status "deploying_pull" -Log "Step 1/3: Pulling images..."
$errPrev = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
$errFile = [System.IO.Path]::GetTempFileName()
docker compose -f docker-compose.flarum.yml --env-file .env.flarum pull 2> $errFile
$pullExit = $LASTEXITCODE
$ErrorActionPreference = $errPrev
if ($pullExit -ne 0) {
  $errText = ""
  if (Test-Path $errFile) {
    $errText = (Get-Content $errFile -Raw -ErrorAction SilentlyContinue) -replace "[\r\n]+", " "
    $errText = $errText.Trim()
    if ($errText.Length -gt 180) { $errText = $errText.Substring(0, 177) + "..." }
    Remove-Item $errFile -Force -ErrorAction SilentlyContinue
  }
  if ($errText -match "dockerDesktopLinuxEngine|cannot find the file specified|Cannot connect to the Docker daemon") {
    $errText = "Docker not running. Start Docker Desktop and try again."
  }
  if (-not $errText) { $errText = "Docker pull failed (exit code $pullExit). Start Docker Desktop or run: .\scripts\deploy-flarum.ps1 in PowerShell to see the error." }
  Update-Status -Status "failed" -Log $errText
  exit 1
}
if (Test-Path $errFile) { Remove-Item $errFile -Force -ErrorAction SilentlyContinue }

Update-Status -Status "deploying_db" -Log "Step 2/3: Starting database..."
$ErrorActionPreference = 'Continue'
docker compose -f docker-compose.flarum.yml --env-file .env.flarum up -d db 2>&1 | Out-Null
$ErrorActionPreference = 'Stop'

Start-Sleep -Seconds 10

Update-Status -Status "deploying_app" -Log "Step 3/3: Starting Flarum..."
$ErrorActionPreference = 'Continue'
docker compose -f docker-compose.flarum.yml --env-file .env.flarum up -d flarum 2>&1 | Out-Null
$ErrorActionPreference = 'Stop'

Start-Sleep -Seconds 5
$ErrorActionPreference = 'Continue'
$flarumId = docker compose -f docker-compose.flarum.yml ps -q flarum 2>$null
$ErrorActionPreference = 'Stop'
if (-not $flarumId) {
  Update-Status -Status "failed" -Log "Flarum container failed to start. Check Docker logs."
  docker compose -f docker-compose.flarum.yml logs
  exit 1
}

Update-Status -Status "deployed" -Log "Deployment succeeded."
Write-Output "FLARUM_URL_IS=$finalFlarumUrl"
exit 0
