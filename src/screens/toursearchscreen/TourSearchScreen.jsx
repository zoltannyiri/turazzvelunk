import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  Search, MapPin, Calendar, DollarSign, 
  Zap, Clock, ArrowRight, SlidersHorizontal, X,
  Mountain, Waves, Sparkles, Tent, Bike, Layers, Compass
} from 'lucide-react';
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { hu } from "date-fns/locale";
import { formatPrice } from '../../utils/formatPrice';

registerLocale('hu', hu);

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

const TourSearchScreen = () => {
  const navigate = useNavigate();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  // Kategória alapú menüpontok állapota
  const [selectedCategory, setSelectedCategory] = useState("Mind");
  const [selectedSubcategory, setSelectedSubcategory] = useState("Mind");
  
  // Részletes keresőhöz tartozó állapotok (kikommentelt keresőhöz fenntartva)
  const [searchTerm, setSearchTerm] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [category, setCategory] = useState("Mind");
  const [subcategory, setSubcategory] = useState("Mind");
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  const popperContainer = ({ children }) => createPortal(children, document.body);
  const monthNames = [
    'Január',
    'Február',
    'Március',
    'Április',
    'Május',
    'Június',
    'Július',
    'Augusztus',
    'Szeptember',
    'Október',
    'November',
    'December'
  ];

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/tours`)
      .then(res => res.json())
      .then(data => {
        setTours(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const formatCompactDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return `${d.getMonth() + 1}.${d.getDate()}`;
  };

  // Csak azok a túrák, amik még nem jártak le (end_date vagy start_date >= mai nap)
  const todayKey = getTodayKey();
  const activeTours = useMemo(() => {
    if (!Array.isArray(tours)) return [];
    return tours.filter(tour => {
      const endDateKey = getLocalDateKey(tour.end_date || tour.start_date);
      return !endDateKey || endDateKey >= todayKey;
    });
  }, [tours, todayKey]);

  // Alapértelmezett és dinamikusan fellelhető kategóriák listája
  const defaultCategories = ['Hegyi túrák', 'Vízitúrák', 'Motoros', 'Jóga'];

  const categoryList = useMemo(() => {
    const dynamicCategories = Array.from(
      new Set(activeTours.map((tour) => tour.category).filter(Boolean))
    );
    return Array.from(new Set([...defaultCategories, ...dynamicCategories]));
  }, [activeTours]);

  // Kategóriákhoz tartozó túraszámok kalkulálása
  const getCategoryTourCount = (catName) => {
    if (catName === 'Mind') return activeTours.length;
    return activeTours.filter(
      (tour) => (tour.category || '').toLowerCase() === catName.toLowerCase()
    ).length;
  };

  // Kategória ikonok hozzárendelése
  const getCategoryIcon = (catName) => {
    switch (catName) {
      case 'Hegyi túrák':
        return <Mountain size={18} />;
      case 'Vízitúrák':
        return <Waves size={18} />;
      case 'Jóga':
        return <Sparkles size={18} />;
      case 'Motoros':
        return <Bike size={18} />;
      case 'Mind':
        return <Layers size={18} />;
      default:
        return <Compass size={18} />;
    }
  };

  // Alkategóriák a kiválasztott kategória alapján
  const subcategories = useMemo(() => {
    if (selectedCategory === "Mind") return [];
    return Array.from(
      new Set(
        activeTours
          .filter((tour) => (tour.category || "").toLowerCase() === selectedCategory.toLowerCase())
          .map((tour) => tour.subcategory)
          .filter(Boolean)
      )
    );
  }, [activeTours, selectedCategory]);

  // Megjelenítendő aktív túrák szűrése a kategória menüpont szerint
  const displayedTours = useMemo(() => {
    return activeTours.filter((tour) => {
      const matchesCategory =
        selectedCategory === "Mind" ||
        (tour.category || "").toLowerCase() === selectedCategory.toLowerCase();
      const matchesSubcategory =
        selectedSubcategory === "Mind" ||
        (tour.subcategory || "").toLowerCase() === selectedSubcategory.toLowerCase();
      return matchesCategory && matchesSubcategory;
    });
  }, [activeTours, selectedCategory, selectedSubcategory]);

  // Kikommentelt keresőhöz fenntartott kategória listák
  const legacyCategories = useMemo(() => {
    return Array.from(new Set(tours.map((tour) => tour.category).filter(Boolean)));
  }, [tours]);

  const legacySubcategories = useMemo(() => {
    return Array.from(
      new Set(
        tours
          .filter((tour) => category === "Mind" || tour.category === category)
          .map((tour) => tour.subcategory)
          .filter(Boolean)
      )
    );
  }, [tours, category]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fcfdfe]">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-600"></div>
    </div>
  );

  return (
    <div className="bg-[#fcfdfe] min-h-screen pb-20 font-sans text-slate-900">
      
      {/* --- KERESŐ FEJLÉC HÁTTÉRKÉPPEL --- */}
      <div className="relative pt-20 pb-24 px-6 shadow-2xl overflow-hidden min-h-[340px] flex items-center">
        
        {/* HÁTTÉRKÉP RÉTEG */}
        <img 
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2070" 
          className="absolute inset-0 w-full h-full object-cover scale-105"
          alt="Background"
        />
        
        {/* SÖTÉTÍTŐ OVERLAY */}
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"></div>

        {/* EMERALD GLOW */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] -mr-32 -mt-32 pointer-events-none z-10"></div>
        
        <div className="max-w-[1400px] mx-auto relative z-20 w-full text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter mb-4 drop-shadow-2xl">
            Túra<span className="text-emerald-400">kereső</span>
          </h1>
          <p className="text-emerald-100/90 text-base md:text-lg font-medium max-w-2xl drop-shadow">
            Válassz kategóriát, és böngéssz az aktuálisan induló, aktív túráink között!
          </p>

          {/* ========================================================================= */}
          {/* --- RÉSZLETES KERESŐ (KIKOMMENTELVE) --- */}
          {/* ========================================================================= */}
          {/*
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-3 rounded-[2.5rem] grid grid-cols-1 md:grid-cols-12 gap-3 shadow-2xl transition-all duration-500 hover:bg-white/15 mt-6">
            
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
                locale="hu"
                calendarStartDay={1}
                popperContainer={popperContainer}
                renderCustomHeader={({ date, decreaseMonth, increaseMonth, prevMonthButtonDisabled, nextMonthButtonDisabled }) => (
                  <div className="flex items-center justify-between px-2 pb-2">
                    <button
                      type="button"
                      onClick={decreaseMonth}
                      disabled={prevMonthButtonDisabled}
                      className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-40"
                    >
                      ‹
                    </button>
                    <div className="font-black text-slate-900">
                      {date.getFullYear()}. {monthNames[date.getMonth()]}
                    </div>
                    <button
                      type="button"
                      onClick={increaseMonth}
                      disabled={nextMonthButtonDisabled}
                      className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-40"
                    >
                      ›
                    </button>
                  </div>
                )}
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

            <div className="md:col-span-3 relative group">
              <SlidersHorizontal className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-400 transition-colors" size={20} />
              <select 
                className="w-full bg-black/20 border-none rounded-3xl py-4 pl-14 text-white text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none cursor-pointer shadow-inner"
                value={category}
                onChange={(e) => { setCategory(e.target.value); setSubcategory("Mind"); }}
              >
                <option value="Mind" className="bg-slate-900 text-white">Minden kategória</option>
                {legacyCategories.map((item) => (
                  <option key={item} value={item} className="bg-slate-900 text-white">{item}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3 relative group">
              <SlidersHorizontal className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-400 transition-colors" size={20} />
              <select 
                className="w-full bg-black/20 border-none rounded-3xl py-4 pl-14 text-white text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none cursor-pointer shadow-inner"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
              >
                <option value="Mind" className="bg-slate-900 text-white">Minden alkategória</option>
                {legacySubcategories.map((item) => (
                  <option key={item} value={item} className="bg-slate-900 text-white">{item}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-1 flex items-center justify-center">
              <button 
                onClick={() => { setSearchTerm(""); setMaxPrice(""); setCategory("Mind"); setSubcategory("Mind"); setDateRange([null, null]); }}
                className="p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-90"
                title="Szűrők törlése"
              >
                <X size={22} />
              </button>
            </div>
          </div>
          */}
        </div>
      </div>

      {/* --- KATEGÓRIA MENÜPONTOK A TÚRÁK FÖLÖTT --- */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 -mt-8 relative z-30 mb-10">
        <div className="bg-white/95 backdrop-blur-xl p-2.5 sm:p-4 rounded-3xl sm:rounded-[2.5rem] shadow-xl border border-slate-100/80">
          <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-1 scrollbar-none lg:flex-nowrap">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("Mind");
                setSelectedSubcategory("Mind");
              }}
              className={`flex-1 min-w-fit lg:min-w-0 flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-200 whitespace-nowrap cursor-pointer ${
                selectedCategory === "Mind"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400/40"
                  : "bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-100"
              }`}
            >
              <Layers size={18} className="shrink-0" />
              <span className="truncate">Összes</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black shrink-0 ${
                selectedCategory === "Mind" ? "bg-emerald-800 text-emerald-100" : "bg-slate-200 text-slate-600"
              }`}>
                {activeTours.length}
              </span>
            </button>

            {categoryList.map((cat) => {
              const count = getCategoryTourCount(cat);
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSelectedSubcategory("Mind");
                  }}
                  className={`flex-1 min-w-fit lg:min-w-0 flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-200 whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400/40"
                      : "bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-100"
                  }`}
                >
                  <span className="shrink-0">{getCategoryIcon(cat)}</span>
                  <span className="truncate">{cat}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black shrink-0 ${
                    isSelected ? "bg-emerald-800 text-emerald-100" : "bg-slate-200 text-slate-600"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Alkategória szűrő gombok (amennyiben van alkategória a kiválasztott főkategóriában) */}
          {subcategories.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2">Alkategória:</span>
              <button
                type="button"
                onClick={() => setSelectedSubcategory("Mind")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedSubcategory === "Mind"
                    ? "bg-emerald-100 text-emerald-900 font-black shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Mind ({getCategoryTourCount(selectedCategory)})
              </button>
              {subcategories.map((subcat) => (
                <button
                  key={subcat}
                  type="button"
                  onClick={() => setSelectedSubcategory(subcat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedSubcategory === subcat
                      ? "bg-emerald-100 text-emerald-900 font-black shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {subcat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- EREDMÉNYEK GRID --- */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 relative z-30">
        <div className="flex justify-between items-center mb-8 bg-white/70 backdrop-blur-sm px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wider text-emerald-700 flex items-center gap-2">
            <span>Kategória:</span>
            <span className="text-emerald-950 font-black">
              {selectedCategory === "Mind" ? "Összes" : selectedCategory}
              {selectedSubcategory !== "Mind" ? ` • ${selectedSubcategory}` : ""}
            </span>
          </div>
          <div className="text-xs font-black uppercase tracking-wider text-slate-500">
            {displayedTours.length} db aktív túra
          </div>
        </div>

        {displayedTours.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedTours.map((tour) => {
              const maxParticipants = Number(tour.max_participants || 0);
              const bookedCount = Number(tour.booked_count || 0);
              const saturation = maxParticipants > 0
                ? Math.round((bookedCount / maxParticipants) * 100)
                : 0;
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
                    {tour.category && (
                      <div className="absolute top-5 left-5 bg-emerald-950/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-300 shadow-sm">
                        {tour.category}
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 w-full p-5 bg-gradient-to-t from-slate-900/80 to-transparent">
                      <div className="text-white text-xs font-bold flex items-center gap-1.5">
                        <MapPin size={14} className="text-emerald-400" /> {tour.location}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      {tour.subcategory && (
                        <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1.5">
                          {tour.subcategory}
                        </div>
                      )}
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
                          <span>
                            Létszám: <span className="text-slate-900">{bookedCount}</span> / {maxParticipants > 0 ? maxParticipants : '-'} fő
                          </span>
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
                        <div className="text-2xl font-black text-slate-900 tracking-tight">{formatPrice(tour.price)} <span className="text-sm font-bold text-slate-500">Ft</span></div>
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
        ) : (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200 shadow-sm">
            <Compass className="mx-auto text-emerald-600 mb-4 opacity-50" size={48} />
            <h3 className="text-xl font-black text-slate-900 mb-2">Nincs megjeleníthető aktív túra</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Ebben a kategóriában jelenleg nincsenek meghirdetett, aktív túrák. Nézz vissza később vagy válassz másik kategóriát!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TourSearchScreen;
