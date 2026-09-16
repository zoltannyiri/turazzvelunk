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
  
  // Részletes keresőhöz tartozó állapotok (opcionálisan fenntartva)
  const [searchTerm, setSearchTerm] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [category, setCategory] = useState("Mind");
  const [subcategory, setSubcategory] = useState("Mind");
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  const popperContainer = ({ children }) => createPortal(children, document.body);
  const monthNames = [
    'Január', 'Február', 'Március', 'Április', 'Május', 'Június',
    'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'
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

  // Csak azok a túrák, amik még nem jártak le
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
        return <Mountain size={16} strokeWidth={1.8} />;
      case 'Vízitúrák':
        return <Waves size={16} strokeWidth={1.8} />;
      case 'Jóga':
        return <Sparkles size={16} strokeWidth={1.8} />;
      case 'Motoros':
        return <Bike size={16} strokeWidth={1.8} />;
      case 'Mind':
        return <Layers size={16} strokeWidth={1.8} />;
      default:
        return <Compass size={16} strokeWidth={1.8} />;
    }
  };

  const getCategoryLabel = (catName) => ({
    'Hegyi túrák': 'Hegyi-túrák',
    'Vízitúrák': 'Vízi-túrák',
    'Motoros': 'Motoros-túrák'
  })[catName] || catName;

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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8faf7]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 border-2 border-[#d8dfd4] border-t-[#275940] rounded-full animate-spin"></div>
        <span className="text-xs font-semibold uppercase tracking-widest text-[#718174]">Túrák betöltése...</span>
      </div>
    </div>
  );

  return (
    <div className="bg-[#f8faf7] min-h-screen pb-24 font-sans text-[#173327]">
      
      {/* --- KERESŐ FEJLÉC HÁTTÉRKÉPPEL ÉS TERMÉSZETES ZÖLD TÓNUSSAL --- */}
      <div className="relative pt-20 pb-28 px-6 overflow-hidden min-h-[360px] flex items-center">
        
        {/* HÁTTÉRKÉP RÉTEG */}
        <img 
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2070" 
          className="absolute inset-0 w-full h-full object-cover scale-105 filter brightness-95"
          alt="Természet háttér"
        />
        
        {/* SÖTÉTÍTŐ TERMÉSZETES ZÖLD OVERLAY */}
        <div className="absolute inset-0 bg-[#0f1f17]/75 backdrop-blur-[1px]"></div>

        {/* LÁGY MÉLYZÖLD FÉNYEFFEKT */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#477258]/15 rounded-full blur-[140px] -mr-32 -mt-32 pointer-events-none z-10"></div>
        
        <div className="max-w-[1400px] mx-auto relative z-20 w-full text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[#dce5d8] text-xs font-semibold uppercase tracking-[0.2em] mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Túrázz Velünk • Programkereső
          </div>
          
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-white font-normal tracking-tight mb-4 drop-shadow-md">
            Fedezd fel a következő kalandodat
          </h1>
          <p className="text-[#dce5d8] text-sm sm:text-base md:text-lg max-w-2xl font-light leading-relaxed drop-shadow-sm">
            Válassz kategóriát, és böngéssz a garantáltan induló, szervezett túráink között.
          </p>
        </div>
      </div>

      {/* --- KATEGÓRIA MENÜPONTOK A TÚRÁK FÖLÖTT --- */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 -mt-10 relative z-30 mb-10">
        <div className="bg-white rounded-3xl shadow-xl shadow-[#173327]/5 border border-[#d8dfd4] p-3 sm:p-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none lg:flex-nowrap">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("Mind");
                setSelectedSubcategory("Mind");
              }}
              className={`flex-1 min-w-fit lg:min-w-0 flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-200 whitespace-nowrap cursor-pointer ${
                selectedCategory === "Mind"
                  ? "bg-[#275940] text-white shadow-sm border border-[#275940]"
                  : "bg-[#f7f9f5] text-[#34493b] hover:bg-[#ecefe6] hover:text-[#173327] border border-[#e1e7dc]"
              }`}
            >
              <Layers size={16} strokeWidth={1.8} className="shrink-0" />
              <span className="truncate">Összes</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                selectedCategory === "Mind" ? "bg-[#1a3d2c] text-[#d4e7db]" : "bg-[#e6ece1] text-[#55695b]"
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
                  className={`flex-1 min-w-fit lg:min-w-0 flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-200 whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? "bg-[#275940] text-white shadow-sm border border-[#275940]"
                      : "bg-[#f7f9f5] text-[#34493b] hover:bg-[#ecefe6] hover:text-[#173327] border border-[#e1e7dc]"
                  }`}
                >
                  <span className="shrink-0">{getCategoryIcon(cat)}</span>
                  <span className="truncate">{getCategoryLabel(cat)}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                    isSelected ? "bg-[#1a3d2c] text-[#d4e7db]" : "bg-[#e6ece1] text-[#55695b]"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Alkategória szűrő gombok */}
          {subcategories.length > 0 && (
            <div className="mt-3.5 pt-3.5 border-t border-[#e8eee4] flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#718174] mr-1">Alkategória:</span>
              <button
                type="button"
                onClick={() => setSelectedSubcategory("Mind")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedSubcategory === "Mind"
                    ? "bg-[#275940] text-white shadow-xs"
                    : "bg-[#f7f9f5] text-[#425447] hover:bg-[#e6ece1] hover:text-[#173327] border border-[#dce5d8]"
                }`}
              >
                Mind ({getCategoryTourCount(selectedCategory)})
              </button>
              {subcategories.map((subcat) => (
                <button
                  key={subcat}
                  type="button"
                  onClick={() => setSelectedSubcategory(subcat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedSubcategory === subcat
                      ? "bg-[#275940] text-white shadow-xs"
                      : "bg-[#f7f9f5] text-[#425447] hover:bg-[#e6ece1] hover:text-[#173327] border border-[#dce5d8]"
                  }`}
                >
                  {subcat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- EREDMÉNYEK GRID ÉS SZEKCIÓ FEJLÉC --- */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 relative z-30">
        
        <div className="border-b border-[#d8dfd4] pb-4 mb-8 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#648067]">Kiválasztott kategória</p>
            <h2 className="mt-1 font-serif text-2xl sm:text-3xl text-[#173327]">
              {selectedCategory === "Mind" ? "Összes elérhető túra" : selectedCategory}
              {selectedSubcategory !== "Mind" ? ` — ${selectedSubcategory}` : ""}
            </h2>
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#718174] bg-[#f7f9f5] border border-[#dce5d8] px-3.5 py-1.5 rounded-full self-start sm:self-auto inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#477258]"></span>
            {displayedTours.length} aktív túra
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
              const remainingSpots = Math.max(0, maxParticipants - bookedCount);

              return (
                <div 
                  key={tour.id} 
                  onClick={() => navigate(`/tours/${tour.id}`)}
                  className="group bg-white rounded-3xl border border-[#dce5d8] hover:border-[#b4c7b0] shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col"
                >
                  {/* KÉP ÉS CÍMKÉK */}
                  <div className="relative h-60 overflow-hidden bg-[#ecefe6]">
                    <img 
                      src={tour.image_url} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                      alt={tour.title} 
                    />
                    
                    {tour.category && (
                      <div className="absolute top-4 left-4 bg-[#173327]/90 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-[0.14em] text-[#dce5d8] shadow-xs">
                        {tour.category}
                      </div>
                    )}

                    {tour.difficulty && (
                      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide text-[#20382a] border border-[#cad6c9]/60 shadow-xs flex items-center gap-1.5">
                        <Zap size={12} className="text-[#477258]" /> {tour.difficulty}
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-[#0f1f17]/85 via-[#0f1f17]/40 to-transparent">
                      <div className="text-white text-xs font-medium flex items-center gap-1.5 drop-shadow-sm">
                        <MapPin size={14} className="text-[#a8c9b2]" /> {tour.location || 'Helyszín egyeztetés alatt'}
                      </div>
                    </div>
                  </div>

                  {/* KÁRTYA TARTALOM */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      {tour.subcategory && (
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5e755f] mb-1.5">
                          {tour.subcategory}
                        </div>
                      )}
                      
                      <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#173327] group-hover:text-[#275940] transition-colors leading-snug line-clamp-2 mb-3">
                        {tour.title}
                      </h3>

                      {/* IDŐPONT ÉS IDŐTARTAM */}
                      <div className="flex items-center justify-between text-xs text-[#55695b] py-2.5 border-y border-[#ecefe6] mb-4">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Clock size={14} className="text-[#648067]" /> 
                          {tour.duration ? `${tour.duration} nap` : '1 nap'}
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <Calendar size={14} className="text-[#648067]" /> 
                          {formatCompactDate(tour.start_date)} – {formatCompactDate(tour.end_date)}
                        </span>
                      </div>

                      {/* SZABAD HELYEK ÉS TELÍTETTSÉG */}
                      <div className="mb-2">
                        <div className="flex justify-between items-center text-xs text-[#718174] mb-1.5 font-medium">
                          <span>
                            Elérhető helyek: <strong className="text-[#173327] font-semibold">{remainingSpots} fő</strong>
                            {maxParticipants > 0 && ` (${bookedCount}/${maxParticipants})`}
                          </span>
                          <span className={saturation >= 90 ? 'text-[#b94a48] font-bold' : 'text-[#477258] font-semibold'}>
                            {saturation}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-[#ecf0e8] rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-700 ease-out ${
                              saturation >= 90 ? 'bg-[#b94a48]' : 'bg-[#275940]'
                            }`} 
                            style={{ width: `${Math.min(saturation, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* LÁBLÉC: ÁR ÉS MEGNYITÁS GOMB */}
                    <div className="pt-4 border-t border-[#ecefe6] flex justify-between items-center mt-3">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#718174] mb-0.5">
                          Részvételi díj
                        </div>
                        <div className="font-serif text-2xl font-bold text-[#173327]">
                          {formatPrice(tour.price)} <span className="text-xs font-normal text-[#718174]">Ft</span>
                        </div>
                      </div>
                      
                      <div className="w-10 h-10 rounded-full bg-[#f7f9f5] border border-[#cad6c9] text-[#275940] flex items-center justify-center group-hover:bg-[#275940] group-hover:text-white group-hover:border-[#275940] transition-all duration-200 shadow-xs">
                        <ArrowRight size={18} strokeWidth={2} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-[#f7f9f5] rounded-3xl border border-[#dce5d8] px-6">
            <div className="w-14 h-14 rounded-full bg-[#ecefe6] border border-[#cad6c9] flex items-center justify-center text-[#477258] mx-auto mb-4">
              <Compass size={24} strokeWidth={1.8} />
            </div>
            <h3 className="font-serif text-2xl text-[#173327] mb-2">Nincs megjeleníthető aktív túra</h3>
            <p className="text-sm text-[#65756a] max-w-md mx-auto leading-relaxed mb-6">
              Ebben a kategóriában jelenleg nincsenek meghirdetett, aktív túrák. Válassz másik kategóriát vagy nézz vissza később!
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("Mind");
                setSelectedSubcategory("Mind");
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#275940] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#1d4330] transition shadow-xs cursor-pointer"
            >
              Összes túra mutatása
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TourSearchScreen;
