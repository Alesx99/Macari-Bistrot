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
router.get('/', async (req, res) => {
  const onlyAvailable = req.query.available === 'true';
  const items = await db.getAllMenuItems(onlyAvailable);

  const grouped = items.reduce((acc, item) => {
    (acc[item.section] ||= []).push(item);
    return acc;
  }, {});

  res.json({ items, grouped, sections: Object.keys(grouped) });
});

/** GET /api/menu/:id */
router.get('/:id', async (req, res) => {
  const item = await db.getMenuItemById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Piatto non trovato' });
  res.json(item);
});

/** POST /api/menu  (admin) */
router.post('/', requireAdmin, validateMenuItem, async (req, res) => {
  const created = await db.createMenuItem(req.body);
  res.status(201).json(created);
});

/** PUT /api/menu/:id  (admin) */
router.put('/:id', requireAdmin, validateMenuItem, async (req, res) => {
  const updated = await db.updateMenuItem(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Piatto non trovato' });
  res.json(updated);
});

/** DELETE /api/menu/:id  (admin) */
router.delete('/:id', requireAdmin, async (req, res) => {
  const ok = await db.deleteMenuItem(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Piatto non trovato' });
  res.status(204).end();
});

/**
 * POST /api/menu/reorder  (admin)
 * Body: { section: string, orderedIds: number[] }
 * Aggiorna `position` per ogni id nell'ordine fornito.
 */
router.post('/reorder', requireAdmin, async (req, res) => {
  const { section, orderedIds } = req.body ?? {};
  if (typeof section !== 'string' || !Array.isArray(orderedIds)) {
    return res.status(400).json({ error: 'Serve { section, orderedIds[] }' });
  }
  await db.reorderMenuItems(section, orderedIds);
  res.json({ ok: true, updated: orderedIds.length });
});

export default router;
