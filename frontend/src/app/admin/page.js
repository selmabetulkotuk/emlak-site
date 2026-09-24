'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { KARAMAN_MAHALLELERI } from '../../lib/mahalleler';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function Admin() {
  // --- KİMLİK DOĞRULAMA (AUTH) STATE'LERİ ---
  const [token, setToken] = useState(null);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginErr, setLoginErr] = useState('');

  // --- İLAN FORM STATE'LERİ ---
  const [listings, setListings] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Daire');
  const [type, setType] = useState('Satılık');
  const [price, setPrice] = useState('');
  const [size, setSize] = useState('');
  const [rooms, setRooms] = useState('');
  const [location, setLocation] = useState('');
  const [desc, setDesc] = useState('');
  const [pendingPhotos, setPendingPhotos] = useState([]); // Gerçek File nesneleri (yüklenecek)
  const [existingPhotos, setExistingPhotos] = useState([]); // Düzenlerken mevcut fotoğraflar (sadece gösterim)
  const [toastMsg, setToastMsg] = useState('');

  const photoUrl = (p) => (p && p.startsWith('http') ? p : `${API_URL}${p}`);

  // Sayfa yüklendiğinde token var mı kontrol et
  useEffect(() => {
    const savedToken = localStorage.getItem('bm_token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  // Token değiştiğinde (girişten sonra) ilanları çek
  useEffect(() => {
    if (token) fetchListings();
  }, [token]);

  const fetchListings = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/listings`);
      setListings(res.data);
    } catch (err) {
      console.error('İlanlar alınamadı:', err);
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2600);
  };

  // --- GİRİŞ İŞLEMİ (BACKEND'E İSTEK) ---
  const tryLogin = async () => {
    try {
      setLoginErr('');
      const res = await axios.post(`${API_URL}/api/auth/login`, {
        username: loginUser,
        password: loginPass
      });

      const receivedToken = res.data.token;
      localStorage.setItem('bm_token', receivedToken);
      setToken(receivedToken);
      showToast('Giriş başarılı!');
    } catch (err) {
      setLoginErr(err.response?.data?.error || 'Kullanıcı adı veya şifre hatalı.');
    }
  };

  const logout = () => {
    localStorage.removeItem('bm_token');
    setToken(null);
  };

  // --- FOTOĞRAF SEÇİMİ (gerçek dosyaları saklıyoruz, önizleme için object URL kullanıyoruz) ---
  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    setPendingPhotos(prev => [...prev, ...files]);
    e.target.value = '';
  };

  const removePendingPhoto = (index) => {
    setPendingPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const formatPrice = (n) => new Intl.NumberFormat('tr-TR').format(Number(n)) + ' TL';

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setCategory('Daire');
    setType('Satılık');
    setPrice('');
    setSize('');
    setRooms('');
    setLocation('');
    setDesc('');
    setPendingPhotos([]);
    setExistingPhotos([]);
  };

  // --- İLANI KAYDET (yeni ekle ya da güncelle) ---
  const submitListing = async () => {
    if (!title || !price) {
      showToast('Başlık ve fiyat zorunludur.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('type', type);
      formData.append('price', price);
      formData.append('size', size);
      formData.append('rooms', rooms);
      formData.append('location', location);
      formData.append('desc', desc);
      pendingPhotos.forEach(file => formData.append('photos', file));

      const url = editingId ? `${API_URL}/api/listings/${editingId}` : `${API_URL}/api/listings`;
      const method = editingId ? 'put' : 'post';

      await axios[method](url, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      showToast(editingId ? 'İlan güncellendi.' : 'İlan yayınlandı.');
      resetForm();
      fetchListings();
    } catch (err) {
      showToast(err.response?.data?.error || 'Bir hata oluştu.');
    }
  };

  // --- DÜZENLEME BAŞLAT ---
  const startEdit = (l) => {
    setEditingId(l.id);
    setTitle(l.title);
    setCategory(l.category);
    setType(l.type);
    setPrice(l.price);
    setSize(l.size || '');
    setRooms(l.rooms || '');
    setLocation(l.location || '');
    setDesc(l.description || l.desc || '');
    setPendingPhotos([]);
    setExistingPhotos(l.photos || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- İLAN SİL ---
  const deleteListing = async (id) => {
    if (!confirm('Bu ilanı silmek istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`${API_URL}/api/listings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('İlan silindi.');
      if (editingId === id) resetForm();
      fetchListings();
    } catch (err) {
      showToast('Silme işlemi başarısız.');
    }
  };

  // Eğer token yoksa (Giriş Yapılmamışsa) Login Ekranını Göster
  if (!token) {
    return (
      <div className="overlay" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="login-box">
          <h3>Yönetici Girişi</h3>
          <p className="hint">İlanları eklemek ve düzenlemek için giriş yapın.</p>
          <div className="field">
            <label>Kullanıcı Adı</label>
            <input type="text" value={loginUser} onChange={e => setLoginUser(e.target.value)} placeholder="admin" />
          </div>
          <div className="field">
            <label>Şifre</label>
            <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} placeholder="••••••••" onKeyDown={(e) => e.key === 'Enter' && tryLogin()} />
          </div>
          <div className="login-err" style={{ minHeight: '20px' }}>{loginErr}</div>
          <button className="admin-submit" onClick={tryLogin}>Giriş Yap</button>
          <Link href="/">
            <button className="admin-cancel" style={{ width: '100%', marginTop: '8px' }}>Siteye Dön</button>
          </Link>
        </div>
      </div>
    );
  }

  // Eğer token varsa (Giriş Yapılmışsa) Yönetici Panelini Göster
  return (
    <div id="admin-view" style={{ minHeight: '100vh', paddingTop: '100px', backgroundColor: 'var(--bg)' }}>
      <header className="scrolled">
        <Link href="/" className="logo">
          <span className="mark">BM</span><span className="sub">YÖNETİCİ PANELİ</span>
        </Link>
        <nav className="links" style={{ position: 'static', transform: 'none', flexDirection: 'row', padding: 0, background: 'none', border: 'none', width: 'auto' }}>
          <button className="admin-link" onClick={logout} style={{ background: 'transparent', cursor: 'pointer' }}>Çıkış Yap</button>
          <Link href="/" className="admin-link">Siteye Dön</Link>
        </nav>
      </header>

      <div className="admin-header">
        <div>
          <span className="tag">İLAN YÖNETİMİ</span>
          <h1>Yönetici Paneli</h1>
        </div>
      </div>

      <div className="admin-wrap">
        {/* SOL TARAF: İLAN EKLEME FORMU */}
        <div className="admin-panel">
          <h3>{editingId ? 'İlanı Düzenle' : 'Yeni İlan Ekle'}</h3>
          <div className="field">
            <label>İlan Başlığı</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="örn. Bahçeli Müstakil Ev" />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Kategori</label>
              <select value={category} onChange={e => setCategory(e.target.value)}>
                <option>Daire</option>
                <option>Villa</option>
                <option>Müstakil Ev</option>
                <option>Arsa</option>
                <option>İşyeri</option>
              </select>
            </div>
            <div className="field">
              <label>Durum</label>
              <select value={type} onChange={e => setType(e.target.value)}>
                <option>Satılık</option>
                <option>Kiralık</option>
              </select>
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Fiyat (TL)</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="2500000" />
            </div>
            <div className="field">
              <label>m²</label>
              <input type="number" value={size} onChange={e => setSize(e.target.value)} placeholder="145" />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Oda Sayısı</label>
              <input type="text" value={rooms} onChange={e => setRooms(e.target.value)} placeholder="3+1 (opsiyonel)" />
            </div>
            <div className="field">
              <label>Konum</label>
              <select value={location} onChange={e => setLocation(e.target.value)}>
  <option value="">Mahalle seçin</option>
  {KARAMAN_MAHALLELERI.map(m => (
    <option key={m} value={m}>{m}</option>
  ))}
</select>
            </div>
          </div>
          <div className="field">
            <label>Açıklama</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Mülk hakkında detaylı bilgi..."></textarea>
          </div>
          <div className="field">
            <label>Fotoğraflar</label>
            <div className="photo-drop" onClick={() => document.getElementById('f-photos').click()}>
              Fotoğraf eklemek için tıklayın (birden fazla seçebilirsiniz)
            </div>
            <input type="file" id="f-photos" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} />

            {existingPhotos.length > 0 && (
              <div className="photo-preview">
                {existingPhotos.map((p, i) => (
                  <div key={`existing-${i}`} className="thumb">
                    <img src={photoUrl(p)} alt={`Mevcut ${i}`} />
                  </div>
                ))}
              </div>
            )}

            <div className="photo-preview">
              {pendingPhotos.map((file, i) => (
                <div key={i} className="thumb">
                  <img src={URL.createObjectURL(file)} alt={`Yüklenen ${i}`} />
                  <button onClick={() => removePendingPhoto(i)}>✕</button>
                </div>
              ))}
            </div>
          </div>
          <button className="admin-submit" onClick={submitListing}>
            {editingId ? 'Değişiklikleri Kaydet' : 'İlanı Yayınla'}
          </button>
          {editingId && (
            <button className="admin-cancel" onClick={resetForm}>Düzenlemeyi İptal Et</button>
          )}
        </div>

        {/* SAĞ TARAF: YAYINDAKİ İLANLAR LİSTESİ */}
        <div>
          <h3 style={{ marginBottom: '16px', fontWeight: 500 }}>Yayındaki İlanlar ({listings.length})</h3>
          <div className="admin-list">
            {listings.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 0' }}>Henüz ilan eklenmedi.</div>
            ) : (
              listings.map(l => (
                <div key={l.id} className="admin-row">
                  <div className="thumb">{l.photos?.length ? <img src={photoUrl(l.photos[0])} alt="Kapak" /> : ''}</div>
                  <div className="info">
                    <h4>{l.title}</h4>
                    <div className="meta">{l.category} · {l.type} · {l.location}</div>
                  </div>
                  <div className="price">{formatPrice(l.price)}</div>
                  <div className="actions">
                    <button className="icon-btn" title="Düzenle" onClick={() => startEdit(l)}>✎</button>
                    <button className="icon-btn del" title="Sil" onClick={() => deleteListing(l.id)}>🗑</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className={`toast ${toastMsg ? 'show' : ''}`}>{toastMsg}</div>
    </div>
  );
}