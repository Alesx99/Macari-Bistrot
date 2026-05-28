$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==============================================="
Write-Host "  Macari Bistrot - Build installer Windows"
Write-Host "==============================================="
Write-Host ""

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$stage = Join-Path $root "installer\windows\build\app"
$output = Join-Path $root "installer\windows\output"
$iss = Join-Path $root "installer\windows\MacariBistrot.iss"

Write-Host "[1/6] Build frontend production..."
Push-Location $root
npm run build
Pop-Location

Write-Host "[2/6] Verifica dipendenze backend..."
if (-not (Test-Path (Join-Path $root "backend\node_modules"))) {
  throw "backend\node_modules mancante. Esegui prima: npm run install:all"
}

Write-Host "[3/6] Prepara cartella staging..."
if (Test-Path $stage) {
  Remove-Item $stage -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $stage | Out-Null
New-Item -ItemType Directory -Force -Path $output | Out-Null

Write-Host "[4/6] Copia runtime app..."
Copy-Item -Recurse -Force (Join-Path $root "backend") (Join-Path $stage "backend")
Copy-Item -Recurse -Force (Join-Path $root "frontend\dist") (Join-Path $stage "frontend\dist")
Copy-Item -Recurse -Force (Join-Path $root "scripts") (Join-Path $stage "scripts")
Copy-Item -Force (Join-Path $root "README.md") (Join-Path $stage "README.md")
Copy-Item -Force (Join-Path $root "SETUP_NUOVO_PC.md") (Join-Path $stage "SETUP_NUOVO_PC.md")

# Non distribuire file dev superflui lato backend
$removePaths = @(
  "backend\.env",
  "backend\.env.example",
  "backend\src\db\seed.js"
)
foreach ($rel in $removePaths) {
  $target = Join-Path $stage $rel
  if (Test-Path $target) { Remove-Item -Force $target }
}

Write-Host "[5/6] Verifica Inno Setup (ISCC)..."
$iscc = Get-Command ISCC.exe -ErrorAction SilentlyContinue
if (-not $iscc) {
  $candidates = @(
    "C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
    "C:\Program Files\Inno Setup 6\ISCC.exe"
  )
  $resolved = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
  if ($resolved) {
    $iscc = @{ Source = $resolved }
  } else {
    throw "ISCC.exe non trovato. Installa Inno Setup e aggiungi ISCC al PATH."
  }
}

Write-Host "[6/6] Compila installer..."
Push-Location (Join-Path $root "installer\windows")
& $iscc.Source "MacariBistrot.iss"
Pop-Location

Write-Host ""
Write-Host "Build completata. Installer disponibile in:"
Write-Host "  $output"
Write-Host ""
