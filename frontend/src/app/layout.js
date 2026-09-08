import './globals.css';

export const metadata = {
  title: 'BM Gayrimenkul',
  description: 'Her Zemin Bir Başlangıçtır',
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}