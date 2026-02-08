import React, { useEffect, useState, useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Calendar, CreditCard, ChevronRight, User, ShieldCheck, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';

const AdminUserProfileScreen = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user || user.role !== 'admin') {
        setLoading(false);
        return;
      }

      try {
        const [profileRes, bookingsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/auth/users/${id}`,
            {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            }
          ),
          fetch(`${import.meta.env.VITE_API_URL}/bookings/admin/users/${id}`,
            {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            }
          )
        ]);

        const profileData = await profileRes.json();
        const bookingsData = await bookingsRes.json();

        if (!profileRes.ok) {
          toast.error(profileData.message || 'Hiba a profil betöltésekor.');
        } else {
          setProfile(profileData);
        }
        setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      } catch (err) {
        toast.error('Hiba a profil betöltésekor.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, user]);

  const handleRemoveBooking = async (bookingId) => {
    if (!window.confirm('Biztosan eltávolítod a túráról?')) return;
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
    } else {
      toast.error(data.message || 'Hiba történt.');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center text-slate-400 font-bold">Nincs jogosultságod.</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <div className="relative bg-emerald-950 pt-24 pb-32 px-6 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-emerald-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-500 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
            <div className="relative">
              <div className="w-36 h-36 bg-white p-2 rounded-[3rem] shadow-2xl">
                <div className="w-full h-full bg-emerald-600 rounded-[2.5rem] overflow-hidden flex items-center justify-center text-white text-4xl font-black">
                  {profile?.avatar_url ? (
                    <img
                      src={`${import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '')}${profile.avatar_url}`}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    profile?.name?.charAt(0) || <User size={32} />
                  )}
                </div>
              </div>
            </div>

            <div className="text-center md:text-left pb-4">
              <div className="flex items-center gap-3 text-emerald-200 text-xs font-black uppercase tracking-[0.3em]">
                <ShieldCheck size={16} /> Admin betekintés
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white mt-3 tracking-tighter">
                {profile?.name || 'Profil'}
              </h1>
              <div className="text-emerald-100 font-bold mt-2">{profile?.email}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-20 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-emerald-50">
              <h3 className="font-black text-emerald-950 text-xl mb-6">Adatai</h3>
              <div className="space-y-4">
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs font-bold uppercase">Email</span>
                  <span className="text-emerald-950 font-bold truncate">{profile?.email || '-'}</span>
                </div>
                <div className="flex flex-col pt-4 border-t border-gray-50">
                  <span className="text-gray-400 text-xs font-bold uppercase">Tagság kezdete</span>
                  <span className="text-emerald-950 font-bold">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('hu-HU') : '-'}
                  </span>
                </div>
              </div>
              <Link
                to="/admin"
                className="w-full mt-8 flex items-center justify-center gap-2 p-4 rounded-2xl bg-slate-50 text-slate-700 font-black hover:bg-emerald-600 hover:text-white transition-all"
              >
                <ArrowLeft size={18} /> Vissza az adminhoz
              </Link>
            </div>

            <div className="bg-emerald-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-600/20">
              <div className="text-4xl font-black">{bookings.length}</div>
              <div className="font-bold opacity-80">Jelentkezés</div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-[3rem] shadow-xl p-8 md:p-12 border border-emerald-50 min-h-[500px]">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-emerald-950 tracking-tight">Jelentkezések</h2>
                <div className="flex gap-2">
                  <span className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-black uppercase tracking-widest">Összes: {bookings.length}</span>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full mb-4"></div>
                  <p className="text-gray-400 font-bold">Betöltés..</p>
                </div>
              ) : bookings.length > 0 ? (
                <div className="grid gap-6">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="group relative bg-white border border-gray-100 p-2 pr-6 rounded-[2rem] hover:shadow-2xl hover:border-emerald-200 transition-all duration-500 flex flex-col md:flex-row items-center gap-6">
                      <div className="flex-1 space-y-2 py-4">
                        <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                          {booking.location}
                        </div>
                        <h3 className="text-2xl font-black text-emerald-950 tracking-tight group-hover:text-emerald-600 transition-colors">
                          {booking.title}
                        </h3>
                        <div className="flex gap-6 text-gray-400 font-bold text-xs uppercase pt-2">
                          <span className="flex items-center gap-1"><Calendar size={14} /> {booking.booked_at ? new Date(booking.booked_at).toLocaleDateString() : '-'}</span>
                          <span className="flex items-center gap-1"><CreditCard size={14} /> {booking.status}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center md:items-end gap-3">
                        <Link
                          to={`/tours/${booking.tour_id}`}
                          className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all"
                          title="Túra megnyitása"
                        >
                          <ChevronRight size={20} />
                        </Link>
                        <button
                          onClick={() => handleRemoveBooking(booking.id)}
                          className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white"
                        >
                          Törlés a túráról
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                  <div className="text-xl font-black text-slate-400 uppercase tracking-widest">Nincs jelentkezés</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserProfileScreen;
