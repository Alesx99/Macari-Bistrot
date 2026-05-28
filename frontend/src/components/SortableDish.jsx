import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatPrice } from '../hooks/useMenu.js';

/**
 * Riga di un piatto, trascinabile via handle (☰).
 */
export default function SortableDish({ item, onEdit, onDelete, onToggle, disabled }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1
  };

  return (
    <li ref={setNodeRef} style={style}
        className={`flex items-center gap-3 p-3 rounded-lg border
          ${item.available ? 'bg-white border-bistrot-100' : 'bg-bistrot-50 border-bistrot-200 opacity-70'}`}>
      <button
        {...attributes}
        {...listeners}
        title="Trascina per riordinare"
        className="cursor-grab touch-none text-bistrot-400 hover:text-bistrot-600 px-1 select-none"
        aria-label="Riordina"
        type="button"
      >
        ☰
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-lg text-bistrot-900 truncate">{item.title}</span>
          {!item.available && (
            <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800">Non disponibile</span>
          )}
        </div>
        {item.description && (
          <p className="text-sm text-bistrot-600 truncate italic">{item.description}</p>
        )}
      </div>

      <div className="font-semibold text-bistrot-800 whitespace-nowrap">
        {formatPrice(item.price)}
      </div>

      <div className="flex gap-1">
        <button onClick={onToggle} disabled={disabled}
                title={item.available ? 'Nascondi dal menù' : 'Mostra nel menù'}
                className="btn-secondary !px-2 !py-1 text-xs">
          {item.available ? '👁' : '🚫'}
        </button>
        <button onClick={onEdit} disabled={disabled}
                className="btn-secondary !px-2 !py-1 text-xs">Modifica</button>
        <button onClick={onDelete} disabled={disabled}
                className="btn-danger !px-2 !py-1 text-xs">Elimina</button>
      </div>
    </li>
  );
}
