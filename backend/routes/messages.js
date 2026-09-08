const express = require('express');
const router = express.Router();
const db = require('../config/db');
const transporter = require('../config/mailer');
const verifyToken = require('../middleware/auth');
require('dotenv').config();

// Herkese açık: iletişim formundan mesaj gönder
router.post('/', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Tüm alanlar zorunludur.' });
  }

  try {
    await db.query('INSERT INTO messages (name, email, message) VALUES (?, ?, ?)', [name, email, message]);

    // E-posta gönder (gönderim başarısız olsa bile mesaj veritabanında kayıtlı kalır)
    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_TO || process.env.EMAIL_USER,
      replyTo: email,
      subject: `Yeni İletişim Mesajı - ${name}`,
      text: `İsim: ${name}\nE-posta: ${email}\n\nMesaj:\n${message}`
    }).catch(err => console.error('E-posta gönderilemedi:', err.message));

    res.status(201).json({ message: 'Mesajınız alındı.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Mesaj gönderilemedi.' });
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