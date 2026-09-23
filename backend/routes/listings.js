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
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
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

// Admin: yeni ilan ekle
router.post('/', verifyToken, upload.array('photos', 10), async (req, res) => {
  const { title, category, type, price, size, rooms, location, desc } = req.body;
  if (!title || !category || !type || !price) {
    return res.status(400).json({ error: 'Zorunlu alanlar eksik.' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO listings (title, category, type, price, size, rooms, location, description) VALUES (?,?,?,?,?,?,?,?)',
      [title, category, type, price, size || null, rooms || null, location || null, desc || null]
    );
    const listingId = result.insertId;

    if (req.files && req.files.length) {
      const values = req.files.map((f, i) => [listingId, f.path, i]);
      await db.query('INSERT INTO listing_photos (listing_id, url, sort_order) VALUES ?', [values]);
    }

    res.status(201).json({ id: listingId, message: 'İlan eklendi.' });
  } catch (err) {
    console.error('HATA DETAY (POST /listings):', err && err.message, err);
    res.status(500).json({ error: 'İlan eklenemedi.' });
  }
});

// Admin: ilan güncelle
router.put('/:id', verifyToken, upload.array('photos', 10), async (req, res) => {
  const { title, category, type, price, size, rooms, location, desc } = req.body;

  try {
    await db.query(
      'UPDATE listings SET title=?, category=?, type=?, price=?, size=?, rooms=?, location=?, description=? WHERE id=?',
      [title, category, type, price, size || null, rooms || null, location || null, desc || null, req.params.id]
    );

    if (req.files && req.files.length) {
      const values = req.files.map((f, i) => [req.params.id, f.path, i]);
      await db.query('INSERT INTO listing_photos (listing_id, url, sort_order) VALUES ?', [values]);
    }

    res.json({ message: 'İlan güncellendi.' });
  } catch (err) {
    console.error('HATA DETAY (PUT /listings/:id):', err && err.message, err);
    res.status(500).json({ error: 'İlan güncellenemedi.' });
  }
});

// Admin: ilan sil
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM listings WHERE id = ?', [req.params.id]);
    res.json({ message: 'İlan silindi.' });
  } catch (err) {
    console.error('HATA DETAY (DELETE /listings/:id):', err && err.message, err);
    res.status(500).json({ error: 'İlan silinemedi.' });
  }
});

module.exports = router;