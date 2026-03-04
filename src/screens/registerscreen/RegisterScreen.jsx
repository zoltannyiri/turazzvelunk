import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';

const RegisterScreen = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      name: formData.name.trim(),
      email: formData.email.trim()
    };
    if (!payload.name) {
      const message = 'A név megadása kötelező.';
      setFormError(message);
      toast.error(message);
      return;
    }
    if (payload.password !== confirmPassword) {
      const message = 'A jelszavak nem egyeznek.';
      setFormError(message);
      toast.error(message);
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
        setFormError('');
        toast.success('Sikeres regisztráció! Most már bejelentkezhetsz.');
        navigate('/login');
      } else {
        const message = data.message || 'Hiba történt.';
        setFormError(message);
        toast.error(message);
      }
    } catch (err) {
      console.error("Hiba:", err);
      const message = 'Hiba történt.';
      setFormError(message);
      toast.error(message);
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
              type={showPassword ? 'text' : 'password'}
              placeholder="Jelszó" 
              className="w-full pl-12 pr-12 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition"
              aria-label={showPassword ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Jelszó megerősítése" 
              className="w-full pl-12 pr-12 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition"
              aria-label={showConfirmPassword ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black text-lg hover:bg-orange-600 transition shadow-lg shadow-orange-500/20">
            Fiók létrehozása
          </button>
          {formError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              {formError}
            </div>
          )}
        </form>

        <p className="text-center mt-8 text-gray-600">
          Már van fiókod? <Link to="/login" className="text-emerald-700 font-bold hover:underline">Jelentkezz be!</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterScreen;