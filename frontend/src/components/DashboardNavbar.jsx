import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardNavbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Role-specific navigation links
  const getNavLinks = () => {
    switch (user?.role) {
      case 'principal':
        return [
          { label: 'Dashboard', path: '/dashboard/principal', icon: '🏛️' },
          { label: 'Analytics', path: '/dashboard/principal/analytics', icon: '📊' },
          { label: 'Leaderboard', path: '/dashboard/principal/leaderboard', icon: '🏆' },
          { label: 'Guides', path: '/dashboard/principal/guides', icon: '📖' },
          { label: 'Emergency', path: '/dashboard/principal/emergency-contacts', icon: '🆘' },
        ];
      case 'teacher':
        return [
          { label: 'Dashboard', path: '/dashboard/teacher', icon: '📚' },
          { label: 'Quizzes', path: '/dashboard/teacher/quizzes', icon: '📝' },
          { label: 'Leaderboard', path: '/dashboard/teacher/leaderboard', icon: '🏆' },
          { label: 'Guides', path: '/dashboard/teacher/guides', icon: '📖' },
          { label: 'Emergency', path: '/dashboard/teacher/emergency-contacts', icon: '🆘' },
        ];
      case 'student':
        return [
          { label: 'Drill Lobby', path: '/dashboard/student', icon: '🎮' },
          { label: 'Go-Bag Shop', path: '/dashboard/student/shop', icon: '🎒' },
          { label: 'Leaderboard', path: '/dashboard/student/leaderboard', icon: '🏆' },
          { label: 'AI Assistant', path: '/dashboard/student/ai', icon: '🤖' },
          { label: 'Guides', path: '/dashboard/student/guides', icon: '📖' },
          { label: 'Emergency', path: '/dashboard/student/emergency-contacts', icon: '🆘' },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  // Role badge colors
  const roleBadge = {
    principal: { bg: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Principal' },
    teacher: { bg: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Teacher' },
    student: { bg: 'bg-green-100 text-green-800 border-green-200', label: 'Student' },
  };

  const badge = roleBadge[user?.role] || roleBadge.student;

  return (
    <nav id="dashboard-navbar" className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={`/dashboard/${user?.role}`} className="flex items-center gap-2">
            <span className="text-gray-900 font-bold text-lg tracking-tight hidden sm:inline">
              Suraksha<span className="text-blue-600">Link</span>
            </span>
            <span className="text-gray-900 font-bold text-lg sm:hidden">SL</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="text-base">{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right Section */}
          <div className="hidden md:flex items-center gap-4">
            {/* Role Badge */}
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}>
              {badge.label}
            </span>

            {/* User Name */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-xs font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
                {user?.name || 'User'}
              </span>
            </div>

            {/* Logout */}
            <button
              id="logout-button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 border border-transparent hover:border-red-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button
            id="dashboard-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
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
          <div className="md:hidden border-t border-slate-100 py-3 animate-fade-in">
            {/* Role Badge */}
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-sm font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{user?.name || 'User'}</p>
                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                  {badge.label}
                </span>
              </div>
            </div>

            {/* Nav Links */}
            {navLinks.map(link => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-lg">{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}

            {/* Logout */}
            <div className="border-t border-slate-100 mt-3 pt-3">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default DashboardNavbar;
