import React, { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen, Calendar, Compass, Info, LogOut,
  Mail, Menu, Search, ShieldCheck, X
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import NotificationsBell from './NotificationsBell';

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

  const renderLink = ({ to, label, icon }, mobile = false) => {
    const active = isActive(to);
    return (
      <Link
        key={to}
        to={to}
        onClick={mobile ? () => setIsMobileMenuOpen(false) : undefined}
        className={`relative inline-flex items-center gap-1.5 font-semibold transition-colors ${mobile
          ? `w-full rounded-lg px-3 py-3 text-sm ${active ? 'bg-[#edf2e9] text-[#173327]' : 'text-[#5e6f63] hover:bg-[#f3f6ef]'}`
          : `px-2.5 text-xs whitespace-nowrap ${active ? 'text-[#173327]' : 'text-[#5e6f63] hover:text-[#173327]'}`}`}
        aria-current={active ? 'page' : undefined}
      >
        {React.createElement(icon, { size: mobile ? 18 : 15, strokeWidth: 1.8 })}
        <span>{label}</span>
        {!mobile && active && <span className="absolute inset-x-2.5 -bottom-2 h-0.5 bg-[#477258]" />}
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-[100] border-b border-[#d9dfd5] bg-[#fffefa]/95 text-[#173327] shadow-[0_5px_22px_rgba(30,51,34,0.05)] backdrop-blur-xl" aria-label="Fő navigáció">
      <div className="mx-auto flex min-h-[4.6rem] max-w-[1500px] items-center justify-between gap-5 px-4 py-2.5">
        <Link to="/" className="group inline-flex shrink-0 items-center gap-3" aria-label="Túrázz Velünk kezdőlap">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#b9c8b7] bg-[#eef3e9] text-[#275940] transition-colors group-hover:bg-[#275940] group-hover:text-white">
            <Compass size={20} strokeWidth={1.7} />
          </span>
          <span className="flex flex-col leading-none">
            <strong className="font-serif text-xl font-normal tracking-tight whitespace-nowrap max-[620px]:text-lg">Túrázz Velünk</strong>
            <small className="mt-1 text-[8px] font-bold uppercase tracking-[0.12em] text-[#77847a] max-[1180px]:hidden">utak · történetek · közösség</small>
          </span>
        </Link>

        <div className="flex min-w-0 self-stretch items-stretch gap-0.5 max-[960px]:hidden">
          {primaryLinks.map((link) => renderLink(link))}
          {user?.role === 'admin' && (
            <div className="ml-2 flex border-l border-[#d9dfd5] pl-2">
              {renderLink({ to: '/admin', label: 'Admin', icon: ShieldCheck })}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {loading ? (
            <div className="h-9 w-28 animate-pulse rounded-lg bg-[#e9ede6]" aria-hidden="true" />
          ) : user ? (
            <>
              <NotificationsBell />
              <Link to="/profile" className="ml-1 flex items-center gap-2 border-l border-[#d9dfd5] py-0.5 pr-2 pl-3 max-[620px]:hidden">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#dfeadd] font-serif text-sm text-[#275940]">
                  {user.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
                <span className="flex max-w-28 flex-col max-[1180px]:hidden">
                  <strong className="truncate text-xs font-bold text-[#21392a]">{user.name}</strong>
                  <small className="mt-0.5 text-[10px] font-semibold text-[#78877c]">{user.role === 'admin' ? 'Adminisztrátor' : 'Profilom'}</small>
                </span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#627267] transition-colors hover:bg-[#f5ebe7] hover:text-[#9b4f41] max-[620px]:hidden"
                title="Kijelentkezés"
                aria-label="Kijelentkezés"
              >
                <LogOut size={18} strokeWidth={1.8} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1 max-[620px]:hidden">
              <Link to="/login" className="px-3 py-2 text-xs font-bold text-[#4f6355]">Belépés</Link>
              <Link to="/register" className="rounded-lg bg-[#275940] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#173d2a]">Csatlakozom</Link>
            </div>
          )}

          <button
            type="button"
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-[#d9dfd5] text-[#627267] max-[960px]:inline-flex"
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
        <div id="mobile-navigation" className="border-t border-[#e3e8df] bg-[#fffefa] px-4 pt-3 pb-4 min-[961px]:hidden">
          <div className="grid gap-1">
            {primaryLinks.map((link) => renderLink(link, true))}
            {user?.role === 'admin' && renderLink({ to: '/admin', label: 'Adminisztráció', icon: ShieldCheck }, true)}
          </div>
          {!loading && user && (
            <div className="mt-3 flex items-center justify-between gap-4 border-t border-[#d9dfd5] px-1 pt-4">
              <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#dfeadd] font-serif text-sm text-[#275940]">{user.name?.charAt(0)?.toUpperCase() || '?'}</span>
                <span className="flex flex-col"><strong className="text-xs">{user.name}</strong><small className="text-[10px] text-[#78877c]">Profil megnyitása</small></span>
              </Link>
              <button type="button" onClick={handleLogout} className="inline-flex items-center gap-1 text-xs font-bold text-[#8f5145]"><LogOut size={17} /> Kijelentkezés</button>
            </div>
          )}
          {!loading && !user && (
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-[#d9dfd5] pt-4 text-center text-xs font-bold">
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg border border-[#cfd9cd] px-3 py-3 text-[#275940]">Belépés</Link>
              <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg bg-[#275940] px-3 py-3 text-white">Csatlakozom</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
