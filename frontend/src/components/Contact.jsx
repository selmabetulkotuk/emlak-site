'use client';
export default function Contact() {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Mesajınız alındı, en kısa sürede dönüş yapacağız.');
  };

  return (
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
        <form className="contact-form" onSubmit={handleSubmit}>
          <input type="text" placeholder="Ad Soyad" required />
          <input type="email" placeholder="E-posta" required />
          <textarea placeholder="Mesajınız" required></textarea>
          <button type="submit" className="btn btn-primary" style={{ border: 'none' }}>Mesaj Gönder</button>
        </form>
      </div>
    </section>
  );
}