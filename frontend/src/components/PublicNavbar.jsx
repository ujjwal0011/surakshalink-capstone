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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white shadow-sm border-b border-gray-200'
          : 'bg-white/80 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-gray-900 font-bold text-xl tracking-tight">
              Suraksha<span className="text-blue-600">Link</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <a
                key={link.label}
                href={link.href}
                className="text-gray-500 hover:text-gray-900 font-medium text-sm transition-colors"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/emergency-contacts"
              className="text-red-600 hover:text-red-700 font-medium text-sm transition-colors"
            >
              Emergency
            </Link>
            <Link
              to="/login"
              className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg font-medium text-sm border border-gray-200 hover:border-gray-300 transition-all"
            >
              Login
            </Link>
            <Link
              to="/register-principal"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            >
              Register School
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
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
          <div className="md:hidden bg-white border-t border-gray-100 py-3 animate-fade-in">
            {navLinks.map(link => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-600 hover:text-gray-900 font-medium py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/emergency-contacts"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-red-600 hover:text-red-700 font-medium py-3 px-4 rounded-lg hover:bg-red-50 transition-colors"
            >
              Emergency Contacts
            </Link>
            <div className="border-t border-gray-100 mt-3 pt-3 space-y-2 px-4">
              <Link
                to="/login"
                className="block text-center text-gray-700 font-medium py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register-principal"
                className="block text-center text-white font-medium py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors"
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
