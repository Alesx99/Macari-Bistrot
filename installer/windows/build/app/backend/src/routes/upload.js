import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { nanoid } from 'nanoid';
import { fileURLToPath } from 'node:url';
import { requireAdmin } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = path.resolve(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

/** Tipi consentiti (solo immagini per loghi, sfondi, filigrane) */
const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);
const ALLOWED_EXT  = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const kind = (req.params.kind || 'asset').replace(/[^a-z0-9_-]/gi, '');
    cb(null, `${kind}-${Date.now()}-${nanoid(6)}${ext}`);
  }
});

const MAX_MB = Number(process.env.MAX_UPLOAD_MB ?? 5);

const upload = multer({
  storage,
  limits: { fileSize: MAX_MB * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_MIME.has(file.mimetype) || !ALLOWED_EXT.has(ext)) {
      return cb(new Error('Tipo file non consentito (solo PNG, JPG, WEBP, SVG)'));
    }
    cb(null, true);
  }
});

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
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Nessun file caricato' });
    const publicUrl = `/uploads/${req.file.filename}`;
    res.status(201).json({
      kind,
      filename: req.file.filename,
      url: publicUrl,
      path: publicUrl,
      size: req.file.size
    });
  });
});

/**
 * DELETE /api/upload/:filename   (admin)
 * Rimuove fisicamente un file di upload, solo se il nome è "safe".
 */
router.delete('/:filename', requireAdmin, (req, res) => {
  const filename = req.params.filename;
  if (!/^[a-z0-9_\-.]+$/i.test(filename)) {
    return res.status(400).json({ error: 'Nome file non valido' });
  }
  const fullPath = path.join(UPLOADS_DIR, filename);
  // Protezione da path traversal: il file deve trovarsi davvero in UPLOADS_DIR
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
