import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Search } from 'lucide-react';
import './Header.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchMe() {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' });
        const data = await res.json();
        if (!cancelled) setUser(data.user);
      } catch (_) {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchMe();
    return () => { cancelled = true; };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    function onDocClick(e) {
      if (!userMenuOpen) return;
      // Close the menu if clicking outside any element with data-profile-menu
      const el = e.target.closest('[data-profile-menu]');
      if (!el) setUserMenuOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [userMenuOpen]);

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' });
      setUser(null);
      window.location.href = '/';
    } catch (_) {}
  };

  const initialsFrom = (nameOrEmail) => {
    if (!nameOrEmail) return 'U';
    const str = String(nameOrEmail);
    if (str.includes(' ')) {
      return str.split(' ').filter(Boolean).slice(0, 2).map(s => s[0].toUpperCase()).join('');
    }
    if (str.includes('@')) return str[0].toUpperCase();
    return str[0].toUpperCase();
  };

  const Avatar = () => {
    const [imgErr, setImgErr] = useState(false);
    if (user?.avatar_url && !imgErr) {
      return (
        <img
          src={user.avatar_url}
          alt={user.name || user.email}
          referrerPolicy="no-referrer"
          onError={() => setImgErr(true)}
          style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(0,0,0,0.1)' }}
        />
      );
    }
    const initials = initialsFrom(user?.name || user?.email);
    return (
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#111', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>
        {initials}
      </div>
    );
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-content">
          {/* Logo */}
          <Link to="/" className="header-logo">
            <img src="/logo-p.svg" alt="PeakSelf Logo" className="header-logo-icon" />
            <span className="header-brand-name">PEAKSELF</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="header-nav">
            <Link to="/" className="header-nav-link">
              Home
            </Link>
            <Link to="/blog" className="header-nav-link">
              Blog
            </Link>
            <Link to="/about" className="header-nav-link">
              About
            </Link>
            <Link to="/contact" className="header-nav-link">
              Contact
            </Link>
            {!user && (
              <Link to="/login" className="header-nav-link">
                Login
              </Link>
            )}
          </nav>

          {/* Search and Mobile Menu Button */}
          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="header-search-btn">
              <Search className="header-search-icon" />
            </button>

            {/* Auth display */}
            {!loading && user && (
              <div className="profile" data-profile-menu style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  className="profile-trigger"
                  onClick={() => setUserMenuOpen(v => !v)}
                  data-profile-menu
                >
                  <Avatar />
                  <span className="profile-name" data-profile-menu>{user.name || user.email}</span>
                  <svg data-profile-menu width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                {userMenuOpen && (
                  <div className="profile-menu" data-profile-menu>
                    <div className="profile-menu-header">
                      <div className="profile-menu-avatar"><Avatar /></div>
                      <div className="profile-menu-info">
                        <div className="profile-menu-name">{user.name || 'User'}</div>
                        <div className="profile-menu-email">{user.email}</div>
                      </div>
                    </div>
                    <div className="profile-menu-sep" />
                    {user?.role === 'admin' && (
                      <a href="/admin" className="profile-menu-item">Admin</a>
                    )}
                    <button className="profile-menu-item" onClick={logout}>Logout</button>
                  </div>
                )}
              </div>
            )}
            {!loading && !user && (
              <Link to="/register" className="header-nav-link">Sign up</Link>
            )}
            
            {/* Mobile menu button */}
            <button
              onClick={toggleMenu}
              className="header-mobile-menu-btn"
            >
              {isMenuOpen ? <X className="header-mobile-menu-icon" /> : <Menu className="header-mobile-menu-icon" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="header-mobile-nav">
            <nav className="header-mobile-nav-links">
              <Link 
                to="/" 
                className="header-mobile-nav-link"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/blog" 
                className="header-mobile-nav-link"
                onClick={() => setIsMenuOpen(false)}
              >
                Blog
              </Link>
              <Link 
                to="/about" 
                className="header-mobile-nav-link"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                to="/contact" 
                className="header-mobile-nav-link"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              {!user && (
                <Link 
                  to="/login" 
                  className="header-mobile-nav-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              )}
              {user && user.role === 'admin' && (
                <a 
                  href="/admin" 
                  className="header-mobile-nav-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin
                </a>
              )}
              {user && (
                <button 
                  onClick={() => { setIsMenuOpen(false); logout(); }} 
                  className="header-mobile-nav-link logout-btn"
                >
                  Logout
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

