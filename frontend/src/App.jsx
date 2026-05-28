import { Routes, Route, Link } from 'react-router-dom';
import PublicMenu from './pages/PublicMenu.jsx';
import Admin from './pages/Admin.jsx';
import PrintMenu from './pages/PrintMenu.jsx';
import AdminQr from './pages/AdminQr.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/"        element={<PublicMenu />} />
      <Route path="/admin"   element={<Admin />} />
      <Route path="/admin/qr" element={<AdminQr />} />
      <Route path="/print"   element={<PrintMenu />} />
      <Route path="*" element={
        <div className="p-10 text-center">
          <h1 className="text-3xl mb-4">Pagina non trovata</h1>
          <Link className="btn-primary" to="/">Torna al menù</Link>
        </div>
      } />
    </Routes>
  );
}
