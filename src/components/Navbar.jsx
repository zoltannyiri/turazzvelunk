import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  Compass, Calendar, User, LogOut, 
  Menu, X, ShieldCheck, Info, Search, BookOpen 
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Aktív menüpont stílusa (kompakt kiadás)
  const isActive = (path) => location.pathname === path;

  const linkStyle = (path) => `
    flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all
    ${isActive(path) 
      ? 'bg-emerald-500/10 text-emerald-600' 
      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}
  `;

  return (
    <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white group-hover:rotate-12 transition-transform shadow-lg shadow-emerald-600/20">
            <Compass size={18} />
          </div>
          <span className="text-lg font-black italic tracking-tighter text-slate-900 uppercase">
            Túrázz<span className="text-emerald-500">Velünk</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <Link to="/tours" className={linkStyle('/tours')}>
            <Search size={14} /> Túrák
          </Link>
          <Link to="/tour-search" className={linkStyle('/tour-search')}>
            <Search size={14} /> Túrakeresés
          </Link>
          <Link to="/calendar" className={linkStyle('/calendar')}>
            <Calendar size={14} /> Naptár
          </Link>
          <Link to="/blog" className={linkStyle('/blog')}>
            <BookOpen size={14} /> Blog
          </Link>
          <Link to="/about-us" className={linkStyle('/about-us')}>
            <Info size={14} /> Rólunk
          </Link>

          {/* Admin Management - Elválasztóval */}
          {user?.role === 'admin' && (
            <div className="ml-2 pl-2 border-l border-slate-100">
              <Link to="/admin" className={linkStyle('/admin')}>
                <ShieldCheck size={14} className="text-emerald-600" /> Management
              </Link>
            </div>
          )}
        </div>

        {/* USER SECTIONS */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-28 h-9 rounded-xl bg-slate-100 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <Link to="/profile" className="flex items-center gap-2.5 bg-slate-50 hover:bg-emerald-50 pl-1 pr-3 py-1 rounded-full border border-slate-100 transition-all group">
                <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-emerald-600 text-[10px] font-black shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  {user.name.charAt(0)}
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-[10px] font-black text-slate-900 uppercase">{user.name}</span>
                  <span className="text-[7px] font-bold text-emerald-500 uppercase tracking-tighter">{user.role}</span>
                </div>
              </Link>
              
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                title="Kijelentkezés"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-emerald-600 px-3 py-2 transition-all">
                Belépés
              </Link>
              <Link to="/register" className="bg-slate-900 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md">
                Csatlakozom
              </Link>
            </div>
          )}

          {/* MOBIL GOMB */}
          <button 
            className="md:hidden p-2 text-slate-600"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* MOBIL LENYÍLÓ */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-100 p-4 flex flex-col gap-2 animate-in slide-in-from-top-2">
          <Link to="/tours" className={linkStyle('/tours')} onClick={() => setIsMobileMenuOpen(false)}>Túrák</Link>
          <Link to="/tour-search" className={linkStyle('/tour-search')} onClick={() => setIsMobileMenuOpen(false)}>Túrakeresés</Link>
          <Link to="/calendar" className={linkStyle('/calendar')} onClick={() => setIsMobileMenuOpen(false)}>Naptár</Link>
          <Link to="/blog" className={linkStyle('/blog')} onClick={() => setIsMobileMenuOpen(false)}>Blog</Link>
          <Link to="/about-us" className={linkStyle('/about-us')} onClick={() => setIsMobileMenuOpen(false)}>Rólunk</Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className={linkStyle('/admin')} onClick={() => setIsMobileMenuOpen(false)}>Management</Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;