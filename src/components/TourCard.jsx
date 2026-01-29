import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, ArrowRight, Calendar } from 'lucide-react';

const TourCard = ({ tour }) => {
  const formatTourRange = (start, end) => {
    if (!start || !end) return "Hamarosan...";
    const s = new Date(start);
    const e = new Date(end);
    const options = { day: 'numeric' };
    const monthOptions = { month: 'long' };
    if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
      return `${s.getFullYear()}. ${s.toLocaleDateString('hu-HU', monthOptions)} ${s.getDate()} - ${e.getDate()}.`;
    }
    return `${s.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })} - ${e.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })}`;
  };

  return (
    <div className="group bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col h-full">
      <div className="relative h-64 overflow-hidden">
        <img 
          src={tour.image_url} 
          alt={tour.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-900 shadow-sm">
          {tour.difficulty}
        </div>
        <div className="absolute bottom-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-2xl font-black shadow-lg">
          {new Intl.NumberFormat('hu-HU').format(tour.price || 0)} Ft
        </div>
      </div>

      <div className="p-8 flex flex-col flex-1">
        <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-widest mb-3">
          <MapPin size={14} /> {tour.location}
        </div>
        
        <h3 className="text-2xl font-black text-emerald-950 mb-3 leading-tight group-hover:text-emerald-600 transition-colors">
          {tour.title}
        </h3>

        <div className="flex items-center gap-2 text-gray-400 text-sm font-bold mb-6">
          <Calendar size={16} className="text-emerald-500/50" />
          <span>{formatTourRange(tour.start_date, tour.end_date)}</span>
        </div>
        
        <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-500 font-semibold text-sm">
            <Clock size={16} /> {tour.duration} nap
          </div>
          <Link 
            to={`/tours/${tour.id}`} 
            className="w-12 h-12 bg-gray-50 group-hover:bg-emerald-600 group-hover:text-white rounded-2xl flex items-center justify-center transition-all"
          >
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TourCard;