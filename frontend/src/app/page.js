'use client';
import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import Link from 'next/link';
import { KARAMAN_MAHALLELERI } from '../lib/mahalleler';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function Home() {
  // Durum Yönetimleri (State)
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [type, setType] = useState('all');
  const [mahalle, setMahalle] = useState('all');
  const [sort, setSort] = useState('new');
  const [selectedListing, setSelectedListing] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);
const [contactName, setContactName] = useState('');
const [contactEmail, setContactEmail] = useState('');
const [contactMsg, setContactMsg] = useState('');
const [contactStatus, setContactStatus] = useState('');

const [callName, setCallName] = useState('');
const [callPhone, setCallPhone] = useState('');
const [callStatus, setCallStatus] = useState('');

const requestCall = async (e) => {
  e.preventDefault();
  setCallStatus('');
  try {
    const res = await fetch(`${API_URL}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: callName, phone: callPhone, message: 'Telefonla geri arama talebi' })
    });
    if (!res.ok) throw new Error();
    setCallStatus('Talebiniz alındı, en kısa sürede arayacağız.');
    setCallName('');
    setCallPhone('');
  } catch (err) {
    setCallStatus('Bir hata oluştu, lütfen tekrar deneyin.');
  }
};

const sendMessage = async (e) => {
  e.preventDefault();
  setContactStatus('');
  try {
    const res = await fetch(`${API_URL}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: contactName, email: contactEmail, message: contactMsg })
    });
    if (!res.ok) throw new Error();
    setContactStatus('Mesajınız alındı, en kısa sürede dönüş yapacağız.');
    setContactName('');
    setContactEmail('');
    setContactMsg('');
  } catch (err) {
    setContactStatus('Mesaj gönderilemedi, lütfen tekrar deneyin.');
  }
};
  const [allListings, setAllListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const canvasRef = useRef(null);
  const formatPrice = (n) => new Intl.NumberFormat('tr-TR').format(Number(n)) + ' TL';
  // Backend'den gelen fotoğraf yolu /uploads/... şeklinde göreli geliyor, başına API adresini ekliyoruz
  const photoUrl = (p) => (p && p.startsWith('http') ? p : `${API_URL}${p}`);

  // İlanları backend'den çek
  useEffect(() => {
    fetch(`${API_URL}/api/listings`)
      .then(res => res.json())
      .then(data => {
        const normalized = data.map(l => ({ ...l, desc: l.description }));
        setAllListings(normalized);
      })
      .catch(err => console.error('İlanlar alınamadı:', err))
      .finally(() => setLoading(false));
  }, []);

  // Three.js Arkaplan Animasyonu & Scroll Takibi
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);

    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 9);

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const gold = new THREE.Color(0xC7A05C);
    const goldDim = new THREE.Color(0x6B5A34);
    const group = new THREE.Group();
    scene.add(group);

    const shapes = [];
    const geos = [
      () => new THREE.IcosahedronGeometry(2.4, 0),
      () => new THREE.OctahedronGeometry(1.7, 0),
      () => new THREE.TetrahedronGeometry(1.5, 0),
      () => new THREE.IcosahedronGeometry(1.1, 1),
    ];

    for(let i=0; i<5; i++){
      const geo = geos[i % geos.length]();
      const mat = new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? gold : goldDim, wireframe: true, transparent: true, opacity: 0.32 - i * 0.02 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set((Math.random()-0.5)*10, (Math.random()-0.5)*6, (Math.random()-0.5)*6 - 2);
      mesh.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, 0);
      mesh.userData = { speed: 0.05 + Math.random()*0.08, axis: new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize() };
      group.add(mesh);
      shapes.push(mesh);
    }

    const particleCount = 220;
    const positions = new Float32Array(particleCount * 3);
    for(let i=0; i<particleCount; i++){
      positions[i*3] = (Math.random()-0.5)*24;
      positions[i*3+1] = (Math.random()-0.5)*14;
      positions[i*3+2] = (Math.random()-0.5)*14 - 4;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({color: 0xC7A05C, size: 0.028, transparent: true, opacity: 0.55});
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    let mouseX = 0, mouseY = 0;
    const handleMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5);
      mouseY = (e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener('mousemove', handleMouseMove);

    const clock = new THREE.Clock();
    let animationFrameId;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      shapes.forEach(m => m.rotateOnAxis(m.userData.axis, m.userData.speed * dt));
      points.rotation.y += dt * 0.01;
      camera.position.x += (mouseX * 1.2 - camera.position.x) * 0.02;
      camera.position.y += (-mouseY * 0.8 - camera.position.y) * 0.02;
      camera.lookAt(0,0,0);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      scene.clear();
    };
  }, []);

  // Filtreleme Mantığı
  const filteredListings = allListings.filter(l => {
    const matchSearch = !search || l.title.toLowerCase().includes(search.toLowerCase()) || (l.location || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || l.category === category;
    const matchType = type === 'all' || l.type === type;
    const matchMahalle = mahalle === 'all' || l.location === mahalle;
    return matchSearch && matchCat && matchType && matchMahalle;
  }).sort((a, b) => {
    if (sort === 'price-asc') return a.price - b.price;
    if (sort === 'price-desc') return b.price - a.price;
    return 0;
  });

  return (
    <div id="site-view">
      {/* HEADER */}
      <header id="site-header" className={scrolled ? 'scrolled' : ''}>
        <Link href="#" className="logo" onClick={() => setMenuOpen(false)}>
          <span className="mark">Berk Mutlu</span><span className="sub">GAYRİMENKUL</span>
        </Link>
        <nav className={`links ${menuOpen ? 'open' : ''}`} id="nav-links">
          <Link href="#home" onClick={() => setMenuOpen(false)}>Ana Sayfa</Link>
          <Link href="#listings" onClick={() => setMenuOpen(false)}>İlanlar</Link>
          <Link href="#contact" onClick={() => setMenuOpen(false)}>İletişim</Link>
          <Link href="/admin" className="admin-link">Yönetici</Link>
        </nav>
        <button className="burger" onClick={() => setMenuOpen(!menuOpen)}>
          <span></span><span></span><span></span>
        </button>
      </header>

      {/* HERO */}
      <section className="hero" id="home">
        <canvas id="bg-canvas" ref={canvasRef}></canvas>
        <div className="hero-content">
          <div className="line"></div>
          <h1>Her Zemin Bir <em>Başlangıçtır</em></h1>
          <p>Şehrin en seçkin bölgelerinden satılık ve kiralık daire, villa, müstakil ev ve arsa fırsatlarını keşfedin.</p>
          <div className="hero-cta">
            <Link href="#listings" className="btn btn-primary">İlanları Keşfet</Link>
            <Link href="#contact" className="btn btn-ghost">Bize Ulaşın</Link>
          </div>
        </div>
        <div className="scroll-cue"><div className="dash"></div><span>AŞAĞI KAYDIRIN</span></div>
      </section>

      {/* LİSTELER (GRID) */}
      <section id="listings">
        <div className="section-head">
          <div>
            <h2>Güncel İlanlar</h2>
            <p>İhtiyacınıza uygun mülkü bulmak için kategori, tür ve konuma göre filtreleyin.</p>
          </div>
        </div>
        <div className="filter-bar">
          <input type="text" placeholder="Konum veya başlık ara..." value={search} onChange={e => setSearch(e.target.value)} id="search" />
          <select value={category} onChange={e => setCategory(e.target.value)}>
            <option value="all">Tüm Kategoriler</option>
            <option value="Daire">Daire</option>
            <option value="Villa">Villa</option>
            <option value="Müstakil Ev">Müstakil Ev</option>
            <option value="Arsa">Arsa</option>
            <option value="İşyeri">İşyeri</option>
            <option value="İşyeri">Apart</option>

          </select>
          <select value={type} onChange={e => setType(e.target.value)}>
            <option value="all">Satılık / Kiralık</option>
            <option value="Satılık">Satılık</option>
            <option value="Kiralık">Kiralık</option>
          </select>
          <select value={mahalle} onChange={e => setMahalle(e.target.value)}>
  <option value="all">Tüm Mahalleler</option>
  {KARAMAN_MAHALLELERI.map(m => (
    <option key={m} value={m}>{m}</option>
  ))}
</select>
          <select value={sort} onChange={e => setSort(e.target.value)}>
            <option value="new">En Yeni</option>
            <option value="price-asc">Fiyat: Düşükten Yükseğe</option>
            <option value="price-desc">Fiyat: Yüksekten Düşüğe</option>
          </select>
          <span className="filter-count">{filteredListings.length} ilan</span>
        </div>

        <div className="grid">
          {loading ? (
            <div className="empty-state"><h3>Yükleniyor...</h3></div>
          ) : filteredListings.length === 0 ? (
            <div className="empty-state"><h3>Uygun ilan bulunamadı</h3><p>Filtreleri değiştirerek tekrar deneyin.</p></div>
          ) : (
            filteredListings.map(l => (
              <div key={l.id} className="card" onClick={() => { setSelectedListing(l); setPhotoIndex(0); }}>
                <div className="card-photo">
                  {l.photos?.length ? <img src={photoUrl(l.photos[0])} alt={l.title} /> : <div className="no-photo">FOTOĞRAF YOK</div>}
                  <div className="badges">
                    <span className={`badge ${l.type === 'Satılık' ? 'badge-type-sale' : 'badge-type-rent'}`}>{l.type}</span>
                  </div>
                </div>
                <div className="card-body">
                  <span className="cat">{l.category.toUpperCase()}</span>
                  <h3>{l.title}</h3>
                  <div className="loc">{l.location}</div>
                  <div className="card-foot">
                    <span className="price">{formatPrice(l.price)}</span>
                    <span className="meta">{l.size ? `${l.size} m²` : ''}{l.rooms ? ` · ${l.rooms}` : ''}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* HIZLI ARAMA TALEBİ */}
<section style={{ padding: '60px 24px', textAlign: 'center', background: 'var(--panel, #1a1a1a)' }}>
  <h2 style={{ marginBottom: '8px' }}>Sizi Arayalım</h2>
  <p style={{ marginBottom: '24px', opacity: 0.8 }}>Telefon numaranızı bırakın, size en kısa sürede dönüş yapalım.</p>
  <form onSubmit={requestCall} style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', maxWidth: '600px', margin: '0 auto' }}>
    <input type="text" placeholder="Ad Soyad" value={callName} onChange={e => setCallName(e.target.value)} required style={{ flex: '1 1 200px' }} />
    <input type="tel" placeholder="Telefon Numaranız" value={callPhone} onChange={e => setCallPhone(e.target.value)} required style={{ flex: '1 1 200px' }} />
    <button type="submit" className="btn btn-primary" style={{ border: 'none' }}>Beni Arayın</button>
  </form>
  {callStatus && <p style={{ marginTop: '12px', fontSize: '14px' }}>{callStatus}</p>}
</section>

      {/* İLETİŞİM */}
      <section className="contact-section" id="contact">
        <div className="contact-wrap">
          <div>
            <h2>Doğru Mülkü Birlikte Bulalım</h2>
            <p>Satmak, kiralamak ya da hayalinizdeki mekanı bulmak istiyorsanız, ekibimiz size özel bir görüşme için hazır.</p>
            <div className="contact-info">
              <div><span>TELEFON</span>+90 545 426 8962</div>
              <div><span>E-POSTA</span>berkmutlu701@gmail.com</div>
              <div><span>OFİS</span>Karaman, Türkiye</div>
            </div>
          </div>
          <form className="contact-form" onSubmit={sendMessage}>
  <input type="text" placeholder="Ad Soyad" value={contactName} onChange={e => setContactName(e.target.value)} required />
  <input type="email" placeholder="E-posta" value={contactEmail} onChange={e => setContactEmail(e.target.value)} required />
  <textarea placeholder="Mesajınız" value={contactMsg} onChange={e => setContactMsg(e.target.value)} required></textarea>
  <button type="submit" className="btn btn-primary" style={{ border: 'none' }}>Mesaj Gönder</button>
  {contactStatus && <p style={{ marginTop: '10px', fontSize: '14px' }}>{contactStatus}</p>}
</form>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <span className="fmark">BM</span>
        <span className="fmeta">&copy; 2026 BM Gayrimenkul. Tüm hakları saklıdır.</span>
        <div className="flinks">
          <Link href="#listings">İlanlar</Link>
          <Link href="#contact">İletişim</Link>
          <Link href="/admin">Yönetici Paneli</Link>
        </div>
      </footer>

      {/* DETAY MODALI (Açılır Pencere) */}
      {selectedListing && (
        <div className="overlay" onClick={(e) => e.target.className === 'overlay' && setSelectedListing(null)}>
          <div className="modal">
            <button className="modal-close" onClick={() => setSelectedListing(null)}>✕</button>
            <div className="modal-gallery">
              {selectedListing.photos?.length ? (
                <>
                  <img src={photoUrl(selectedListing.photos[photoIndex])} alt="Görsel" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {selectedListing.photos.length > 1 && (
                    <>
                      <button className="gallery-nav prev" onClick={() => setPhotoIndex((prev) => (prev - 1 + selectedListing.photos.length) % selectedListing.photos.length)}>‹</button>
                      <button className="gallery-nav next" onClick={() => setPhotoIndex((prev) => (prev + 1) % selectedListing.photos.length)}>›</button>
                      <div className="gallery-dots">
                        {selectedListing.photos.map((_, i) => (
                          <span key={i} className={i === photoIndex ? 'active' : ''} onClick={() => setPhotoIndex(i)}></span>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="no-photo" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>FOTOĞRAF YOK</div>
              )}
            </div>
            <div className="modal-body">
              <div className="badges-row">
                <span className={`badge ${selectedListing.type === 'Satılık' ? 'badge-type-sale' : 'badge-type-rent'}`} style={{ position: 'static' }}>{selectedListing.type}</span>
                <span className="badge" style={{ position: 'static', background: 'var(--panel-2)', color: 'var(--gold-dim)', border: '1px solid var(--border)' }}>{selectedListing.category}</span>
              </div>
              <h2>{selectedListing.title}</h2>
              <div className="loc">📍 {selectedListing.location}</div>
              <div className="price-row"><span className="price">{formatPrice(selectedListing.price)}</span></div>
              <div className="spec-row">
                {selectedListing.size && <div>Metrekare<span>{selectedListing.size} m²</span></div>}
                {selectedListing.rooms && <div>Oda Sayısı<span>{selectedListing.rooms}</span></div>}
                <div>Kategori<span>{selectedListing.category}</span></div>
              </div>
              <p className="desc">{selectedListing.desc || 'Bu ilan için henüz açıklama eklenmemiş.'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}