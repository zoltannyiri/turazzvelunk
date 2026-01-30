import React, { useState, useEffect } from 'react';
import TourCard from '../../components/TourCard';
import { Search, Filter, SlidersHorizontal, Map } from 'lucide-react';

const ToursScreen = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/tours`)
      .then(res => res.json())
      .then(data => {
        setTours(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Keresés szűrése (név vagy helyszín alapján)
  const filteredTours = Array.isArray(tours) ? tours.filter(tour => 
    tour.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tour.location.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* --- HEADER --- */}
      <div className="bg-emerald-950 pt-16 pb-32 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Minden túra egy helyen</h1>
          <p className="text-emerald-200/60 max-w-xl mx-auto">Válogass a legizgalmasabb túráink közül, és találd meg a számodra tökéletes kihívást.</p>
        </div>
      </div>

      {/* --- FILTER BAR --- */}
      <div className="max-w-7xl mx-auto px-6 -mt-12">
        <div className="bg-white p-4 rounded-[2rem] shadow-xl border border-emerald-100 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Keress túrára vagy helyszínre..." 
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button className="flex items-center gap-2 bg-white border border-gray-200 px-6 py-4 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 transition flex-1 justify-center">
              <SlidersHorizontal size={18} /> Szűrők
            </button>
            <button className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-emerald-700 transition flex-1 justify-center">
              <Map size={18} /> Térkép
            </button>
          </div>
        </div>
      </div>

      {/* --- TOURS GRID --- */}
      <div className="max-w-7xl mx-auto px-6 mt-16">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-emerald-900 font-bold">Túrák betöltése...</p>
          </div>
        ) : filteredTours.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTours.map(tour => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-300">
            <p className="text-gray-500 text-lg">Nem találtunk ilyen túrát a keresésed alapján.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToursScreen;