import { Router } from 'express';
import db from '../db/index.js';
import { requireAdmin } from '../middleware/auth.js';
import { validateMenuItem } from '../middleware/validate.js';

const router = Router();

/**
 * GET /api/menu
 * Restituisce tutti i piatti raggruppati per sezione, ordinati per `position`.
 * Endpoint pubblico (serve la vista pubblica del menù).
 */
router.get('/', (req, res) => {
  const onlyAvailable = req.query.available === 'true';
  const rows = db.prepare(`
    SELECT id, section, title, description, price, available, position
    FROM menu_items
    ${onlyAvailable ? 'WHERE available = 1' : ''}
    ORDER BY section ASC, position ASC, id ASC
  `).all();

  const items = rows.map(r => ({ ...r, available: !!r.available }));

  const grouped = items.reduce((acc, item) => {
    (acc[item.section] ||= []).push(item);
    return acc;
  }, {});

  res.json({ items, grouped, sections: Object.keys(grouped) });
});

/** GET /api/menu/:id */
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Piatto non trovato' });
  res.json({ ...row, available: !!row.available });
});

/** POST /api/menu  (admin) */
router.post('/', requireAdmin, validateMenuItem, (req, res) => {
  const { section, title, description, price, available, position } = req.body;

  // Se position non fornita o 0, mette in fondo alla sezione
  let pos = position;
  if (!pos) {
    const max = db.prepare(
      'SELECT COALESCE(MAX(position), -1) AS m FROM menu_items WHERE section = ?'
    ).get(section).m;
    pos = max + 1;
  }

  const info = db.prepare(`
    INSERT INTO menu_items (section, title, description, price, available, position)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(section, title, description, price, available, pos);

  const row = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ ...row, available: !!row.available });
});

/** PUT /api/menu/:id  (admin) */
router.put('/:id', requireAdmin, validateMenuItem, (req, res) => {
  const { section, title, description, price, available, position } = req.body;
  const info = db.prepare(`
    UPDATE menu_items
       SET section = ?, title = ?, description = ?, price = ?, available = ?,
           position = ?, updated_at = datetime('now')
     WHERE id = ?
  `).run(section, title, description, price, available, position, req.params.id);

  if (info.changes === 0) return res.status(404).json({ error: 'Piatto non trovato' });
  const row = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id);
  res.json({ ...row, available: !!row.available });
});

/** DELETE /api/menu/:id  (admin) */
router.delete('/:id', requireAdmin, (req, res) => {
  const info = db.prepare('DELETE FROM menu_items WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Piatto non trovato' });
  res.status(204).end();
});

/**
 * POST /api/menu/reorder  (admin)
 * Body: { section: string, orderedIds: number[] }
 * Aggiorna `position` per ogni id nell'ordine fornito.
 */
router.post('/reorder', requireAdmin, (req, res) => {
  const { section, orderedIds } = req.body ?? {};
  if (typeof section !== 'string' || !Array.isArray(orderedIds)) {
    return res.status(400).json({ error: 'Serve { section, orderedIds[] }' });
  }
  const upd = db.prepare(
    'UPDATE menu_items SET position = ?, updated_at = datetime(\'now\') WHERE id = ? AND section = ?'
  );
  const tx = db.transaction((ids) => {
    ids.forEach((id, idx) => upd.run(idx, id, section));
  });
  tx(orderedIds);
  res.json({ ok: true, updated: orderedIds.length });
});

export default router;
