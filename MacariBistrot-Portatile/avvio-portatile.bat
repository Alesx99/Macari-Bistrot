@echo off
title Macari Bistrot - Versione Portatile
cd /d "%~dp0"

echo ========================================================
echo   Macari Bistrot - AVVIO IN CORSO (Versione Portatile)
echo ========================================================
echo.
echo   Utilizzo del motore Node.js integrato nella chiavetta.
echo   Database locale e immagini incluse nel pacchetto.
echo.

rem Avvia il backend in background usando il node.exe integrato
start "Macari Server" /min "bin\node.exe" "backend\src\server.js"

echo   Attesa inizializzazione del server in corso (2 secondi)...
timeout /t 2 /nobreak >nul

rem Apri automaticamente il browser sul menu pubblico
echo   Apertura del browser in corso...
start http://localhost:4000

echo.
echo ========================================================
echo   MACARI BISTROT AVVIATO CON SUCCESSO!
echo ========================================================
echo   - Menu pubblico: http://localhost:4000
echo   - Area Gestionale: http://localhost:4000/admin
echo.
echo   Non chiudere questa finestra.
echo   Per arrestare il server in sicurezza: PREMI UN TASTO QUALSIASI.
echo ========================================================
echo.

pause

echo.
echo   Arresto del server in corso...
taskkill /f /fi "IMAGENAME eq node.exe" >nul 2>&1
echo   Arresto completato con successo.
timeout /t 1 >nul
exit
