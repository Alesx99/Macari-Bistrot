# Macàri Bistrot — Menù digitale & stampabile (SPA locale)

Applicazione **interamente offline** per gestire e mostrare il menù del Macàri Bistrot. Gira sul PC del locale e i clienti/camerieri vi accedono via Wi-Fi del locale, anche da smartphone.

- **Vista pubblica** `/` — menù responsive, sfondo personalizzato, filtri per categoria
- **Admin** `/admin` — CRUD piatti con drag-and-drop + editor di stile (logo, sfondo, filigrana, font, margini di stampa)
- **Stampa** `/print` — anteprima A4 + esportazione PDF con puntatori di prezzo (es. `Pasta al forno ........... 10€`) e filigrana centrale a bassa opacità

---

## Stack

| Livello   | Tecnologia                                       |
|-----------|--------------------------------------------------|
| Frontend  | React 18 + Vite + Tailwind CSS                   |
| Routing   | react-router-dom                                 |
| Drag&Drop | @dnd-kit                                         |
| Stampa    | react-to-print + CSS `@media print`              |
| Font      | @fontsource (Playfair Display, Montserrat) — **scaricati localmente, niente CDN** |
| Backend   | Node.js 24 + Express 5 + Helmet + Multer 2       |
| DB        | SQLite via modulo nativo `node:sqlite` (zero addon nativi) |
| Asset     | Cartella `backend/uploads/` servita staticamente |

---

## Struttura

```
Macàri Bistrot/
├── backend/
│   ├── src/
│   │   ├── server.js              # Express + static + SPA fallback
│   │   ├── db/
│   │   │   ├── index.js           # connessione + schema (idempotente)
│   │   │   └── seed.js            # piatti di esempio (Orecchiette cime di rapa, ecc.)
│   │   ├── middleware/
│   │   │   ├── auth.js            # header x-admin-password
│   │   │   └── validate.js        # validazione piatti
│   │   └── routes/
│   │       ├── auth.js, menu.js, settings.js, upload.js
│   ├── data/macari.db             # generato al primo avvio
│   ├── uploads/                   # logo, sfondi, filigrane (PNG/JPG/WEBP/SVG)
│   ├── .env                       # config (porta, password admin…)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/                 # PublicMenu, Admin, PrintMenu
│   │   ├── components/            # MenuManager, DishForm, SortableDish, StyleEditor, PrintableMenu, LoginForm
│   │   ├── hooks/useMenu.js
│   │   ├── api/client.js
│   │   └── styles/index.css       # Tailwind + regole @media print
│   ├── vite.config.js             # proxy verso :4000 in dev
│   └── package.json
├── scripts/show-qr.js             # IP LAN + QR code nel terminale
├── package.json                   # script "tutto in uno"
└── README.md
```

---

## Primo avvio (Windows / macOS / Linux)

Requisiti: **Node.js 24 LTS o superiore**.

```bash
# 1) Dalla cartella del progetto, installa backend, frontend e qrcode-terminal
npm run install:all

# 2) Crea il DB e inseriscici i piatti di esempio
npm run seed

# 3) Avvia il backend (porta 4000) in un terminale...
npm run dev:backend

# 4) ...e il frontend Vite (porta 5173) in un altro terminale
npm run dev:frontend
```

Apri **http://localhost:5173** per il menu, **http://localhost:5173/admin** per il pannello.

Password admin di default: **`macari2024`** (in `backend/.env`, da cambiare prima dell'uso reale).

---

## Build di produzione + avvio "tutto-in-uno"

Quando vuoi che il PC del locale serva sia frontend sia backend dalla stessa porta:

```bash
# 1) Build statico del frontend (genera frontend/dist/)
npm run build

# 2) Avvia solo il backend: serve API + cartella dist + uploads
npm start
```

Il backend serve la SPA su **http://<ip-del-pc>:4000** in tutta la rete locale.

---

## Installer Windows all-in-one

Per generare un setup `.exe` installabile su nuovi PC:

```bash
npm run package:win
```

Output:

`installer/windows/output/MacariBistrot-Setup.exe`

Guida completa in `INSTALLER_WINDOWS.md`.

---

## Accesso rapido + QR code

Per mostrare ai clienti o al proprietario il QR del menu:

```bash
npm run qr
```

Lo script:
1. Rileva l'IPv4 della macchina sulla rete locale.
2. Stampa l'URL completo (es. `http://192.168.1.50:4000`).
3. Disegna il QR direttamente nel terminale.

Puoi passare opzioni: `node scripts/show-qr.js --port 5173 --path /admin`.

### Collegamento sul desktop del PC del locale

Crea un collegamento (.lnk su Windows) a uno di questi URL:

- `http://localhost:4000/admin` — pannello gestionale (in produzione)
- `http://localhost:5173/admin` — pannello gestionale (in sviluppo)
- `http://localhost:4000/print` — stampa rapida

Suggerimento: avvia automaticamente il server all'accensione del PC con un `.bat` nella cartella *Esecuzione automatica* di Windows:

```bat
@echo off
cd /d "C:\Users\betaland operatore\Documents\Progetto Macàri Bistrot"
npm start
```

---

## API REST (riferimento veloce)

Tutte le rotte di scrittura richiedono l'header `x-admin-password`.

| Metodo | Endpoint                       | Auth | Descrizione                                   |
|--------|--------------------------------|------|-----------------------------------------------|
| POST   | `/api/auth/login`              | —    | Verifica la password admin                    |
| GET    | `/api/menu?available=true`     | —    | Restituisce piatti raggruppati per sezione    |
| POST   | `/api/menu`                    | ✓    | Crea un piatto                                |
| PUT    | `/api/menu/:id`                | ✓    | Aggiorna un piatto                            |
| DELETE | `/api/menu/:id`                | ✓    | Elimina un piatto                             |
| POST   | `/api/menu/reorder`            | ✓    | Body `{ section, orderedIds[] }`              |
| GET    | `/api/settings`                | —    | Tutte le impostazioni del locale              |
| PUT    | `/api/settings`                | ✓    | Aggiornamento parziale (chiavi in whitelist)  |
| POST   | `/api/upload/:kind`            | ✓    | kind = logo \| background \| watermark        |
| DELETE | `/api/upload/:filename`        | ✓    | Rimuove un file dagli uploads                 |

---

## Schema del database (SQLite)

```sql
CREATE TABLE menu_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  price REAL NOT NULL DEFAULT 0,
  available INTEGER NOT NULL DEFAULT 1,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
```

Le impostazioni includono: `restaurant_name`, `restaurant_subtitle`, `logo_path`, `background_path`, `watermark_path`, `font_title`, `font_body`, `print_margin_mm`, `print_font_size_pt`, `accent_color`, `currency_symbol`.

---

## Note sulla stampa

Il file `frontend/src/styles/index.css` contiene le regole `@media print` che assicurano:

- `@page { size: A4; margin: var(--print-margin); }`
- nessuna interruzione di pagina a metà piatto: `.print-item { break-inside: avoid; page-break-inside: avoid; }`
- nessun titolo orfano: `.print-section h2 { break-after: avoid; }`
- filigrana posizionata centralmente con `opacity: 0.08`
- "puntatori di prezzo" generati con un `<span>` che ha `border-bottom: 1px dotted`

Per esportare in PDF: `/print` → **Stampa / Salva PDF** → nel dialog scegli "Salva come PDF".

---

## Sicurezza

L'app è progettata per **rete locale fidata** (il Wi-Fi del locale). Misure applicate:

- `helmet` per gli header HTTP di sicurezza
- `express-rate-limit` sull'endpoint di login (anti brute-force)
- whitelist delle chiavi `settings` modificabili
- whitelist mime + estensione sugli upload + limite dimensione
- protezione path-traversal sulla delete degli upload
- validazione dei piatti (lunghezze, range prezzo)
- nessuna esposizione del DB o del filesystem oltre `/uploads`

> **Non esporre il server su Internet pubblico.** Per uso solo LAN basta la password admin in `.env`; per accesso da remoto aggiungi HTTPS + autenticazione più robusta (JWT, ad esempio).

---

## Troubleshooting

| Problema                                       | Soluzione                                              |
|------------------------------------------------|--------------------------------------------------------|
| Errore runtime SQLite su Node vecchio          | Aggiorna a Node 24 LTS (il backend usa `node:sqlite`) |
| Lo smartphone non apre `http://192.168.…`      | Sblocca la porta 4000 nel firewall di Windows          |
| Il PDF si spezza a metà piatto                 | Verifica che le immagini abbiano dimensioni note (height esplicita) |
| Le modifiche non appaiono nel menu pubblico    | Hard refresh (Ctrl+F5); la cache asset dura 7 giorni   |

---

Buon appetito! 🍝
