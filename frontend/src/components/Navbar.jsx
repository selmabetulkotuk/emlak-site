'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header id="site-header" className={scrolled ? 'scrolled' : ''}>
      <Link href="/" className="logo" onClick={() => setMenuOpen(false)}>
        <span className="mark">BM</span>
        <span className="sub">GAYRİMENKUL</span>
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
  );
}