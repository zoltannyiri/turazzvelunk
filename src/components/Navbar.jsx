import React, { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen, Calendar, Compass, Info, LogOut,
  Mail, Menu, Search, ShieldCheck, X
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import NotificationsBell from './NotificationsBell';
import './Navbar.css';

const primaryLinks = [
  { to: '/tours', label: 'Túrák', icon: Compass },
  { to: '/tour-search', label: 'Túrakeresés', icon: Search },
  { to: '/calendar', label: 'Naptár', icon: Calendar },
  { to: '/blog', label: 'Blog', icon: BookOpen },
  { to: '/about-us', label: 'Rólunk', icon: Info },
  { to: '/contact', label: 'Kapcsolat', icon: Mail }
];

const Navbar = () => {
  const { user, logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => (
    location.pathname === path ||
    (path === '/tours' && location.pathname.startsWith('/tours/'))
  );

  const renderLink = ({ to, label, icon }, mobile = false) => (
    <Link
      key={to}
      to={to}
      onClick={mobile ? () => setIsMobileMenuOpen(false) : undefined}
      className={`site-nav-link ${isActive(to) ? 'is-active' : ''} ${mobile ? 'is-mobile' : ''}`}
      aria-current={isActive(to) ? 'page' : undefined}
    >
      {React.createElement(icon, { size: mobile ? 18 : 15, strokeWidth: 1.8 })}
      <span>{label}</span>
    </Link>
  );

  return (
    <nav className="site-navbar" aria-label="Fő navigáció">
      <div className="site-navbar-inner">
        <Link to="/" className="site-brand" aria-label="Túrázz Velünk kezdőlap">
          <span className="site-brand-mark"><Compass size={20} strokeWidth={1.7} /></span>
          <span className="site-brand-copy">
            <strong>Túrázz Velünk</strong>
            <small>utak · történetek · közösség</small>
          </span>
        </Link>

        <div className="site-nav-desktop">
          {primaryLinks.map((link) => renderLink(link))}
          {user?.role === 'admin' && (
            <div className="site-nav-admin">
              {renderLink({ to: '/admin', label: 'Admin', icon: ShieldCheck })}
            </div>
          )}
        </div>

        <div className="site-nav-actions">
          {loading ? (
            <div className="site-profile-skeleton" aria-hidden="true" />
          ) : user ? (
            <>
              <NotificationsBell />
              <Link to="/profile" className={`site-profile-link ${isActive('/profile') ? 'is-active' : ''}`}>
                <span className="site-profile-avatar">{user.name?.charAt(0)?.toUpperCase() || '?'}</span>
                <span className="site-profile-copy">
                  <strong>{user.name}</strong>
                  <small>{user.role === 'admin' ? 'Adminisztrátor' : 'Profilom'}</small>
                </span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="site-nav-icon-button site-logout-button"
                title="Kijelentkezés"
                aria-label="Kijelentkezés"
              >
                <LogOut size={18} strokeWidth={1.8} />
              </button>
            </>
          ) : (
            <div className="site-auth-actions">
              <Link to="/login" className="site-login-link">Belépés</Link>
              <Link to="/register" className="site-register-link">Csatlakozom</Link>
            </div>
          )}

          <button
            type="button"
            className="site-mobile-toggle"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={isMobileMenuOpen ? 'Menü bezárása' : 'Menü megnyitása'}
          >
            {isMobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div id="mobile-navigation" className="site-mobile-menu">
          <div className="site-mobile-links">
            {primaryLinks.map((link) => renderLink(link, true))}
            {user?.role === 'admin' && renderLink({ to: '/admin', label: 'Adminisztráció', icon: ShieldCheck }, true)}
          </div>
          {!loading && user && (
            <div className="site-mobile-user">
              <Link to="/profile" className="site-mobile-profile">
                <span className="site-profile-avatar">{user.name?.charAt(0)?.toUpperCase() || '?'}</span>
                <span><strong>{user.name}</strong><small>Profil megnyitása</small></span>
              </Link>
              <button type="button" onClick={handleLogout}><LogOut size={17} /> Kijelentkezés</button>
            </div>
          )}
          {!loading && !user && (
            <div className="site-mobile-auth">
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>Belépés</Link>
              <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>Csatlakozom</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
