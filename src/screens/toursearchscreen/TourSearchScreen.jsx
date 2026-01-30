import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, MapPin, Calendar, DollarSign, 
  Zap, Clock, ArrowRight, SlidersHorizontal, X 
} from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const TourSearchScreen = () => {
  const navigate = useNavigate();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [difficulty, setDifficulty] = useState("Mind");
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/tours`)
      .then(res => res.json())
      .then(data => {
        setTours(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const formatCompactDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return `${d.getMonth() + 1}.${d.getDate()}`;
  };

  const filteredTours = useMemo(() => {
    return tours.filter(tour => {
      const matchesSearch = tour.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            tour.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDifficulty = difficulty === "Mind" || tour.difficulty === difficulty;
      const matchesPrice = !maxPrice || tour.price <= parseInt(maxPrice);
      
      let matchesDate = true;
      if (startDate && endDate) {
        const tourStart = new Date(tour.start_date);
        matchesDate = tourStart >= startDate && tourStart <= endDate;
      }
      return matchesSearch && matchesDifficulty && matchesPrice && matchesDate;
    });
  }, [tours, searchTerm, difficulty, maxPrice, startDate, endDate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#fcfdfe]"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-600"></div></div>;

  return (
    <div className="bg-[#fcfdfe] min-h-screen pb-20 font-sans text-slate-900">
      
      {/* --- KERESŐ FEJLÉC HÁTTÉRKÉPPEL --- */}
      <div className="relative pt-20 pb-28 px-6 shadow-2xl overflow-hidden min-h-[400px] flex items-center">
        
        {/* HÁTTÉRKÉP RÉTEG */}
        <img 
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2070" 
          className="absolute inset-0 w-full h-full object-cover scale-105"
          alt="Background"
        />
        
        {/* SÖTÉTÍTŐ OVERLAY (hogy olvasható legyen a tartalom) */}
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"></div>

        {/* EMERALD GLOW (a 2026-os stílus megtartásához) */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] -mr-32 -mt-32 pointer-events-none z-10"></div>
        
        <div className="max-w-6xl mx-auto relative z-20 w-full">
          <h1 className="text-5xl md:text-6xl font-black text-white italic uppercase tracking-tighter mb-10 drop-shadow-2xl">
            Túra<span className="text-emerald-400">kereső</span>
          </h1>

          {/* Glassmorphism Szűrő Panel */}
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-3 rounded-[2.5rem] grid grid-cols-1 md:grid-cols-12 gap-3 shadow-2xl transition-all duration-500 hover:bg-white/15">
            
            <div className="md:col-span-4 relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-400 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Hova utaznál?" 
                className="w-full bg-black/20 border-none rounded-3xl py-4 pl-14 text-white placeholder:text-slate-400 text-sm font-bold focus:ring-2 focus:ring-emerald-500/50 transition-all outline-none shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="md:col-span-3 relative group">
              <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-400 transition-colors z-20 pointer-events-none" size={20} />
              <DatePicker
                selectsRange
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => setDateRange(update)}
                placeholderText="Mikor indulnál?"
                className="w-full bg-black/20 border-none rounded-3xl py-4 pl-14 text-white placeholder:text-slate-400 text-sm font-bold focus:ring-2 focus:ring-emerald-500/50 transition-all outline-none shadow-inner"
              />
            </div>

            <div className="md:col-span-2 relative group">
              <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-400 transition-colors" size={20} />
              <input 
                type="number" 
                placeholder="Max ár" 
                className="w-full bg-black/20 border-none rounded-3xl py-4 pl-14 text-white placeholder:text-slate-400 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>

            <div className="md:col-span-2 relative group">
              <Zap className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-400 transition-colors" size={20} />
              <select 
                className="w-full bg-black/20 border-none rounded-3xl py-4 pl-14 text-white text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none cursor-pointer shadow-inner"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="Mind" className="bg-slate-900 text-white">Mind</option>
                <option value="Könnyű" className="bg-slate-900 text-white">Könnyű</option>
                <option value="Közepes" className="bg-slate-900 text-white">Közepes</option>
                <option value="Nehéz" className="bg-slate-900 text-white">Nehéz</option>
              </select>
            </div>

            <div className="md:col-span-1 flex items-center justify-center">
              <button 
                onClick={() => { setSearchTerm(""); setMaxPrice(""); setDifficulty("Mind"); setDateRange([null, null]); }}
                className="p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-90"
                title="Szűrők törlése"
              >
                <X size={22} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- EREDMÉNYEK GRID --- */}
      <div className="max-w-6xl mx-auto px-6 -mt-12 relative z-30">
        <div className="flex justify-between items-end mb-8 bg-white/50 backdrop-blur-sm p-4 rounded-2xl inline-block border border-white/20 shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-700">
            Találatok: <span className="text-emerald-900">{filteredTours.length} db túra</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTours.map((tour) => {
            const saturation = Math.round(((tour.booked_count || 0) / (tour.max_participants || 12)) * 100);
            return (
              <div 
                key={tour.id} 
                onClick={() => navigate(`/tours/${tour.id}`)}
                className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer overflow-hidden flex flex-col"
              >
                <div className="relative h-56 overflow-hidden">
                  <img src={tour.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={tour.title} />
                  <div className="absolute top-5 right-5 bg-white/80 backdrop-blur-md pl-2 pr-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm flex items-center gap-1.5">
                    <Zap size={12} className="text-amber-500" /> {tour.difficulty}
                  </div>
                  <div className="absolute bottom-0 left-0 w-full p-5 bg-gradient-to-t from-slate-900/80 to-transparent">
                    <div className="text-white text-xs font-bold flex items-center gap-1.5">
                      <MapPin size={14} className="text-emerald-400" /> {tour.location}
                    </div>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-black text-xl italic uppercase tracking-tighter text-slate-900 leading-tight mb-4 group-hover:text-emerald-600 transition-colors line-clamp-2">
                      {tour.title}
                    </h3>
                    <div className="flex justify-between items-center text-[11px] font-black uppercase text-slate-400 mb-5">
                      <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg"><Clock size={14}/> {tour.duration} nap</span>
                      <span className="flex items-center gap-1.5 text-slate-900 bg-emerald-50/50 px-2 py-1 rounded-lg">
                        <Calendar size={14} className="text-emerald-600"/> {formatCompactDate(tour.start_date)} - {formatCompactDate(tour.end_date)}
                      </span>
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between text-[9px] font-black uppercase mb-1.5 text-slate-400">
                        <span>Létszám: <span className="text-slate-900">{tour.booked_count || 0}</span> / {tour.max_participants || 12} fő</span>
                        <span className={saturation >= 90 ? 'text-red-500' : 'text-emerald-500'}>{saturation}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ease-out ${saturation >= 90 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                          style={{ width: `${Math.min(saturation, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-5 border-t border-slate-100 flex justify-between items-center mt-4">
                    <div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Részvételi díj</div>
                      <div className="text-2xl font-black text-slate-900 tracking-tight">{tour.price?.toLocaleString()} <span className="text-sm font-bold text-slate-500">Ft</span></div>
                    </div>
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:scale-110 transition-all shadow-lg">
                      <ArrowRight size={20} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TourSearchScreen;