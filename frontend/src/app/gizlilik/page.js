import Link from 'next/link';

export const metadata = {
  title: 'Gizlilik Politikası | BM Gayrimenkul',
  description: 'BM Gayrimenkul kişisel verilerin korunması ve gizlilik politikası.',
};

export default function Gizlilik() {
  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '120px 24px 80px', lineHeight: 1.7, color: 'var(--text, #e5e5e5)' }}>
      <h1 style={{ marginBottom: '24px' }}>Gizlilik Politikası ve Kişisel Verilerin Korunması</h1>

      <p>
        BM Gayrimenkul (&quot;biz&quot;) olarak, internet sitemiz (bmgayrimenkul.com) üzerinden
        iletişim formu aracılığıyla paylaştığınız kişisel verilerin (ad soyad, e-posta adresi
        ve mesaj içeriği) güvenliğine önem veriyoruz. Bu metin, 6698 sayılı Kişisel Verilerin
        Korunması Kanunu (KVKK) kapsamında sizi bilgilendirmek amacıyla hazırlanmıştır.
      </p>

      <h2 style={{ marginTop: '32px', marginBottom: '12px' }}>Toplanan Veriler</h2>
      <p>
        İletişim formunu doldurduğunuzda yalnızca sizin bize ilettiğiniz ad soyad, e-posta
        adresi ve mesaj içeriği tarafımızca kaydedilir. Sitemizi ziyaret etmeniz sırasında
        bunların dışında bir kişisel veri talep edilmez.
      </p>

      <h2 style={{ marginTop: '32px', marginBottom: '12px' }}>Verilerin Kullanım Amacı</h2>
      <p>
        Paylaştığınız bilgiler yalnızca talebinize veya sorunuza dönüş yapabilmek amacıyla
        kullanılır. Verileriniz üçüncü taraflarla paylaşılmaz, pazarlama amacıyla
        kullanılmaz veya satılmaz.
      </p>

      <h2 style={{ marginTop: '32px', marginBottom: '12px' }}>Haklarınız</h2>
      <p>
        KVKK&apos;nın 11. maddesi uyarınca; kişisel verilerinizin işlenip işlenmediğini
        öğrenme, işlenmişse buna ilişkin bilgi talep etme, verilerinizin silinmesini veya
        düzeltilmesini isteme haklarına sahipsiniz. Bu haklarınızı kullanmak için bizimle
        iletişim sayfamızdan ulaşabilirsiniz.
      </p>

      <h2 style={{ marginTop: '32px', marginBottom: '12px' }}>İletişim</h2>
      <p>
        Gizlilik politikamızla ilgili sorularınız için{' '}
        <Link href="/#contact" style={{ color: 'var(--gold, #C7A05C)' }}>iletişim formumuzu</Link>{' '}
        kullanabilirsiniz.
      </p>

      <div style={{ marginTop: '48px' }}>
        <Link href="/" style={{ color: 'var(--gold, #C7A05C)' }}>← Anasayfaya dön</Link>
      </div>
    </div>
  );
}