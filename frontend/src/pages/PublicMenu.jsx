import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMenu, formatPrice, getOrderedSections } from '../hooks/useMenu.js';

export default function PublicMenu() {
  const { menu, settings, loading, error } = useMenu(true);
  const [activeSection, setActiveSection] = useState('all');

  const sections = getOrderedSections(menu.sections, settings);
  const visibleSections = activeSection === 'all' ? sections : sections.filter(s => s === activeSection);

  const bgStyle = useMemo(() => {
    if (!settings.background_path) return {};
    return {
      backgroundImage: `linear-gradient(rgba(250,246,239,0.85), rgba(250,246,239,0.95)), url("${settings.background_path}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    };
  }, [settings.background_path]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-bistrot-700">
      Caricamento del menù…
    </div>;
  }

  if (error) {
    return <div className="min-h-screen flex flex-col items-center justify-center text-red-700 p-6 text-center">
      <p className="text-lg mb-2">Errore nel caricamento del menù</p>
      <p className="text-sm opacity-70">{error.message}</p>
    </div>;
  }

  return (
    <div className="min-h-screen" style={bgStyle}>
      {/* Header */}
      <header className="text-center pt-10 pb-8 px-4">
        {settings.logo_path && (
          <img
            src={settings.logo_path}
            alt="Logo"
            className="mx-auto h-24 md:h-32 object-contain mb-4"
          />
        )}
        <h1 className="font-display text-4xl md:text-6xl text-bistrot-800">
          {settings.restaurant_name || 'Macàri Bistrot'}
        </h1>
        {settings.restaurant_subtitle && (
          <p className="mt-2 italic text-bistrot-600">{settings.restaurant_subtitle}</p>
        )}
      </header>

      {/* Filtri categoria */}
      <nav className="sticky top-0 z-10 bg-bistrot-50/95 backdrop-blur border-y border-bistrot-200">
        <div className="max-w-3xl mx-auto flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar">
          <CategoryChip label="Tutto" active={activeSection === 'all'}
                        onClick={() => setActiveSection('all')} />
          {sections.map(s => (
            <CategoryChip key={s} label={s} active={activeSection === s}
                          onClick={() => setActiveSection(s)} />
          ))}
        </div>
      </nav>

      {/* Sezioni */}
      <main className="max-w-3xl mx-auto px-4 pb-20 pt-6 space-y-10">
        {visibleSections.map(section => (
          <section key={section}>
            <h2 className="font-display text-2xl md:text-3xl text-bistrot-700
                            border-b border-bistrot-300 pb-2 mb-5">
              {section}
            </h2>
            <ul className="space-y-5">
              {menu.grouped[section].map(item => (
                <li key={item.id}>
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-lg md:text-xl text-bistrot-900">
                      {item.title}
                    </span>
                    <span className="flex-1 border-b border-dotted border-bistrot-300 translate-y-[-4px]"></span>
                    <span className="font-sans font-semibold text-bistrot-800 whitespace-nowrap">
                      {formatPrice(item.price, settings.currency_symbol)}
                    </span>
                  </div>
                  {item.description && (
                    <p className="mt-1 text-sm text-bistrot-700 italic">{item.description}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}

        {visibleSections.length === 0 && (
          <p className="text-center text-bistrot-600 py-12">
            Il menù è in aggiornamento — torna più tardi.
          </p>
        )}
      </main>

      {/* Footer discreto */}
      <footer className="text-center pb-8 text-xs text-bistrot-500">
        <Link to="/admin" className="hover:underline">Area gestionale</Link>
        <span className="mx-2">·</span>
        <Link to="/print" className="hover:underline">Versione stampabile</Link>
      </footer>
    </div>
  );
}

function CategoryChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors
        ${active
          ? 'bg-bistrot-600 text-bistrot-50'
          : 'bg-white text-bistrot-700 border border-bistrot-200 hover:bg-bistrot-100'}`}
    >
      {label}
    </button>
  );
}
