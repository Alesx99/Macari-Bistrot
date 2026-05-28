/**
 * Validazione/sanitizzazione minima per i piatti del menu.
 * Niente librerie esterne per restare leggeri.
 */
export function validateMenuItem(req, res, next) {
  const { section, title, description, price, available, position } = req.body ?? {};

  const errors = [];

  if (typeof section !== 'string' || section.trim().length === 0 || section.length > 60) {
    errors.push('section richiesta (1-60 caratteri)');
  }
  if (typeof title !== 'string' || title.trim().length === 0 || title.length > 120) {
    errors.push('title richiesto (1-120 caratteri)');
  }
  if (description != null && (typeof description !== 'string' || description.length > 500)) {
    errors.push('description deve essere una stringa <= 500 caratteri');
  }
  const priceNum = Number(price);
  if (!Number.isFinite(priceNum) || priceNum < 0 || priceNum > 9999) {
    errors.push('price deve essere un numero tra 0 e 9999');
  }
  if (available != null && typeof available !== 'boolean' && available !== 0 && available !== 1) {
    errors.push('available deve essere booleano');
  }
  if (position != null && !Number.isInteger(Number(position))) {
    errors.push('position deve essere un intero');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Dati non validi', details: errors });
  }

  req.body = {
    section: section.trim(),
    title: title.trim(),
    description: (description ?? '').toString().trim(),
    price: priceNum,
    available: available == null ? 1 : (available ? 1 : 0),
    position: position == null ? 0 : Number(position)
  };
  next();
}
