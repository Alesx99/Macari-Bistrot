import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

import { initSchema } from './db/index.js';
import menuRouter from './routes/menu.js';
import settingsRouter from './routes/settings.js';
import uploadRouter from './routes/upload.js';
import authRouter from './routes/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carica backend/.env anche se Node parte da un'altra cartella (es. versione portatile)
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const PORT = Number(process.env.PORT ?? 4000);
const HOST = process.env.HOST ?? '0.0.0.0';
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? '*';

// Inizializza schema + valori default (idempotente)
initSchema();

const app = express();

// Sicurezza HTTP standard. CSP disabilitata in dev per non rompere Vite.
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({ origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',') }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Rate limit: protegge il login da brute force in caso di guest sospetti
const loginLimiter = rateLimit({
  windowMs: 5 * 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});

// Cartella uploads servita staticamente
const UPLOADS_DIR = path.resolve(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOADS_DIR, {
  maxAge: '7d',
  immutable: false
}));

// === API ===
app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }));
app.use('/api/auth', loginLimiter, authRouter);
app.use('/api/menu', menuRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/upload', uploadRouter);

// === SPA statica (build di produzione di Vite, se presente) ===
const FRONTEND_DIST = path.resolve(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get(/^\/(?!api|uploads).*/, (req, res) => {
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

// === Error handler globale ===
app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(err.status ?? 500).json({ error: err.message ?? 'Errore interno' });
});

/** Ritorna l'IPv4 LAN della macchina (prima interfaccia non interna). */
function getLanIp() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] ?? []) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return '127.0.0.1';
}

app.listen(PORT, HOST, () => {
  const lan = getLanIp();
  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║         Macàri Bistrot — server avviato                ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`  Locale:  http://localhost:${PORT}`);
  console.log(`  Rete:    http://${lan}:${PORT}`);
  console.log(`  Admin:   http://${lan}:${PORT}/admin`);
  console.log('');
  console.log('  In dev usa il frontend Vite su http://localhost:5173');
  console.log('  Per il QR code dal terminale: npm run qr');
  console.log('');
});
