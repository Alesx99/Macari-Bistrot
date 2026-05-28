#!/usr/bin/env node
/**
 * show-qr.js
 *
 * Stampa nel terminale l'URL di accesso al menu in rete locale
 * e il relativo QR code da mostrare al proprietario / ai clienti.
 *
 * Uso:
 *   node scripts/show-qr.js             # legge la porta da backend/.env (default 4000)
 *   node scripts/show-qr.js --port 5173 # forza una porta diversa
 *   node scripts/show-qr.js --path /admin
 *
 * Dipende dal pacchetto `qrcode-terminal`. Installalo una volta sola con:
 *   npm install -g qrcode-terminal
 * oppure (consigliato) localmente alla root:
 *   npm install --no-save qrcode-terminal
 */
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// === Parsing semplice degli argomenti ===
const argv = process.argv.slice(2);
function flag(name, def) {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : def;
}

// === Lettura porta dal .env del backend (se esiste) ===
function readPortFromEnv() {
  try {
    const envPath = path.resolve(__dirname, '..', 'backend', '.env');
    if (!fs.existsSync(envPath)) return null;
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/^PORT\s*=\s*(\d+)/m);
    return match ? Number(match[1]) : null;
  } catch {
    return null;
  }
}

const PORT = Number(flag('port', readPortFromEnv() ?? 4000));
const PATH = flag('path', '/');

// === Trova IP LAN IPv4 (escludendo loopback / VPN noti) ===
function getLanIps() {
  const ifaces = os.networkInterfaces();
  const out = [];
  for (const [name, list] of Object.entries(ifaces)) {
    for (const iface of list ?? []) {
      if (iface.family !== 'IPv4' || iface.internal) continue;
      // Filtri opzionali per interfacce virtuali frequenti su Windows
      if (/vEthernet|VirtualBox|VMware|Loopback|Hyper-V/i.test(name)) {
        out.push({ name, address: iface.address, preferred: false });
      } else {
        out.push({ name, address: iface.address, preferred: true });
      }
    }
  }
  // Le interfacce "preferite" (Wi-Fi/Ethernet fisico) vengono prima
  out.sort((a, b) => Number(b.preferred) - Number(a.preferred));
  return out;
}

const ips = getLanIps();
if (ips.length === 0) {
  console.error('Nessun IP di rete locale trovato. Sei connesso al Wi-Fi?');
  process.exit(1);
}

const primary = ips[0];
const url = `http://${primary.address}:${PORT}${PATH}`;

// === Genera il QR code ===
let qrcode;
try {
  qrcode = require('qrcode-terminal');
} catch {
  console.error('');
  console.error('Pacchetto `qrcode-terminal` non installato.');
  console.error('Esegui una volta sola dalla root del progetto:');
  console.error('  npm install --no-save qrcode-terminal');
  console.error('');
  console.error('Intanto ecco l\'URL da condividere manualmente:');
  console.error(`  ${url}`);
  process.exit(1);
}

console.log('');
console.log('╔══════════════════════════════════════════════════════╗');
console.log('║   Macàri Bistrot — Accesso rapido al menu in locale  ║');
console.log('╚══════════════════════════════════════════════════════╝');
console.log('');
console.log(`  Interfaccia: ${primary.name}`);
console.log(`  URL:         ${url}`);
console.log('');
if (ips.length > 1) {
  console.log('  Altre interfacce disponibili:');
  ips.slice(1).forEach(i => console.log(`    - ${i.name}: http://${i.address}:${PORT}${PATH}`));
  console.log('');
}

qrcode.generate(url, { small: true }, (qr) => {
  console.log(qr);
  console.log('  Inquadra il QR con uno smartphone connesso alla stessa rete.');
  console.log('  Premi Ctrl+C per chiudere.');
  console.log('');
});
