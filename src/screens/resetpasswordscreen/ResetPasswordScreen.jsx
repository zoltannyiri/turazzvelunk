import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { KeyRound, Mail, Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';

const ResetPasswordScreen = ({ mode }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const isForgotMode = mode === 'forgot' || !token;

  const [email, setEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleForgot = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setForgotSent(true);
      } else {
        toast.error(data.message || 'Hiba tortent.');
      }
    } catch (err) {
      toast.error('Hiba tortent. Probald ujra!');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('A jelszónak legalabb 6 karakter hosszunak kell lennie.');
      return;
    }
    if (password !== passwordConfirm) {
      toast.error('A ket jelszo nem egyezik meg!');
      return;
    }
    setResetLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setResetDone(true);
        toast.success('Jelszo sikeresen megvaltoztatva!');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        toast.error(data.message || 'Hiba tortent.');
      }
    } catch (err) {
      toast.error('Hiba tortent. Probald ujra!');
    } finally {
      setResetLoading(false);
    }
  };

  if (isForgotMode) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-emerald-50 w-full max-w-md">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-emerald-100 rounded-2xl text-emerald-700">
              <KeyRound size={32} />
            </div>
          </div>
          <h2 className="text-3xl font-black text-center text-emerald-950 mb-2">
            Elfelejtett jelszó
          </h2>
          <p className="text-center text-gray-500 mb-8">
            Add meg az email cimed, és küldünk egy visszaállítási linket.
          </p>

          {forgotSent ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="p-4 bg-emerald-100 rounded-full text-emerald-600">
                <CheckCircle size={40} />
              </div>
              <p className="text-center text-emerald-800 font-semibold text-lg">
                Email elküldve!
              </p>
              <p className="text-center text-gray-500 text-sm">
                Ha ez az email cím szerepel rendszerünkben, hamarosan megérkezik a visszaállítási link. Ellenőrizd a spam mappát is!
              </p>
              <Link
                to="/login"
                className="mt-2 flex items-center gap-2 text-emerald-700 font-bold hover:underline"
              >
                <ArrowLeft size={16} /> Vissza a bejelentkezéshez
              </Link>
            </div>
          ) : (
            <form onSubmit={handleForgot} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  placeholder="Email cimed"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full bg-emerald-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-emerald-800 transition shadow-lg shadow-emerald-900/20 disabled:opacity-60"
              >
                {forgotLoading ? 'Küldes...' : 'Link küldése'}
              </button>
            </form>
          )}

          {!forgotSent && (
            <p className="text-center mt-8 text-gray-600">
              <Link to="/login" className="flex items-center justify-center gap-2 text-emerald-700 font-bold hover:underline">
                <ArrowLeft size={16} /> Vissza a bejelentkezéshez
              </Link>
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-emerald-50 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-emerald-100 rounded-2xl text-emerald-700">
            <Lock size={32} />
          </div>
        </div>
        <h2 className="text-3xl font-black text-center text-emerald-950 mb-2">
          Új jelszó beállítása
        </h2>
        <p className="text-center text-gray-500 mb-8">
          Add meg az új jelszavad. Legalabb 6 karakter legyen.
        </p>

        {resetDone ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="p-4 bg-emerald-100 rounded-full text-emerald-600">
              <CheckCircle size={40} />
            </div>
            <p className="text-center text-emerald-800 font-semibold text-lg">
              Jelszó megváltoztatva!
            </p>
            <p className="text-center text-gray-500 text-sm">
              Hamarosan átirányítunk a bejelentkezési oldalra...
            </p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Új jelszó"
                className="w-full pl-12 pr-12 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type={showPasswordConfirm ? 'text' : 'password'}
                placeholder="Jelszo megerositese"
                className="w-full pl-12 pr-12 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm((p) => !p)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition"
              >
                {showPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {password && passwordConfirm && (
              <p className={`text-sm font-semibold px-1 ${password === passwordConfirm ? 'text-emerald-600' : 'text-red-500'}`}>
                {password === passwordConfirm ? '\u2713 A jelszavak egyeznek' : '\u2717 A jelszavak nem egyeznek'}
              </p>
            )}
            <button
              type="submit"
              disabled={resetLoading}
              className="w-full bg-emerald-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-emerald-800 transition shadow-lg shadow-emerald-900/20 disabled:opacity-60"
            >
              {resetLoading ? 'Mentés...' : 'Jelszó mentése'}
            </button>
          </form>
        )}

        {!resetDone && (
          <p className="text-center mt-8 text-gray-600">
            <Link to="/login" className="flex items-center justify-center gap-2 text-emerald-700 font-bold hover:underline">
              <ArrowLeft size={16} /> Vissza a bejelentkezéshez
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordScreen;
