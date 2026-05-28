import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, isAdminLogged } from '../api/client.js';
import { useMenu } from '../hooks/useMenu.js';
import LoginForm from '../components/LoginForm.jsx';
import MenuManager from '../components/MenuManager.jsx';
import StyleEditor from '../components/StyleEditor.jsx';

export default function Admin() {
  const [logged, setLogged] = useState(isAdminLogged());
  const [tab, setTab] = useState('menu');
  const navigate = useNavigate();

  if (!logged) {
    return <LoginForm onLogin={() => setLogged(true)} />;
  }

  return (
    <div className="min-h-screen bg-bistrot-50">
      <header className="bg-white border-b border-bistrot-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="font-display text-2xl text-bistrot-800">Macàri Bistrot — Admin</h1>
            <p className="text-xs text-bistrot-600">Pannello gestionale del locale</p>
          </div>
          <nav className="flex gap-2 flex-wrap">
            <TabButton active={tab === 'menu'} onClick={() => setTab('menu')}>Menù</TabButton>
            <TabButton active={tab === 'style'} onClick={() => setTab('style')}>Stile & Stampa</TabButton>
            <Link to="/admin/qr" className="btn-secondary">QR Tavoli</Link>
            <Link to="/" className="btn-secondary">Vedi pubblico</Link>
            <Link to="/print" className="btn-secondary">Stampa PDF</Link>
            <button
              className="btn-danger"
              onClick={() => { api.logout(); setLogged(false); navigate('/admin'); }}
            >
              Esci
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {tab === 'menu'  && <MenuManagerWrapper />}
        {tab === 'style' && <StyleEditorWrapper />}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`btn ${active ? 'bg-bistrot-700 text-bistrot-50' : 'bg-bistrot-100 text-bistrot-800 hover:bg-bistrot-200'}`}
    >
      {children}
    </button>
  );
}

function MenuManagerWrapper() {
  const { menu, settings, loading, reload } = useMenu(false);
  if (loading) return <p className="text-bistrot-600">Caricamento…</p>;
  return <MenuManager menu={menu} settings={settings} onChanged={reload} />;
}

function StyleEditorWrapper() {
  const { settings, loading, reload } = useMenu(false);
  if (loading) return <p className="text-bistrot-600">Caricamento…</p>;
  return <StyleEditor settings={settings} onSaved={reload} />;
}
