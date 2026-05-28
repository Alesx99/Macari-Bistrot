import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';

/**
 * Carica menu + settings da backend e fornisce un metodo di refresh.
 */
export function useMenu(onlyAvailable = false) {
  const [menu, setMenu] = useState({ items: [], grouped: {}, sections: [] });
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, s] = await Promise.all([api.getMenu(onlyAvailable), api.getSettings()]);
      setMenu(m);
      setSettings(s);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [onlyAvailable]);

  useEffect(() => { reload(); }, [reload]);

  return { menu, settings, loading, error, reload, setSettings };
}

export function formatPrice(value, symbol = '€') {
  const num = Number(value);
  if (!Number.isFinite(num)) return '';
  return `${num.toFixed(2).replace('.', ',')} ${symbol}`;
}

/**
 * Ritorna le sezioni del menu nell'ordine scelto dall'admin.
 * L'ordine viene letto da settings.section_order (JSON array string).
 * Se mancano sezioni nel setting, vengono accodate in ordine naturale.
 */
export function getOrderedSections(menuSections = [], settings = {}) {
  const fallback = [...menuSections];
  const raw = settings.section_order;
  if (!raw) return fallback;

  try {
    const preferred = JSON.parse(raw);
    if (!Array.isArray(preferred)) return fallback;

    const existing = new Set(menuSections);
    const ordered = preferred.filter((s) => typeof s === 'string' && existing.has(s));
    const missing = menuSections.filter((s) => !ordered.includes(s));
    return [...ordered, ...missing];
  } catch {
    return fallback;
  }
}
