import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { nanoid } from 'nanoid';
import { fileURLToPath } from 'node:url';
import { requireAdmin } from '../middleware/auth.js';
import db, { isOnlineMode } from '../db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Tipi consentiti (solo immagini per loghi, sfondi, filigrane) */
const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);
const ALLOWED_EXT  = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg']);

const MAX_MB = Number(process.env.MAX_UPLOAD_MB ?? 5);

/** Nome del bucket Supabase Storage per gli asset */
const STORAGE_BUCKET = 'assets';

// ---------------------------------------------------------------------------
// Configurazione multer: memoryStorage per online, diskStorage per locale
// ---------------------------------------------------------------------------

let upload;

if (isOnlineMode()) {
  // Modalità ONLINE: il file viene tenuto in memoria e poi caricato su Supabase Storage
  const memStorage = multer.memoryStorage();

  upload = multer({
    storage: memStorage,
    limits: { fileSize: MAX_MB * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (!ALLOWED_MIME.has(file.mimetype) || !ALLOWED_EXT.has(ext)) {
        return cb(new Error('Tipo file non consentito (solo PNG, JPG, WEBP, SVG)'));
      }
      cb(null, true);
    }
  });
} else {
  // Modalità LOCALE: salvataggio su disco come prima
  const UPLOADS_DIR = path.resolve(__dirname, '..', '..', 'uploads');
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  const diskStor = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const kind = (req.params.kind || 'asset').replace(/[^a-z0-9_-]/gi, '');
      cb(null, `${kind}-${Date.now()}-${nanoid(6)}${ext}`);
    }
  });

  upload = multer({
    storage: diskStor,
    limits: { fileSize: MAX_MB * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (!ALLOWED_MIME.has(file.mimetype) || !ALLOWED_EXT.has(ext)) {
        return cb(new Error('Tipo file non consentito (solo PNG, JPG, WEBP, SVG)'));
      }
      cb(null, true);
    }
  });
}

const router = Router();

/**
 * POST /api/upload/:kind   (admin)
 * :kind = logo | background | watermark
 * Field name: "file"
 * Risposta: { url, path, kind, filename }
 */
router.post('/:kind', requireAdmin, (req, res, next) => {
  const kind = req.params.kind;
  if (!['logo', 'background', 'watermark'].includes(kind)) {
    return res.status(400).json({ error: 'kind deve essere logo|background|watermark' });
  }

  upload.single('file')(req, res, async (err) => {
    try {
      if (err) return res.status(400).json({ error: err.message });
      if (!req.file) return res.status(400).json({ error: 'Nessun file caricato' });

      if (isOnlineMode()) {
        // --- Modalità online: upload su Supabase Storage ---
        const ext = path.extname(req.file.originalname).toLowerCase();
        const filename = `${kind}-${Date.now()}-${nanoid(6)}${ext}`;
        const storagePath = `${kind}/${filename}`;

        await db.uploadFile(STORAGE_BUCKET, storagePath, req.file.buffer, req.file.mimetype);
        const publicUrl = db.getPublicUrl(STORAGE_BUCKET, storagePath);

        res.status(201).json({
          kind,
          filename,
          url: publicUrl,
          path: publicUrl,
          size: req.file.size
        });
      } else {
        // --- Modalità locale: il file è già su disco ---
        const publicUrl = `/uploads/${req.file.filename}`;
        res.status(201).json({
          kind,
          filename: req.file.filename,
          url: publicUrl,
          path: publicUrl,
          size: req.file.size
        });
      }
    } catch (uploadErr) {
      next(uploadErr);
    }
  });
});

/**
 * DELETE /api/upload/:filename   (admin)
 * Rimuove un file di upload.
 * In modalità online: elimina da Supabase Storage (filename = "kind/nome.ext")
 * In modalità locale: rimuove dal disco, solo se il nome è "safe".
 */
router.delete('/:filename', requireAdmin, async (req, res) => {
  const filename = req.params.filename;

  if (isOnlineMode()) {
    // In modalità online il filename potrebbe contenere il percorso nel bucket
    // Il frontend salva l'URL completo; estraiamo il path dal bucket
    try {
      // Proviamo a eliminare dal bucket; il percorso è passato dal client
      // Il path nel bucket è nella forma "kind/nomefile.ext"
      await db.deleteFile(STORAGE_BUCKET, filename);
      return res.status(204).end();
    } catch (err) {
      return res.status(404).json({ error: 'File non trovato nello storage' });
    }
  }

  // --- Modalità locale ---
  if (!/^[a-z0-9_\-.]+$/i.test(filename)) {
    return res.status(400).json({ error: 'Nome file non valido' });
  }

  const UPLOADS_DIR = path.resolve(__dirname, '..', '..', 'uploads');
  const fullPath = path.join(UPLOADS_DIR, filename);

  // Protezione da path traversal
  if (!fullPath.startsWith(UPLOADS_DIR)) {
    return res.status(400).json({ error: 'Percorso non valido' });
  }
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: 'File non trovato' });
  }
  fs.unlinkSync(fullPath);
  res.status(204).end();
});

export default router;
