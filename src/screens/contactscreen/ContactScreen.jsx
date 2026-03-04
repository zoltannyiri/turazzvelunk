import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Send } from 'lucide-react';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';

const ContactScreen = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.info('A küldéshez be kell jelentkezned.');
      navigate('/login');
      return;
    }
    if (!subject.trim()) {
      const msg = 'A tárgy megadása kötelező.';
      setFormError(msg);
      toast.error(msg);
      return;
    }
    if (!message.trim()) {
      const msg = 'Az üzenet megadása kötelező.';
      setFormError(msg);
      toast.error(msg);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setFormError('');
        setSubject('');
        setMessage('');
        toast.success('Üzenet elküldve.');
      } else {
        const msg = data.message || 'Hiba történt.';
        setFormError(msg);
        toast.error(msg);
      }
    } catch (err) {
      const msg = 'Hiba történt.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-12">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-emerald-50 w-full max-w-2xl">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-emerald-100 rounded-2xl text-emerald-700">
            <Mail size={32} />
          </div>
        </div>
        <h2 className="text-3xl font-black text-center text-emerald-950 mb-2">Ügyfélszolgálat</h2>
        <p className="text-center text-gray-500 mb-8">Írj nekünk, és hamarosan válaszolunk.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Tárgy"
              className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <textarea
              rows={6}
              placeholder="Üzenet"
              className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition resize-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Send size={18} /> {submitting ? 'Küldés...' : 'Üzenet küldése'}
          </button>
          {formError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              {formError}
            </div>
          )}
          {user?.email && (
            <div className="text-xs text-slate-400 font-bold text-center">
              Feladó email cím: {user.email}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ContactScreen;
