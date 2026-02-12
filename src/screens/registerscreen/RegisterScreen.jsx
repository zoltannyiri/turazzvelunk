import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User } from 'lucide-react';

const RegisterScreen = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      name: formData.name.trim(),
      email: formData.email.trim()
    };
    if (!payload.name) {
      alert('A név megadása kötelező.');
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Sikeres regisztráció! Most már bejelentkezhetsz.");
        navigate('/login');
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error("Hiba:", err);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-12">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-emerald-50 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-orange-100 rounded-2xl text-orange-600">
            <UserPlus size={32} />
          </div>
        </div>
        <h2 className="text-3xl font-black text-center text-emerald-950 mb-2">Csatlakozz hozzánk!</h2>
        <p className="text-center text-gray-500 mb-8">Készítsd el a profilodat pár másodperc alatt.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Teljes neved" 
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="email" 
              placeholder="Email címed" 
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="password" 
              placeholder="Jelszó" 
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>
          <button className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black text-lg hover:bg-orange-600 transition shadow-lg shadow-orange-500/20">
            Fiók létrehozása
          </button>
        </form>

        <p className="text-center mt-8 text-gray-600">
          Már van fiókod? <Link to="/login" className="text-emerald-700 font-bold hover:underline">Jelentkezz be!</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterScreen;