import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const TourDetailsScreen = () => {
  const { id } = useParams();
  const [tour, setTour] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/tours/${id}`)
      .then(res => res.json())
      .then(data => setTour(data));
  }, [id]);

  if (!tour) return <div className="p-10 text-center text-xl">Betöltés...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <img src={tour.image_url} className="w-full h-96 object-cover rounded-3xl shadow-lg" alt={tour.title} />
      <h1 className="text-4xl font-bold mt-8 text-gray-900">{tour.title}</h1>
      <p className="text-brand-orange font-bold text-xl mt-2">{tour.location}</p>
      <div className="mt-6 text-gray-700 leading-relaxed text-lg">
        {tour.description}
      </div>
      <div className="mt-10 p-6 bg-brand-green text-white rounded-2xl flex justify-between items-center">
        <div>
          <span className="block text-sm opacity-80">Részvételi díj</span>
          <span className="text-3xl font-bold">{tour.price.toLocaleString()} Ft</span>
        </div>
        <button className="bg-brand-orange hover:bg-white hover:text-brand-orange transition-colors px-8 py-3 rounded-xl font-bold text-lg">
          Lefoglalom a helyem
        </button>
      </div>
    </div>
  );
};

export default TourDetailsScreen;