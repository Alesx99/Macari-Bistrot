import { Router } from 'express';
import db from '../db/index.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

/** Chiavi consentite (whitelist per evitare scritture arbitrarie). */
const ALLOWED_KEYS = new Set([
  'restaurant_name',
  'restaurant_subtitle',
  'logo_path',
  'background_path',
  'watermark_path',
  'font_title',
  'font_body',
  'print_margin_mm',
  'print_font_size_pt',
  'accent_color',
  'currency_symbol',
  'section_order',
  'watermark_pattern',
  'watermark_pattern_size',
  'public_base_url'
]);

function readAllSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  return rows.reduce((acc, r) => { acc[r.key] = r.value; return acc; }, {});
}

/** GET /api/settings — pubblico (serve a public view e admin) */
router.get('/', (req, res) => {
  res.json(readAllSettings());
});

/**
 * PUT /api/settings  (admin)
 * Body: { key: value, key2: value2, ... }
 * Solo le chiavi nella whitelist vengono aggiornate.
 */
router.put('/', requireAdmin, (req, res) => {
  const incoming = req.body ?? {};
  const upd = db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ' +
    'ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  );
  const tx = db.transaction((entries) => {
    for (const [k, v] of entries) {
      if (!ALLOWED_KEYS.has(k)) continue;
      const value = v == null ? '' : String(v);
      if (value.length > 5000) continue; // safety: niente blob giganti via JSON
      upd.run(k, value);
    }
  });
  tx(Object.entries(incoming));
  res.json(readAllSettings());
});

export default router;
