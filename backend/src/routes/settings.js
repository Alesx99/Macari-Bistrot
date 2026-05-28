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
  'watermark_pattern_color',
  'watermark_pattern_opacity',
  'watermark_pattern_thickness',
  'watermark_pattern_frequency',
  'watermark_pattern_density',
  'print_paper_color',
  'print_paper_opacity',
  'print_paper_intensity',
  'public_base_url'
]);

/** GET /api/settings — pubblico (serve a public view e admin) */
router.get('/', async (req, res) => {
  const settings = await db.getAllSettings();
  res.json(settings);
});

/**
 * PUT /api/settings  (admin)
 * Body: { key: value, key2: value2, ... }
 * Solo le chiavi nella whitelist vengono aggiornate.
 */
router.put('/', requireAdmin, async (req, res) => {
  const incoming = req.body ?? {};

  // Filtra le chiavi consentite e sanifica i valori
  const filtered = Object.entries(incoming).filter(([k, v]) => {
    if (!ALLOWED_KEYS.has(k)) return false;
    const value = v == null ? '' : String(v);
    if (value.length > 5000) return false; // safety: niente blob giganti via JSON
    return true;
  }).map(([k, v]) => [k, v == null ? '' : String(v)]);

  const allSettings = await db.upsertSettings(filtered);
  res.json(allSettings);
});

export default router;
