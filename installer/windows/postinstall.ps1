$ErrorActionPreference = "Stop"

param(
  [Parameter(Mandatory = $true)][string]$InstallDir,
  [Parameter(Mandatory = $true)][string]$NodePath,
  [switch]$EnableFirewall,
  [switch]$EnableAutoStart
)

$backendDir = Join-Path $InstallDir "backend"
$envPath = Join-Path $backendDir ".env"
$uploadsDir = Join-Path $backendDir "uploads"
$dataDir = Join-Path $backendDir "data"
$serverScript = Join-Path $backendDir "src\server.js"

if (-not (Test-Path $uploadsDir)) { New-Item -ItemType Directory -Path $uploadsDir -Force | Out-Null }
if (-not (Test-Path $dataDir)) { New-Item -ItemType Directory -Path $dataDir -Force | Out-Null }

if (-not (Test-Path $envPath)) {
  @"
PORT=4000
HOST=0.0.0.0
NODE_ENV=production
CORS_ORIGIN=*
ADMIN_PASSWORD=macari2024
MAX_UPLOAD_MB=5
"@ | Set-Content -Path $envPath -Encoding ASCII
}

if ($EnableFirewall) {
  netsh advfirewall firewall add rule name="Macari Bistrot 4000 TCP" dir=in action=allow protocol=TCP localport=4000 profile=private | Out-Null
}

if ($EnableAutoStart) {
  $taskName = "MacariBistrotServer"
  schtasks /Delete /TN $taskName /F | Out-Null 2>$null
  $taskCmd = "`"$NodePath`" `"$serverScript`""
  schtasks /Create /SC ONLOGON /RL HIGHEST /TN $taskName /TR $taskCmd /F | Out-Null
}
