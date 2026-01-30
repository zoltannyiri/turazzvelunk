import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { 
  Clock, MapPin, Calendar, Users, ArrowLeft, 
  Zap, Info, ShieldCheck, CheckCircle2, UserMinus, Sparkles
} from 'lucide-react';
import { toast } from 'react-toastify';

const TourDetailsScreen = () => {
  const { id } = useParams();
  const location = useLocation();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBooked, setIsBooked] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const fromCalendar = location.state?.from === 'calendar';

  const formatHungarianDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const months = ["Január", "Február", "Március", "Április", "Május", "Június", "Július", "Augusztus", "Szeptember", "Október", "November", "December"];
    return `${date.getFullYear()}. ${months[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}.`;
  };

  const fetchTourData = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/tours/${id}`);
      const data = await res.json();
      setTour(data);

      if (user) {
        const checkRes = await fetch(`${import.meta.env.VITE_API_URL}/bookings/check/${id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const checkData = await checkRes.json();
        setIsBooked(checkData.isBooked);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTourData();
  }, [id, user]);

  const handleBooking = async () => {
    if (!user) {
      toast.info("A jelentkezéshez előbb be kell jelentkezned!");
      navigate('/login');
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ tour_id: id }),
      });
      if (res.ok) {
        toast.success("🎉 Sikeres jelentkezés!");
        setIsBooked(true);
        fetchTourData();
      }
    } catch (err) { toast.error("Hiba történt."); }
  };

  const handleCancelBooking = async () => {
    if (!window.confirm("Biztosan le szeretnél jelentkezni?")) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings/cancel/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        toast.warn("Lejelentkezve a túráról.");
        setIsBooked(false);
        fetchTourData();
      }
    } catch (err) { toast.error("Hiba a lejelentkezéskor."); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-emerald-600"></div>
    </div>
  );

  if (!tour) return <div className="p-20 text-center font-black text-slate-400">Túra nem található.</div>;

  return (
    <div className="bg-[#fcfdfe] min-h-screen pb-12 font-sans">
      {/* --- HERO SECTION - Kompaktabb magasság --- */}
      <div className="relative h-[40vh] md:h-[45vh] w-full overflow-hidden shadow-lg">
        <img src={tour.image_url} className="w-full h-full object-cover" alt={tour.title} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20"></div>
        
        {/* Navigáció */}
        <div className="absolute top-6 left-6 z-20">
          <Link 
            to={fromCalendar ? "/calendar" : "/tours"} 
            className="inline-flex items-center gap-2 text-white bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl hover:bg-emerald-600 transition-all text-xs font-bold uppercase tracking-wider"
          >
            <ArrowLeft size={16} /> 
            {fromCalendar ? "Vissza a naptárhoz" : "Vissza a túrákhoz"}
          </Link>
        </div>

        {/* Cím */}
        <div className="absolute bottom-8 left-0 w-full px-6 md:px-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest text-[10px] mb-2">
              <MapPin size={14} /> {tour.location}
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tighter uppercase italic">
              {tour.title}
            </h1>
          </div>
        </div>
      </div>

      {/* --- TARTALOM - Szűkebb konténer --- */}
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        
        {/* Bal oldal - 8 oszlop */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Info Grid - Kisebb kártyák */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Clock size={18}/>, label: 'Idő', val: `${tour.duration} nap` },
              { icon: <Zap size={18}/>, label: 'Szint', val: tour.difficulty },
              { icon: <Users size={18}/>, label: 'Helyek', val: `${tour.booked_count || 0}/${tour.max_participants}` }
            ].map((item, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                <div className="text-emerald-500 mb-1">{item.icon}</div>
                <div className="text-[9px] text-slate-400 uppercase font-black tracking-tighter">{item.label}</div>
                <div className="font-bold text-slate-800 text-sm">{item.val}</div>
              </div>
            ))}
          </div>

          {/* Leírás - Tisztább elrendezés */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
             <div className="flex items-center gap-2 mb-4 text-emerald-600">
                <Info size={20} />
                <h2 className="text-lg font-black uppercase tracking-tight italic text-slate-900">A túra részletei</h2>
             </div>
             <p className="text-slate-600 leading-relaxed text-base font-medium">
               {tour.description}
             </p>
          </div>
        </div>

        {/* Jobb oldal / Sidebar - 4 oszlop */}
        <div className="lg:col-span-4">
          <div className="sticky top-6 space-y-4">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
              {/* Dekoratív fény */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
              
              <div className="relative z-10">
                <div className="mb-6">
                  <div className="text-emerald-400 font-bold uppercase tracking-widest text-[9px] mb-1">Részvételi díj</div>
                  <div className="text-4xl font-black italic tracking-tighter">
                    {tour.price?.toLocaleString()} <span className="text-lg not-italic text-emerald-500">Ft</span>
                  </div>
                </div>

                <div className="space-y-3 mb-8 text-xs">
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-slate-400 font-bold uppercase">Indulás</span>
                      <span className="font-bold">{formatHungarianDate(tour.start_date)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-slate-400 font-bold uppercase">Zárás</span>
                      <span className="font-bold">{formatHungarianDate(tour.end_date)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-400 font-bold uppercase">Jelentkezők</span>
                      <span className="font-bold text-emerald-400">{tour.booked_count || 0} / {tour.max_participants} fő</span>
                    </div>
                </div>

                {isBooked ? (
                  <button 
                    onClick={handleCancelBooking}
                    className="w-full py-4 rounded-2xl font-black text-sm bg-red-500/10 text-red-500 border border-red-500/30 flex items-center justify-center gap-2 uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                  >
                    <UserMinus size={18} /> Lejelentkezés
                  </button>
                ) : (
                  <button 
                    onClick={handleBooking}
                    className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 uppercase tracking-widest ${
                      user 
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-lg shadow-emerald-500/20' 
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {user ? 'Jelentkezem most' : 'Bejelentkezés szükséges'}
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-[9px] uppercase tracking-widest bg-white py-3 rounded-2xl border border-slate-100 shadow-sm">
                <ShieldCheck size={14} className="text-emerald-500" /> 100% Biztonságos foglalás
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourDetailsScreen;