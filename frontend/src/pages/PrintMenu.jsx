import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { useMenu, getOrderedSections } from '../hooks/useMenu.js';
import PrintableMenu from '../components/PrintableMenu.jsx';

/**
 * Pagina dedicata all'anteprima + esportazione PDF/stampa.
 * Usa `react-to-print` per aprire il dialog di stampa del browser
 * (da cui si può "Salva come PDF").
 * Include controlli per la stampa selettiva delle categorie.
 */
export default function PrintMenu() {
  const { menu, settings, loading } = useMenu(true);
  const printRef = useRef(null);

  const [selectedSections, setSelectedSections] = useState([]);
  const [initialized, setInitialized] = useState(false);

  // Ottieni l'elenco delle sezioni ordinate secondo le impostazioni dell'admin
  const allSections = getOrderedSections(menu.sections, settings);

  // Inizializza le sezioni selezionate una volta caricato il menù
  useEffect(() => {
    if (!loading && menu.sections && menu.sections.length > 0 && !initialized) {
      setSelectedSections(allSections);
      setInitialized(true);
    }
  }, [loading, menu.sections, settings, initialized, allSections]);

  const paperColor = settings.print_paper_color || '#ffffff';
  const paperOpacity = Number(settings.print_paper_opacity !== undefined ? settings.print_paper_opacity : 1);
  const paperIntensity = Number(settings.print_paper_intensity !== undefined ? settings.print_paper_intensity : 100);
  const paperBg = getPaperBackground(paperColor, paperOpacity, paperIntensity);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Menu - ${settings.restaurant_name || 'Macari Bistrot'}`,
    pageStyle: `
      @page {
        size: A4;
        margin: ${settings.print_margin_mm || 15}mm;
      }
      html, body {
        background: ${paperBg} !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    `
  });

  const toggleSection = (sectionName) => {
    setSelectedSections(prev => {
      if (prev.includes(sectionName)) {
        return prev.filter(s => s !== sectionName);
      } else {
        return [...prev, sectionName];
      }
    });
  };

  const selectAll = () => setSelectedSections(allSections);
  const selectNone = () => setSelectedSections([]);

  // Preset: Esclude bevande, vini e liquori
  const excludeDrinks = () => {
    const drinkKeywords = ['vini', 'bevande', 'cocktails', 'drinks', 'birre', 'cantina', 'liquori', 'wine', 'beverages', 'bar'];
    const foodOnly = allSections.filter(s =>
      !drinkKeywords.some(keyword => s.toLowerCase().includes(keyword))
    );
    setSelectedSections(foodOnly);
  };

  // Preset: Include solo bevande, vini e liquori
  const selectOnlyDrinks = () => {
    const drinkKeywords = ['vini', 'bevande', 'cocktails', 'drinks', 'birre', 'cantina', 'liquori', 'wine', 'beverages', 'bar'];
    const drinksOnly = allSections.filter(s =>
      drinkKeywords.some(keyword => s.toLowerCase().includes(keyword))
    );
    setSelectedSections(drinksOnly);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Caricamento…</div>;
  }

  return (
    <div className="min-h-screen bg-bistrot-100 py-8">
      {/* Toolbar visibile solo a schermo */}
      <div className="no-print max-w-4xl mx-auto px-4 mb-6">
        <div className="card p-6 flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-bistrot-100 pb-4">
            <div>
              <h1 className="font-display text-2xl text-bistrot-800">Anteprima di stampa</h1>
              <p className="text-sm text-bistrot-600">
                Personalizza quali categorie includere nella stampa. Margini: {settings.print_margin_mm || 15}mm
              </p>
            </div>
            <div className="flex gap-2">
              <Link to="/" className="btn-secondary">← Torna al menù</Link>
              <button
                onClick={handlePrint}
                className="btn-primary shadow-md"
                disabled={selectedSections.length === 0}
              >
                Stampa / Salva PDF
              </button>
            </div>
          </div>

          {/* Selettori di Categoria */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 className="text-xs font-bold text-bistrot-700 uppercase tracking-wider">
                Categorie da Stampare ({selectedSections.length} di {allSections.length})
              </h2>
              {/* Pulsanti di controllo rapido */}
              <div className="flex flex-wrap gap-2 text-xs">
                <button onClick={selectAll} className="text-bistrot-600 hover:text-bistrot-800 font-semibold transition-colors">
                  Seleziona Tutto
                </button>
                <span className="text-bistrot-300">|</span>
                <button onClick={selectNone} className="text-bistrot-600 hover:text-bistrot-800 font-semibold transition-colors">
                  Deseleziona Tutto
                </button>
                {allSections.some(s => ['vini', 'bevande', 'cocktails', 'drinks', 'birre', 'cantina', 'liquori'].some(k => s.toLowerCase().includes(k))) && (
                  <>
                    <span className="text-bistrot-300">|</span>
                    <button onClick={excludeDrinks} className="text-bistrot-600 hover:text-bistrot-800 font-semibold transition-colors">
                      Escludi Bevande
                    </button>
                    <span className="text-bistrot-300">|</span>
                    <button onClick={selectOnlyDrinks} className="text-bistrot-600 hover:text-bistrot-800 font-semibold transition-colors">
                      Solo Drink List
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Griglia delle categorie */}
            <div className="flex flex-wrap gap-2">
              {allSections.map(section => {
                const isSelected = selectedSections.includes(section);
                return (
                  <button
                    key={section}
                    onClick={() => toggleSection(section)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 shadow-sm border ${
                      isSelected
                        ? 'bg-bistrot-600 text-bistrot-50 border-bistrot-600 hover:bg-bistrot-700'
                        : 'bg-white text-bistrot-600 border-bistrot-200 hover:bg-bistrot-50'
                    }`}
                  >
                    <span className="mr-1.5">{isSelected ? '✓' : '+'}</span>
                    {section}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Anteprima foglio A4 */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="shadow-xl mx-auto transition-all duration-300" style={{
          maxWidth: '210mm',
          minHeight: '297mm',
          padding: `${settings.print_margin_mm || 15}mm`,
          backgroundColor: paperBg
        }}>
          {selectedSections.length === 0 ? (
            <div className="h-[200mm] flex flex-col items-center justify-center text-center text-bistrot-400 p-6 border-2 border-dashed border-bistrot-200 rounded-lg">
              <span className="text-4xl mb-3">🖨️</span>
              <p className="font-semibold text-lg">Nessuna categoria selezionata</p>
              <p className="text-sm max-w-sm mt-1">Seleziona almeno una categoria nella barra superiore per visualizzare l'anteprima di stampa.</p>
            </div>
          ) : (
            <PrintableMenu ref={printRef} menu={menu} settings={settings} selectedSections={selectedSections} />
          )}
        </div>
      </div>
    </div>
  );
}

function getPaperBackground(hex, opacity, intensity) {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  if (cleanHex.length !== 6) return `rgba(255, 255, 255, ${opacity})`;

  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  const hDeg = Math.round(h * 360);
  const factor = intensity / 100;
  const adjS = Math.round(s * factor * 100);
  const adjL = Math.round(100 - (100 - (l * 100)) * factor);

  return `hsla(${hDeg}, ${adjS}%, ${adjL}%, ${opacity})`;
}
