import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { LogIn, Mail, Lock } from 'lucide-react';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (res.ok) {
        login(data);
        navigate('/');
        } else {
        alert(data.message);
        }
    } catch (err) {
        console.error("Bejelentkezési hiba:", err);
    }
    };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-emerald-50 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-emerald-100 rounded-2xl text-emerald-700">
            <LogIn size={32} />
          </div>
        </div>
        <h2 className="text-3xl font-black text-center text-emerald-950 mb-2">Üdv újra!</h2>
        <p className="text-center text-gray-500 mb-8">Jelentkezz be a kalandokhoz.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="email" 
              placeholder="Email címed" 
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="password" 
              placeholder="Jelszavad" 
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="w-full bg-emerald-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-emerald-800 transition shadow-lg shadow-emerald-900/20">
            Bejelentkezés
          </button>
        </form>

        <p className="text-center mt-8 text-gray-600">
          Még nincs fiókod? <Link to="/regisztracio" className="text-emerald-700 font-bold hover:underline">Regisztrálj!</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;