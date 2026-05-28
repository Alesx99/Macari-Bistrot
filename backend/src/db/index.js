// ---------------------------------------------------------------------------
// Modulo database dual-mode: Supabase (online) oppure SQLite (locale)
// Se SUPABASE_URL è impostata nelle variabili d'ambiente → modalità online
// Altrimenti → SQLite locale come prima (comportamento invariato)
// ---------------------------------------------------------------------------

/** Restituisce true se il server gira in modalità online (Supabase). */
export function isOnlineMode() {
  return !!process.env.SUPABASE_URL;
}

// ---------------------------------------------------------------------------
// Oggetto `db` — espone la stessa interfaccia async in entrambe le modalità
// ---------------------------------------------------------------------------

let db;

if (isOnlineMode()) {
  // ---- Modalità ONLINE: delega tutto al modulo supabase.js ----
  const { supabaseDb } = await import('./supabase.js');
  db = supabaseDb;
} else {
  // ---- Modalità LOCALE: SQLite (codice originale, wrappato in async) ----
  const { DatabaseSync } = await import('node:sqlite');
  const path = await import('node:path');
  const fs = await import('node:fs');
  const { fileURLToPath } = await import('node:url');

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
      if (!fs.existsSync(DB_PATH)) return;

      const backupsDir = path.join(DATA_DIR, 'backups');
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
      }

      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_` +
                        `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

      const backupName = `macari-auto-backup-${timestamp}.db`;
      const backupPath = path.join(backupsDir, backupName);

      fs.copyFileSync(DB_PATH, backupPath);
      console.log(`[Backup] Copia di sicurezza automatica creata: backups/${backupName}`);

      // Rotazione: mantieni solo i 5 backup più recenti
      const files = fs.readdirSync(backupsDir)
        .filter(f => f.startsWith('macari-auto-backup-') && f.endsWith('.db'))
        .map(f => {
          const full = path.join(backupsDir, f);
          return { name: f, path: full, mtime: fs.statSync(full).mtimeMs };
        })
        .sort((a, b) => b.mtime - a.mtime);

      if (files.length > 5) {
        for (const file of files.slice(5)) {
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
  sqlite.exec('PRAGMA journal_mode = WAL;');
  sqlite.exec('PRAGMA foreign_keys = ON;');

  /**
   * Helper interno: layer di compatibilità SQLite con prepare/exec/transaction.
   */
  const rawDb = {
    prepare(sql) { return sqlite.prepare(sql); },
    exec(sql) { return sqlite.exec(sql); },
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

  // -----------------------------------------------------------------------
  // Interfaccia async unificata per la modalità SQLite
  // -----------------------------------------------------------------------
  db = {
    async getAllMenuItems(onlyAvailable = false) {
      const rows = rawDb.prepare(`
        SELECT id, section, title, description, price, available, position
        FROM menu_items
        ${onlyAvailable ? 'WHERE available = 1' : ''}
        ORDER BY section ASC, position ASC, id ASC
      `).all();
      // Converte available da intero a booleano per coerenza con Supabase
      return rows.map(r => ({ ...r, available: !!r.available }));
    },

    async getMenuItemById(id) {
      const row = rawDb.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
      if (!row) return null;
      return { ...row, available: !!row.available };
    },

    async createMenuItem({ section, title, description, price, available, position }) {
      let pos = position;
      if (!pos) {
        const max = rawDb.prepare(
          'SELECT COALESCE(MAX(position), -1) AS m FROM menu_items WHERE section = ?'
        ).get(section).m;
        pos = max + 1;
      }

      const info = rawDb.prepare(`
        INSERT INTO menu_items (section, title, description, price, available, position)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(section, title, description, price, available ? 1 : 0, pos);

      const row = rawDb.prepare('SELECT * FROM menu_items WHERE id = ?').get(info.lastInsertRowid);
      return { ...row, available: !!row.available };
    },

    async updateMenuItem(id, { section, title, description, price, available, position }) {
      const info = rawDb.prepare(`
        UPDATE menu_items
           SET section = ?, title = ?, description = ?, price = ?, available = ?,
               position = ?, updated_at = datetime('now')
         WHERE id = ?
      `).run(section, title, description, price, available ? 1 : 0, position, id);

      if (info.changes === 0) return null;
      const row = rawDb.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
      return { ...row, available: !!row.available };
    },

    async deleteMenuItem(id) {
      const info = rawDb.prepare('DELETE FROM menu_items WHERE id = ?').run(id);
      return info.changes > 0;
    },

    async reorderMenuItems(section, orderedIds) {
      const upd = rawDb.prepare(
        "UPDATE menu_items SET position = ?, updated_at = datetime('now') WHERE id = ? AND section = ?"
      );
      const tx = rawDb.transaction((ids) => {
        ids.forEach((itemId, idx) => upd.run(idx, itemId, section));
      });
      tx(orderedIds);
    },

    async getAllSettings() {
      const rows = rawDb.prepare('SELECT key, value FROM settings').all();
      return rows.reduce((acc, r) => { acc[r.key] = r.value; return acc; }, {});
    },

    async upsertSettings(entries) {
      const upd = rawDb.prepare(
        'INSERT INTO settings (key, value) VALUES (?, ?) ' +
        'ON CONFLICT(key) DO UPDATE SET value = excluded.value'
      );
      const tx = rawDb.transaction((rows) => {
        for (const [k, v] of rows) upd.run(k, v);
      });
      tx(entries);
      return this.getAllSettings();
    }
  };
}

// ---------------------------------------------------------------------------
// Inizializzazione schema — necessaria solo in modalità SQLite
// (In Supabase le tabelle sono pre-create via Dashboard / Migration)
// ---------------------------------------------------------------------------
export async function initSchema() {
  if (isOnlineMode()) {
    console.log('[DB] Modalità online (Supabase) — schema gestito da remoto');
    return;
  }

  // Import dinamici necessari in modalità locale
  const { DatabaseSync } = await import('node:sqlite');
  const path = await import('node:path');
  const fs = await import('node:fs');
  const { fileURLToPath } = await import('node:url');

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');
  const DB_PATH = path.join(DATA_DIR, 'macari.db');

  const sqlite = new DatabaseSync(DB_PATH);

  sqlite.exec(`
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
    print_section_title_center: 'false',
    print_section_title_font: 'Playfair Display',
    print_section_title_size_em: '1.4',
    print_body_font: 'Playfair Display',
    print_body_size_em: '1',
    print_subtitle_font: 'Montserrat',
    print_subtitle_size_em: '0.88',
    print_frame_enabled: 'false',
    print_frame_style: 'classic',
    print_frame_color: '#8B6F3E',
    print_frame_thickness: '2',
    accent_color:         '#8B6F3E',
    currency_symbol:      '€',
    section_order:        JSON.stringify(['Antipasti', 'Primi', 'Secondi', 'Contorni', 'Dolci', 'Vini', 'Bevande']),
    watermark_pattern:    'none',
    watermark_pattern_size: '36',
    watermark_pattern_color: '#3c3c3c',
    watermark_pattern_opacity: '0.18',
    watermark_pattern_thickness: '1',
    watermark_pattern_frequency: '4',
    watermark_pattern_density: '1',
    print_paper_color:    '#ffffff',
    print_paper_opacity:  '1',
    print_paper_intensity: '100',
    public_base_url:      ''
  };

  const insert = sqlite.prepare(
    'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
  );

  sqlite.exec('BEGIN');
  try {
    for (const [k, v] of Object.entries(defaults)) insert.run(k, v);
    sqlite.exec('COMMIT');
  } catch (err) {
    sqlite.exec('ROLLBACK');
    throw err;
  }
}

export default db;
