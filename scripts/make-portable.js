import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const PORTABLE_DIR = path.join(ROOT, 'MacariBistrot-Portatile');

console.log('\n======================================================');
console.log('       CREAZIONE PACCHETTO MACARI BISTROT PORTATILE');
console.log('======================================================\n');

try {
  // 1) Esegui la build di produzione del frontend
  console.log('[1/7] Esecuzione build di produzione del frontend...');
  execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
  console.log('✓ Build completata con successo.\n');

  // 2) Pulisci e crea la cartella di output portatile
  console.log('[2/7] Preparazione cartelle di destinazione...');
  if (fs.existsSync(PORTABLE_DIR)) {
    console.log('  - Rilevata cartella precedente. Pulizia in corso...');
    fs.rmSync(PORTABLE_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(PORTABLE_DIR, { recursive: true });
  fs.mkdirSync(path.join(PORTABLE_DIR, 'bin'), { recursive: true });
  fs.mkdirSync(path.join(PORTABLE_DIR, 'frontend'), { recursive: true });
  console.log('✓ Cartelle create.\n');

  // 3) Copia il motore Node.js corrente (Zero-Install!)
  console.log('[3/7] Integrazione del motore Node.js (process.execPath)...');
  const nodeSrc = process.execPath;
  const nodeDest = path.join(PORTABLE_DIR, 'bin', 'node.exe');
  fs.copyFileSync(nodeSrc, nodeDest);
  console.log(`✓ Copiato: ${path.basename(nodeSrc)} -> bin/node.exe\n`);

  // 4) Copia ricorsiva del backend
  console.log('[4/7] Copia delle risorse del backend in corso...');
  const backendSrc = path.join(ROOT, 'backend');
  const backendDest = path.join(PORTABLE_DIR, 'backend');
  
  // Opzioni di copia: escludiamo file di ambiente locali o log
  fs.cpSync(backendSrc, backendDest, {
    recursive: true,
    filter: (src) => {
      const relative = path.relative(backendSrc, src);
      if (relative === '.env') return false; // Non copiamo il file .env locale (lo generiamo pulito)
      if (relative.startsWith('data' + path.sep + 'backups')) return false; // Escludiamo i backup passati
      return true;
    }
  });

  // Assicuriamoci che esista una configurazione .env predefinita nella cartella portatile
  const localEnvPath = path.join(ROOT, 'backend', '.env');
  const destEnvPath = path.join(backendDest, '.env');
  if (fs.existsSync(localEnvPath)) {
    console.log('  - Rilevato file .env esistente. Copia in corso...');
    fs.copyFileSync(localEnvPath, destEnvPath);
  } else {
    console.log('  - Nessun file .env trovato. Creazione di una configurazione di default...');
    fs.writeFileSync(
      destEnvPath,
      'PORT=4000\nHOST=0.0.0.0\nADMIN_PASSWORD=macari2024\nCORS_ORIGIN=*\n'
    );
  }
  console.log('✓ Risorse backend copiate.\n');

  // 5) Copia del frontend pre-compilato (dist)
  console.log('[5/7] Copia dei file statici del frontend...');
  const distSrc = path.join(ROOT, 'frontend', 'dist');
  const distDest = path.join(PORTABLE_DIR, 'frontend', 'dist');
  if (!fs.existsSync(distSrc)) {
    throw new Error('Cartella frontend/dist non trovata! La build non è andata a buon fine.');
  }
  fs.cpSync(distSrc, distDest, { recursive: true });
  console.log('✓ File statici copiati.\n');

  // 6) Generazione dello script batch avvio-portatile.bat
  console.log('[6/7] Generazione dello script di avvio rapido per Windows...');
  const batContent = `@echo off
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
start "Macari Server" /min "bin\\node.exe" "backend\\src\\server.js"

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
`;
  fs.writeFileSync(path.join(PORTABLE_DIR, 'avvio-portatile.bat'), batContent);
  console.log('✓ Script avvio-portatile.bat generato.\n');

  // 7) Generazione di Leggimi.txt
  console.log('[7/7] Scrittura del file informativo Leggimi.txt...');
  const readmeContent = `======================================================
  Macàri Bistrot — Versione Portatile per Chiavetta USB
======================================================

Questo pacchetto contiene l'applicazione Macàri Bistrot pre-configurata per essere eseguita interamente offline direttamente da una chiavetta USB (Zero-Install).

ISTRUZIONI PER L'USO:
1. Copia l'intera cartella "MacariBistrot-Portatile" sulla tua chiavetta USB.
2. Inserisci la chiavetta USB in qualsiasi computer Windows (del locale o personale).
3. Apri la cartella e fai doppio clic sul file "avvio-portatile.bat".
4. Il server si avvierà automaticamente e si aprirà il browser sul menù.

CARATTERISTICHE DELLA VERSIONE PORTATILE:
- FUNZIONA OVUNQUE: Non richiede che Node.js sia installato sul computer ospite. Utilizza il motore Node integrato nella cartella "bin".
- DATI PROTETTI: Il database e le immagini caricate (loghi/sfondi) risiedono sulla chiavetta e vengono aggiornati in tempo reale.
- CHIUSURA SICURA: Quando hai finito, premi un tasto qualsiasi sulla finestra nera del prompt dei comandi per arrestare il server e poter rimuovere in sicurezza la chiavetta.
- BACKUP AUTOMATICI: Ad ogni avvio, viene creata una copia di sicurezza del database nella cartella "backend/data/backups/" per proteggerti da eventuali disconnessioni accidentali della chiavetta.

Buon lavoro con Macàri Bistrot! 🍝
`;
  fs.writeFileSync(path.join(PORTABLE_DIR, 'Leggimi.txt'), readmeContent);
  console.log('✓ File Leggimi.txt generato.\n');

  console.log('======================================================');
  console.log('           PACCHETTO CREATO CON SUCCESSO!');
  console.log('======================================================');
  console.log(`Cartella pronta: ${PORTABLE_DIR}`);
  console.log('Copia questa cartella direttamente sulla tua chiavetta USB!\n');

} catch (err) {
  console.error('\n[ERRORE DURANTE LA CREAZIONE DEL PACCHETTO PORTATILE]:', err.message);
  process.exit(1);
}
