import React, { useState, useEffect } from 'react';
import TourCard from '../../components/TourCard';
import { Archive, CalendarDays, Search, X, Compass } from 'lucide-react';

const getLocalDateKey = (value) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTodayKey = () => getLocalDateKey(new Date());

const ToursScreen = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('active');
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/tours`)
      .then(res => res.json())
      .then(data => {
        setTours(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Keresés szűrése (név vagy helyszín alapján)
  const todayKey = getTodayKey();
  const activeTours = Array.isArray(tours)
    ? tours.filter(tour => {
        const endDateKey = getLocalDateKey(tour.end_date || tour.start_date);
        return !endDateKey || endDateKey >= todayKey;
      })
    : [];
  const archivedTours = Array.isArray(tours)
    ? tours.filter(tour => {
        const endDateKey = getLocalDateKey(tour.end_date || tour.start_date);
        return endDateKey && endDateKey < todayKey;
      })
    : [];
  const visibleTours = view === 'archive' ? archivedTours : activeTours;
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredTours = visibleTours.filter(tour =>
    tour.title?.toLowerCase().includes(normalizedSearchTerm) ||
    tour.location?.toLowerCase().includes(normalizedSearchTerm) ||
    tour.category?.toLowerCase().includes(normalizedSearchTerm)
  );

  return (
    <div className="bg-[#f8faf7] min-h-screen pb-24 font-sans text-[#173327]">
      
      {/* --- KERESŐ FEJLÉC HÁTTÉRKÉPPEL ÉS TERMÉSZETES ZÖLD TÓNUSSAL --- */}
      <div className="relative pt-20 pb-28 px-6 overflow-hidden min-h-[360px] flex items-center">
        
        {/* HÁTTÉRKÉP RÉTEG */}
        <img 
          src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=2070" 
          className="absolute inset-0 w-full h-full object-cover scale-105 filter brightness-95"
          alt="Hegyi táj háttér"
        />
        
        {/* SÖTÉTÍTŐ TERMÉSZETES ZÖLD OVERLAY */}
        <div className="absolute inset-0 bg-[#0f1f17]/75 backdrop-blur-[1px]"></div>

        {/* LÁGY MÉLYZÖLD FÉNYEFFEKT */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#477258]/15 rounded-full blur-[140px] -mr-32 -mt-32 pointer-events-none z-10"></div>
        
        <div className="max-w-7xl mx-auto relative z-20 w-full text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[#dce5d8] text-xs font-semibold uppercase tracking-[0.2em] mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Túrázz Velünk • Programjaink
          </div>
          
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-white font-normal tracking-tight mb-4 drop-shadow-md">
            Minden túra egy helyen
          </h1>
          <p className="text-[#dce5d8] text-sm sm:text-base md:text-lg max-w-2xl font-light leading-relaxed drop-shadow-sm">
            Válogass a szervezett túráink közül, és találd meg a számodra tökéletes élményt.
          </p>
        </div>
      </div>

      {/* --- LEBEGŐ KERESŐ ÉS NÉZETVÁLTÓ SÁV --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-10 relative z-30 mb-10">
        <div className="bg-white rounded-3xl shadow-xl shadow-[#173327]/5 border border-[#d8dfd4] p-3 sm:p-4 flex flex-col md:flex-row gap-3 items-center">
          
          {/* KERESŐ MEZŐ */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#648067]" size={18} strokeWidth={2} />
            <input 
              type="text" 
              placeholder="Keresés címre, helyszínre vagy kategóriára..." 
              className="w-full pl-11 pr-10 py-3.5 bg-[#f7f9f5] border border-[#dce5d8] rounded-2xl text-sm text-[#173327] placeholder:text-[#879489] focus:outline-none focus:border-[#477258] focus:ring-1 focus:ring-[#477258] transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#879489] hover:text-[#173327] p-1 transition"
                aria-label="Keresés törlése"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* AKTÍV / ARCHÍVUM VÁLTÓ GOMBOK */}
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <button 
              type="button" 
              onClick={() => setView('active')} 
              aria-pressed={view === 'active'} 
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-200 whitespace-nowrap cursor-pointer ${
                view === 'active'
                  ? 'bg-[#275940] text-white shadow-sm border border-[#275940]'
                  : 'bg-[#f7f9f5] text-[#34493b] hover:bg-[#ecefe6] hover:text-[#173327] border border-[#e1e7dc]'
              }`}
            >
              <CalendarDays size={16} strokeWidth={1.8} className="shrink-0" />
              <span>Aktív túrák</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                view === 'active' ? 'bg-[#1a3d2c] text-[#d4e7db]' : 'bg-[#e6ece1] text-[#55695b]'
              }`}>
                {activeTours.length}
              </span>
            </button>

            <button 
              type="button" 
              onClick={() => setView('archive')} 
              aria-pressed={view === 'archive'} 
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-200 whitespace-nowrap cursor-pointer ${
                view === 'archive'
                  ? 'bg-[#275940] text-white shadow-sm border border-[#275940]'
                  : 'bg-[#f7f9f5] text-[#34493b] hover:bg-[#ecefe6] hover:text-[#173327] border border-[#e1e7dc]'
              }`}
            >
              <Archive size={16} strokeWidth={1.8} className="shrink-0" />
              <span>Archívum</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                view === 'archive' ? 'bg-[#1a3d2c] text-[#d4e7db]' : 'bg-[#e6ece1] text-[#55695b]'
              }`}>
                {archivedTours.length}
              </span>
            </button>
          </div>

        </div>
      </div>

      {/* --- EREDMÉNYEK GRID ÉS SZEKCIÓ FEJLÉC --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-30">
        
        <div className="border-b border-[#d8dfd4] pb-4 mb-8 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#648067]">
              {view === 'active' ? 'Aktuális programok' : 'Múltbeli túrák'}
            </p>
            <h2 className="mt-1 font-serif text-2xl sm:text-3xl text-[#173327]">
              {view === 'active' ? 'Induló és nyitott túráink' : 'Archivált túrák'}
              {searchTerm && ` — „${searchTerm}”`}
            </h2>
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#718174] bg-[#f7f9f5] border border-[#dce5d8] px-3.5 py-1.5 rounded-full self-start sm:self-auto inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#477258]"></span>
            {filteredTours.length} elérhető túra
          </div>
        </div>

        {loading ? (
          <div className="min-h-[300px] flex flex-col items-center justify-center gap-3 py-16 text-[#718174]">
            <div className="w-9 h-9 border-2 border-[#d8dfd4] border-t-[#275940] rounded-full animate-spin"></div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#718174]">Túrák betöltése...</span>
          </div>
        ) : filteredTours.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTours.map(tour => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-[#f7f9f5] rounded-3xl border border-[#dce5d8] px-6 max-w-xl mx-auto">
            <div className="w-14 h-14 rounded-full bg-[#ecefe6] border border-[#cad6c9] flex items-center justify-center text-[#477258] mx-auto mb-4">
              <Compass size={24} strokeWidth={1.8} />
            </div>
            <h3 className="font-serif text-2xl text-[#173327] mb-2">Nem találtunk ilyen túrát</h3>
            <p className="text-sm text-[#65756a] leading-relaxed mb-6">
              {searchTerm 
                ? `A(z) „${searchTerm}” keresési feltételnek egyetlen túra sem felel meg.`
                : 'Jelenleg nincsenek megjeleníthető túrák ebben a nézetben.'}
            </p>
            {searchTerm ? (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#275940] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#1d4330] transition shadow-xs cursor-pointer"
              >
                Keresés törlése
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setView(view === 'active' ? 'archive' : 'active')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#275940] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#1d4330] transition shadow-xs cursor-pointer"
              >
                {view === 'active' ? 'Archívum megtekintése' : 'Vissza az aktív túrákhoz'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ToursScreen;
