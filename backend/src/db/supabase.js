import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Client Supabase — inizializzato una sola volta (singleton)
// ---------------------------------------------------------------------------

let _client = null;

/**
 * Crea (o restituisce) il client Supabase configurato.
 * Le credenziali vengono lette dalle variabili d'ambiente.
 */
export function createSupabaseClient() {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;

  if (!url || !key) {
    throw new Error(
      'Variabili SUPABASE_URL e SUPABASE_KEY necessarie per la modalità online'
    );
  }

  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  return _client;
}

// ---------------------------------------------------------------------------
// Astrazione database — stessa interfaccia async usata da db/index.js
// ---------------------------------------------------------------------------

export const supabaseDb = {
  /**
   * Restituisce tutti i piatti del menù, opzionalmente solo quelli disponibili.
   */
  async getAllMenuItems(onlyAvailable = false) {
    const sb = createSupabaseClient();
    let query = sb
      .from('menu_items')
      .select('id, section, title, description, price, available, position')
      .order('section', { ascending: true })
      .order('position', { ascending: true })
      .order('id', { ascending: true });

    if (onlyAvailable) {
      query = query.eq('available', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  /**
   * Restituisce un singolo piatto per id, oppure null se non trovato.
   */
  async getMenuItemById(id) {
    const sb = createSupabaseClient();
    const { data, error } = await sb
      .from('menu_items')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ?? null;
  },

  /**
   * Inserisce un nuovo piatto e restituisce l'oggetto creato.
   * Se position non è specificata, lo mette in fondo alla sezione.
   */
  async createMenuItem({ section, title, description, price, available, position }) {
    const sb = createSupabaseClient();

    // Se position è 0 o non fornita, calcoliamo la prossima posizione
    let pos = position;
    if (!pos) {
      const { data: maxRow } = await sb
        .from('menu_items')
        .select('position')
        .eq('section', section)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle();

      pos = (maxRow?.position ?? -1) + 1;
    }

    const { data, error } = await sb
      .from('menu_items')
      .insert({
        section,
        title,
        description,
        price,
        available: !!available,
        position: pos
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Aggiorna un piatto esistente. Restituisce l'oggetto aggiornato o null.
   */
  async updateMenuItem(id, { section, title, description, price, available, position }) {
    const sb = createSupabaseClient();
    const { data, error } = await sb
      .from('menu_items')
      .update({
        section,
        title,
        description,
        price,
        available: !!available,
        position,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) throw error;
    return data ?? null;
  },

  /**
   * Elimina un piatto per id. Restituisce true se trovato ed eliminato.
   */
  async deleteMenuItem(id) {
    const sb = createSupabaseClient();
    const { data, error } = await sb
      .from('menu_items')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  /**
   * Aggiorna le posizioni dei piatti in una sezione secondo l'ordine fornito.
   */
  async reorderMenuItems(section, orderedIds) {
    const sb = createSupabaseClient();
    const now = new Date().toISOString();

    // Aggiorniamo la posizione di ogni piatto nell'ordine ricevuto
    const promises = orderedIds.map((id, idx) =>
      sb
        .from('menu_items')
        .update({ position: idx, updated_at: now })
        .eq('id', id)
        .eq('section', section)
    );

    const results = await Promise.all(promises);
    for (const { error } of results) {
      if (error) throw error;
    }
  },

  /**
   * Restituisce tutte le impostazioni come oggetto { chiave: valore }.
   */
  async getAllSettings() {
    const sb = createSupabaseClient();
    const { data, error } = await sb.from('settings').select('key, value');
    if (error) throw error;

    return (data ?? []).reduce((acc, r) => {
      acc[r.key] = r.value;
      return acc;
    }, {});
  },

  /**
   * Inserisce o aggiorna coppie chiave/valore nelle impostazioni.
   * Restituisce l'intero set di impostazioni aggiornato.
   */
  async upsertSettings(entries) {
    const sb = createSupabaseClient();

    if (entries.length > 0) {
      const rows = entries.map(([key, value]) => ({ key, value }));
      const { error } = await sb
        .from('settings')
        .upsert(rows, { onConflict: 'key' });

      if (error) throw error;
    }

    // Restituisce tutte le impostazioni dopo l'upsert
    return this.getAllSettings();
  },

  // -----------------------------------------------------------------------
  // Operazioni Supabase Storage (per upload file)
  // -----------------------------------------------------------------------

  /**
   * Carica un file su Supabase Storage.
   */
  async uploadFile(bucket, filePath, buffer, contentType) {
    const sb = createSupabaseClient();
    const { data, error } = await sb.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType,
        upsert: true
      });

    if (error) throw error;
    return data;
  },

  /**
   * Elimina un file da Supabase Storage.
   */
  async deleteFile(bucket, filePath) {
    const sb = createSupabaseClient();
    const { error } = await sb.storage.from(bucket).remove([filePath]);
    if (error) throw error;
  },

  /**
   * Restituisce l'URL pubblico di un file nello storage.
   */
  getPublicUrl(bucket, filePath) {
    const sb = createSupabaseClient();
    const { data } = sb.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  }
};
