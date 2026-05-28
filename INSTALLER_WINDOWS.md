# Installer all-in-one Windows

Questa guida spiega come creare un installer `.exe` per distribuire Macari Bistrot su un nuovo PC in modo semplice.

## Obiettivo

Il setup installa:

- backend (con dipendenze gia incluse)
- frontend gia buildato (`frontend/dist`)
- script utili (`scripts/`)
- collegamenti desktop/menu Start
- configurazione opzionale firewall e avvio automatico

## Prerequisiti macchina di build

- Node.js **24 LTS**
- dipendenze progetto installate (`npm run install:all`)
- Inno Setup installato con `ISCC.exe` nel PATH

## Comando unico di build installer

Dalla root progetto:

```bat
npm run package:win
```

Lo script:

1. builda il frontend (`npm run build`)
2. prepara la cartella staging (`installer/windows/build/app`)
3. copia runtime necessario
4. compila il setup con Inno Setup

Output finale:

`installer/windows/output/MacariBistrot-Setup.exe`

## Installazione sul PC del locale

1. installa Node.js 24 LTS (se non presente)
2. esegui `MacariBistrot-Setup.exe` come amministratore
3. durante wizard, lascia attive:
   - apertura porta firewall 4000
   - avvio automatico server
4. apri `http://localhost:4000/admin`

## Note operative

- Il setup seeda automaticamente dati demo se DB vuoto.
- Il server gira su porta `4000`.
- Password admin iniziale in `.env` installato: `macari2024` (cambiala subito).

## Troubleshooting

- **Errore \"Node.js LTS non trovato\"**  
  Installa Node 24 LTS da https://nodejs.org e rilancia il setup.

- **Telefono non raggiunge il menu**  
  Verifica Wi-Fi comune + firewall + URL base pubblico impostato in admin.

- **Il server non parte all'accesso**  
  Verifica il task scheduler `MacariBistrotServer`.
