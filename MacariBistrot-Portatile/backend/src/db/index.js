import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'macari.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Crea una copia di sicurezza automatica del database prima di aprirlo.
 * Mantiene solo gli ultimi 5 backup per non sovraccaricare la chiavetta USB.
 */
function backupDatabase() {
  try {
    if (!fs.existsSync(DB_PATH)) return; // Se il DB non esiste ancora, nessun backup da fare

    const backupsDir = path.join(DATA_DIR, 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    // Genera timestamp leggibile YYYYMMDD_HHMMSS
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_` +
                      `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    const backupName = `macari-auto-backup-${timestamp}.db`;
    const backupPath = path.join(backupsDir, backupName);

    // Copia fisica del database
    fs.copyFileSync(DB_PATH, backupPath);
    console.log(`[Backup] Copia di sicurezza automatica creata: backups/${backupName}`);

    // Rotazione: mantieni solo i 5 backup più recenti
    const files = fs.readdirSync(backupsDir)
      .filter(f => f.startsWith('macari-auto-backup-') && f.endsWith('.db'))
      .map(f => {
        const full = path.join(backupsDir, f);
        return { name: f, path: full, mtime: fs.statSync(full).mtimeMs };
      })
      .sort((a, b) => b.mtime - a.mtime); // Ordine decrescente (più recenti prima)

    if (files.length > 5) {
      const oldFiles = files.slice(5);
      for (const file of oldFiles) {
        fs.unlinkSync(file.path);
        console.log(`[Backup] Rimossa vecchia copia per rotazione: ${file.name}`);
      }
    }
  } catch (err) {
    console.error('[Backup] Errore durante il backup automatico:', err.message);
  }
}

// Esegui il backup prima di collegare il database
backupDatabase();

const sqlite = new DatabaseSync(DB_PATH);

// PRAGMA per affidabilita e performance su disco locale
sqlite.exec('PRAGMA journal_mode = WAL;');
sqlite.exec('PRAGMA foreign_keys = ON;');

/**
 * Compat layer per mantenere API sync comoda:
 * - db.prepare().get/all/run
 * - db.exec(...)
 * - db.transaction(fn)
 */
const db = {
  prepare(sql) {
    return sqlite.prepare(sql);
  },
  exec(sql) {
    return sqlite.exec(sql);
  },
  transaction(fn) {
    return (...args) => {
      sqlite.exec('BEGIN');
      try {
        const out = fn(...args);
        sqlite.exec('COMMIT');
        return out;
      } catch (err) {
        sqlite.exec('ROLLBACK');
        throw err;
      }
    };
  }
};

/**
 * Inizializza lo schema (idempotente).
 * - menu_items: piatti del menù
 * - settings:  configurazione del locale (logo, sfondi, font, filigrana)
 */
export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      section     TEXT    NOT NULL,
      title       TEXT    NOT NULL,
      description TEXT    DEFAULT '',
      price       REAL    NOT NULL DEFAULT 0,
      available   INTEGER NOT NULL DEFAULT 1,
      position    INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    DEFAULT (datetime('now')),
      updated_at  TEXT    DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_menu_section_position
      ON menu_items(section, position);

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Valori di default per le impostazioni (insert solo se non esistono già)
  const defaults = {
    restaurant_name:      'Macàri Bistrot',
    restaurant_subtitle:  'Cucina di terra e di mare',
    logo_path:            '',
    background_path:      '',
    watermark_path:       '',
    font_title:           'Playfair Display',
    font_body:            'Montserrat',
    print_margin_mm:      '15',
    print_font_size_pt:   '11',
    accent_color:         '#8B6F3E',
    currency_symbol:      '€',
    section_order:        JSON.stringify(['Antipasti', 'Primi', 'Secondi', 'Contorni', 'Dolci', 'Vini', 'Bevande']),
    watermark_pattern:    'none',
    watermark_pattern_size: '36',
    public_base_url:      ''
  };

  const insert = sqlite.prepare(
    'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
  );
  const insertMany = db.transaction((entries) => {
    for (const [k, v] of entries) insert.run(k, v);
  });
  insertMany(Object.entries(defaults));
}

export default db;
