'use client';
import { useState } from 'react';

const SAMPLE_LISTINGS = [
  { id: 's1', title: 'Bahçeli Müstakil Ev', category: 'Müstakil Ev', type: 'Satılık', price: 4850000, size: 210, rooms: '4+1', location: 'Selçuklu, Konya', desc: 'Geniş bahçeli, doğalgaz kombili, ana caddeye yakın konumda ferah bir müstakil ev.', photos: ['https://picsum.photos/seed/kosk-house1/900/600', 'https://picsum.photos/seed/kosk-house1b/900/600'] },
  { id: 's2', title: 'Merkezi Konumda Kiralık Daire', category: 'Daire', type: 'Kiralık', price: 14500, size: 120, rooms: '2+1', location: 'Meram, Konya', desc: 'Yeni yapılmış sitede, otoparklı, asansörlü, eşyasız kiralık daire.', photos: ['https://picsum.photos/seed/kosk-flat1/900/600'] },
  { id: 's3', title: 'Yatırımlık İmarlı Arsa', category: 'Arsa', type: 'Satılık', price: 1250000, size: 500, rooms: '', location: 'Karatay, Konya', desc: 'Yola cepheli, imar durumu net, yatırım için uygun köşe arsa.', photos: ['https://picsum.photos/seed/kosk-land1/900/600'] }
];

export default function ListingGrid() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [type, setType] = useState('all');
  const [sort, setSort] = useState('new');
  
  const [selectedListing, setSelectedListing] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  const formatPrice = (n) => new Intl.NumberFormat('tr-TR').format(n) + ' TL';

  const filteredListings = SAMPLE_LISTINGS.filter(l => {
    const matchSearch = !search || l.title.toLowerCase().includes(search.toLowerCase()) || l.location.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || l.category === category;
    const matchType = type === 'all' || l.type === type;
    return matchSearch && matchCat && matchType;
  }).sort((a, b) => {
    if (sort === 'price-asc') return a.price - b.price;
    if (sort === 'price-desc') return b.price - a.price;
    return 0; // Şimdilik yeniye göre sıralama sabit
  });

  return (
    <>
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
          </select>
          <select value={type} onChange={e => setType(e.target.value)}>
            <option value="all">Satılık / Kiralık</option>
            <option value="Satılık">Satılık</option>
            <option value="Kiralık">Kiralık</option>
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)}>
            <option value="new">En Yeni</option>
            <option value="price-asc">Fiyat: Düşükten Yükseğe</option>
            <option value="price-desc">Fiyat: Yüksekten Düşüğe</option>
          </select>
          <span className="filter-count">{filteredListings.length} ilan</span>
        </div>

        <div className="grid">
          {filteredListings.length === 0 ? (
            <div className="empty-state">
              <h3>Uygun ilan bulunamadı</h3>
              <p>Filtreleri değiştirerek tekrar deneyin.</p>
            </div>
          ) : (
            filteredListings.map(l => (
              <div key={l.id} className="card" onClick={() => { setSelectedListing(l); setPhotoIndex(0); }}>
                <div className="card-photo">
                  {l.photos?.length ? <img src={l.photos[0]} alt={l.title} /> : <div className="no-photo">FOTOĞRAF YOK</div>}
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

      {/* İlan Detay Modalı */}
      {selectedListing && (
        <div className="overlay" onClick={(e) => e.target.className === 'overlay' && setSelectedListing(null)}>
          <div className="modal">
            <button className="modal-close" onClick={() => setSelectedListing(null)}>✕</button>
            <div className="modal-gallery">
              {selectedListing.photos?.length ? (
                <>
                  <img src={selectedListing.photos[photoIndex]} alt="Görsel" />
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
    </>
  );
}