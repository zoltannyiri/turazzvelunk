import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, ArrowRight, Calendar, Zap } from 'lucide-react';
import { formatPrice } from '../utils/formatPrice';

const TourCard = ({ tour }) => {
  const navigate = useNavigate();
  const bookedCount = Number(tour.booked_count || 0);
  const maxParticipants = Number(tour.max_participants || 0);
  const saturation = maxParticipants > 0
    ? Math.round((bookedCount / maxParticipants) * 100)
    : 0;
  const remainingSpots = Math.max(0, maxParticipants - bookedCount);

  const formatTourRange = (start, end) => {
    if (!start || !end) return "Időpont hamarosan";
    const s = new Date(start);
    const e = new Date(end);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "Időpont hamarosan";
    const monthOptions = { month: 'short' };
    if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
      return `${s.getFullYear()}. ${s.toLocaleDateString('hu-HU', monthOptions)} ${s.getDate()} – ${e.getDate()}.`;
    }
    return `${s.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })}`;
  };

  return (
    <div 
      onClick={() => navigate(`/tours/${tour.id}`)}
      className="group bg-white rounded-3xl border border-[#dce5d8] hover:border-[#b4c7b0] shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full"
    >
      {/* KÉP ÉS CÍMKÉK */}
      <div className="relative h-60 overflow-hidden bg-[#ecefe6]">
        <img 
          src={tour.image_url} 
          alt={tour.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
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
              {formatTourRange(tour.start_date, tour.end_date)}
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

        {/* LÁBLÉC: ÁR ÉS GOMB */}
        <div className="pt-4 border-t border-[#ecefe6] flex justify-between items-center mt-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#718174] mb-0.5">
              Részvételi díj
            </div>
            <div className="font-serif text-2xl font-bold text-[#173327]">
              {formatPrice(tour.price)} <span className="text-xs font-normal text-[#718174]">Ft</span>
            </div>
            {tour.deposit_amount > 0 && (
              <div className="text-[11px] font-medium text-[#8a7238] mt-0.5">
                Előleg: {formatPrice(tour.deposit_amount)} Ft
              </div>
            )}
          </div>
          
          <div className="w-10 h-10 rounded-full bg-[#f7f9f5] border border-[#cad6c9] text-[#275940] flex items-center justify-center group-hover:bg-[#275940] group-hover:text-white group-hover:border-[#275940] transition-all duration-200 shadow-xs">
            <ArrowRight size={18} strokeWidth={2} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourCard;
