import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle, Clock, Users, DollarSign, 
  ChevronDown, ChevronUp, Plus, Edit3, Trash2, Calendar, BarChart, MessageSquareText, XCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../App.css";

const AdminDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTour, setExpandedTour] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTourId, setEditingTourId] = useState(null);
  const [cancelRequests, setCancelRequests] = useState([]);
  
  const initialTourState = {
    title: '', 
    location: '', 
    description: '', 
    price: '', 
    duration: '', 
    difficulty: 'Könnyű',
    image_url: '', 
    start_date: '', 
    end_date: '',
    max_participants: ''
  };
  const [newTour, setNewTour] = useState(initialTourState);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings/all`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setBookings(data);
      setLoading(false);
    } catch (err) {
      toast.error("Hiba a lista frissítésekor!");
      setLoading(false);
    }
  }, []);

  const fetchCancelRequests = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings/cancel-requests`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setCancelRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Hiba a lejelentkezési kérelmek betöltésekor!");
    }
  }, []);

  useEffect(() => {
    fetchBookings();
    fetchCancelRequests();
  }, [fetchBookings, fetchCancelRequests]);

  const groupedBookings = bookings.reduce((acc, booking) => {
    if (!acc[booking.tour_id]) {
      acc[booking.tour_id] = {
        id: booking.tour_id,
        title: booking.title,
        location: booking.location,
        description: booking.description,
        price: booking.price,
        image_url: booking.image_url,
        duration: booking.duration,
        difficulty: booking.difficulty,
        max_participants: booking.max_participants,
        start_date: booking.start_date, 
        end_date: booking.end_date,
        participants: []
      };
    }
    acc[booking.tour_id].participants.push(booking);
    return acc;
  }, {});

  const updateStatus = async (id, newStatus) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings/${id}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` 
      },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
      toast.success("✔️ Státusz frissítve!");
    }
  };

  const updateCancelRequestStatus = async (id, status) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings/cancel-requests/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (res.ok) {
      toast.success(data.message || 'Kérelem frissítve!');
      setCancelRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      fetchBookings();
    } else {
      toast.error(data.message || 'Hiba történt.');
    }
  };

  const handleSubmitTour = async (e) => {
    e.preventDefault();
    const formatDate = (date) => {
      if (!(date instanceof Date)) return date;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const payload = {
      ...newTour,
      start_date: formatDate(newTour.start_date),
      end_date: formatDate(newTour.end_date),
      max_participants: parseInt(newTour.max_participants)
    };
    
    const url = editingTourId 
      ? `${import.meta.env.VITE_API_URL}/tours/${editingTourId}`
      : `${import.meta.env.VITE_API_URL}/tours`;
    const method = editingTourId ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method: method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` 
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      toast.success(editingTourId ? "💾 Túra frissítve!" : "🚀 Új túra létrehozva!");
      setIsModalOpen(false);
      setEditingTourId(null);
      setNewTour(initialTourState);
      fetchBookings();
    } else {
      toast.error("Hiba történt a mentés során!");
    }
  };

  const handleDeleteTour = async (id) => {
    if (!window.confirm("Biztosan törölni akarod ezt a túrát?")) return;
    const res = await fetch(`${import.meta.env.VITE_API_URL}/tours/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("🗑️ " + data.message);
      fetchBookings();
    } else {
      toast.error("❌ " + data.message);
    }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen p-4 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <h1 className="text-5xl font-black text-emerald-950 tracking-tighter italic">Admin Dashboard</h1>
          <button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-[2rem] font-black flex items-center gap-3 transition-all shadow-2xl shadow-emerald-600/20 active:scale-95"
            onClick={() => {
              setEditingTourId(null);
              setNewTour(initialTourState);
              setIsModalOpen(true);
            }}
          >
            <Plus size={20} /> ÚJ TÚRA LÉTREHOZÁSA
          </button>
        </header>

        <div className="grid gap-8">
          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 md:p-10 flex items-center justify-between bg-gradient-to-r from-white to-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <MessageSquareText size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-emerald-950">Lejelentkezési kérelmek</h2>
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Admin döntés szükséges</div>
                </div>
              </div>
              <div className="px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-widest">
                {cancelRequests.filter(r => r.status === 'pending').length} pending
              </div>
            </div>
            <div className="px-8 pb-8">
              {cancelRequests.length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-bold">Nincs kérelem.</div>
              ) : (
                <div className="grid gap-4">
                  {cancelRequests.map((req) => (
                    <div key={req.id} className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600">{req.tour_title}</div>
                          <div className="text-xs text-slate-400 font-bold">{req.location}</div>
                          <div className="text-xl font-black text-slate-900 mt-1">{req.user_name}</div>
                          <div className="text-xs text-slate-400 font-bold">{req.email}</div>
                        </div>
                        <div className="text-sm text-slate-600 max-w-xl">{req.reason}</div>
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/tours/${req.tour_id}`}
                            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition"
                          >
                            Túra megnyitása
                          </Link>
                          {req.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => updateCancelRequestStatus(req.id, 'approved')}
                                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-700"
                              >
                                Jóváhagyás
                              </button>
                              <button
                                onClick={() => updateCancelRequestStatus(req.id, 'rejected')}
                                className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white"
                              >
                                Elutasítás
                              </button>
                            </>
                          ) : req.status === 'approved' ? (
                            <div className="flex items-center gap-2 text-emerald-600 text-xs font-black uppercase tracking-widest">
                              <CheckCircle size={16} /> Jóváhagyva
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-red-500 text-xs font-black uppercase tracking-widest">
                              <XCircle size={16} /> Elutasítva
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {Object.values(groupedBookings).map((tour) => {
            const currentParticipants = tour.participants.length;
            const maxCapacity = tour.max_participants;
            const saturation = maxCapacity > 0 
                ? Math.round((currentParticipants / maxCapacity) * 100) 
                : 0;

            return (
              <div key={tour.id} className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden transition-all hover:shadow-xl">
                <div className="p-8 md:p-10 flex flex-col md:flex-row justify-between items-center gap-6 bg-gradient-to-r from-white to-slate-50">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-emerald-100 rounded-3xl flex items-center justify-center text-emerald-600">
                      <Calendar size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-emerald-950">{tour.title}</h2>
                      <div className="flex gap-4 mt-1 font-bold text-xs uppercase tracking-tighter">
                        <span className="flex items-center gap-1 text-slate-400"><Users size={14} /> {tour.participants.length} Fő</span>
                        <span className="flex items-center gap-1 text-emerald-600"><DollarSign size={14} /> {(tour.participants.length * tour.price).toLocaleString()} Ft</span>
                        <span className="text-amber-600">{tour.difficulty}</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-64">
                    <div className="flex justify-between text-[10px] font-black uppercase mb-2 text-slate-400 italic">
                      <span>Telítettség</span>
                      <span>{saturation}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-1000" 
                        style={{ width: `${Math.min(saturation, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTourId(tour.id);
                        setNewTour({
                          title: tour.title || '',
                          location: tour.location || '',
                          description: tour.description || '',
                          price: tour.price || '',
                          duration: tour.duration || '',
                          difficulty: tour.difficulty || 'Könnyű',
                          image_url: tour.image_url || '',
                          max_participants: tour.max_participants || 12,
                          start_date: tour.start_date ? new Date(tour.start_date) : null,
                          end_date: tour.end_date ? new Date(tour.end_date) : null,
                        });
                        setIsModalOpen(true);
                      }}
                      className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition shadow-sm"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteTour(tour.id); }}
                      className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-500 hover:text-white transition shadow-sm"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button 
                      onClick={() => setExpandedTour(expandedTour === tour.id ? null : tour.id)}
                      className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition"
                    >
                      {expandedTour === tour.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                </div>

                {expandedTour === tour.id && (
                  <div className="px-10 pb-10 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="overflow-hidden rounded-[2rem] border border-slate-50 bg-slate-50/50 p-2">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                            <th className="px-8 py-5">Túrázó</th>
                            <th className="px-8 py-5 text-right">Művelet</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white">
                          {tour.participants.map((p) => (
                            <tr key={p.id} className="group hover:bg-white transition-colors">
                              <td className="px-8 py-5">
                                <div className="font-black text-emerald-950 text-sm">{p.user_name}</div>
                                <div className="text-xs text-slate-400">{p.email}</div>
                              </td>
                              <td className="px-8 py-5 text-right">
                                {p.status === 'pending' ? (
                                  <button 
                                    onClick={() => updateStatus(p.id, 'confirmed')}
                                    className="bg-emerald-600 text-white text-[10px] font-black px-4 py-2 rounded-xl hover:bg-emerald-700 transition"
                                  >
                                    ELFOGADÁS
                                  </button>
                                ) : (
                                  <div className="text-emerald-500 flex justify-end"><CheckCircle size={20} /></div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-emerald-950/60 backdrop-blur-xl" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 overflow-y-auto max-h-[90vh] animate-in zoom-in duration-300">
            <h2 className="text-3xl font-black text-emerald-950 mb-8 italic">
              {editingTourId ? 'Túra szerkesztése' : 'Új túra meghirdetése'}
            </h2>
            <form onSubmit={handleSubmitTour} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Túra megnevezése</label>
                <input type="text" required value={newTour.title} className="w-full p-4 bg-slate-50 border-none rounded-2xl mt-1 focus:ring-2 focus:ring-emerald-500 transition" 
                  onChange={e => setNewTour({...newTour, title: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Helyszín</label>
                <input type="text" required value={newTour.location} className="w-full p-4 bg-slate-50 border-none rounded-2xl mt-1" 
                  onChange={e => setNewTour({...newTour, location: e.target.value})} />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Nehézség</label>
                <select value={newTour.difficulty} className="w-full p-4 bg-slate-50 border-none rounded-2xl mt-1 focus:ring-2 focus:ring-emerald-500 transition font-bold"
                  onChange={e => setNewTour({...newTour, difficulty: e.target.value})}>
                  <option value="Könnyű">Könnyű</option>
                  <option value="Közepes">Közepes</option>
                  <option value="Nehéz">Nehéz</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4 italic">Időtartam (Intervallum)</label>
                <div className="relative mt-1">
                  <DatePicker
                    selectsRange={true}
                    startDate={newTour.start_date instanceof Date ? newTour.start_date : null}
                    endDate={newTour.end_date instanceof Date ? newTour.end_date : null}
                    onChange={(update) => {
                      const [start, end] = update;
                      setNewTour({
                        ...newTour,
                        start_date: start,
                        end_date: end
                      });
                    }}
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 transition font-bold text-emerald-900"
                    dateFormat="yyyy. MM. dd."
                    placeholderText="Válaszd ki az intervallumot..."
                    isClearable={true}
                  />
                  <Calendar className="absolute right-4 top-4 text-emerald-500/50 pointer-events-none" size={20} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Ár (Ft)</label>
                <input type="number" required value={newTour.price} className="w-full p-4 bg-slate-50 border-none rounded-2xl mt-1" 
                  onChange={e => setNewTour({...newTour, price: e.target.value})} />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Maximális létszám</label>
                <input type="number" required value={newTour.max_participants} className="w-full p-4 bg-slate-50 border-none rounded-2xl mt-1" 
                  onChange={e => setNewTour({...newTour, max_participants: e.target.value})} />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Kép URL</label>
                <input type="text" required value={newTour.image_url} className="w-full p-4 bg-slate-50 border-none rounded-2xl mt-1"  
                  onChange={e => setNewTour({...newTour, image_url: e.target.value})} />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Leírás</label>
                <textarea rows="4" required value={newTour.description} className="w-full p-4 bg-slate-50 border-none rounded-2xl mt-1 font-medium" 
                  onChange={e => setNewTour({...newTour, description: e.target.value})}></textarea>
              </div>
              <button type="submit" className="md:col-span-2 relative group overflow-hidden w-full py-5 rounded-[2rem] font-black text-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xl hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3">
                <span className="relative z-10">{editingTourId ? '💾 MÓDOSÍTÁSOK MENTÉSE' : '🚀 TÚRA KÖZZÉTÉTELE'}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;