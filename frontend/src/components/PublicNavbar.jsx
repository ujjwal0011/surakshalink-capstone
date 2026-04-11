import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const PublicNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Impact', href: '#impact' },
  ];

  return (
    <nav
      id="public-navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'glass-dark shadow-2xl shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-9 w-9 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-shadow">
              <span className="text-white font-black text-sm">SL</span>
            </div>
            <span className="text-white font-extrabold text-xl tracking-tight">
              Suraksha<span className="text-cyan-400">Link</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <a
                key={link.label}
                href={link.href}
                className="text-slate-300 hover:text-white font-medium text-sm transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-400 group-hover:w-full transition-all duration-300" />
              </a>
            ))}
            <Link
              to="/emergency-contacts"
              className="flex items-center gap-1.5 text-red-400 hover:text-red-300 font-semibold text-sm transition-colors relative group"
            >
              <span>🆘</span> Emergency
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-400 group-hover:w-full transition-all duration-300" />
            </Link>
            <Link
              to="/login"
              className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl font-semibold text-sm border border-white/20 hover:border-white/40 transition-all duration-300 hover:shadow-lg hover:shadow-white/10"
            >
              Login
            </Link>
            <Link
              to="/register-principal"
              className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 hover:scale-105"
            >
              Register School
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden glass rounded-2xl p-4 mt-2 mb-4 animate-fade-in">
            {navLinks.map(link => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-slate-200 hover:text-white font-medium py-3 px-4 rounded-lg hover:bg-white/10 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/emergency-contacts"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 font-semibold py-3 px-4 rounded-lg hover:bg-red-500/10 transition-colors"
            >
              <span>🆘</span> Emergency Contacts
            </Link>
            <div className="border-t border-white/10 mt-3 pt-3 space-y-2">
              <Link
                to="/login"
                className="block text-center text-white font-semibold py-3 px-4 rounded-xl border border-white/20 hover:bg-white/10 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register-principal"
                className="block text-center text-white font-semibold py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500"
              >
                Register School
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default PublicNavbar;
