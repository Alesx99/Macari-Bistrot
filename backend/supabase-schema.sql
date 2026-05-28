-- =============================================================
-- Schema Supabase per Macàri Bistrot
-- Eseguire nel SQL Editor di Supabase (https://supabase.com/dashboard)
-- =============================================================

-- =====================
-- Tabella: menu_items
-- =====================
CREATE TABLE IF NOT EXISTS menu_items (
  id          SERIAL PRIMARY KEY,
  section     TEXT    NOT NULL,
  title       TEXT    NOT NULL,
  description TEXT    DEFAULT '',
  price       NUMERIC(8,2) NOT NULL DEFAULT 0,
  available   BOOLEAN NOT NULL DEFAULT true,
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indice per ordinamento rapido per sezione
CREATE INDEX IF NOT EXISTS idx_menu_section_position
  ON menu_items(section, position);

-- =====================
-- Tabella: settings
-- =====================
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);

-- =====================
-- Valori di default per le impostazioni
-- ON CONFLICT DO NOTHING: non sovrascrive valori già presenti
-- =====================
INSERT INTO settings (key, value) VALUES
  ('restaurant_name',              'Macàri Bistrot'),
  ('restaurant_subtitle',          'Cucina di terra e di mare'),
  ('logo_path',                    ''),
  ('background_path',              ''),
  ('watermark_path',               ''),
  ('font_title',                   'Playfair Display'),
  ('font_body',                    'Montserrat'),
  ('print_margin_mm',              '15'),
  ('print_font_size_pt',           '11'),
  ('accent_color',                 '#8B6F3E'),
  ('currency_symbol',              '€'),
  ('section_order',                '["Antipasti","Primi","Secondi","Contorni","Dolci","Vini","Bevande"]'),
  ('watermark_pattern',            'none'),
  ('watermark_pattern_size',       '36'),
  ('watermark_pattern_color',      '#3c3c3c'),
  ('watermark_pattern_opacity',    '0.18'),
  ('watermark_pattern_thickness',  '1'),
  ('watermark_pattern_frequency',  '4'),
  ('watermark_pattern_density',    '1'),
  ('print_paper_color',            '#ffffff'),
  ('print_paper_opacity',          '1'),
  ('print_paper_intensity',        '100'),
  ('public_base_url',              'https://alesx99.github.io/Macari-Bistrot')
ON CONFLICT (key) DO NOTHING;

-- =====================
-- Disabilitare RLS (Row Level Security)
-- Usiamo la anon key solo dal backend, non serve RLS.
-- =====================
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Accesso completo menu_items" ON menu_items FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Accesso completo settings" ON settings FOR ALL USING (true) WITH CHECK (true);
