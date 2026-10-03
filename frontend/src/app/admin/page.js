'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { KARAMAN_MAHALLELERI } from '../../lib/mahalleler';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const quillModules = {
  toolbar: [
    [{ font: [] }, { size: [] }],
    ['bold', 'italic', 'underline'],
    [{ align: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['clean']
  ]
};
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
  const [floor, setFloor] = useState('');
  const [buildingAge, setBuildingAge] = useState('');
  const [details, setDetails] = useState({
  grossSize: '', bathroomCount: '', totalFloors: '', tapuDurumu: '', paylasimliIlan: '',
  gorintuluArama: '', isinmaTipi: '', krediUygun: '', konutSekli: '', esyali: '',
  yakitTipi: '', yapiTipi: '', yapininDurumu: '', kullanimDurumu: '', yetkiliOfis: '',
  takas: '', cepheSecenekleri: '', kiraGetirisi: '', eidsOnayli: '', extraNotes: ''
});
const setDetail = (key, value) => setDetails(d => ({ ...d, [key]: value }));
  const [pendingPhotos, setPendingPhotos] = useState([]); // Gerçek File nesneleri (yüklenecek)
  const [coverKey, setCoverKey] = useState(null); // 'pending-0' ya da mevcut fotoğrafın URL'si
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
  const handlePriceChange = (e) => {
  // Sadece rakamları al (harf ve diğer işaretleri engelle)
  const rawValue = e.target.value.replace(/\D/g, '');
  
  if (!rawValue) {
    setPrice('');
    return;
  }

  // Sayıyı tr-TR formatında (binlik ayraçlı) biçimlendir
  const formattedValue = new Intl.NumberFormat('tr-TR').format(rawValue);
  setPrice(formattedValue);
};

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setCategory('Daire');
    setType('Satılık');
    setPrice('');
    setSize('');
    setRooms('');
    setLocation('');
    setFloor('');
    setBuildingAge(''); 
    setDetails({
  grossSize: '', bathroomCount: '', totalFloors: '', tapuDurumu: '', paylasimliIlan: '',
  gorintuluArama: '', isinmaTipi: '', krediUygun: '', konutSekli: '', esyali: '',
  yakitTipi: '', yapiTipi: '', yapininDurumu: '', kullanimDurumu: '', yetkiliOfis: '',
  takas: '', cepheSecenekleri: '', kiraGetirisi: '', eidsOnayli: '', extraNotes: ''
});
    setDesc('');
    setPendingPhotos([]);
    setExistingPhotos([]);
    setCoverKey(null);
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
      formData.append('price', price.replace(/\./g, ''));
      formData.append('size', size);
      formData.append('rooms', rooms);
      formData.append('location', location);
      formData.append('floor', floor);
      formData.append('buildingAge', buildingAge);
      formData.append('desc', desc);
      Object.entries(details).forEach(([k, v]) => formData.append(k, v));
      pendingPhotos.forEach(file => formData.append('photos', file));
      if (coverKey && coverKey.startsWith('pending-')) {
  formData.append('coverIndex', coverKey.split('-')[1]);
} else if (coverKey) {
  formData.append('coverExistingUrl', coverKey);
}

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
    setPrice(l.price ? new Intl.NumberFormat('tr-TR').format(l.price) : '');
    setSize(l.size || '');
    setRooms(l.rooms || '');
    setLocation(l.location || '');
    setFloor(l.floor || '');
    setBuildingAge(l.buildingAge || '');
    setDetails({
  grossSize: l.grossSize || '', bathroomCount: l.bathroomCount || '', totalFloors: l.totalFloors || '',
  tapuDurumu: l.tapuDurumu || '', paylasimliIlan: l.paylasimliIlan || '', gorintuluArama: l.gorintuluArama || '',
  isinmaTipi: l.isinmaTipi || '', krediUygun: l.krediUygun || '', konutSekli: l.konutSekli || '',
  esyali: l.esyali || '', yakitTipi: l.yakitTipi || '', yapiTipi: l.yapiTipi || '',
  yapininDurumu: l.yapininDurumu || '', kullanimDurumu: l.kullanimDurumu || '', yetkiliOfis: l.yetkiliOfis || '',
  takas: l.takas || '', cepheSecenekleri: l.cepheSecenekleri || '', kiraGetirisi: l.kiraGetirisi || '',
  eidsOnayli: l.eidsOnayli || '', extraNotes: l.extraNotes || ''
});
    setDesc(l.description || l.desc || '');
    setPendingPhotos([]);
    setExistingPhotos(l.photos || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCoverKey(l.photos && l.photos.length ? l.photos[0] : null);
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

      {/* admin-wrap kısmına form alanını (sol tarafı) genişletecek bir grid yapısı ekliyoruz */}
      <div className="admin-wrap" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px', alignItems: 'start' }}>
        
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
                <option value="Apart">Apart</option>
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
              <input type="text" value={price} onChange={handlePriceChange} placeholder="2.500.000" />
            </div>
            <div className="field">
              <label>m²</label>
              <input type="number" value={size} onChange={e => setSize(e.target.value)} placeholder="145" />
            </div>
          </div>
          

          <div className="field-row">
            <div className="field">
              <label>Bulunduğu Kat</label>
              <input type="text" value={floor} onChange={e => setFloor(e.target.value)} placeholder="örn. 3. Kat, Giriş Kat" />
            </div>
            <div className="field">
              <label>Bina Yaşı</label>
              <input type="text" value={buildingAge} onChange={e => setBuildingAge(e.target.value)} placeholder="örn. Sıfır, 5-10 Yıl" />
            </div>
          </div> {/* DİKKAT: Eksik olan kapanış div'i buraya eklendi */}

          <div className="field-row">
            <div className="field">
              <label>Tapu Durumu</label>
              <select value={details.tapuDurumu} onChange={e => setDetail('tapuDurumu', e.target.value)}>
                <option value="">Seçiniz</option>
                <option>Kat Mülkiyeti</option><option>Kat İrtifakı</option><option>Arsa Tapulu</option><option>Hisseli Tapu</option><option>Müstakil Tapulu</option>
              </select>
            </div>
            <div className="field">
              <label>Banyo Sayısı</label>
              <input type="number" value={details.bathroomCount} onChange={e => setDetail('bathroomCount', e.target.value)} placeholder="1" />
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

          <div className="field-row">
  <div className="field">
    <label>Bulunduğu Kat</label>
    <input 
      type="text" 
      value={floor} 
      onChange={e => setFloor(e.target.value)} 
      placeholder="örn. 3. Kat, Giriş Kat" 
    />
  </div>
  <div className="field">
    <label>Bina Yaşı</label>
    <input 
      type="text" 
      value={buildingAge} 
      onChange={e => setBuildingAge(e.target.value)} 
      placeholder="örn. Sıfır, 5-10 Yıl" 
    />
  </div>
  <div className="field-row">
  <div className="field">
    <label>Tapu Durumu</label>
    <select value={details.tapuDurumu} onChange={e => setDetail('tapuDurumu', e.target.value)}>
      <option value="">Seçiniz</option>
      <option>Kat Mülkiyeti</option><option>Kat İrtifakı</option><option>Arsa Tapulu</option><option>Hisseli Tapu</option><option>Müstakil Tapulu</option>
    </select>
  </div>
  <div className="field">
    <label>Banyo Sayısı</label>
    <input type="number" value={details.bathroomCount} onChange={e => setDetail('bathroomCount', e.target.value)} placeholder="1" />
  </div>
</div>
<div className="field-row">
  <div className="field">
    <label>Brüt m²</label>
    <input type="number" value={details.grossSize} onChange={e => setDetail('grossSize', e.target.value)} placeholder="158" />
  </div>
  <div className="field">
    <label>Binadaki Kat Sayısı</label>
    <input type="number" value={details.totalFloors} onChange={e => setDetail('totalFloors', e.target.value)} placeholder="3" />
  </div>
</div>
<div className="field-row">
  <div className="field">
    <label>Isınma Tipi</label>
    <select value={details.isinmaTipi} onChange={e => setDetail('isinmaTipi', e.target.value)}>
      <option value="">Seçiniz</option>
      <option>Kombi</option><option>Merkezi</option><option>Yerden Isıtma</option><option>Soba</option><option>Klima</option><option>Isıtma Yok</option>
    </select>
  </div>
  <div className="field">
    <label>Yakıt Tipi</label>
    <select value={details.yakitTipi} onChange={e => setDetail('yakitTipi', e.target.value)}>
      <option value="">Seçiniz</option>
      <option>Doğalgaz</option><option>Elektrik</option><option>Kömür</option><option>Yok</option>
    </select>
  </div>
</div>
<div className="field-row">
  <div className="field">
    <label>Yapı Tipi</label>
    <select value={details.yapiTipi} onChange={e => setDetail('yapiTipi', e.target.value)}>
      <option value="">Seçiniz</option>
      <option>Betonarme</option><option>Çelik</option><option>Ahşap</option>
    </select>
  </div>
  <div className="field">
    <label>Yapının Durumu</label>
    <select value={details.yapininDurumu} onChange={e => setDetail('yapininDurumu', e.target.value)}>
      <option value="">Seçiniz</option>
      <option>Sıfır</option><option>İkinci El</option>
    </select>
  </div>
</div>
<div className="field-row">
  <div className="field">
    <label>Kullanım Durumu</label>
    <select value={details.kullanimDurumu} onChange={e => setDetail('kullanimDurumu', e.target.value)}>
      <option value="">Seçiniz</option>
      <option>Boş</option><option>Kiracılı</option><option>Mülk Sahibi</option>
    </select>
  </div>
  <div className="field">
    <label>Konut Şekli</label>
    <input type="text" value={details.konutSekli} onChange={e => setDetail('konutSekli', e.target.value)} placeholder="örn. Daire, Dubleks" />
  </div>
</div>
<div className="field-row">
  <div className="field">
    <label>Eşyalı mı?</label>
    <select value={details.esyali} onChange={e => setDetail('esyali', e.target.value)}>
      <option value="">Seçiniz</option><option>Evet</option><option>Hayır</option>
    </select>
  </div>
  <div className="field">
    <label>Krediye Uygun mu?</label>
    <select value={details.krediUygun} onChange={e => setDetail('krediUygun', e.target.value)}>
      <option value="">Seçiniz</option><option>Evet</option><option>Hayır</option>
    </select>
  </div>
</div>
<div className="field-row">
  <div className="field">
    <label>Takas</label>
    <select value={details.takas} onChange={e => setDetail('takas', e.target.value)}>
      <option value="">Seçiniz</option><option>Yapılır</option><option>Yapılmaz</option>
    </select>
  </div>
  <div className="field">
    <label>Yetkili Ofis mi?</label>
    <select value={details.yetkiliOfis} onChange={e => setDetail('yetkiliOfis', e.target.value)}>
      <option value="">Seçiniz</option><option>Evet</option><option>Hayır</option>
    </select>
  </div>
</div>
<div className="field-row">
  <div className="field">
    <label>Paylaşımlı İlan mı?</label>
    <select value={details.paylasimliIlan} onChange={e => setDetail('paylasimliIlan', e.target.value)}>
      <option value="">Seçiniz</option><option>Evet</option><option>Hayır</option>
    </select>
  </div>
  <div className="field">
    <label>Görüntülü Arama ile Gezilebilir mi?</label>
    <select value={details.gorintuluArama} onChange={e => setDetail('gorintuluArama', e.target.value)}>
      <option value="">Seçiniz</option><option>Evet</option><option>Hayır</option>
    </select>
  </div>
</div>
<div className="field-row">
  <div className="field">
    <label>EIDS Onaylı mı?</label>
    <select value={details.eidsOnayli} onChange={e => setDetail('eidsOnayli', e.target.value)}>
      <option value="">Seçiniz</option><option>Evet</option><option>Hayır</option>
    </select>
  </div>
  <div className="field">
    <label>Kira Getirisi (TL)</label>
    <input type="number" value={details.kiraGetirisi} onChange={e => setDetail('kiraGetirisi', e.target.value)} placeholder="opsiyonel" />
  </div>
</div>
<div className="field">
  <label>Cephe Seçenekleri</label>
  <input type="text" value={details.cepheSecenekleri} onChange={e => setDetail('cepheSecenekleri', e.target.value)} placeholder="örn. Güney, Doğu, Batı" />
</div>
</div>
          <div className="field">
            <label>Açıklama</label>

     <ReactQuill theme="snow" value={desc} onChange={setDesc} modules={quillModules} />         
 </div>
 <div className="field">
  <label>Ek Açıklamalar (opsiyonel, kısa notlar)</label>
  <textarea value={details.extraNotes} onChange={e => setDetail('extraNotes', e.target.value)} placeholder="örn. Eşyalar dahildir, acil satılık..."></textarea>
</div>
          <div className="field">
            <label>Fotoğraflar</label>
            <div className="photo-drop" onClick={() => document.getElementById('f-photos').click()}>
              Fotoğraf eklemek için tıklayın (birden fazla seçebilirsiniz)
            </div>
            <input type="file" id="f-photos" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} />

            {existingPhotos.length > 0 && (
              <div className="photo-preview">
                {(existingPhotos.length > 0 || pendingPhotos.length > 0) && (
  <div className="photo-preview">
    {existingPhotos.map((p, i) => (
      <div key={`existing-${i}`} className="thumb" style={{ position: 'relative', border: coverKey === p ? '2px solid var(--gold)' : 'none' }}>
        <img src={photoUrl(p)} alt={`Mevcut ${i}`} />
        <button
          type="button"
          onClick={() => setCoverKey(p)}
          style={{ position: 'absolute', bottom: 4, left: 4, right: 4, fontSize: '11px', padding: '2px 4px', background: coverKey === p ? 'var(--gold)' : 'rgba(0,0,0,0.6)', color: coverKey === p ? '#000' : '#fff', border: 'none', borderRadius: '2px', cursor: 'pointer' }}
        >
          {coverKey === p ? '★ Kapak' : 'Kapak Yap'}
        </button>
      </div>
    ))}
    {pendingPhotos.map((file, i) => {
      const key = `pending-${i}`;
      return (
        <div key={key} className="thumb" style={{ position: 'relative', border: coverKey === key ? '2px solid var(--gold)' : 'none' }}>
          <img src={URL.createObjectURL(file)} alt={`Yüklenen ${i}`} />
          <button type="button" onClick={() => removePendingPhoto(i)} style={{ position: 'absolute', top: 2, right: 2 }}>✕</button>
          <button
            type="button"
            onClick={() => setCoverKey(key)}
            style={{ position: 'absolute', bottom: 4, left: 4, right: 4, fontSize: '11px', padding: '2px 4px', background: coverKey === key ? 'var(--gold)' : 'rgba(0,0,0,0.6)', color: coverKey === key ? '#000' : '#fff', border: 'none', borderRadius: '2px', cursor: 'pointer' }}
          >
            {coverKey === key ? '★ Kapak' : 'Kapak Yap'}
          </button>
        </div>
      );
    })}
  </div>
)}
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