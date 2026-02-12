import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { 
  CheckCircle, Users, DollarSign, 
  ChevronDown, ChevronUp, Plus, Edit3, Trash2, Calendar, MessageSquareText, XCircle, LayoutGrid, ListChecks, UserCog
} from 'lucide-react';
import { toast } from 'react-toastify';
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { hu } from "date-fns/locale";

registerLocale('hu', hu);
import "../../App.css";

ChartJS.register(ArcElement, Tooltip, Legend);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [expandedTour, setExpandedTour] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTourId, setEditingTourId] = useState(null);
  const [cancelRequests, setCancelRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [tours, setTours] = useState([]);
  const [toursLoading, setToursLoading] = useState(true);
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
  
  const initialTourState = {
    title: '', 
    location: '', 
    description: '', 
    price: '', 
    duration: '', 
    difficulty: 'Könnyű',
    difficulty_level: 5,
    category: 'Hegyi túrák',
    subcategory: 'Hazai - Külföldi túrák',
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
    } catch (err) {
      toast.error("Hiba a lista frissítésekor!");
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

  const fetchTours = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/tours`);
      const data = await res.json();
      setTours(Array.isArray(data) ? data : []);
      setToursLoading(false);
    } catch (err) {
      toast.error("Hiba a túrák betöltésekor!");
      setToursLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/users`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
      setUsersLoading(false);
    } catch (err) {
      toast.error("Hiba a felhasználók betöltésekor!");
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
    fetchCancelRequests();
    fetchUsers();
    fetchTours();
  }, [fetchBookings, fetchCancelRequests, fetchUsers, fetchTours]);


  const groupedBookings = useMemo(() => {
    return bookings.reduce((acc, booking) => {
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
          difficulty_level: booking.difficulty_level,
          category: booking.category,
          subcategory: booking.subcategory,
          max_participants: booking.max_participants,
          start_date: booking.start_date, 
          end_date: booking.end_date,
          participants: []
        };
      }
      acc[booking.tour_id].participants.push(booking);
      return acc;
    }, {});
  }, [bookings]);

  const groupedUsers = useMemo(() => {
    return bookings.reduce((acc, booking) => {
      if (!acc[booking.user_id]) {
        acc[booking.user_id] = {
          id: booking.user_id,
          name: booking.user_name,
          email: booking.email,
          bookings: []
        };
      }
      acc[booking.user_id].bookings.push(booking);
      return acc;
    }, {});
  }, [bookings]);

  const usersWithBookings = useMemo(() => {
    return users.map((user) => ({
      ...user,
      bookings: groupedUsers[user.id]?.bookings || []
    }));
  }, [users, groupedUsers]);

  const toursByCategory = useMemo(() => {
    return tours.reduce((acc, tour) => {
      const key = tour.category || 'Egyéb';
      if (!acc[key]) acc[key] = [];
      acc[key].push(tour);
      return acc;
    }, {});
  }, [tours]);

  const categoryRevenue = useMemo(() => {
    const tourCategoryMap = tours.reduce((acc, tour) => {
      acc[tour.id] = tour.category || 'Egyéb';
      return acc;
    }, {});

    return bookings.reduce((acc, booking) => {
      const category = tourCategoryMap[booking.tour_id] || 'Egyéb';
      acc[category] = (acc[category] || 0) + (booking.price || 0);
      return acc;
    }, {});
  }, [bookings, tours]);

  const pieColors = [
    '#10B981', '#34D399', '#059669', '#0EA5E9', '#6366F1', '#F59E0B', '#F97316', '#EC4899', '#8B5CF6', '#14B8A6'
  ];

  const revenuePieData = useMemo(() => {
    const labels = Object.keys(categoryRevenue);
    return {
      labels,
      datasets: [
        {
          data: labels.map((label) => categoryRevenue[label]),
          backgroundColor: labels.map((_, index) => pieColors[index % pieColors.length]),
          borderWidth: 0
        }
      ]
    };
  }, [categoryRevenue]);

  const categoryPieData = useMemo(() => {
    const labels = Object.keys(toursByCategory);
    return {
      labels,
      datasets: [
        {
          data: labels.map((label) => toursByCategory[label]?.length || 0),
          backgroundColor: labels.map((_, index) => pieColors[index % pieColors.length]),
          borderWidth: 0
        }
      ]
    };
  }, [toursByCategory]);

  const getBookingStatusLabel = (booking) => {
    if (booking?.payment_status === 'paid') return 'Fizetve';
    return booking?.status || '';
  };

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

  const handleAdminRemoveBooking = async (bookingId) => {
    if (!window.confirm("Biztosan eltávolítod a túráról?")) return;
    const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings/admin/${bookingId}`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }
    );
    const data = await res.json();
    if (res.ok) {
      toast.success(data.message || 'Törölve.');
      setBookings(prev => prev.filter(b => b.id !== bookingId));
      setCancelRequests(prev => prev.filter(r => r.booking_id !== bookingId));
    } else {
      toast.error(data.message || 'Hiba történt.');
    }
  };

  const handleRoleUpdate = async (id, role) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/users/${id}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ role })
    });
    const data = await res.json();
    if (res.ok) {
      toast.success(data.message || 'Szerepkör frissítve.');
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    } else {
      toast.error(data.message || 'Hiba történt.');
    }
  };

  const openUserProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handleSubmitTour = async (e) => {
    e.preventDefault();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const formatDate = (date) => {
      if (!(date instanceof Date)) return date;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const calculateDuration = (start, end) => {
      if (!(start instanceof Date) || !(end instanceof Date)) return newTour.duration;
      const diffMs = end.getTime() - start.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      return diffDays >= 0 ? diffDays + 1 : newTour.duration;
    };
    
    const payload = {
      ...newTour,
      difficulty_level: Number(newTour.difficulty_level || 0) || null,
      start_date: formatDate(newTour.start_date),
      end_date: formatDate(newTour.end_date),
      duration: calculateDuration(newTour.start_date, newTour.end_date),
      max_participants: parseInt(newTour.max_participants)
    };

    if (newTour.start_date instanceof Date) {
      const startDate = new Date(newTour.start_date);
      startDate.setHours(0, 0, 0, 0);
      if (startDate < today) {
        toast.error('A túra kezdete nem lehet korábbi a mai dátumnál.');
        return;
      }
    }
    
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
      setTours(prev => prev.filter(tour => tour.id !== id));
      setBookings(prev => prev.filter(booking => booking.tour_id !== id));
      setCancelRequests(prev => prev.filter(req => req.tour_id !== id));
      if (expandedTour === id) {
        setExpandedTour(null);
      }
    } else {
      toast.error("❌ " + data.message);
    }
  };

  const totalTours = tours.length;
  const totalBookings = bookings.length;
  const totalUsers = users.length;
  const totalRevenue = useMemo(() => {
    return bookings.reduce((sum, booking) => sum + (booking.price || 0), 0);
  }, [bookings]);

  const pendingCancelCount = useMemo(() => {
    return cancelRequests.filter(
      (r) => String(r?.status || 'pending').toLowerCase() === 'pending'
    ).length;
  }, [cancelRequests]);

  const pendingBookingCount = useMemo(() => {
    return bookings.filter(
      (b) => String(b?.status || '').toLowerCase() === 'pending'
    ).length;
  }, [bookings]);

  const tabs = [
    { id: 'overview', label: 'Áttekintés', icon: LayoutGrid },
    { id: 'tours', label: 'Túrák', icon: Calendar },
    { id: 'bookings', label: 'Jelentkezések', icon: ListChecks },
    { id: 'cancellations', label: 'Lejelentkezések', icon: MessageSquareText },
    { id: 'users', label: 'Felhasználók', icon: UserCog }
  ];

  return (
    <div className="bg-[#f4f7fb] min-h-screen font-sans">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
          <aside className="bg-white/80 border border-white rounded-[2.5rem] p-6 shadow-xl sticky top-6 self-start backdrop-blur-xl">
            <div className="mb-8">
              <div className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600">Admin</div>
              <div className="text-2xl font-black text-emerald-950">Vezérlőpult</div>
            </div>
            <nav className="grid gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-black text-sm transition-all ${isActive ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-white text-slate-600 hover:bg-emerald-50'}`}
                  >
                    <Icon size={18} /> {tab.label}
                  </button>
                );
              })}
            </nav>
            <div className="mt-8 p-4 rounded-2xl bg-emerald-50 text-emerald-900 text-xs font-bold">
              Napi státusz: {pendingBookingCount} nyitott kérelem
            </div>
          </aside>

          <main className="space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-emerald-950 tracking-tighter italic">Admin Dashboard</h1>
                <div className="text-xs text-slate-400 font-black uppercase tracking-[0.3em] mt-2">Turazz Velunk</div>
              </div>
              {activeTab === 'tours' && (
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
              )}
            </header>

            {activeTab === 'overview' && (
              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 shadow-sm">
                    <div className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Túrák</div>
                    <div className="text-3xl font-black text-emerald-950 mt-2">{totalTours}</div>
                  </div>
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 shadow-sm">
                    <div className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Jelentkezések</div>
                    <div className="text-3xl font-black text-emerald-950 mt-2">{totalBookings}</div>
                  </div>
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 shadow-sm">
                    <div className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Felhasználók</div>
                    <div className="text-3xl font-black text-emerald-950 mt-2">{totalUsers}</div>
                  </div>
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 shadow-sm">
                    <div className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Bevétel</div>
                    <div className="text-3xl font-black text-emerald-950 mt-2">{totalRevenue.toLocaleString()} Ft</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-[3rem] border border-slate-100 p-6 md:p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Összes bevétel</div>
                        <div className="text-xl font-black text-emerald-950">Kategóriák szerint</div>
                      </div>
                      <div className="text-xs font-black text-emerald-600">{totalRevenue.toLocaleString()} Ft</div>
                    </div>
                    {Object.keys(categoryRevenue).length === 0 ? (
                      <div className="text-center text-slate-400 font-bold py-10">Nincs adat.</div>
                    ) : (
                      <div className="h-64 relative">
                        <Pie
                          data={revenuePieData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { position: 'bottom' } }
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-[3rem] border border-slate-100 p-6 md:p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Túrák</div>
                        <div className="text-xl font-black text-emerald-950">Kategóriák szerint</div>
                      </div>
                      <div className="text-xs font-black text-emerald-600">{totalTours} db</div>
                    </div>
                    {Object.keys(toursByCategory).length === 0 ? (
                      <div className="text-center text-slate-400 font-bold py-10">Nincs adat.</div>
                    ) : (
                      <div className="h-64 relative">
                        <Pie
                          data={categoryPieData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { position: 'bottom' } }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tours' && (
              <div className="grid gap-8">
                {toursLoading ? (
                  <div className="bg-white rounded-[2rem] border border-slate-100 p-10 text-center text-slate-400 font-bold">Betöltés...</div>
                ) : Object.keys(toursByCategory).length === 0 ? (
                  <div className="bg-white rounded-[2rem] border border-slate-100 p-10 text-center text-slate-400 font-bold">Nincs túra.</div>
                ) : (
                  Object.entries(toursByCategory).map(([category, items]) => (
                    <div key={category} className="space-y-4">
                      <div className="text-xs font-black uppercase tracking-[0.3em] text-emerald-600">{category}</div>
                      <div className="grid gap-6">
                        {items.map((tour) => {
                          const participants = groupedBookings[tour.id]?.participants || [];
                          const pendingCount = participants.filter(p => p.status === 'pending').length;
                          const confirmedCount = participants.filter(p => p.status === 'confirmed').length;
                          const saturation = tour.max_participants > 0
                            ? Math.round((participants.length / tour.max_participants) * 100)
                            : 0;

                          return (
                            <div
                              key={tour.id}
                              className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden transition-all hover:shadow-xl cursor-pointer"
                              onClick={() => navigate(`/tours/${tour.id}`)}
                            >
                              <div className="p-8 md:p-10 flex flex-col md:flex-row justify-between items-center gap-6 bg-gradient-to-r from-white to-slate-50">
                                <div className="flex items-center gap-6">
                                  <div className="w-16 h-16 bg-emerald-100 rounded-3xl flex items-center justify-center text-emerald-600">
                                    <Calendar size={28} />
                                  </div>
                                  <div>
                                    <h2 className="text-2xl font-black text-emerald-950">{tour.title}</h2>
                                    <div className="flex flex-wrap gap-3 mt-2 text-[10px] font-black uppercase tracking-tighter text-slate-400">
                                      <span className="flex items-center gap-1"><Users size={14} /> {participants.length} Fő</span>
                                      <span>Max: {tour.max_participants || 0} fő</span>
                                      <span>Pending: {pendingCount} fő</span>
                                      <span className="flex items-center gap-1"><DollarSign size={14} /> {tour.price?.toLocaleString()} Ft</span>
                                      <span>Nehézség: {tour.difficulty_level ?? tour.difficulty}</span>
                                      {tour.subcategory && <span>{tour.subcategory}</span>}
                                      {tour.start_date && tour.end_date && (
                                        <span>{new Date(tour.start_date).toLocaleDateString()} - {new Date(tour.end_date).toLocaleDateString()}</span>
                                      )}
                                      <span>{tour.location}</span>
                                      <span>{tour.duration} nap</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="w-full md:w-64">
                                  <div className="flex justify-between text-[10px] font-black uppercase mb-2 text-slate-400 italic">
                                    <span>{participants.length} / {tour.max_participants || 0} fő</span>
                                    <span>{saturation}%</span>
                                  </div>
                                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-emerald-500 transition-all duration-1000" 
                                      style={{ width: `${Math.min(saturation, 100)}%` }}
                                    ></div>
                                  </div>
                                  <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400 space-y-1">
                                    <div>Elfogadott: {confirmedCount} fő</div>
                                    <div>Folyamatban: {pendingCount} fő</div>
                                  </div>
                                </div>

                                <div className="flex gap-3">
                                  <Link
                                    to={`/tours/${tour.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="px-4 py-3 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition"
                                  >
                                    Túra megnyitása
                                  </Link>
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
                                        difficulty_level: tour.difficulty_level || 5,
                                        category: tour.category || 'Hegyi túrák',
                                        subcategory: tour.subcategory || 'Hazai - Külföldi túrák',
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedTour(expandedTour === tour.id ? null : tour.id);
                                    }}
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
                                          <th className="px-8 py-5">Státusz</th>
                                          <th className="px-8 py-5 text-right">Művelet</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-white">
                                        {participants.length === 0 ? (
                                          <tr>
                                            <td className="px-8 py-6 text-sm text-slate-400 font-bold" colSpan={3}>Nincs jelentkező.</td>
                                          </tr>
                                        ) : participants.map((p) => (
                                          <tr key={p.id} className="group hover:bg-white transition-colors">
                                            <td className="px-8 py-5">
                                              <button
                                                onClick={(e) => { e.stopPropagation(); openUserProfile(p.user_id); }}
                                                className="font-black text-emerald-950 text-sm hover:text-emerald-600 transition"
                                              >
                                                {p.user_name}
                                              </button>
                                              <div className="text-xs text-slate-400">{p.email}</div>
                                            </td>
                                            <td className="px-8 py-5">
                                              <span className="text-xs font-black uppercase text-slate-400">{getBookingStatusLabel(p)}</span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                              <div className="flex items-center justify-end gap-2">
                                                {p.status === 'pending' ? (
                                                  <button 
                                                    onClick={(e) => { e.stopPropagation(); updateStatus(p.id, 'confirmed'); }}
                                                    className="bg-emerald-600 text-white text-[10px] font-black px-4 py-2 rounded-xl hover:bg-emerald-700 transition"
                                                  >
                                                    ELFOGADÁS
                                                  </button>
                                                ) : (
                                                  <div className="text-emerald-500 flex justify-end"><CheckCircle size={20} /></div>
                                                )}
                                                <button
                                                  onClick={(e) => { e.stopPropagation(); handleAdminRemoveBooking(p.id); }}
                                                  className="bg-red-500/10 text-red-500 text-[10px] font-black px-4 py-2 rounded-xl hover:bg-red-500 hover:text-white transition"
                                                >
                                                  TÖRLÉS
                                                </button>
                                              </div>
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
                  ))
                )}
              </div>
            )}

            {activeTab === 'bookings' && (
              <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-8 md:p-10 flex items-center justify-between bg-gradient-to-r from-white to-slate-50">
                  <div>
                    <h2 className="text-2xl font-black text-emerald-950">Összes jelentkezés</h2>
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Admin kezelő</div>
                  </div>
                  <div className="text-xs font-black uppercase tracking-widest text-emerald-600">{bookings.length} db</div>
                </div>
                <div className="px-8 pb-8 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        <th className="py-4">Túra</th>
                        <th className="py-4">Felhasználó</th>
                        <th className="py-4">Státusz</th>
                        <th className="py-4 text-right">Művelet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bookings.map((b) => (
                        <tr key={b.id} className="text-sm">
                          <td className="py-4">
                            <div className="font-black text-emerald-950">{b.title}</div>
                            <div className="text-xs text-slate-400">{b.location}</div>
                          </td>
                          <td className="py-4">
                            <div className="font-bold text-slate-800">{b.user_name}</div>
                            <div className="text-xs text-slate-400">{b.email}</div>
                          </td>
                          <td className="py-4">
                            <span className="text-[10px] font-black uppercase text-slate-500">{getBookingStatusLabel(b)}</span>
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {b.status === 'pending' && (
                                <button
                                  onClick={() => updateStatus(b.id, 'confirmed')}
                                  className="bg-emerald-600 text-white text-[10px] font-black px-4 py-2 rounded-xl hover:bg-emerald-700 transition"
                                >
                                  ELFOGADÁS
                                </button>
                              )}
                              <button
                                onClick={() => handleAdminRemoveBooking(b.id)}
                                className="bg-red-500/10 text-red-500 text-[10px] font-black px-4 py-2 rounded-xl hover:bg-red-500 hover:text-white transition"
                              >
                                TÖRLÉS
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'cancellations' && (
              <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-8 md:p-10 flex items-center justify-between bg-gradient-to-r from-white to-slate-50">
                  <div>
                    <h2 className="text-2xl font-black text-emerald-950">Lejelentkezési kérelmek</h2>
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Teljes lista</div>
                  </div>
                  <div className="px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-widest">
                    {pendingCancelCount} pending
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
            )}

            {activeTab === 'users' && (
              <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-8 md:p-10 flex items-center justify-between bg-gradient-to-r from-white to-slate-50">
                  <div>
                    <h2 className="text-2xl font-black text-emerald-950">Felhasználók</h2>
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Jogosultságok és túrák</div>
                  </div>
                  <div className="text-xs font-black uppercase tracking-widest text-emerald-600">{users.length} db</div>
                </div>
                <div className="px-8 pb-8">
                  {usersLoading ? (
                    <div className="text-center py-10 text-slate-400 font-bold">Betöltés...</div>
                  ) : usersWithBookings.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 font-bold">Nincs felhasználó.</div>
                  ) : (
                    <div className="grid gap-4">
                      {usersWithBookings.map((user) => {
                        const isExpanded = expandedUserId === user.id;
                        return (
                          <div key={user.id} className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <div className="text-xl font-black text-slate-900">{user.name}</div>
                                <div className="text-xs text-slate-400 font-bold">{user.email}</div>
                              </div>
                              <button
                                onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-700 text-xs font-black uppercase tracking-widest hover:bg-emerald-50 transition"
                              >
                                Részletek {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            </div>
                            {isExpanded && (
                              <div className="mt-4 border-t border-slate-100 pt-4 space-y-4">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                  <div className="flex flex-wrap items-center gap-3">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Szerepkör</div>
                                    <div className="text-xs font-black uppercase tracking-widest text-emerald-600">{user.role}</div>
                                    <button
                                      onClick={() => openUserProfile(user.id)}
                                      className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-widest hover:bg-emerald-100 transition"
                                    >
                                      Profil megnyitása
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => handleRoleUpdate(user.id, user.role === 'admin' ? 'user' : 'admin')}
                                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition self-start md:self-auto"
                                  >
                                    {user.role === 'admin' ? 'Admin elvétel' : 'Admin jog'}
                                  </button>
                                </div>
                                {user.bookings.length > 0 ? (
                                  <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Jelentkezések</div>
                                    <div className="grid gap-2">
                                      {user.bookings.map((booking) => (
                                        <div key={booking.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white rounded-2xl p-4">
                                          <div>
                                            <Link
                                              to={`/tours/${booking.tour_id}`}
                                              className="font-black text-emerald-950 text-sm hover:text-emerald-600 transition"
                                            >
                                              {booking.title}
                                            </Link>
                                            <div className="text-xs text-slate-400">{booking.location}</div>
                                          </div>
                                          <div className="text-[10px] font-black uppercase text-slate-400">{getBookingStatusLabel(booking)}</div>
                                          <button
                                            onClick={() => handleAdminRemoveBooking(booking.id)}
                                            className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white"
                                          >
                                            Törlés a túráról
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-xs text-slate-400 font-bold">Nincs aktív jelentkezés.</div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
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
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Kategória</label>
                <select value={newTour.category} className="w-full p-4 bg-slate-50 border-none rounded-2xl mt-1 focus:ring-2 focus:ring-emerald-500 transition font-bold"
                  onChange={e => setNewTour({...newTour, category: e.target.value})}>
                  <option>Hegyi túrák</option>
                  <option>Vízitúrák</option>
                  <option>Jóga</option>
                  <option>Jóga táborok</option>
                  <option>Motoros</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Alkategória</label>
                <input type="text" value={newTour.subcategory} className="w-full p-4 bg-slate-50 border-none rounded-2xl mt-1"
                  onChange={e => setNewTour({...newTour, subcategory: e.target.value})} />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Nehézség (1-10)</label>
                <input type="number" min="1" max="10" value={newTour.difficulty_level} className="w-full p-4 bg-slate-50 border-none rounded-2xl mt-1"
                  onChange={e => setNewTour({...newTour, difficulty_level: e.target.value})} />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Nehézség (szöveg)</label>
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
                    minDate={new Date()}
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
                    locale="hu"
                    calendarStartDay={1}
                    placeholderText="Válaszd ki az intervallumot..."
                    isClearable={true}
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