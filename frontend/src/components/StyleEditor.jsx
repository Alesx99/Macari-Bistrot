import { useState } from 'react';
import { api } from '../api/client.js';

const FONT_OPTIONS = [
  'Playfair Display',
  'Montserrat',
  'Georgia',
  'Times New Roman',
  'Cormorant Garamond'
];

const WATERMARK_PATTERNS = [
  { value: 'none', label: 'Nessun pattern (solo immagine, se caricata)' },
  { value: 'lines', label: 'Linee orizzontali' },
  { value: 'diagonal', label: 'Linee diagonali' },
  { value: 'grid', label: 'Griglia quadrati' },
  { value: 'dots', label: 'Puntini' },
  { value: 'waves', label: 'Ondine' },
  { value: 'cross', label: 'Crocette' }
];

const PRINT_FRAME_STYLES = [
  { value: 'classic', label: 'Classica' },
  { value: 'double', label: 'Doppia linea' },
  { value: 'ornate', label: 'Con ghirigori agli angoli' },
  { value: 'minimal_gold', label: 'Minimal gold' },
  { value: 'vintage_menu', label: 'Vintage menu' }
];

export default function StyleEditor({ settings, onSaved }) {
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  function update(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      await api.updateSettings(form);
      setMessage({ type: 'ok', text: 'Impostazioni salvate.' });
      onSaved?.();
    } catch (e) {
      setMessage({ type: 'err', text: 'Errore: ' + e.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(kind, file) {
    if (!file) return;
    try {
      const res = await api.uploadAsset(kind, file);
      const fieldMap = { logo: 'logo_path', background: 'background_path', watermark: 'watermark_path' };
      const field = fieldMap[kind];
      const next = { ...form, [field]: res.url };
      setForm(next);
      await api.updateSettings({ [field]: res.url });
      setMessage({ type: 'ok', text: `${kind} caricato.` });
      onSaved?.();
    } catch (e) {
      setMessage({ type: 'err', text: 'Upload fallito: ' + e.message });
    }
  }

  return (
    <div className="space-y-6">
      <div className="card p-6 space-y-5">
        <h3 className="font-display text-xl text-bistrot-800">Identità del locale</h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Nome del locale</label>
            <input className="input"
                   value={form.restaurant_name || ''}
                   onChange={(e) => update('restaurant_name', e.target.value)} />
          </div>
          <div>
            <label className="label">Sottotitolo</label>
            <input className="input"
                   value={form.restaurant_subtitle || ''}
                   onChange={(e) => update('restaurant_subtitle', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">URL pubblico locale (Wi-Fi)</label>
          <input
            className="input"
            value={form.public_base_url || ''}
            onChange={(e) => update('public_base_url', e.target.value)}
            placeholder="es: http://192.168.1.110:4000"
          />
          <p className="text-xs text-bistrot-600 mt-1">
            Usato per generare i QR dei tavoli. Se vuoto, verra usato l'URL corrente.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <AssetPicker label="Logo"
                       url={form.logo_path}
                       onPick={(f) => handleUpload('logo', f)}
                       onClear={() => update('logo_path', '')} />
          <AssetPicker label="Sfondo (menù digitale)"
                       url={form.background_path}
                       onPick={(f) => handleUpload('background', f)}
                       onClear={() => update('background_path', '')} />
          <AssetPicker label="Filigrana (stampa)"
                       url={form.watermark_path}
                       onPick={(f) => handleUpload('watermark', f)}
                       onClear={() => update('watermark_path', '')} />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="label">Font titoli</label>
            <select className="input"
                    value={form.font_title || 'Playfair Display'}
                    onChange={(e) => update('font_title', e.target.value)}>
              {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Font corpo</label>
            <select className="input"
                    value={form.font_body || 'Montserrat'}
                    onChange={(e) => update('font_body', e.target.value)}>
              {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Colore accento</label>
            <input type="color"
                   className="h-10 w-full rounded-lg border border-bistrot-200 cursor-pointer"
                   value={form.accent_color || '#8B6F3E'}
                   onChange={(e) => update('accent_color', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card p-6 space-y-5">
        <h3 className="font-display text-xl text-bistrot-800">Impostazioni di stampa</h3>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="label">Margini pagina (mm)</label>
            <input className="input" type="number" min="5" max="40"
                   value={form.print_margin_mm || 15}
                   onChange={(e) => update('print_margin_mm', e.target.value)} />
          </div>
          <div>
            <label className="label">Dimensione font (pt)</label>
            <input className="input" type="number" min="8" max="20"
                   value={form.print_font_size_pt || 11}
                   onChange={(e) => update('print_font_size_pt', e.target.value)} />
          </div>
          <div>
            <label className="label">Simbolo valuta</label>
            <input className="input" maxLength={3}
                   value={form.currency_symbol || '€'}
                   onChange={(e) => update('currency_symbol', e.target.value)} />
          </div>
        </div>

        <div className="border-t border-bistrot-100 pt-5 space-y-4">
          <h4 className="font-semibold text-bistrot-700 text-sm uppercase tracking-wider">
            Tipografia stampa menu
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="inline-flex items-center gap-2 text-sm text-bistrot-700">
                <input
                  type="checkbox"
                  checked={String(form.print_section_title_center || 'false') === 'true'}
                  onChange={(e) => update('print_section_title_center', e.target.checked ? 'true' : 'false')}
                />
                Titoli categorie centrati
              </label>
            </div>
            <div>
              <label className="label">Font titoli categorie</label>
              <select className="input"
                      value={form.print_section_title_font || form.font_title || 'Playfair Display'}
                      onChange={(e) => update('print_section_title_font', e.target.value)}>
                {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Dimensione titoli categorie (em)</label>
              <input className="input" type="number" min="0.8" max="2.4" step="0.05"
                     value={form.print_section_title_size_em || 1.4}
                     onChange={(e) => update('print_section_title_size_em', e.target.value)} />
            </div>
            <div>
              <label className="label">Font corpo piatti</label>
              <select className="input"
                      value={form.print_body_font || form.font_body || 'Playfair Display'}
                      onChange={(e) => update('print_body_font', e.target.value)}>
                {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Dimensione corpo piatti (em)</label>
              <input className="input" type="number" min="0.8" max="1.6" step="0.05"
                     value={form.print_body_size_em || 1}
                     onChange={(e) => update('print_body_size_em', e.target.value)} />
            </div>
            <div>
              <label className="label">Font sottotitoli piatti</label>
              <select className="input"
                      value={form.print_subtitle_font || form.font_body || 'Montserrat'}
                      onChange={(e) => update('print_subtitle_font', e.target.value)}>
                {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Dimensione sottotitoli piatti (em)</label>
              <input className="input" type="number" min="0.7" max="1.3" step="0.05"
                     value={form.print_subtitle_size_em || 0.88}
                     onChange={(e) => update('print_subtitle_size_em', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="border-t border-bistrot-100 pt-5 space-y-4">
          <h4 className="font-semibold text-bistrot-700 text-sm uppercase tracking-wider">
            Spaziatura e Impaginazione
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Spaziatura tra piatti (em)</label>
              <input className="input" type="number" min="0.1" max="3" step="0.05"
                     value={form.print_item_spacing_em !== undefined ? form.print_item_spacing_em : 0.4}
                     onChange={(e) => update('print_item_spacing_em', e.target.value)} />
            </div>
            <div>
              <label className="label">Spaziatura tra sezioni (em)</label>
              <input className="input" type="number" min="0.2" max="5" step="0.05"
                     value={form.print_section_spacing_em !== undefined ? form.print_section_spacing_em : 1.4}
                     onChange={(e) => update('print_section_spacing_em', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="inline-flex items-center gap-2 text-sm text-bistrot-700">
                <input
                  type="checkbox"
                  checked={String(form.print_auto_distribute || 'false') === 'true'}
                  onChange={(e) => update('print_auto_distribute', e.target.checked ? 'true' : 'false')}
                />
                Distribuzione verticale automatica (riempimento pagina se ci sono pochi elementi)
              </label>
            </div>
          </div>
        </div>

        <div className="border-t border-bistrot-100 pt-5 space-y-4">
          <h4 className="font-semibold text-bistrot-700 text-sm uppercase tracking-wider">
            Cornice decorativa
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="inline-flex items-center gap-2 text-sm text-bistrot-700">
                <input
                  type="checkbox"
                  checked={String(form.print_frame_enabled || 'false') === 'true'}
                  onChange={(e) => update('print_frame_enabled', e.target.checked ? 'true' : 'false')}
                />
                Abilita cornice decorativa nella stampa
              </label>
            </div>
            {String(form.print_frame_enabled || 'false') === 'true' && (
              <>
                <div>
                  <label className="label">Stile cornice</label>
                  <select
                    className="input"
                    value={form.print_frame_style || 'classic'}
                    onChange={(e) => update('print_frame_style', e.target.value)}
                  >
                    {PRINT_FRAME_STYLES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Colore cornice</label>
                  <input
                    type="color"
                    className="h-10 w-full rounded-lg border border-bistrot-200 cursor-pointer"
                    value={form.print_frame_color || '#8B6F3E'}
                    onChange={(e) => update('print_frame_color', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Spessore cornice (px)</label>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    max="8"
                    step="1"
                    value={form.print_frame_thickness || 2}
                    onChange={(e) => update('print_frame_thickness', e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="border-t border-bistrot-100 pt-5 space-y-4">
          <h4 className="font-semibold text-bistrot-700 text-sm uppercase tracking-wider">
            Stile del Foglio (Sfondo)
          </h4>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="label">Colore del foglio</label>
              <input type="color"
                     className="h-10 w-full rounded-lg border border-bistrot-200 cursor-pointer"
                     value={form.print_paper_color || '#ffffff'}
                     onChange={(e) => update('print_paper_color', e.target.value)} />
            </div>

            <div>
              <label className="label">
                Opacità foglio: {Math.round((form.print_paper_opacity !== undefined ? form.print_paper_opacity : 1) * 100)}%
              </label>
              <input
                className="w-full accent-bistrot-600"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={form.print_paper_opacity !== undefined ? form.print_paper_opacity : 1}
                onChange={(e) => update('print_paper_opacity', e.target.value)}
              />
              <p className="text-xs text-bistrot-600 mt-1">
                Trasparenza del colore di sfondo.
              </p>
            </div>

            <div>
              <label className="label">
                Intensità colore: {form.print_paper_intensity !== undefined ? form.print_paper_intensity : 100}%
              </label>
              <input
                className="w-full accent-bistrot-600"
                type="range"
                min="0"
                max="100"
                step="1"
                value={form.print_paper_intensity !== undefined ? form.print_paper_intensity : 100}
                onChange={(e) => update('print_paper_intensity', e.target.value)}
              />
              <p className="text-xs text-bistrot-600 mt-1">
                Saturazione e chiarezza della tinta (0% = bianco).
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-bistrot-100 pt-5 space-y-4">
          <h4 className="font-semibold text-bistrot-700 text-sm uppercase tracking-wider">
            Trama di Sottofondo (Pattern Geometrico)
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Pattern ripetibile</label>
              <select
                className="input"
                value={form.watermark_pattern || 'none'}
                onChange={(e) => update('watermark_pattern', e.target.value)}
              >
                {WATERMARK_PATTERNS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <p className="text-xs text-bistrot-600 mt-1">
                Effetto geometrico di sfondo ripetuto su tutta la pagina.
              </p>
            </div>

            {form.watermark_pattern !== 'none' && (
              <div>
                <label className="label">Colore del pattern</label>
                <input type="color"
                       className="h-10 w-full rounded-lg border border-bistrot-200 cursor-pointer"
                       value={form.watermark_pattern_color || '#3c3c3c'}
                       onChange={(e) => update('watermark_pattern_color', e.target.value)} />
              </div>
            )}
          </div>

          {form.watermark_pattern !== 'none' && (
            <div className="grid md:grid-cols-2 gap-4 border-t border-dashed border-bistrot-100 pt-3">
              <div>
                <label className="label">
                  Frequenza (Ripetizioni): {form.watermark_pattern_frequency || 4} / 10
                </label>
                <input
                  className="w-full accent-bistrot-600"
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={form.watermark_pattern_frequency || 4}
                  onChange={(e) => update('watermark_pattern_frequency', e.target.value)}
                />
                <p className="text-xs text-bistrot-600 mt-1">
                  Valori alti = trama fitta, valori bassi = trama ampia.
                </p>
              </div>

              <div>
                <label className="label">
                  Densità (Elementi per cella): {form.watermark_pattern_density || 1} / 5
                </label>
                <input
                  className="w-full accent-bistrot-600"
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={form.watermark_pattern_density || 1}
                  onChange={(e) => update('watermark_pattern_density', e.target.value)}
                />
                <p className="text-xs text-bistrot-600 mt-1">
                  Numero di linee, punti o onde disegnati in ciascuna cella.
                </p>
              </div>

              <div>
                <label className="label">
                  Intensità (Spessore tratto): {form.watermark_pattern_thickness || 1}px
                </label>
                <input
                  className="w-full accent-bistrot-600"
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={form.watermark_pattern_thickness || 1}
                  onChange={(e) => update('watermark_pattern_thickness', e.target.value)}
                />
                <p className="text-xs text-bistrot-600 mt-1">
                  Spessore della linea o dimensione del cerchio.
                </p>
              </div>

              <div>
                <label className="label">
                  Opacità pattern: {Math.round((form.watermark_pattern_opacity !== undefined ? form.watermark_pattern_opacity : 0.18) * 100)}%
                </label>
                <input
                  className="w-full accent-bistrot-600"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={form.watermark_pattern_opacity !== undefined ? form.watermark_pattern_opacity : 0.18}
                  onChange={(e) => update('watermark_pattern_opacity', e.target.value)}
                />
                <p className="text-xs text-bistrot-600 mt-1">
                  Trasparenza del disegno geometrico sullo sfondo.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {message && (
          <span className={`text-sm ${message.type === 'ok' ? 'text-green-700' : 'text-red-700'}`}>
            {message.text}
          </span>
        )}
        <button className="btn-primary" disabled={saving} onClick={handleSave}>
          {saving ? 'Salvataggio…' : 'Salva impostazioni'}
        </button>
      </div>
    </div>
  );
}

function AssetPicker({ label, url, onPick, onClear }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="border-2 border-dashed border-bistrot-200 rounded-lg p-3 text-center
                      bg-bistrot-50 hover:bg-bistrot-100 transition-colors">
        {url ? (
          <div className="space-y-2">
            <img src={url} alt={label} className="max-h-24 mx-auto object-contain" />
            <p className="text-xs text-bistrot-600 truncate">{url}</p>
            <div className="flex gap-2 justify-center">
              <label className="btn-secondary !px-3 !py-1 text-xs cursor-pointer">
                Sostituisci
                <input type="file" accept="image/*" className="hidden"
                       onChange={(e) => onPick(e.target.files?.[0])} />
              </label>
              <button onClick={onClear} className="btn-danger !px-3 !py-1 text-xs">Rimuovi</button>
            </div>
          </div>
        ) : (
          <label className="block cursor-pointer py-4">
            <span className="text-sm text-bistrot-700">Clicca per caricare</span>
            <span className="block text-xs text-bistrot-500 mt-1">PNG, JPG, WEBP, SVG (max 5MB)</span>
            <input type="file" accept="image/*" className="hidden"
                   onChange={(e) => onPick(e.target.files?.[0])} />
          </label>
        )}
      </div>
    </div>
  );
}
