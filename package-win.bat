@echo off
setlocal EnableExtensions

title Macari Bistrot - Build installer Windows

cd /d "%~dp0"
if errorlevel 1 (
  echo [ERRORE] Impossibile accedere alla cartella del progetto.
  pause
  exit /b 1
)

rem Forza priorita al Node di sistema (evita runtime embedded di altri tool)
if exist "C:\Program Files\nodejs\node.exe" (
  set "PATH=C:\Program Files\nodejs;%PATH%"
)

echo.
echo ===============================================
echo   Macari Bistrot - Packaging Windows
echo ===============================================
echo.

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERRORE] npm non trovato nel PATH.
  echo Installa Node.js 24 LTS e riprova.
  echo.
  pause
  exit /b 1
)

echo Avvio comando: npm run package:win
echo.
call npm run package:win
set "RC=%ERRORLEVEL%"

echo.
if not "%RC%"=="0" (
  echo [ERRORE] Packaging fallito con codice %RC%.
  echo Controlla i log sopra (Inno Setup/ISCC, build frontend, dipendenze).
  echo.
  pause
  exit /b %RC%
)

echo [OK] Packaging completato.
echo Output atteso: installer\windows\output\MacariBistrot-Setup.exe
echo.
pause
exit /b 0
