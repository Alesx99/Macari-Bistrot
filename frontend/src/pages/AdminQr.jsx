import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { api } from '../api/client.js';

export default function AdminQr() {
  const [settings, setSettings] = useState({});
  const [startTable, setStartTable] = useState(1);
  const [endTable, setEndTable] = useState(20);
  const [qrSize, setQrSize] = useState(170);
  const [baseUrlInput, setBaseUrlInput] = useState('');
  const [codes, setCodes] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => {});
  }, []);

  const suggestedBaseUrl = useMemo(() => {
    const fromSettings = (settings.public_base_url || '').trim();
    if (fromSettings) return normalizeBaseUrl(fromSettings);

    // In sviluppo (Vite su 5173/5174/...) i QR devono puntare al backend LAN :4000.
    const port = window.location.port || '';
    if (port.startsWith('517')) {
      return normalizeBaseUrl(`${window.location.protocol}//${window.location.hostname}:4000`);
    }
    return normalizeBaseUrl(window.location.origin);
  }, [settings.public_base_url]);

  useEffect(() => {
    setBaseUrlInput((prev) => (prev ? prev : suggestedBaseUrl));
  }, [suggestedBaseUrl]);

  const baseUrl = normalizeBaseUrl(baseUrlInput || suggestedBaseUrl);

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTable, endTable, qrSize, baseUrl]);

  async function generate() {
    setError('');
    const from = Number(startTable);
    const to = Number(endTable);
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from) {
      setError('Intervallo tavoli non valido.');
      setCodes([]);
      return;
    }

    const next = [];
    for (let table = from; table <= to; table += 1) {
      const url = `${baseUrl}/?table=${table}`;
      const dataUrl = await QRCode.toDataURL(url, {
        width: Number(qrSize),
        margin: 1,
        color: { dark: '#1f2937', light: '#ffffff' }
      });
      next.push({ table, url, dataUrl });
    }
    setCodes(next);
  }

  function handlePrint() {
    window.print();
  }

  async function saveBaseUrl() {
    try {
      setMessage('');
      const value = normalizeBaseUrl(baseUrlInput.trim());
      if (!/^https?:\/\/.+/i.test(value)) {
        setError('Inserisci un URL valido (es. http://192.168.1.110:4000).');
        return;
      }
      const updated = await api.updateSettings({ public_base_url: value });
      setSettings(updated);
      setMessage('Base URL salvata.');
      setError('');
    } catch (e) {
      setError(`Errore salvataggio URL: ${e.message}`);
    }
  }

  return (
    <div className="min-h-screen bg-bistrot-50">
      <div className="no-print max-w-6xl mx-auto px-4 pt-6 pb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-3xl text-bistrot-800">QR tavoli stampabili</h1>
            <p className="text-sm text-bistrot-600">
              Genera un foglio con QR pronti da stampare e applicare sui tavoli.
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin" className="btn-secondary">Torna admin</Link>
            <button onClick={handlePrint} className="btn-primary">Stampa foglio QR</button>
          </div>
        </div>

        <div className="card p-4 mt-4 grid md:grid-cols-4 gap-3">
          <div>
            <label className="label">Da tavolo</label>
            <input className="input" type="number" min="1" value={startTable}
                   onChange={(e) => setStartTable(e.target.value)} />
          </div>
          <div>
            <label className="label">A tavolo</label>
            <input className="input" type="number" min="1" value={endTable}
                   onChange={(e) => setEndTable(e.target.value)} />
          </div>
          <div>
            <label className="label">Dimensione QR (px)</label>
            <input className="input" type="number" min="120" max="260" step="10" value={qrSize}
                   onChange={(e) => setQrSize(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Base URL Wi-Fi</label>
            <div className="flex gap-2">
              <input
                className="input"
                value={baseUrlInput}
                onChange={(e) => setBaseUrlInput(e.target.value)}
                placeholder="http://192.168.1.110:4000"
              />
              <button type="button" className="btn-secondary shrink-0" onClick={saveBaseUrl}>
                Salva URL
              </button>
            </div>
            <p className="text-xs text-bistrot-600 mt-1">
              Suggerito: {suggestedBaseUrl}
            </p>
          </div>
        </div>

        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        {message && <p className="mt-2 text-sm text-green-700">{message}</p>}
      </div>

      <main className="max-w-6xl mx-auto px-4 pb-8 print:p-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-3">
          {codes.map((item) => (
            <article key={item.table}
                     className="bg-white border border-bistrot-200 rounded-xl p-4 shadow-sm print:shadow-none print:break-inside-avoid">
              <h2 className="font-display text-2xl text-center text-bistrot-800">Tavolo {item.table}</h2>
              <p className="text-xs text-center text-bistrot-500 mt-1">Inquadra per vedere il menù</p>
              <img src={item.dataUrl} alt={`QR Tavolo ${item.table}`} className="mx-auto mt-3" />
              <p className="text-[10px] text-center text-bistrot-500 mt-2 break-all">{item.url}</p>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}

function normalizeBaseUrl(url) {
  return url.replace(/\/+$/, '');
}
