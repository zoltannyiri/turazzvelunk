import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { toast } from 'react-toastify';
import AuthLayout from '../../components/AuthLayout';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
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
        setFormError('');
        navigate('/');
        } else {
        const message = data.message || 'Hiba történt.';
        setFormError(message);
        toast.error(message);
        }
    } catch (err) {
        console.error("Bejelentkezési hiba:", err);
        const message = 'Hiba történt.';
        setFormError(message);
        toast.error(message);
    }
    };

  return (
    <AuthLayout eyebrow="Visszatérés" title="Jó újra látni." description="Lépj be, és folytasd ott, ahol az utolsó kalandod véget ért.">
      <form onSubmit={handleSubmit} className="mt-9 space-y-5">
        <div>
          <label htmlFor="login-email" className="mb-2 block text-xs font-semibold text-[#173327]">Email-cím</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#78877c]" size={18} />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="neved@email.hu"
              className="w-full rounded-lg border border-[#d9dfd5] bg-white py-3.5 pl-11 pr-4 text-sm text-[#173327] outline-none transition-colors placeholder:text-[#9ba89c] focus:border-[#477258] focus:ring-2 focus:ring-[#cbdcc8]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label htmlFor="login-password" className="text-xs font-semibold text-[#173327]">Jelszó</label>
            <Link to="/forgot-password" className="text-xs font-semibold text-[#477258] transition-colors hover:text-[#173327] hover:underline">Elfelejtetted?</Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#78877c]" size={18} />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Add meg a jelszavad"
              className="w-full rounded-lg border border-[#d9dfd5] bg-white py-3.5 pl-11 pr-12 text-sm text-[#173327] outline-none transition-colors placeholder:text-[#9ba89c] focus:border-[#477258] focus:ring-2 focus:ring-[#cbdcc8]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#78877c] transition-colors hover:bg-[#edf2e9] hover:text-[#275940]"
              aria-label={showPassword ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        {formError && (
          <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {formError}
          </div>
        )}
        <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#275940] px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#173d2a]">
          Bejelentkezés <ArrowRight size={17} />
        </button>
      </form>
      <p className="mt-8 border-t border-[#e3e8df] pt-6 text-center text-sm text-[#607267]">
        Még nincs fiókod? <Link to="/register" className="font-semibold text-[#275940] underline-offset-4 hover:underline">Regisztrálj</Link>
      </p>
    </AuthLayout>
  );
};

export default LoginScreen;
