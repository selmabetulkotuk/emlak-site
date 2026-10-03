const express = require('express');
const router = express.Router();
const db = require('../config/db');
const resend = require('../config/mailer');
const verifyToken = require('../middleware/auth');
require('dotenv').config();

// Herkese açık: iletişim formundan mesaj gönder
// Herkese açık: iletişim formundan mesaj gönder
router.post('/', async (req, res) => {
  const { name, email, phone, message } = req.body;
  if (!name || (!phone && !email)) {
    return res.status(400).json({ error: 'Size ulaşabilmemiz için telefon veya e-posta girmelisiniz.' });
  }

  try {
    // 1. Önce veritabanına kaydet
    await db.query('INSERT INTO messages (name, email, phone, message) VALUES (?, ?, ?, ?)', [name, email || null, phone, message || 'Telefonla geri arama talebi']);

    // 2. MAİL GÖNDERİMİNİ BEKLE (await ŞİMDİ eklendi)
    const { data, error } = await resend.emails.send({
      from: 'BM Gayrimenkul <onboarding@resend.dev>',
      to: process.env.EMAIL_TO,
      reply_to: email || undefined,
      subject: `Yeni İletişim Talebi - ${name}`,
      text: `İsim: ${name}\nTelefon: ${phone || 'belirtilmedi'}\nE-posta: ${email || 'belirtilmedi'}\n\nMesaj:\n${message || 'Telefonla geri arama talebi'}`
    });

    // Eğer Resend tarafından bir hata dönerse yakala
    if (error) {
      console.error('Resend API Hatası:', error);
      return res.status(500).json({ error: 'Mesaj kaydedildi ancak e-posta gönderilemedi.' });
    }

    // 3. Mail başarıyla gittiyse yanıt dön
    res.status(201).json({ message: 'Talebiniz alındı ve e-posta gönderildi.' });

  } catch (err) {
    console.error('HATA DETAY (POST /messages):', err.message);
    res.status(500).json({ error: 'Sistemsel bir hata oluştu.' });
  }
});