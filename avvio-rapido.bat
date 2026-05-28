@echo off
setlocal EnableExtensions

title Macari Bistrot - Avvio rapido

rem Vai sempre nella cartella del progetto (dove si trova questo .bat)
cd /d "%~dp0"
if errorlevel 1 goto :fail_root

rem Forza priorita al Node di sistema (evita runtime embedded di altri tool)
if exist "C:\Program Files\nodejs\node.exe" (
  set "PATH=C:\Program Files\nodejs;%PATH%"
)

echo.
echo ========================================
echo   Macari Bistrot - avvio sviluppo
echo ========================================
echo   Cartella: %CD%
echo.

where node >nul 2>&1
if errorlevel 1 goto :fail_node

where npm >nul 2>&1
if errorlevel 1 goto :fail_npm

for /f "tokens=1 delims=." %%a in ('node -p "process.versions.node"') do set "NODE_MAJOR=%%a"
if %NODE_MAJOR% LSS 24 goto :fail_node_version

if not exist "backend\package.json" goto :fail_backend_folder
if not exist "frontend\package.json" goto :fail_frontend_folder

set "NEED_INSTALL=0"
if not exist "backend\node_modules" set "NEED_INSTALL=1"
if not exist "frontend\node_modules" set "NEED_INSTALL=1"

if "%NEED_INSTALL%"=="1" (
  echo [INFO] Dipendenze mancanti: avvio installazione automatica...
  call npm run install:all
  if errorlevel 1 goto :fail_install

  if not exist "backend\data\macari.db" (
    echo [INFO] Inizializzazione database seed...
    call npm run seed
    if errorlevel 1 goto :fail_seed
  )
)

echo [OK] Avvio backend su 4000...
start "Macari Backend" cmd /k "cd /d ""%CD%"" && npm run dev:backend"

timeout /t 2 /nobreak >nul

echo [OK] Avvio frontend su 5173...
start "Macari Frontend" cmd /k "cd /d ""%CD%"" && npm run dev:frontend"

echo.
echo Pronto.
echo   Menu pubblico:  http://localhost:5173/
echo   Admin:          http://localhost:5173/admin
echo   Stampa:         http://localhost:5173/print
echo   API:            http://localhost:4000/api/health
echo.
echo Chiudi le due finestre Backend/Frontend per fermare i server.
echo.
pause
exit /b 0

:fail_root
echo [ERRORE] Impossibile entrare nella cartella del progetto.
goto :end_fail

:fail_node
echo [ERRORE] Node.js non trovato nel PATH.
echo Installa Node 24+ e riavvia il terminale/PC.
goto :end_fail

:fail_npm
echo [ERRORE] npm non trovato nel PATH.
goto :end_fail

:fail_node_version
echo [ERRORE] Versione Node non supportata per questo setup: v%NODE_MAJOR%.
echo Usa Node 24 LTS (o superiore compatibile).
echo.
echo Suggerimento rapido con nvm-windows:
echo   nvm install 24.11.0
echo   nvm use 24.11.0
echo.
goto :end_fail

:fail_backend_folder
echo [ERRORE] Cartella backend non valida o incompleta.
goto :end_fail

:fail_frontend_folder
echo [ERRORE] Cartella frontend non valida o incompleta.
goto :end_fail

:fail_install
echo [ERRORE] Installazione dipendenze fallita.
echo Prova manualmente: npm run install:all
goto :end_fail

:fail_seed
echo [ERRORE] Seed database fallito.
echo Prova manualmente: npm run seed
goto :end_fail

:end_fail
echo.
pause
exit /b 1
