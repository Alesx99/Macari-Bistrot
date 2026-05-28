import { useMemo, useState } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { api } from '../api/client.js';
import { getOrderedSections } from '../hooks/useMenu.js';
import SortableDish from './SortableDish.jsx';
import DishForm from './DishForm.jsx';

const DEFAULT_SECTIONS = ['Antipasti', 'Primi', 'Secondi', 'Contorni', 'Dolci', 'Vini', 'Bevande'];

export default function MenuManager({ menu, settings, onChanged }) {
  const [editing, setEditing] = useState(null); // null | 'new' | item
  const [filterSection, setFilterSection] = useState('all');
  const [busy, setBusy] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  const sectionsForDishForm = useMemo(() => {
    const set = new Set([...DEFAULT_SECTIONS, ...menu.sections]);
    return Array.from(set);
  }, [menu.sections]);

  const orderedSections = useMemo(
    () => getOrderedSections(menu.sections, settings),
    [menu.sections, settings]
  );

  const visibleSections = filterSection === 'all'
    ? orderedSections
    : orderedSections.filter(s => s === filterSection);

  async function handleDragEnd(section, event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const list = menu.grouped[section];
    const oldIdx = list.findIndex(i => i.id === active.id);
    const newIdx = list.findIndex(i => i.id === over.id);
    const reordered = arrayMove(list, oldIdx, newIdx);

    try {
      setBusy(true);
      await api.reorder(section, reordered.map(i => i.id));
      await onChanged();
    } catch (err) {
      alert('Errore di riordinamento: ' + err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSave(data) {
    try {
      setBusy(true);
      if (editing === 'new') {
        await api.createItem(data);
      } else {
        await api.updateItem(editing.id, data);
      }
      setEditing(null);
      await onChanged();
    } catch (err) {
      alert('Errore salvataggio: ' + (err.details?.join(', ') || err.message));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(item) {
    if (!confirm(`Eliminare "${item.title}"?`)) return;
    try {
      setBusy(true);
      await api.deleteItem(item.id);
      await onChanged();
    } catch (err) {
      alert('Errore: ' + err.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleAvailable(item) {
    try {
      setBusy(true);
      await api.updateItem(item.id, { ...item, available: !item.available });
      await onChanged();
    } catch (err) {
      alert('Errore: ' + err.message);
    } finally {
      setBusy(false);
    }
  }

  async function moveSection(section, direction) {
    const idx = orderedSections.indexOf(section);
    if (idx < 0) return;
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= orderedSections.length) return;

    const next = [...orderedSections];
    const [picked] = next.splice(idx, 1);
    next.splice(target, 0, picked);

    try {
      setSavingOrder(true);
      await api.updateSettings({ section_order: JSON.stringify(next) });
      await onChanged();
    } catch (err) {
      alert('Errore nel salvataggio ordine categorie: ' + err.message);
    } finally {
      setSavingOrder(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm text-bistrot-700">Filtra sezione:</label>
          <select className="input max-w-xs"
                  value={filterSection}
                  onChange={(e) => setFilterSection(e.target.value)}>
            <option value="all">Tutte</option>
            {orderedSections.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button className="btn-primary" onClick={() => setEditing('new')}>
          + Nuovo piatto
        </button>
      </div>

      {orderedSections.length > 0 && (
        <div className="card p-4">
          <h3 className="font-display text-lg text-bistrot-800 mb-3">Ordine categorie</h3>
          <div className="space-y-2">
            {orderedSections.map((section, idx) => (
              <div key={section} className="flex items-center justify-between rounded-lg border border-bistrot-200 bg-white px-3 py-2">
                <span className="text-bistrot-800">{section}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-secondary !px-3 !py-1 text-xs"
                    onClick={() => moveSection(section, 'up')}
                    disabled={savingOrder || idx === 0}
                  >
                    Su
                  </button>
                  <button
                    type="button"
                    className="btn-secondary !px-3 !py-1 text-xs"
                    onClick={() => moveSection(section, 'down')}
                    disabled={savingOrder || idx === orderedSections.length - 1}
                  >
                    Giu
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-bistrot-600">
            Questo ordine verra usato nella vista pubblica e nella stampa PDF.
          </p>
        </div>
      )}

      {/* Lista per sezione */}
      {visibleSections.map(section => (
        <SectionBlock
          key={section}
          section={section}
          items={menu.grouped[section]}
          onDragEnd={(e) => handleDragEnd(section, e)}
          onEdit={setEditing}
          onDelete={handleDelete}
          onToggle={toggleAvailable}
          busy={busy}
        />
      ))}

      {visibleSections.length === 0 && (
        <div className="card p-8 text-center text-bistrot-600">
          Nessun piatto. Clicca "+ Nuovo piatto" per iniziare.
        </div>
      )}

      {/* Modale form */}
      {editing && (
        <DishForm
          initial={editing === 'new' ? null : editing}
          sections={sectionsForDishForm}
          onCancel={() => setEditing(null)}
          onSubmit={handleSave}
        />
      )}
    </div>
  );
}

function SectionBlock({ section, items, onDragEnd, onEdit, onDelete, onToggle, busy }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  return (
    <section className="card p-4">
      <h3 className="font-display text-xl text-bistrot-800 mb-3 flex items-center gap-2">
        {section}
        <span className="text-sm text-bistrot-500 font-sans">({items.length})</span>
      </h3>

      <DndContext sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={onDragEnd}>
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {items.map(item => (
              <SortableDish
                key={item.id}
                item={item}
                onEdit={() => onEdit(item)}
                onDelete={() => onDelete(item)}
                onToggle={() => onToggle(item)}
                disabled={busy}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </section>
  );
}
