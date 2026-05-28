import { forwardRef } from 'react';
import { formatPrice, getOrderedSections } from '../hooks/useMenu.js';

/**
 * Layout dedicato alla stampa.
 * - Logo in alto
 * - Sezioni e piatti formattati con "puntatori di prezzo"
 * - Filigrana centrale a bassa opacità (se presente)
 * - Regole CSS page-break-inside: avoid (vedi index.css)
 */
const PrintableMenu = forwardRef(function PrintableMenu({ menu, settings, selectedSections, sectionPerPage = false }, ref) {
  const fontSize = `${settings.print_font_size_pt || 11}pt`;
  const accent = settings.accent_color || '#8B6F3E';
  const titleCenter = String(settings.print_section_title_center || 'false') === 'true';
  const sectionTitleFont = settings.print_section_title_font || settings.font_title || 'Playfair Display';
  const bodyFont = settings.print_body_font || settings.font_body || 'Playfair Display';
  const subtitleFont = settings.print_subtitle_font || settings.font_body || 'Montserrat';
  const sectionTitleSize = `${clampNumber(settings.print_section_title_size_em, 1.4, 0.8, 2.4)}em`;
  const bodySize = `${clampNumber(settings.print_body_size_em, 1, 0.8, 1.6)}em`;
  const subtitleSize = `${clampNumber(settings.print_subtitle_size_em, 0.88, 0.7, 1.3)}em`;
  const frameEnabled = String(settings.print_frame_enabled || 'false') === 'true';
  const frameStyle = settings.print_frame_style || 'classic';
  const frameColor = settings.print_frame_color || accent;
  const frameThickness = clampNumber(settings.print_frame_thickness, 2, 1, 8);
  const allOrderedSections = getOrderedSections(menu.sections, settings);
  const orderedSections = selectedSections !== undefined
    ? allOrderedSections.filter(s => selectedSections.includes(s))
    : allOrderedSections;

  const paperColor = settings.print_paper_color || '#ffffff';
  const paperOpacity = Number(settings.print_paper_opacity !== undefined ? settings.print_paper_opacity : 1);
  const paperIntensity = Number(settings.print_paper_intensity !== undefined ? settings.print_paper_intensity : 100);
  const paperBg = getPaperBackground(paperColor, paperOpacity, paperIntensity);

  const pattern = settings.watermark_pattern || 'none';
  const patternStyle = getWatermarkPatternStyle(pattern, settings);

  return (
    <div
      ref={ref}
      className="print-area print-page"
      style={{
        ['--print-margin']: `${settings.print_margin_mm || 15}mm`,
        ['--print-font-size']: fontSize,
        ['--print-paper-bg']: paperBg,
        fontSize
      }}
    >
      {/* Filigrana */}
      {(settings.watermark_path || pattern !== 'none') && (
        <div className="print-watermark" aria-hidden="true">
          {pattern !== 'none' ? (
            <div style={patternStyle} />
          ) : (
            <img src={settings.watermark_path} alt="" />
          )}
        </div>
      )}

      <div className={`print-content ${frameEnabled ? 'print-content--framed' : ''}`}>
        {frameEnabled && (
          <div
            className={`print-frame print-frame--${frameStyle}`}
            style={{
              ['--print-frame-color']: frameColor,
              ['--print-frame-thickness']: `${frameThickness}px`
            }}
            aria-hidden="true"
          />
        )}

        {/* Intestazione */}
        <header style={{ textAlign: 'center', marginBottom: '1.2em' }}>
          {settings.logo_path && (
            <img
              src={settings.logo_path}
              alt="Logo"
              style={{ maxHeight: '90px', margin: '0 auto 8px', display: 'block' }}
            />
          )}
          <h1 style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: '2.2em',
            margin: 0,
            color: accent,
            letterSpacing: '0.02em'
          }}>
            {settings.restaurant_name || 'Macàri Bistrot'}
          </h1>
          {settings.restaurant_subtitle && (
            <p style={{ fontStyle: 'italic', marginTop: 4, color: '#555', fontSize: '0.95em' }}>
              {settings.restaurant_subtitle}
            </p>
          )}
          <div style={{
            height: 2,
            width: '40%',
            background: accent,
            margin: '14px auto 0',
            opacity: 0.5
          }} />
        </header>

        <div className="print-sections">
          {orderedSections.map(section => (
            <section
              key={section}
              className={`print-section ${sectionPerPage ? 'print-section--page-break' : ''}`}
              style={{ marginBottom: '1.4em' }}
            >
              <h2 style={{
                fontFamily: `"${sectionTitleFont}", Georgia, serif`,
                fontSize: sectionTitleSize,
                textAlign: titleCenter ? 'center' : 'left',
                color: accent,
                borderBottom: `1px solid ${accent}`,
                paddingBottom: 4,
                marginBottom: 10,
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                {section}
              </h2>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {menu.grouped[section].map(item => (
                  <li key={item.id} className="print-item">
                    <div className="price-row">
                      <span style={{
                        fontFamily: `"${bodyFont}", serif`,
                        fontWeight: 500,
                        fontSize: bodySize
                      }}>
                        {item.title}
                      </span>
                      <span className="leader" aria-hidden="true" />
                      <span style={{
                        fontFamily: `"${bodyFont}", sans-serif`,
                        fontWeight: 500,
                        fontSize: bodySize
                      }}>
                        {formatPrice(item.price, settings.currency_symbol)}
                      </span>
                    </div>
                    {item.description && (
                      <p style={{
                        fontFamily: `"${subtitleFont}", sans-serif`,
                        fontSize: subtitleSize,
                        fontStyle: 'italic',
                        color: '#555',
                        margin: '2px 0 0 0'
                      }}>
                        {item.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <footer className="print-powered-by" style={{
          textAlign: 'center',
          fontSize: '0.72em',
          color: '#777',
          fontFamily: 'Montserrat, sans-serif',
          fontStyle: 'italic'
        }}>
          Powered by Alesx99
        </footer>
      </div>
    </div>
  );
});

export default PrintableMenu;

function clampNumber(value, fallback, min, max) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
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

function getWatermarkPatternStyle(type, patternSettings) {
  if (type === 'none') return {};

  const color = patternSettings.watermark_pattern_color || '#3c3c3c';
  const opacity = Number(patternSettings.watermark_pattern_opacity !== undefined ? patternSettings.watermark_pattern_opacity : 0.18);
  const thickness = Number(patternSettings.watermark_pattern_thickness !== undefined ? patternSettings.watermark_pattern_thickness : 1);
  const frequency = Number(patternSettings.watermark_pattern_frequency !== undefined ? patternSettings.watermark_pattern_frequency : 4);
  const density = Number(patternSettings.watermark_pattern_density !== undefined ? patternSettings.watermark_pattern_density : 1);

  // Mappa frequenza (1 a 10) in dimensione cella (180px a 24px)
  const size = Math.round(180 - (frequency - 1) * 16);

  let r = 60, g = 60, b = 60;
  let cleanHex = color.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }
  const strokeColor = `rgba(${r},${g},${b},${opacity})`;
  const fillColor = `rgba(${r},${g},${b},${opacity * 0.75})`;

  let svg = '';

  if (type === 'lines') {
    let lines = [];
    for (let i = 1; i <= density; i++) {
      const y = Math.round((size * i) / (density + 1));
      lines.push(`<line x1="0" y1="${y}" x2="${size}" y2="${y}" stroke="${strokeColor}" stroke-width="${thickness}"/>`);
    }
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      ${lines.join('\n')}
    </svg>`;
  } else if (type === 'diagonal') {
    let lines = [];
    for (let i = 0; i < density; i++) {
      const offset = (size * i) / density;
      lines.push(`<line x1="0" y1="${size - offset}" x2="${size - offset}" y2="0" stroke="${strokeColor}" stroke-width="${thickness}"/>`);
      if (offset > 0) {
        lines.push(`<line x1="${size - offset}" y1="${size}" x2="${size}" y2="${size - offset}" stroke="${strokeColor}" stroke-width="${thickness}"/>`);
      }
    }
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      ${lines.join('\n')}
    </svg>`;
  } else if (type === 'grid') {
    let gridLines = [];
    gridLines.push(`<rect x="0" y="0" width="${size}" height="${size}" fill="none" stroke="${strokeColor}" stroke-width="${thickness}"/>`);
    for (let i = 1; i < density; i++) {
      const pos = Math.round((size * i) / density);
      gridLines.push(`<line x1="${pos}" y1="0" x2="${pos}" y2="${size}" stroke="${strokeColor}" stroke-width="${thickness}"/>`);
      gridLines.push(`<line x1="0" y1="${pos}" x2="${size}" y2="${pos}" stroke="${strokeColor}" stroke-width="${thickness}"/>`);
    }
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      ${gridLines.join('\n')}
    </svg>`;
  } else if (type === 'dots') {
    let circles = [];
    const rRadius = Math.max(1, thickness);
    for (let x = 0; x < density; x++) {
      const cx = Math.round((size * (x + 0.5)) / density);
      for (let y = 0; y < density; y++) {
        const cy = Math.round((size * (y + 0.5)) / density);
        circles.push(`<circle cx="${cx}" cy="${cy}" r="${rRadius}" fill="${fillColor}" />`);
      }
    }
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      ${circles.join('\n')}
    </svg>`;
  } else if (type === 'waves') {
    let paths = [];
    for (let i = 1; i <= density; i++) {
      const y = Math.round((size * i) / (density + 1));
      const amp = Math.max(3, Math.round(size / 8));
      paths.push(`<path d="M 0,${y} Q ${size/4},${y - amp} ${size/2},${y} T ${size},${y}" fill="none" stroke="${strokeColor}" stroke-width="${thickness}" />`);
    }
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      ${paths.join('\n')}
    </svg>`;
  } else if (type === 'cross') {
    let crosses = [];
    const arm = Math.max(2, Math.round(size / (density * 4)));
    for (let x = 0; x < density; x++) {
      const cx = Math.round((size * (x + 0.5)) / density);
      for (let y = 0; y < density; y++) {
        const cy = Math.round((size * (y + 0.5)) / density);
        crosses.push(`<line x1="${cx - arm}" y1="${cy}" x2="${cx + arm}" y2="${cy}" stroke="${strokeColor}" stroke-width="${thickness}" />`);
        crosses.push(`<line x1="${cx}" y1="${cy - arm}" x2="${cx}" y2="${cy + arm}" stroke="${strokeColor}" stroke-width="${thickness}" />`);
      }
    }
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      ${crosses.join('\n')}
    </svg>`;
  } else {
    return {};
  }

  const encoded = encodeURIComponent(svg);
  return {
    width: '100%',
    height: '100%',
    backgroundImage: `url("data:image/svg+xml,${encoded}")`,
    backgroundRepeat: 'repeat',
    backgroundSize: `${size}px ${size}px`
  };
}
