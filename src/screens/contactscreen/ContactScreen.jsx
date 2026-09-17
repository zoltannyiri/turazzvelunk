import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Send, MapPin, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
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
      toast.info('Az üzenetküldéshez be kell jelentkezned.');
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
        toast.success('Üzenetedet sikeresen továbbítottuk csapatunknak!');
      } else {
        const msg = data.message || 'Hiba történt az üzenet küldésekor.';
        setFormError(msg);
        toast.error(msg);
      }
    } catch (err) {
      const msg = 'Hálózati hiba történt az üzenet küldésekor.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f8faf7] min-h-screen pb-24 font-sans text-[#173327]">
      
      {/* --- KAPCSOLAT FEJLÉC HÁTTÉRKÉPPEL ÉS TERMÉSZETES ZÖLD TÓNUSSAL --- */}
      <div className="relative pt-20 pb-28 px-6 overflow-hidden min-h-[360px] flex items-center">
        
        {/* HÁTTÉRKÉP RÉTEG */}
        <img 
          src="https://images.unsplash.com/photo-1542332213-31f87348057f?auto=format&fit=crop&q=80&w=2070" 
          className="absolute inset-0 w-full h-full object-cover scale-105 filter brightness-95"
          alt="Természet hegyvidék háttér"
        />
        
        {/* SÖTÉTÍTŐ TERMÉSZETES ZÖLD OVERLAY */}
        <div className="absolute inset-0 bg-[#0f1f17]/75 backdrop-blur-[1px]"></div>

        {/* LÁGY MÉLYZÖLD FÉNYEFFEKT */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#477258]/15 rounded-full blur-[140px] -mr-32 -mt-32 pointer-events-none z-10"></div>
        
        <div className="max-w-6xl mx-auto relative z-20 w-full text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[#dce5d8] text-xs font-semibold uppercase tracking-[0.2em] mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Túrázz Velünk • Kapcsolat
          </div>
          
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-white font-normal tracking-tight mb-4 drop-shadow-md">
            Kérdésed van? Keress minket bátran.
          </h1>
          <p className="text-[#dce5d8] text-sm sm:text-base md:text-lg max-w-2xl font-light leading-relaxed drop-shadow-sm">
            Legyen szó túrajelentkezésről, egyedi túratervekről vagy általános kérdésekről, csapatunk készséggel áll rendelkezésedre.
          </p>
        </div>
      </div>

      {/* --- KÉTOSZLOPOS ELRENDEZÉS: ELÉRHETŐSÉGEK ÉS ŰRLAP --- */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-10 relative z-30">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* BAL OLDAL: ELÉRHETŐSÉGI INFORMÁCIÓK */}
          <div className="lg:col-span-5 rounded-3xl bg-[#173327] text-white p-8 sm:p-10 border border-[#275940] shadow-xl flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a8c9b2] mb-2 block">
                Közvetlen kapcsolat
              </span>
              <h2 className="font-serif text-3xl text-white font-normal mb-3">
                Itt vagyunk, hogy segítsünk
              </h2>
              <p className="text-sm text-[#dce5d8] font-light leading-relaxed mb-8">
                Írj nekünk az űrlapon keresztül vagy keress minket az alábbi elérhetőségeinken. Szívesen válaszolunk minden túrával kapcsolatos megkeresésre.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#275940] border border-white/10 flex items-center justify-center text-[#a8c9b2] shrink-0 mt-0.5">
                    <Mail size={18} strokeWidth={2} />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a8c9b2]">
                      Központi email-cím
                    </div>
                    <a 
                      href="mailto:turazzvelunk.eu@gmail.com" 
                      className="text-sm font-medium text-white hover:text-emerald-300 transition"
                    >
                      turazzvelunk.eu@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#275940] border border-white/10 flex items-center justify-center text-[#a8c9b2] shrink-0 mt-0.5">
                    <Clock size={18} strokeWidth={2} />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a8c9b2]">
                      Válaszidő
                    </div>
                    <div className="text-sm font-light text-[#dce5d8]">
                      Munkanapokon 24 órán belül válaszolunk
                    </div>
                  </div>
                </div>

                {/* <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#275940] border border-white/10 flex items-center justify-center text-[#a8c9b2] shrink-0 mt-0.5">
                    <MapPin size={18} strokeWidth={2} />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a8c9b2]">
                      Túrák helyszíne
                    </div>
                    <div className="text-sm font-light text-[#dce5d8]">
                      Magyarország és a Kárpát-medence legszebb tájai
                    </div>
                  </div>
                </div> */}
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-[#275940] text-xs text-[#a8c9b2]/90 leading-relaxed font-light">
              Egyedi csoportos túrák, céges csapatépítők vagy via ferrata oktatás kapcsán is örömmel várjuk megkeresésedet.
            </div>
          </div>

          {/* JOBB OLDAL: ÜZENETKÜLDŐ ŰRLAP */}
          <div className="lg:col-span-7 rounded-3xl bg-white border border-[#d8dfd4] p-8 sm:p-10 shadow-xl shadow-[#173327]/5">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#648067] mb-1 block">
                Ügyfélszolgálat
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#173327] font-normal mb-2">
                Írj nekünk üzenetet
              </h2>
              <p className="text-sm text-[#65756a] font-light mb-6">
                Töltsd ki az űrlapot, és a válaszlevelet a profilodhoz kapcsolt email-címedre küldjük el.
              </p>
            </div>

            {!user ? (
              <div className="rounded-2xl bg-[#f7f9f5] border border-[#dce5d8] p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-[#34493b] font-medium text-center sm:text-left">
                  Az üzenetküldéshez kérjük, jelentkezz be a fiókodba.
                </div>
                <Link
                  to="/login"
                  className="shrink-0 px-5 py-2.5 rounded-xl bg-[#275940] text-white hover:bg-[#1d4330] text-xs font-bold uppercase tracking-wider transition shadow-xs inline-flex items-center gap-1.5"
                >
                  Bejelentkezés <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <div className="mb-6 p-3.5 rounded-2xl bg-[#f7f9f5] border border-[#dce5d8] flex items-center justify-between text-xs text-[#718174]">
                <span>
                  Feladó: <strong className="text-[#173327] font-semibold">{user.name}</strong> ({user.email})
                </span>
                <span className="inline-flex items-center gap-1 text-[#477258] font-semibold">
                  <ShieldCheck size={14} /> Azonosított felhasználó
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#718174] mb-1.5 block">
                  Tárgy
                </label>
                <input
                  type="text"
                  placeholder="pl. Érdeklődés a következő hegyi túráról"
                  className="w-full px-4 py-3.5 bg-[#f7f9f5] border border-[#dce5d8] rounded-xl text-sm text-[#173327] placeholder:text-[#879489] focus:outline-none focus:border-[#477258] focus:ring-1 focus:ring-[#477258] transition"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#718174] mb-1.5 block">
                  Üzenet szövege
                </label>
                <textarea
                  rows={6}
                  placeholder="Írd le részletesen kérdésedet, igényeidet vagy észrevételedet..."
                  className="w-full px-4 py-3.5 bg-[#f7f9f5] border border-[#dce5d8] rounded-xl text-sm text-[#173327] placeholder:text-[#879489] focus:outline-none focus:border-[#477258] focus:ring-1 focus:ring-[#477258] transition resize-none"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-xs font-semibold text-red-700">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !user}
                className="w-full bg-[#275940] hover:bg-[#1d4330] text-white py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} strokeWidth={2} />
                {submitting ? 'Küldés folyamatban...' : 'Üzenet elküldése'}
              </button>
            </form>
          </div>

        </div>
      </div>

    </div>
  );
};

export default ContactScreen;
