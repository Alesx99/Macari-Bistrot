/**
 * Piccolo client HTTP per il backend Macàri.
 * - Aggiunge automaticamente l'header `x-admin-password` se presente in localStorage.
 * - Gestisce JSON e upload multipart in modo trasparente.
 * - Usa VITE_API_BASE_URL per puntare al backend remoto (Render) quando deployato su GitHub Pages.
 */

// Base URL del backend: vuoto in sviluppo locale (il proxy Vite ci pensa),
// valorizzato in produzione per puntare al server Render.
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const ADMIN_PWD_KEY = 'macari_admin_pwd';

export function setAdminPassword(pwd) {
  if (pwd) localStorage.setItem(ADMIN_PWD_KEY, pwd);
  else localStorage.removeItem(ADMIN_PWD_KEY);
}

export function getAdminPassword() {
  return localStorage.getItem(ADMIN_PWD_KEY) || '';
}

export function isAdminLogged() {
  return Boolean(getAdminPassword());
}

async function request(url, { method = 'GET', body, isForm = false } = {}) {
  const headers = {};
  const pwd = getAdminPassword();
  if (pwd) headers['x-admin-password'] = pwd;
  if (!isForm && body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers,
    body: isForm ? body : (body !== undefined ? JSON.stringify(body) : undefined)
  });

  if (res.status === 204) return null;

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const msg = data?.error || `Errore HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.details = data?.details;
    throw err;
  }
  return data;
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return text; }
}

export const api = {
  // === Menu ===
  getMenu: (onlyAvailable = false) =>
    request(`/api/menu${onlyAvailable ? '?available=true' : ''}`),
  createItem:   (item)        => request('/api/menu',  { method: 'POST',   body: item }),
  updateItem:   (id, item)    => request(`/api/menu/${id}`, { method: 'PUT',  body: item }),
  deleteItem:   (id)          => request(`/api/menu/${id}`, { method: 'DELETE' }),
  reorder:      (section, orderedIds) =>
    request('/api/menu/reorder', { method: 'POST', body: { section, orderedIds } }),

  // === Settings ===
  getSettings:    ()          => request('/api/settings'),
  updateSettings: (patch)     => request('/api/settings', { method: 'PUT', body: patch }),

  // === Upload ===
  uploadAsset: async (kind, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return request(`/api/upload/${kind}`, { method: 'POST', body: fd, isForm: true });
  },
  deleteAsset: (filename) => request(`/api/upload/${encodeURIComponent(filename)}`, { method: 'DELETE' }),

  // === Auth ===
  login: async (password) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Login fallito');
    }
    setAdminPassword(password);
    return res.json();
  },
  logout: () => setAdminPassword(null)
};
