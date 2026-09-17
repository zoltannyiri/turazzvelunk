import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react';
import { toast } from 'react-toastify';
import AuthLayout from '../../components/AuthLayout';

const RegisterScreen = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
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
      email: formData.email.trim(),
      phone: formData.phone.trim()
    };
    if (!payload.name) {
      const message = 'A név megadása kötelező.';
      setFormError(message);
      toast.error(message);
      return;
    }
    const phoneDigits = payload.phone.replace(/\D/g, '');
    if (!/^\+?[\d\s()-]+$/.test(payload.phone) || phoneDigits.length < 7 || phoneDigits.length > 15) {
      const message = 'Adj meg egy érvényes telefonszámot!';
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
    <AuthLayout eyebrow="Az első lépés" title="Induljunk együtt." description="Hozd létre a fiókodat, és találd meg a következő közös élményt.">
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="register-name" className="mb-2 block text-xs font-semibold text-[#173327]">Teljes név</label>
          <div className="relative">
            <User className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#78877c]" size={18} />
            <input
              id="register-name"
              type="text"
              autoComplete="name"
              placeholder="Ahogy szólíthatunk"
              className="w-full rounded-lg border border-[#d9dfd5] bg-white py-3 pl-11 pr-4 text-sm text-[#173327] outline-none transition-colors placeholder:text-[#9ba89c] focus:border-[#477258] focus:ring-2 focus:ring-[#cbdcc8]"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="register-email" className="mb-2 block text-xs font-semibold text-[#173327]">Email-cím</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#78877c]" size={18} />
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              placeholder="neved@email.hu"
              className="w-full rounded-lg border border-[#d9dfd5] bg-white py-3 pl-11 pr-4 text-sm text-[#173327] outline-none transition-colors placeholder:text-[#9ba89c] focus:border-[#477258] focus:ring-2 focus:ring-[#cbdcc8]"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="register-phone" className="mb-2 block text-xs font-semibold text-[#173327]">Telefonszám</label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#78877c]" size={18} />
            <input
              id="register-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+36 20 123 4567"
              className="w-full rounded-lg border border-[#d9dfd5] bg-white py-3 pl-11 pr-4 text-sm text-[#173327] outline-none transition-colors placeholder:text-[#9ba89c] focus:border-[#477258] focus:ring-2 focus:ring-[#cbdcc8]"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="register-password" className="mb-2 block text-xs font-semibold text-[#173327]">Jelszó</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#78877c]" size={18} />
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Válassz egy jelszót"
              className="w-full rounded-lg border border-[#d9dfd5] bg-white py-3 pl-11 pr-12 text-sm text-[#173327] outline-none transition-colors placeholder:text-[#9ba89c] focus:border-[#477258] focus:ring-2 focus:ring-[#cbdcc8]"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
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
        <div>
          <label htmlFor="register-confirm-password" className="mb-2 block text-xs font-semibold text-[#173327]">Jelszó megerősítése</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#78877c]" size={18} />
            <input
              id="register-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Írd be újra a jelszót"
              className="w-full rounded-lg border border-[#d9dfd5] bg-white py-3 pl-11 pr-12 text-sm text-[#173327] outline-none transition-colors placeholder:text-[#9ba89c] focus:border-[#477258] focus:ring-2 focus:ring-[#cbdcc8]"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#78877c] transition-colors hover:bg-[#edf2e9] hover:text-[#275940]"
              aria-label={showConfirmPassword ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
              aria-pressed={showConfirmPassword}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        {formError && (
          <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {formError}
          </div>
        )}
        <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#275940] px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#173d2a]">
          Fiók létrehozása <ArrowRight size={17} />
        </button>
      </form>
      <p className="mt-7 border-t border-[#e3e8df] pt-5 text-center text-sm text-[#607267]">
        Már van fiókod? <Link to="/login" className="font-semibold text-[#275940] underline-offset-4 hover:underline">Jelentkezz be</Link>
      </p>
    </AuthLayout>
  );
};

export default RegisterScreen;
