import './globals.css';

export const metadata = {
  title: 'BM Gayrimenkul | Karaman Emlak, Satılık ve Kiralık İlanlar',
  description: 'Karaman ve çevresinde satılık ve kiralık daire, villa, müstakil ev, arsa ve işyeri ilanları. BM Gayrimenkul ile hayalinizdeki mülkü bulun.',
  keywords: ['Karaman emlak', 'satılık daire', 'kiralık daire', 'Karaman villa', 'bm gayrimenkul' ,'karaman kiralık'],
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'BM Gayrimenkul',
    description: 'Her Zemin Bir Başlangıçtır',
    url: 'https://bmgayrimenkul.com',
    siteName: 'BM Gayrimenkul',
    locale: 'tr_TR',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}