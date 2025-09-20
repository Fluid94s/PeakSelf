import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Search } from 'lucide-react';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
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
            <Link to="/login" className="header-nav-link">
              Login
            </Link>
          </nav>

          {/* Search and Mobile Menu Button */}
          <div className="header-actions">
            <button className="header-search-btn">
              <Search className="header-search-icon" />
            </button>
            
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
              <Link 
                to="/login" 
                className="header-mobile-nav-link"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

