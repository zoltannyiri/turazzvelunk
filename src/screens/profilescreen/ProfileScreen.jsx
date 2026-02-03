import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { 
  MapPin, Calendar, CreditCard, ChevronRight, 
  Settings, LogOut, Mountain, Clock, CheckCircle2, AlertCircle, Camera
} from 'lucide-react';

	const ProfileScreen = () => {
    const { user, logout, updateUser } = useContext(AuthContext);
		const [bookings, setBookings] = useState([]);
		const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState(user?.email || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [avatarFile, setAvatarFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/bookings/my-bookings`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => {
      setBookings(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setEmail(user?.email || '');
  }, [user]);

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      if (email && email !== user?.email) formData.append('email', email);
      if (currentPassword) formData.append('currentPassword', currentPassword);
      if (newPassword) formData.append('newPassword', newPassword);
      if (avatarFile) formData.append('avatar', avatarFile);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        updateUser(data.user);
        setCurrentPassword('');
        setNewPassword('');
        setAvatarFile(null);
        alert('✅ Profil frissítve.');
      } else {
        alert(data.message || data.error || 'Hiba történt.');
      }
    } catch (err) {
      alert('Hiba történt a mentéskor.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <div className="relative bg-emerald-950 pt-24 pb-48 px-6 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-emerald-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-500 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
            <div className="relative group">
              <div className="w-40 h-40 bg-white p-2 rounded-[3rem] shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <div className="w-full h-full bg-emerald-600 rounded-[2.5rem] flex items-center justify-center text-white text-5xl font-black">
                  {user?.name.charAt(0)}
                </div>
              </div>
              <button
                onClick={() => setIsEditOpen(true)}
                className="absolute bottom-2 right-2 p-3 bg-white rounded-2xl shadow-lg text-emerald-900 hover:scale-110 transition"
                title="Beállítások"
              >
                <Settings size={20} />
              </button>
            </div>
            
            <div className="text-center md:text-left pb-4">
              {/* <span className="text-emerald-400 font-black uppercase tracking-[0.3em] text-xs">Túrázó Profil</span> */}
              <h1 className="text-5xl md:text-7xl font-black text-white mt-2 tracking-tighter">
                Szia, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">{user?.name.split(' ')[1]}!</span>
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-24 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-emerald-50">
              <h3 className="font-black text-emerald-950 text-xl mb-6">Adataim</h3>
              <div className="space-y-4">
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs font-bold uppercase">Email</span>
                  <span className="text-emerald-950 font-bold truncate">{user?.email}</span>
                </div>
                <div className="flex flex-col pt-4 border-t border-gray-50">
                  <span className="text-gray-400 text-xs font-bold uppercase">Tagság kezdete</span>
                  <span className="text-emerald-950 font-bold">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('hu-HU') : '-'}
                  </span>
                </div>
              </div>
              <button 
                onClick={logout}
                className="w-full mt-8 flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-50 text-red-500 font-black hover:bg-red-500 hover:text-white transition-all group"
              >
                <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" /> Kijelentkezés
              </button>
            </div>
            
            <div className="bg-emerald-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-600/20">
              <Mountain className="mb-4 opacity-50" size={32} />
              <div className="text-4xl font-black">{bookings.length}</div>
              <div className="font-bold opacity-80">Aktív jelentkezés</div>
            </div>

          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-[3rem] shadow-xl p-8 md:p-12 border border-emerald-50 min-h-[500px]">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-emerald-950 tracking-tight">Túráim</h2>
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
                      <div className="w-full md:w-48 h-40 overflow-hidden rounded-[1.8rem]">
                        <img src={booking.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                      </div>

                      <div className="flex-1 space-y-2 py-4">
                        <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                          <MapPin size={12} /> {booking.location}
                        </div>
                        <h3 className="text-2xl font-black text-emerald-950 tracking-tight group-hover:text-emerald-600 transition-colors">
                          {booking.title}
                        </h3>
                        <div className="flex gap-6 text-gray-400 font-bold text-xs uppercase pt-2">
                          <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(booking.booked_at).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><CreditCard size={14} /> {booking.price.toLocaleString()} Ft</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center md:items-end gap-3">
                        {booking.status === 'pending' ? (
                          <div className="flex items-center gap-2 px-5 py-2 bg-orange-50 text-orange-600 rounded-full border border-orange-100 font-black text-xs uppercase tracking-tighter">
                            <AlertCircle size={14} /> Függőben
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 px-5 py-2 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 font-black text-xs uppercase tracking-tighter">
                            <CheckCircle2 size={14} /> Elfogadva
                          </div>
                        )}
                        <Link
                          to={`/tours/${booking.tour_id}`}
                          className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all"
                          title="Túra megnyitása"
                        >
                          <ChevronRight size={20} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                  <Mountain size={48} className="mx-auto text-slate-300 mb-4" />
                  <h4 className="text-xl font-black text-slate-400 uppercase tracking-widest">Még nincsenek túráid</h4>
                  {/* <p className="text-slate-400 mt-2">Itt az ideje jelentkezni egy túrára!</p> */}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isEditOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-emerald-950/60 backdrop-blur-xl" onClick={() => setIsEditOpen(false)}></div>
          <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-emerald-950">Profil beállítások</h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 transition"
                title="Bezárás"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-xs font-bold uppercase">Email</label>
                <input
                  type="email"
                  className="w-full mt-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-bold uppercase">Jelenlegi jelszó</label>
                <input
                  type="password"
                  className="w-full mt-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-bold uppercase">Új jelszó</label>
                <input
                  type="password"
                  className="w-full mt-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                <label className="text-gray-400 text-xs font-bold uppercase flex items-center gap-2">
                  <Camera size={14} /> Avatar feltöltése
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="mt-2 w-full text-sm text-slate-600"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                />
              </div>
              <button
                onClick={handleProfileSave}
                disabled={saving}
                className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition disabled:opacity-60"
              >
                {saving ? 'Mentés...' : 'Mentés'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileScreen;