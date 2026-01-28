import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';

const TourCard = ({ tour }) => {
  return (
    <div className="group bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 flex flex-col h-full">
      {/* Kép */}
      <div className="relative h-64 overflow-hidden">
        <img 
          src={tour.image_url} 
          alt={tour.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-900">
          {tour.difficulty}
        </div>
      </div>

      {/* Info */}
      <div className="p-8 flex flex-col flex-grow">
        <div className="flex items-center gap-1.5 text-emerald-600 mb-3">
          <MapPin size={14} strokeWidth={3} />
          <span className="text-[11px] font-bold uppercase tracking-widest">{tour.location}</span>
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-4 leading-tight group-hover:text-emerald-700 transition-colors">
          {tour.title}
        </h3>

        <div className="flex items-center gap-6 text-gray-400 text-xs font-medium mb-8">
          <div className="flex items-center gap-1.5">
            <Calendar size={16} />
            <span>{tour.duration} nap</span>
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-tighter">Ár / fő</p>
            <p className="text-xl font-black text-emerald-900">{new Intl.NumberFormat('hu-HU').format(tour.price)} Ft</p>
          </div>
          
          <Link to={`/tura/${tour.id}`} className="bg-gray-50 hover:bg-emerald-600 hover:text-white p-3 rounded-2xl transition-all group/btn">
            <ArrowRight size={24} className="group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TourCard;