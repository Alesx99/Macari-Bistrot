import { useEffect, useState } from 'react';

const EMPTY = {
  section: 'Antipasti',
  title: '',
  description: '',
  price: 0,
  available: true,
  position: 0
};

export default function DishForm({ initial, sections, onCancel, onSubmit }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) setForm({ ...initial, available: !!initial.available });
    else setForm({ ...EMPTY, section: sections[0] || 'Antipasti' });
  }, [initial, sections]);

  function update(k, v) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        section: form.section,
        title: form.title,
        description: form.description,
        price: Number(form.price),
        available: Boolean(form.available),
        position: Number(form.position) || 0
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
         onClick={onCancel}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="card p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <h3 className="font-display text-2xl text-bistrot-800">
          {initial ? 'Modifica piatto' : 'Nuovo piatto'}
        </h3>

        <div>
          <label className="label">Sezione</label>
          <input
            className="input"
            list="sections-list"
            value={form.section}
            onChange={(e) => update('section', e.target.value)}
            required
          />
          <datalist id="sections-list">
            {sections.map(s => <option key={s} value={s} />)}
          </datalist>
          <p className="text-xs text-bistrot-500 mt-1">
            Puoi scegliere una sezione esistente o digitarne una nuova.
          </p>
        </div>

        <div>
          <label className="label">Nome del piatto</label>
          <input
            className="input"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            maxLength={120}
            required
          />
        </div>

        <div>
          <label className="label">Descrizione</label>
          <textarea
            className="input"
            rows={3}
            maxLength={500}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Ingredienti principali, abbinamenti…"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Prezzo (€)</label>
            <input
              className="input"
              type="number"
              step="0.10"
              min="0"
              value={form.price}
              onChange={(e) => update('price', e.target.value)}
              required
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.available}
                onChange={(e) => update('available', e.target.checked)}
                className="w-5 h-5 accent-bistrot-600"
              />
              <span className="text-sm font-medium text-bistrot-700">Disponibile</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCancel} className="btn-secondary">Annulla</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Salvataggio…' : 'Salva'}
          </button>
        </div>
      </form>
    </div>
  );
}
