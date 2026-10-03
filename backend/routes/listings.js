const express = require('express');
const router = express.Router();
const multer = require('multer');
const db = require('../config/db');
const verifyToken = require('../middleware/auth');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'bm-gayrimenkul/listings',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'heic']
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Herkese açık: tüm ilanları getir
router.get('/', async (req, res) => {
  try {
    const [listings] = await db.query('SELECT * FROM listings ORDER BY created_at DESC');
    const [photos] = await db.query('SELECT * FROM listing_photos ORDER BY sort_order ASC');
    const result = listings.map(l => ({
      ...l,
      photos: photos.filter(p => p.listing_id === l.id).map(p => p.url)
    }));
    res.json(result);
  } catch (err) {
    console.error('HATA DETAY (GET /listings):', err && err.message, err);
    res.status(500).json({ error: 'İlanlar alınamadı.' });
  }
});

// Herkese açık: tek ilan detayı
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM listings WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'İlan bulunamadı.' });
    const [photos] = await db.query(
      'SELECT url FROM listing_photos WHERE listing_id = ? ORDER BY sort_order ASC',
      [req.params.id]
    );
    res.json({ ...rows[0], photos: photos.map(p => p.url) });
  } catch (err) {
    console.error('HATA DETAY (GET /listings/:id):', err && err.message, err);
    res.status(500).json({ error: 'İlan alınamadı.' });
  }
});

const DETAIL_FIELDS = [
  'grossSize', 'bathroomCount', 'totalFloors', 'tapuDurumu', 'paylasimliIlan',
  'gorintuluArama', 'isinmaTipi', 'krediUygun', 'konutSekli', 'esyali',
  'yakitTipi', 'yapiTipi', 'yapininDurumu', 'kullanimDurumu', 'yetkiliOfis',
  'takas', 'cepheSecenekleri', 'kiraGetirisi', 'eidsOnayli', 'extraNotes'
];

// Admin: yeni ilan ekle
router.post('/', verifyToken, upload.array('photos', 30), async (req, res) => {
  const { title, category, type, price, size, rooms, location, desc, floor, buildingAge } = req.body;

  if (!title || !category || !type || !price) {
    return res.status(400).json({ error: 'Zorunlu alanlar eksik.' });
  }

  try {
    const detailValues = DETAIL_FIELDS.map(f => req.body[f] || null);
    const columns = ['title','category','type','price','size','rooms','location','description','floor','buildingAge', ...DETAIL_FIELDS];
    const placeholders = columns.map(() => '?').join(',');
    const values = [title, category, type, price, size || null, rooms || null, location || null, desc || null, floor || null, buildingAge || null, ...detailValues];

    const [result] = await db.query(
      `INSERT INTO listings (${columns.join(',')}) VALUES (${placeholders})`,
      values
    );
    const listingId = result.insertId;

    if (req.files && req.files.length) {
      const coverIdx = req.body.coverIndex !== undefined ? parseInt(req.body.coverIndex, 10) : null;
      const photoValues = req.files.map((f, i) => [listingId, f.path, (coverIdx !== null && i === coverIdx) ? -1 : i]);
      await db.query('INSERT INTO listing_photos (listing_id, url, sort_order) VALUES ?', [photoValues]);
    }

    res.status(201).json({ id: listingId, message: 'İlan eklendi.' });
  } catch (err) {
    console.error('HATA DETAY (POST /listings):', err && err.message, err);
    res.status(500).json({ error: 'İlan eklenemedi.' });
  }
});

// Admin: ilan güncelle
router.put('/:id', verifyToken, upload.array('photos', 30), async (req, res) => {
  const { title, category, type, price, size, rooms, location, desc, floor, buildingAge } = req.body;

  try {
    const detailValues = DETAIL_FIELDS.map(f => req.body[f] || null);
    const columns = ['title','category','type','price','size','rooms','location','description','floor','buildingAge', ...DETAIL_FIELDS];
    const setClause = columns.map(c => `${c}=?`).join(',');
    const values = [title, category, type, price, size || null, rooms || null, location || null, desc || null, floor || null, buildingAge || null, ...detailValues, req.params.id];

    await db.query(`UPDATE listings SET ${setClause} WHERE id=?`, values);

    if (req.files && req.files.length) {
      const coverIdx = req.body.coverIndex !== undefined ? parseInt(req.body.coverIndex, 10) : null;
      const photoValues = req.files.map((f, i) => [req.params.id, f.path, (coverIdx !== null && i === coverIdx) ? -1 : i]);
      await db.query('INSERT INTO listing_photos (listing_id, url, sort_order) VALUES ?', [photoValues]);
    }

    if (req.body.coverExistingUrl) {
      await db.query('UPDATE listing_photos SET sort_order = -1 WHERE listing_id = ? AND url = ?', [req.params.id, req.body.coverExistingUrl]);
    }

    res.json({ message: 'İlan güncellendi.' });
  } catch (err) {
    console.error('HATA DETAY (PUT /listings/:id):', err && err.message, err);
    res.status(500).json({ error: 'İlan güncellenemedi.' });
  }
});
// Admin: İlan sil
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const listingId = req.params.id;

    // 1. Önce ilana ait fotoğrafları veritabanından silin (Eğer ON DELETE CASCADE ayarlı değilse)
    await db.query('DELETE FROM listing_photos WHERE listing_id = ?', [listingId]);

    // 2. Ardından ilanı silin
    const [result] = await db.query('DELETE FROM listings WHERE id = ?', [listingId]);

    // Eğer silinecek kayıt bulunamadıysa (affectedRows 0 ise)
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Silinmek istenen ilan bulunamadı.' });
    }

    res.json({ message: 'İlan başarıyla silindi.' });
  } catch (err) {
    console.error('HATA DETAY (DELETE /listings/:id):', err && err.message, err);
    res.status(500).json({ error: 'İlan silinirken bir hata oluştu.' });
  }
});
module.exports = router;