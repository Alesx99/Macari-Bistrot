# Guida installazione su nuovo PC

Questa guida spiega come configurare **Macari Bistrot** su un computer nuovo in modo stabile, offline e accessibile via Wi-Fi locale.

---

## 1) Requisiti minimi

- Windows 10/11 (consigliato)
- Connessione Internet solo per la prima installazione
- Node.js **24 LTS** (obbligatorio per usare il backend con `node:sqlite`)
- Stampante (opzionale) per QR e menu cartaceo

> Importante: usa Node 24 LTS o superiore compatibile.

---

## 2) Copia del progetto sul nuovo PC

Copia l'intera cartella del progetto, ad esempio in:

`C:\MacariBistrot\`

La struttura finale deve contenere almeno:

- `backend/`
- `frontend/`
- `scripts/`
- `package.json`
- `avvio-rapido.bat`

---

## 3) Installazione Node.js 24 LTS

### Metodo consigliato (sito ufficiale)
1. Vai su [https://nodejs.org](https://nodejs.org)
2. Scarica **Node.js 24 LTS**
3. Installa con opzioni default
4. Riavvia terminale

Verifica:

```bat
node -v
npm -v
```

`node -v` deve mostrare `v24.x.x`.

---

## 4) Prima inizializzazione progetto

Apri `cmd` nella cartella progetto e lancia:

```bat
npm run install:all
npm run seed
```

Cosa fa:
- installa dipendenze backend/frontend
- prepara il database SQLite
- inserisce dati demo menu (utile per test)

---

## 5) Configurazione backend

Apri `backend\.env` e verifica questi valori:

```env
PORT=4000
HOST=0.0.0.0
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
ADMIN_PASSWORD=CAMBIA_QUESTA_PASSWORD
MAX_UPLOAD_MB=5
```

### Regole importanti
- `HOST=0.0.0.0` permette accesso da telefoni/tablet sulla rete locale
- Cambia sempre `ADMIN_PASSWORD` prima di andare in produzione

---

## 6) Avvio rapido

Doppio click su:

`avvio-rapido.bat`

Lo script:
- controlla Node/npm
- installa dipendenze se mancanti
- avvia backend + frontend in due finestre

URL principali:
- Menu pubblico: `http://localhost:5174/` (o 5173 se libera)
- Admin: `http://localhost:5174/admin`
- Stampa: `http://localhost:5174/print`

> Nota: se 5173 e occupata, Vite usa 5174 automaticamente.

---

## 7) Accesso da smartphone/tablet via Wi-Fi locale

1. Assicurati che PC e smartphone siano sulla **stessa rete Wi-Fi**
2. Verifica l'IP del PC (esempio `192.168.1.110`)
3. In admin > **Stile & Stampa**, imposta:
   - `URL pubblico locale (Wi-Fi)` = `http://192.168.1.110:4000`
4. Salva

### Firewall Windows
Se i telefoni non vedono il menu:
- apri la porta **4000 TCP** per rete privata
- consenti `node.exe` in rete privata

---

## 8) QR code per i tavoli

Percorso: `Admin -> QR Tavoli` (`/admin/qr`)

Passi:
1. imposta range tavoli (es. 1-20)
2. scegli dimensione QR
3. clicca **Stampa foglio QR**
4. applica i QR sui tavoli

In alternativa da terminale (QR singolo):

```bat
npm run qr
```

---

## 9) Uso quotidiano nel locale

### All'apertura
- avvia `avvio-rapido.bat`
- verifica che menu e admin siano raggiungibili

### Durante il servizio
- aggiorna piatti da `/admin`
- usa `/print` per ristampa rapida PDF

### A fine giornata (consigliato)
- fai backup del file DB:
  - `backend\data\macari.db`
- fai backup cartella upload:
  - `backend\uploads\`

---

## 10) Backup e ripristino

### Backup minimo da copiare su USB/cloud
- `backend\data\macari.db`
- `backend\uploads\`
- `backend\.env`

### Ripristino su nuovo PC
1. copia progetto
2. rimetti i file backup nelle stesse cartelle
3. avvia con `avvio-rapido.bat`

---

## 11) Modalita produzione (opzionale)

Se vuoi usare solo backend in produzione (frontend buildato statico):

```bat
npm run build
npm start
```

Accesso tipico:
- `http://<ip-pc>:4000/`
- `http://<ip-pc>:4000/admin`

---

## 12) Troubleshooting rapido

### Errore runtime SQLite
- causa comune: Node non compatibile
- soluzione: usa Node **24 LTS**

### Finestra script si chiude subito
- avvia da cmd:
  ```bat
  cmd /k "C:\Percorso\Progetto\avvio-rapido.bat"
  ```
- leggi errore e correggi in base al messaggio

### Telefono non apre il menu
- controlla IP corretto
- controlla firewall porta 4000
- verifica stessa rete Wi-Fi

---

## 13) Checklist finale per consegna al locale

- [ ] Node 24 LTS installato
- [ ] `npm run install:all` completato
- [ ] `npm run seed` completato
- [ ] Password admin cambiata in `backend\.env`
- [ ] `HOST=0.0.0.0` confermato
- [ ] URL pubblico locale impostato in admin
- [ ] QR tavoli stampati e testati
- [ ] Backup testato (`macari.db` + `uploads`)

---

Se vuoi, possiamo anche preparare una versione "chiavetta USB" con script automatico di backup giornaliero.
