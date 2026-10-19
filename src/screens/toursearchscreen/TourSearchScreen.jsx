import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, MapPin, Calendar, DollarSign, 
  Zap, Clock, ArrowRight, SlidersHorizontal, X,
  Mountain, Waves, Sparkles, Tent, Bike, Layers, Compass
} from 'lucide-react';
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { hu } from "date-fns/locale";
import { formatPrice } from '../../utils/formatPrice';
import { parseTourDate, getLocalDateKey } from '../../utils/formatDate';
import TourCard from '../../components/TourCard';

registerLocale('hu', hu);

const getTodayKey = () => getLocalDateKey(new Date());

const defaultCategories = ['Hegyi túrák', 'Vízitúrák', 'Motoros', 'Jóga'];

const findMatchingCategory = (param, list) => {
  if (!param) return "Mind";
  const pNorm = param.toLowerCase().replace(/[\s\-_]/g, '');
  const found = list.find((cat) => {
    const cNorm = cat.toLowerCase().replace(/[\s\-_]/g, '');
    return cNorm === pNorm || cNorm.includes(pNorm) || pNorm.includes(cNorm);
  });
  return found || param;
};

const TourSearchScreen = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  // Kategória alapú menüpontok állapota
  const categoryParam = searchParams.get('category');
  const [selectedCategory, setSelectedCategory] = useState(() =>
    findMatchingCategory(categoryParam, defaultCategories)
  );
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Csak azok a túrák, amik még nem jártak le
  const todayKey = getTodayKey();
  const activeTours = useMemo(() => {
    if (!Array.isArray(tours)) return [];
    return tours.filter(tour => {
      const endDateKey = getLocalDateKey(tour.end_date || tour.start_date);
      return !endDateKey || endDateKey >= todayKey;
    });
  }, [tours, todayKey]);

  const categoryList = useMemo(() => {
    const dynamicCategories = Array.from(
      new Set(activeTours.map((tour) => tour.category).filter(Boolean))
    );
    return Array.from(new Set([...defaultCategories, ...dynamicCategories]));
  }, [activeTours]);

  useEffect(() => {
    const fromUrl = searchParams.get('category');
    if (fromUrl) {
      setSelectedCategory(findMatchingCategory(fromUrl, categoryList));
      setSelectedSubcategory("Mind");
    } else {
      setSelectedCategory("Mind");
      setSelectedSubcategory("Mind");
    }
  }, [searchParams, categoryList]);

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
    'Motoros': 'Motoros-túrák',
    'Jóga': 'Jóga-túrák'
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
                setSearchParams({});
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
                    setSearchParams({ category: cat });
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
            {displayedTours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
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
                setSearchParams({});
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
