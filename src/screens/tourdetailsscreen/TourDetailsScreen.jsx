import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { 
  Clock, MapPin, Calendar, Users, ArrowLeft, 
  CheckCircle2, ShieldCheck, Zap, Info 
} from 'lucide-react';

const TourDetailsScreen = () => {
  const { id } = useParams();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/tours/${id}`)
      .then(res => res.json())
      .then(data => {
        setTour(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const handleBooking = async () => {
    if (!user) {
      alert("A jelentkezéshez előbb be kell jelentkezned!");
      navigate('/login');
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ tour_id: id }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("🎉 " + data.message);
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Hiba történt a jelentkezés során.");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
    </div>
  );

  if (!tour) return <div className="p-10 text-center">Túra nem található.</div>;

  return (
    <div className="bg-white min-h-screen">
      {/* --- HERO HEADER --- */}
      <div className="relative h-[50vh] md:h-[65vh] overflow-hidden">
        <img 
          src={tour.image_url} 
          className="w-full h-full object-cover scale-105" 
          alt={tour.title} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/20 to-transparent"></div>
        
        <div className="absolute top-8 left-8">
          <Link to="/tours" className="flex items-center gap-2 text-white bg-black/20 backdrop-blur-md px-4 py-2 rounded-full hover:bg-black/40 transition">
            <ArrowLeft size={18} /> Vissza a túrákhoz
          </Link>
        </div>

        <div className="absolute bottom-12 left-0 w-full px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest text-sm mb-4">
              <MapPin size={16} /> {tour.location}
            </div>
            <h1 className="text-4xl md:text-7xl font-black text-white leading-tight max-w-4xl tracking-tighter">
              {tour.title}
            </h1>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT GRID --- */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-3 gap-16">
        
        {/* Bal oldal: Részletek */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Quick Info Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100">
              <Clock className="text-emerald-700 mb-2" size={20} />
              <div className="text-xs text-emerald-600/70 uppercase font-bold">Időtartam</div>
              <div className="font-black text-emerald-950">{tour.duration} nap</div>
            </div>
            <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100">
              <Zap className="text-emerald-700 mb-2" size={20} />
              <div className="text-xs text-emerald-600/70 uppercase font-bold">Nehézség</div>
              <div className="font-black text-emerald-950">{tour.difficulty}</div>
            </div>
            <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100">
              <Users className="text-emerald-700 mb-2" size={20} />
              <div className="text-xs text-emerald-600/70 uppercase font-bold">Létszám</div>
              <div className="font-black text-emerald-950">Max. 12 fő</div>
            </div>
            <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100">
              <ShieldCheck className="text-emerald-700 mb-2" size={20} />
              <div className="text-xs text-emerald-600/70 uppercase font-bold">Biztonság</div>
              <div className="font-black text-emerald-950">Profi vezetés</div>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-black text-emerald-950 mb-6 flex items-center gap-3">
              Leírás <Info className="text-emerald-600/30" />
            </h2>
            <p className="text-gray-600 leading-relaxed text-xl">
              {tour.description || "Indulj el velünk egy felejthetetlen kalandra, ahol a természet érintetlensége és a profi szervezés találkozik. Ez a túra kifejezetten azoknak szól, akik többre vágynak egy egyszerű sétánál."}
            </p>
          </div>

          {/* Amit kínálunk */}
          <div className="space-y-4">
            <h3 className="text-xl font-black text-emerald-950 uppercase tracking-tight">Mit tartalmaz az ár?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {['Szakképzett hegyi vezetés', 'Speciális felszerelés bérlése', 'Szállás és ellátás', 'Balesetbiztosítás a túra idejére'].map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                  <CheckCircle2 className="text-emerald-600" size={22} />
                  <span className="font-bold text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Jobb oldal: Foglalási Panel (Sticky) */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 bg-emerald-950 p-8 rounded-[2.5rem] shadow-2xl text-white overflow-hidden relative">
            {/* Dekoratív háttér elem */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="mb-8">
                <span className="text-emerald-400 font-bold uppercase tracking-widest text-xs">Részvételi díj</span>
                <div className="text-5xl font-black mt-1">
                  {tour.price.toLocaleString()} <span className="text-xl">Ft</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm border-b border-emerald-800 pb-2">
                  <span className="text-emerald-300">Indulás dátuma:</span>
                  <span className="font-bold uppercase">Hamarosan...</span>
                </div>
                <div className="flex justify-between text-sm border-b border-emerald-800 pb-2">
                  <span className="text-emerald-300">Szabad helyek:</span>
                  <span className="font-bold">4 / 12</span>
                </div>
              </div>

              <button 
                onClick={handleBooking}
                className={`w-full py-5 rounded-2xl font-black text-xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 ${
                  user 
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-emerald-500/20' 
                    : 'bg-emerald-800/50 text-emerald-600 cursor-not-allowed'
                }`}
              >
                {user ? 'Jelentkezem most' : 'Lépj be a foglaláshoz'}
              </button>
              
              <p className="text-center text-emerald-500/50 text-[10px] mt-6 uppercase font-bold tracking-widest">
                🔒 Biztonságos foglalás & Garantált élmény
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourDetailsScreen;