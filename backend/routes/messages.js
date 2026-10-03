const express = require('express');
const router = express.Router();
const db = require('../config/db');
const transporter = require('../config/mailer');
const verifyToken = require('../middleware/auth');
require('dotenv').config();

// Herkese açık: iletişim formundan mesaj gönder
router.post('/', async (req, res) => {
  const { name, email, phone, message } = req.body;
  if (!name || !phone && !email) {
    return res.status(400).json({ error: 'Size ulaşabilmemiz için telefon veya e-posta girmelisiniz.' });
  }

  try {
    // 1. Önce veritabanına kaydet
    await db.query('INSERT INTO messages (name, email, phone, message) VALUES (?, ?, ?, ?)', [name, email || null, phone, message || 'Telefonla geri arama talebi']);

    // 2. MAİL GÖNDERİMİNİ BEKLE (await eklendi)
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_TO || process.env.EMAIL_USER,
      replyTo: email || undefined,
      subject: `Yeni İletişim Talebi - ${name}`,
      text: `İsim: ${name}\nTelefon: ${phone}\nE-posta: ${email || 'belirtilmedi'}\n\nMesaj:\n${message || 'Telefonla geri arama talebi'}`
    });

    // 3. Eğer üstteki await hata fırlatmazsa, yani mail giderse başarılı yanıt dön
    res.status(201).json({ message: 'Talebiniz alındı ve e-posta gönderildi.' });

  } catch (err) {
    console.error('HATA DETAY (POST /messages):', err && err.message, err);
    // Hata durumunda frontend'e bilgi ver
    res.status(500).json({ error: 'Mesaj gönderilirken bir hata oluştu.' });
  }
});
// Admin: gelen mesajları listele
router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM messages ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Mesajlar alınamadı.' });
  }
});

// Admin: mesaj sil
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM messages WHERE id = ?', [req.params.id]);
    res.json({ message: 'Mesaj silindi.' });
  } catch (err) {
    res.status(500).json({ error: 'Mesaj silinemedi.' });
  }
});

module.exports = router;