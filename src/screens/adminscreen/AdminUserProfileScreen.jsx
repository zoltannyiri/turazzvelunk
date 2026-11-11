import React, { useEffect, useState, useContext } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Calendar, CreditCard, ChevronRight, User, ShieldCheck, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { formatPrice } from '../../utils/formatPrice';

const AdminUserProfileScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [createdTours, setCreatedTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (user && String(user.id) === String(id)) {
      navigate('/profile', { replace: true });
      return;
    }
    const fetchProfile = async () => {
      try {
        if (isAdmin) {
          const [profileRes, bookingsRes, toursRes] = await Promise.all([
            fetch(`${import.meta.env.VITE_API_URL}/auth/users/${id}`,
              {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
              }
            ),
            fetch(`${import.meta.env.VITE_API_URL}/bookings/admin/users/${id}`,
              {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
              }
            ),
            fetch(`${import.meta.env.VITE_API_URL}/tours/admin/users/${id}/created`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
          ]);

          const profileData = await profileRes.json();
          const bookingsData = await bookingsRes.json();
          const toursData = await toursRes.json();

          if (!profileRes.ok) {
            toast.error(profileData.message || 'Hiba a profil betöltésekor.');
          } else {
            setProfile(profileData);
          }
          setBookings(Array.isArray(bookingsData) ? bookingsData : []);
          setCreatedTours(Array.isArray(toursData) ? toursData : []);
        } else {
          const profileRes = await fetch(`${import.meta.env.VITE_API_URL}/auth/users/${id}/public`,
            {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            }
          );
          const profileData = await profileRes.json();
          if (!profileRes.ok) {
            toast.error(profileData.message || 'Hiba a profil betöltésekor.');
          } else {
            setProfile(profileData);
          }
          setBookings([]);
        }
      } catch (err) {
        toast.error('Hiba a profil betöltésekor.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, user]);

  const createdIds = new Set(createdTours.map(tour => Number(tour.tour_id)));
  const profileTours = [
    ...bookings.map(booking => ({ ...booking, isCreated: createdIds.has(Number(booking.tour_id)) })),
    ...createdTours.filter(tour => !bookings.some(booking => Number(booking.tour_id) === Number(tour.tour_id)))
      .map(tour => ({ ...tour, id: null, status: 'created', booked_at: tour.start_date, total_price: tour.price, isCreated: true }))
  ];

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
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
    } else {
      toast.error(data.message || 'Hiba történt.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f0]">
        <div className="text-center text-slate-400 font-bold">Jelentkezz be a profil megtekintéséhez.</div>
      </div>
    );
  }

  return (
    <div className="bg-[#f5f5f0] min-h-screen pb-20">
      <div className="relative overflow-hidden bg-[#173327] px-6 pb-28 pt-16 text-[#fffefa] md:pb-32 md:pt-20">
        <div className="pointer-events-none absolute -right-24 -top-36 h-96 w-96 rounded-full border border-white/10" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-8 -top-20 h-96 w-96 rounded-full border border-white/10" aria-hidden="true" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col items-start gap-7 sm:flex-row sm:items-center">
            <div className="relative">
              <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-[#dce8d7] bg-[#477258] shadow-lg sm:h-28 sm:w-28">
                <div className="flex h-full w-full items-center justify-center font-serif text-5xl text-white">
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

            <div className="min-w-0">
              {isAdmin && (
                <div className="flex items-center gap-3 text-emerald-200 text-xs font-semibold uppercase tracking-[0.3em]">
                  <ShieldCheck size={16} /> Admin betekintés
                </div>
              )}
              <h1 className="mt-2 font-serif text-[clamp(2.8rem,5vw,4.8rem)] leading-[1.05] tracking-[-0.045em]">
                {profile?.name || 'Profil'}
              </h1>
              {isAdmin && <div className="text-emerald-100 font-bold mt-2">{profile?.email}</div>}
              {isAdmin && profile?.phone && (
                <div className="text-emerald-200 text-sm font-semibold mt-1">
                  <a href={`tel:${profile.phone}`} className="hover:underline">{profile.phone}</a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto -mt-16 max-w-6xl px-6">
        <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-5">
            <div className="rounded-xl border border-[#d9dfd5] bg-[#fffefa] p-6 shadow-[0_12px_35px_rgba(23,51,39,0.06)]">
              <h3 className="font-semibold text-[#173327] text-xl mb-6">Adatai</h3>
              <div className="space-y-4">
                {isAdmin && (
                  <div className="flex flex-col">
                    <span className="text-[#78877c] text-xs font-bold uppercase">Email</span>
                    <span className="text-[#173327] text-sm font-semibold break-all">{profile?.email || '-'}</span>
                  </div>
                )}
                {isAdmin && (
                  <div className="flex flex-col pt-4 border-t border-[#e3e8df]">
                    <span className="text-[#78877c] text-xs font-bold uppercase">Telefonszám</span>
                    <span className="text-[#173327] text-sm font-semibold break-all">
                      {profile?.phone ? (
                        <a href={`tel:${profile.phone}`} className="text-emerald-700 hover:underline">
                          {profile.phone}
                        </a>
                      ) : (
                        '-'
                      )}
                    </span>
                  </div>
                )}
                <div className="flex flex-col pt-4 border-t border-[#e3e8df]">
                  <span className="text-[#78877c] text-xs font-bold uppercase">Tagság kezdete</span>
                  <span className="text-[#173327] font-bold">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('hu-HU') : '-'}
                  </span>
                </div>
              </div>
              {isAdmin ? (
                <Link
                  to="/admin"
                  className="w-full mt-8 flex items-center justify-center gap-2 p-4 rounded-lg bg-[#f5f5f0] text-slate-700 font-semibold hover:bg-[#275940] hover:text-white transition-all"
                >
                  <ArrowLeft size={18} /> Vissza az adminhoz
                </Link>
              ) : (
                <Link
                  to="/tours"
                  className="w-full mt-8 flex items-center justify-center gap-2 p-4 rounded-lg bg-[#f5f5f0] text-slate-700 font-semibold hover:bg-[#275940] hover:text-white transition-all"
                >
                  <ArrowLeft size={18} /> Vissza a túrákhoz
                </Link>
              )}
            </div>

            {isAdmin && (
              <div className="rounded-xl border border-[#cbdcc8] bg-[#e8eee4] p-6">
                <div className="font-serif text-5xl leading-none">{bookings.filter(b => !['cancelled', 'expired'].includes(b.status)).length}</div>
                <div className="mt-2 text-sm font-semibold text-[#477258]">Aktív jelentkezés</div>
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="min-w-0">
              <div className="min-w-0 rounded-xl border border-[#d9dfd5] bg-[#fffefa] p-6 shadow-[0_12px_35px_rgba(23,51,39,0.06)] md:p-8">
                <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-[#e3e8df] pb-6">
                  <h2 className="font-serif text-4xl tracking-tight text-[#173327]">Jelentkezések</h2>
                  <div className="flex gap-2">
                    <span className="rounded-full border border-[#cbdcc8] bg-[#edf2e9] px-3 py-1.5 text-xs font-semibold text-[#275940]">{profileTours.length} túra</span>
                  </div>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full mb-4"></div>
                    <p className="text-[#78877c] font-bold">Betöltés..</p>
                  </div>
                ) : profileTours.length > 0 ? (
                  <div className="grid gap-6">
                    {profileTours.map((booking) => (
                      <div key={`${booking.id || 'created'}-${booking.tour_id}`} className="group flex flex-col gap-5 rounded-xl border border-[#dfe5dc] bg-[#fffefa] p-4 transition-colors hover:border-[#9fb69d] md:flex-row md:items-center">
                        <div className="h-44 w-full shrink-0 overflow-hidden rounded-lg bg-[#e8eee4] md:h-36 md:w-40">
                          {booking.image_url && <img src={booking.image_url} alt={booking.title} className="h-full w-full object-cover" />}
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-[10px] uppercase tracking-widest">
                            {booking.location}
                          </div>
                          <h3 className="font-serif text-[1.55rem] leading-tight text-[#173327]">
                            {booking.title}
                          </h3>
                          <div className="flex flex-wrap gap-4 text-[#607267] font-medium text-xs pt-2">
                            <span className="flex items-center gap-1"><Calendar size={14} /> {booking.booked_at ? new Date(booking.booked_at).toLocaleDateString() : '-'}</span>
                            <span className="flex items-center gap-1"><CreditCard size={14} /> {formatPrice(booking.total_price ?? booking.price)} Ft</span>
                            {Number(booking.deposit_amount) > 0 && <span>Előleg: {formatPrice(booking.deposit_amount)} Ft {booking.deposit_paid ? '(rendezve)' : booking.deposit_deadline ? `(${new Date(booking.deposit_deadline).toLocaleDateString('hu-HU')} -ig)` : ''}</span>}
                            {Number(booking.refund_amount) > 0 && <span>Visszatérítés: {formatPrice(booking.refund_amount)} Ft ({booking.refund_status === 'completed' ? 'rendezve' : 'függőben'})</span>}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 md:flex-col md:items-end">
                          {booking.isCreated && <span className="rounded-full border border-[#cbdcc8] bg-[#edf2e9] px-3 py-1.5 text-xs font-semibold text-[#275940]">Általa létrehozva</span>}
                          {booking.status !== 'created' && <span className="rounded-full border border-[#cbdcc8] bg-[#edf2e9] px-3 py-1.5 text-xs font-semibold text-[#275940]">{{pending: 'Jóváhagyásra vár', confirmed: 'Elfogadva', cancelled: 'Lejelentkezve', expired: 'Lejárt', waitlist: 'Várólistán'}[booking.status] || booking.status}</span>}
                          {booking.payment_status === 'paid' && <span className="text-xs font-semibold text-[#275940]">Fizetve</span>}
                          <Link
                            to={`/tours/${booking.tour_id}`}
                            className="p-3 bg-gray-50 text-[#78877c] rounded-lg hover:bg-[#275940] hover:text-white transition-all"
                            title="Túra megnyitása"
                          >
                            <ChevronRight size={20} />
                          </Link>
                          {booking.id && !['cancelled', 'expired'].includes(booking.status) && <button
                            onClick={() => handleRemoveBooking(booking.id)}
                            className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 text-xs font-semibold uppercase tracking-widest hover:bg-red-500 hover:text-white"
                          >
                            Eltávolítás a túráról
                          </button>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-24 bg-[#f5f5f0] rounded-xl border-2 border-dashed border-slate-200">
                    <div className="text-xl font-semibold text-slate-400 uppercase tracking-widest">Nincs jelentkezés</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUserProfileScreen;
