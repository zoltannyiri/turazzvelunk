import React, { useState, useEffect } from 'react';
import TourCard from '../../components/TourCard';

const HomeScreen = () => {
  const [tours, setTours] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/tours`)
      .then(res => res.json())
      .then(data => setTours(data));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="mb-12">
        <h2 className="text-sm font-black text-emerald-600 uppercase tracking-[0.3em] mb-4">Fedezd fel a világot</h2>
        <h1 className="text-5xl font-black text-gray-900 tracking-tight">Aktuális kalandjaink</h1>
      </div>

      {/* A GRID ELRENDEZÉS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {tours.map(tour => (
          <TourCard key={tour.id} tour={tour} />
        ))}
      </div>
    </div>
  );
};

export default HomeScreen;