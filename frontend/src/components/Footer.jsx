import Link from 'next/link';

export default function Footer() {
  return (
    <footer>
      <span className="fmark">BM</span>
      <span className="fmeta">&copy; 2026 BM Gayrimenkul. Tüm hakları saklıdır.</span>
      <div className="flinks">
        <Link href="#listings">İlanlar</Link>
        <Link href="#contact">İletişim</Link>
        <Link href="/admin">Yönetici Paneli</Link>
      </div>
    </footer>
  );
}