/**
 * Middleware di autenticazione admin molto semplice basato su password.
 * Adatto a un'app che gira solo in rete locale: confronta l'header
 * `x-admin-password` con la password in ADMIN_PASSWORD.
 *
 * Per un locale, questo è sufficiente: la rete è fidata e l'app non è
 * esposta su Internet. Non usare in scenari pubblici senza HTTPS/JWT.
 */
export function requireAdmin(req, res, next) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD non configurata sul server' });
  }
  const provided = req.header('x-admin-password');
  if (!provided || provided !== expected) {
    return res.status(401).json({ error: 'Credenziali admin non valide' });
  }
  next();
}
