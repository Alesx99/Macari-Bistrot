import { Router } from 'express';

const router = Router();

/**
 * POST /api/auth/login
 * Body: { password }
 * Risponde { ok: true } se la password corrisponde a ADMIN_PASSWORD.
 * Il frontend salverà la password in localStorage e la invierà come
 * header `x-admin-password` per le successive operazioni admin.
 */
router.post('/login', (req, res) => {
  const expected = process.env.ADMIN_PASSWORD;
  const { password } = req.body ?? {};
  if (!expected) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD non configurata' });
  }
  if (password !== expected) {
    return res.status(401).json({ error: 'Password errata' });
  }
  res.json({ ok: true });
});

export default router;
