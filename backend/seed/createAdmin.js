require('dotenv').config();
const bcrypt = require('bcrypt');
const readline = require('readline');
const db = require('../config/db');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('Yönetici kullanıcı adı: ', (username) => {
  rl.question('Yönetici şifresi: ', async (password) => {
    try {
      const hash = await bcrypt.hash(password, 10);
      await db.query('INSERT INTO admins (username, password_hash) VALUES (?, ?)', [username, hash]);
      console.log('Yönetici oluşturuldu:', username);
    } catch (err) {
      console.error('Hata:', err.message);
    } finally {
      rl.close();
      process.exit();
    }
  });
});