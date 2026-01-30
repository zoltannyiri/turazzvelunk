import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Compass, LogOut, User, UserPlus, Calendar } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        
        <Link to="/" className="flex items-center gap-2 group">
          <div className="p-2 bg-emerald-600 rounded-lg group-hover:rotate-12 transition-transform">
            <Compass className="text-white" size={24} />
          </div>
          <span className="text-xl font-black tracking-tighter text-emerald-950 uppercase">TúrázzVelünk</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 font-semibold text-gray-500 text-sm tracking-wide">
          <Link to="/tours" className="hover:text-emerald-600 transition">TÚRÁK</Link>
          <Link to="/calendar" className="hover:text-emerald-600 transition flex items-center gap-1.5">
            <span>NAPTÁR</span>
          </Link>
          <Link to="/about-us" className="hover:text-emerald-600 transition">RÓLUNK</Link>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-4">
              {user.role === 'admin' && (
                <Link 
                  to="/admin" 
                  className="text-xs font-black text-orange-500 hover:text-orange-600 tracking-widest uppercase border-r border-gray-200 pr-4"
                >
                  Dashboard
                </Link>
              )}
              <Link 
                to="/profile" 
                className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 hover:bg-emerald-100 transition shadow-sm group/user"
              >
                <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold group-hover/user:scale-110 transition">
                  {user.name.charAt(0)}
                </div>
                <span className="text-sm font-bold text-emerald-900">{user.name}</span>
              </Link>

              <button 
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Kijelentkezés"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link 
                to="/login" 
                className="flex items-center gap-2 text-emerald-900 px-4 py-2.5 rounded-full font-bold text-sm hover:bg-emerald-50 transition"
              >
                <User size={18} />
                <span>BEJELENTKEZÉS</span>
              </Link>
              <Link 
                to="/register" 
                className="flex items-center gap-2 bg-emerald-900 text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-emerald-800 transition shadow-lg shadow-emerald-900/10"
              >
                <UserPlus size={18} />
                <span>REGISZTRÁCIÓ</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;