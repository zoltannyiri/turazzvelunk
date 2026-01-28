import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, User } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="p-2 bg-emerald-600 rounded-lg group-hover:rotate-12 transition-transform">
            <Compass className="text-white" size={24} />
          </div>
          <span className="text-xl font-black tracking-tighter text-emerald-900">TÚRÁZZVELUNK</span>
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8 font-semibold text-gray-500 text-sm tracking-wide">
          <Link to="/" className="hover:text-emerald-600 transition">TÚRÁK</Link>
          <Link to="/rolunk" className="hover:text-emerald-600 transition">RÓLUNK</Link>
          <Link to="/kapcsolat" className="hover:text-emerald-600 transition">KAPCSOLAT</Link>
        </div>

        {/* CTA */}
        <button className="flex items-center gap-2 bg-emerald-900 text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-emerald-800 transition shadow-lg shadow-emerald-900/10">
          <User size={18} />
          <span>BEJELENTKEZÉS</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;