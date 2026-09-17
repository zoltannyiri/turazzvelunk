import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { 
  MapPin, Calendar, CreditCard, ChevronRight, 
  Settings, LogOut, Mountain, Clock, CheckCircle2, AlertCircle, Camera, XCircle
} from 'lucide-react';
import { formatPrice } from '../../utils/formatPrice';

	const formatHungarianDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const months = ["Január", "Február", "Március", "Április", "Május", "Június", "Július", "Augusztus", "Szeptember", "Október", "November", "December"];
  return `${date.getFullYear()}. ${months[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}.`;
};

const ProfileScreen = () => {
    const { user, logout, updateUser, loading: authLoading } = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();
    const paymentHandledRef = useRef(false);
    const paymentTargetRef = useRef(null);
		const [bookings, setBookings] = useState([]);
		const [createdTours, setCreatedTours] = useState([]);
		const [loading, setLoading] = useState(true);
    const [createdToursLoading, setCreatedToursLoading] = useState(false);
    const [email, setEmail] = useState(user?.email || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [avatarFile, setAvatarFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [paymentProcessing, setPaymentProcessing] = useState(false);

  const fetchMyBookings = () => {
    return fetch(`${import.meta.env.VITE_API_URL}/bookings/my-bookings`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => {
      setBookings(data);
      setLoading(false);

      if (paymentProcessing) {
        const targetId = paymentTargetRef.current;
        const paid = Array.isArray(data)
          ? targetId
            ? data.some((b) => Number(b.id) === Number(targetId) && b.payment_status === 'paid')
            : data.some((b) => b.payment_status === 'paid')
          : false;
        if (paid) {
          setPaymentProcessing(false);
          paymentTargetRef.current = null;
        }
      }
    });
  };

  useEffect(() => {
    fetchMyBookings();
  }, []);

  useEffect(() => {
    if (user?.role !== 'admin') {
      setCreatedTours([]);
      setCreatedToursLoading(false);
      return;
    }

    let active = true;
    setCreatedToursLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/tours/my-created`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error || 'A létrehozott túrák nem tölthetők be.');
        if (active) setCreatedTours(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setCreatedTours([]);
      })
      .finally(() => {
        if (active) setCreatedToursLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user?.role]);

  const createdTourIds = new Set(createdTours.map((tour) => Number(tour.tour_id)));
  const profileTours = [
    ...bookings.map((booking) => ({
      ...booking,
      profile_kind: 'booking',
      is_created_by_me: createdTourIds.has(Number(booking.tour_id))
    })),
    ...createdTours
      .filter((tour) => !bookings.some((booking) => Number(booking.tour_id) === Number(tour.tour_id)))
      .map((tour) => ({
        ...tour,
        id: null,
        status: 'created',
        profile_kind: 'created',
        booked_at: tour.start_date,
        total_price: tour.price,
        is_created_by_me: true
      }))
  ];

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get('payment');
    const sessionId = params.get('session_id');
    if (!paymentStatus || paymentHandledRef.current) return;
    paymentHandledRef.current = true;

    if (paymentStatus === 'success') {
      setPaymentProcessing(true);
      if (sessionId) {
        fetch(`${import.meta.env.VITE_API_URL}/payments/confirm-checkout-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ session_id: sessionId })
        })
          .then((res) => res.json())
          .then((data) => {
            if (data?.booking_id) {
              paymentTargetRef.current = data.booking_id;
            }
          })
          .catch(() => {});
      }
      fetchMyBookings();
      for (let i = 1; i <= 3; i += 1) {
        setTimeout(() => {
          fetchMyBookings();
        }, i * 1500);
      }
    }
    if (paymentStatus === 'cancel') {
      setPaymentProcessing(false);
    }

    navigate('/profile', { replace: true });
  }, [location.search, navigate]);

  useEffect(() => {
    if (!paymentProcessing) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const interval = setInterval(() => {
      fetchMyBookings();
    }, 2000);

    return () => clearInterval(interval);
  }, [paymentProcessing]);

  const handlePay = async (bookingId, paymentType = 'full') => {
    const ok = window.confirm('Fizetés után az eszközöket már nem lehet visszamondani. Folytatod a fizetést?');
    if (!ok) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/payments/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          booking_id: bookingId,
          payment_type: paymentType,
          return_url: `${window.location.origin}${window.location.pathname}`
        })
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      alert(data.message || data.error || 'Hiba történt.');
    } catch (err) {
      alert('Hiba történt.');
    }
  };

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

  const handleDeleteAccount = async () => {
    const ok = window.confirm('Biztosan törölni szeretnéd a fiókodat? Ez nem visszavonható.');
    if (!ok) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) {
        logout();
        navigate('/', { replace: true });
      } else {
        alert(data.message || data.error || 'Hiba történt.');
      }
    } catch (err) {
      alert('Hiba történt.');
    }
  };

  if (authLoading && !paymentProcessing) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user && paymentProcessing) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-xl border border-emerald-50 p-8 max-w-md text-center">
          <div className="mx-auto mb-4 h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <h3 className="text-xl font-black text-emerald-950">Bejelentkezés visszaállítása</h3>
          <p className="text-slate-500 mt-2">Kérlek várj, ez néhány másodpercet vehet igénybe.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-slate-500 font-bold">Kérlek jelentkezz be.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0] pb-24 text-[#173327]">
      {paymentProcessing && (
        <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center px-6">
          <div className="w-full max-w-md rounded-xl border border-[#d9dfd5] bg-[#fffefa] p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#477258] border-t-transparent" />
            <h3 className="font-serif text-2xl text-[#173327]">Fizetés feldolgozása</h3>
            <p className="mt-2 text-sm text-[#607267]">Kérlek várj, amíg a fizetés státusza frissül.</p>
          </div>
        </div>
      )}
      <header className="relative overflow-hidden bg-[#173327] px-6 pb-28 pt-16 text-[#fffefa] md:pb-32 md:pt-20">
        <div className="pointer-events-none absolute -right-24 -top-36 h-96 w-96 rounded-full border border-white/10" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-8 -top-20 h-96 w-96 rounded-full border border-white/10" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl">
          <div className="flex flex-col items-start gap-7 sm:flex-row sm:items-center">
            <div className="relative shrink-0">
              <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-[#dce8d7] bg-[#477258] shadow-lg sm:h-28 sm:w-28">
                <div className="flex h-full w-full items-center justify-center font-serif text-5xl text-white">
                  {user?.avatar_url ? (
                    <img
                      src={`${import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '')}${user.avatar_url}`}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    user?.name?.charAt(0)?.toUpperCase()
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsEditOpen(true)}
                className="absolute -bottom-1 -right-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d9dfd5] bg-[#fffefa] text-[#173327] shadow-md transition-colors hover:bg-[#e8eee4]"
                title="Profil szerkesztése"
                aria-label="Profil szerkesztése"
              >
                <Settings size={17} />
              </button>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#bbd3b8]">Saját útvonalad</span>
              <h1 className="mt-2 font-serif text-[clamp(2.8rem,5vw,4.8rem)] leading-[1.05] tracking-[-0.045em]">
                Szia, {user?.name?.trim().split(/\s+/).at(-1) || 'túrázó'}!
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-[#d3e1d0]">Itt találod a túráidat, jelentkezéseidet és a fiókod adatait.</p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto -mt-16 max-w-6xl px-6">
        <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <div className="rounded-xl border border-[#d9dfd5] bg-[#fffefa] p-6 shadow-[0_12px_35px_rgba(23,51,39,0.06)]">
              <div className="mb-6 flex items-center justify-between border-b border-[#e3e8df] pb-4">
                <h2 className="font-serif text-2xl">Fiókom</h2>
                <button onClick={() => setIsEditOpen(true)} className="rounded-lg p-2 text-[#477258] transition-colors hover:bg-[#edf2e9]" title="Profil szerkesztése" aria-label="Profil szerkesztése"><Settings size={18} /></button>
              </div>
              <div className="space-y-5">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#78877c]">Email-cím</span>
                  <span className="mt-1 break-all text-sm font-semibold text-[#173327]">{user?.email}</span>
                </div>
                <div className="flex flex-col border-t border-[#e3e8df] pt-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#78877c]">Velünk tartasz ekkortól</span>
                  <span className="mt-1 text-sm font-semibold text-[#173327]">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('hu-HU') : '-'}
                  </span>
                </div>
              </div>
              <button
                onClick={logout}
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg border border-[#d9dfd5] px-4 py-3 text-sm font-semibold text-[#173327] transition-colors hover:bg-[#edf2e9]"
              >
                <LogOut size={16} /> Kijelentkezés
              </button>
              <button
                onClick={handleDeleteAccount}
                className="mt-3 w-full rounded-lg px-4 py-2 text-xs font-semibold text-[#9b4f41] transition-colors hover:bg-[#f5ebe7]"
              >
                Fiók törlése
              </button>
            </div>
            <div className="rounded-xl border border-[#cbdcc8] bg-[#e8eee4] p-6">
              <Mountain className="mb-5 text-[#477258]" size={26} strokeWidth={1.5} />
              <div className="font-serif text-5xl leading-none">{bookings.filter(b => !['cancelled', 'expired'].includes(b.status)).length}</div>
              <div className="mt-2 text-sm font-semibold text-[#477258]">Aktív jelentkezés</div>
            </div>
          </aside>

          <section className="min-w-0 rounded-xl border border-[#d9dfd5] bg-[#fffefa] p-6 shadow-[0_12px_35px_rgba(23,51,39,0.06)] md:p-8">
              <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-[#e3e8df] pb-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#477258]">Úton vagy</span>
                  <h2 className="mt-1 font-serif text-4xl tracking-tight">Túráim</h2>
                </div>
                <span className="rounded-full border border-[#cbdcc8] bg-[#edf2e9] px-3 py-1.5 text-xs font-semibold text-[#275940]">{profileTours.length} túra</span>
              </div>

              {loading || createdToursLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#477258] border-t-transparent"></div>
                  <p className="text-sm font-medium text-[#78877c]">Túráid betöltése…</p>
                </div>
              ) : profileTours.length > 0 ? (
                <div className="grid gap-4">
                  {profileTours.map((booking) => (
                    <div key={`${booking.profile_kind}-${booking.id || booking.tour_id}`} className="group flex flex-col gap-5 rounded-xl border border-[#dfe5dc] bg-[#fffefa] p-4 transition-colors hover:border-[#9fb69d] md:flex-row md:items-center">
                      <div className="h-44 w-full shrink-0 overflow-hidden rounded-lg bg-[#e8eee4] md:h-36 md:w-40">
                        {booking.image_url ? (
                          <img src={booking.image_url} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" alt={booking.title} />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#78967e]"><Mountain size={32} strokeWidth={1.5} /></div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#477258]">
                          <MapPin size={13} /> {booking.location}
                        </div>
                        <h3 className="font-serif text-[1.55rem] leading-tight text-[#173327]">
                          {booking.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs font-medium text-[#607267]">
                          {booking.booked_at && <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(booking.booked_at).toLocaleDateString('hu-HU')}</span>}
                          <span className="flex items-center gap-1.5"><CreditCard size={14} /> {formatPrice(booking.total_price ?? booking.price)} Ft</span>
                          {booking.deposit_amount > 0 && (
                            booking.deposit_paid ? (
                              <span className="flex items-center gap-1 text-[#275940]"><CheckCircle2 size={14} /> Előleg: {formatPrice(booking.deposit_amount)} Ft (rendezve)</span>
                            ) : (
                              <span className="flex items-center gap-1 text-[#a16225]"><Clock size={14} /> Előleg: {formatPrice(booking.deposit_amount)} Ft{booking.deposit_deadline ? ` (${formatHungarianDate(booking.deposit_deadline)}-ig)` : ''}</span>
                            )
                          )}
                        </div>
                      </div>

                      <div className="flex w-full shrink-0 flex-wrap items-center gap-2 border-t border-[#e3e8df] pt-4 md:w-auto md:max-w-52 md:flex-col md:items-end md:border-l md:border-t-0 md:py-1 md:pl-5">
                        {booking.is_created_by_me && (
                          <div className="flex items-center gap-1.5 rounded-full border border-[#cbdcc8] bg-[#edf2e9] px-3 py-1.5 text-[11px] font-semibold text-[#275940]">
                            <Mountain size={14} /> Általam létrehozva
                          </div>
                        )}
                        {booking.status === 'created' ? null : booking.status === 'waitlist' ? (
                          <div className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-800">
                            <Clock size={14} /> Várólistán
                          </div>
                        ) : booking.status === 'pending' ? (
                          <div className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-800">
                            <Clock size={14} /> Jóváhagyásra vár
                          </div>
                        ) : booking.status === 'expired' ? (
                          <div className="flex items-center gap-1.5 rounded-full border border-[#d9dfd5] bg-[#f5f5f0] px-3 py-1.5 text-[11px] font-semibold text-[#607267]">
                            <AlertCircle size={14} /> Lejárt
                          </div>
                        ) : booking.status === 'confirmed' ? (
                          <div className="flex items-center gap-1.5 rounded-full border border-[#cbdcc8] bg-[#edf2e9] px-3 py-1.5 text-[11px] font-semibold text-[#275940]">
                            <CheckCircle2 size={14} /> Elfogadva
                          </div>
                        ) : booking.status === 'cancelled' ? (
                          <div className="flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-semibold text-rose-700">
                            <XCircle size={14} /> Lejelentkezve
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 rounded-full border border-[#d9dfd5] bg-[#f5f5f0] px-3 py-1.5 text-[11px] font-semibold text-[#607267]">
                            {booking.status}
                          </div>
                        )}
                        {booking.status === 'waitlist' && (
                          <div className="text-xs font-medium text-amber-800">
                            Értesítünk, ha bekerülsz
                          </div>
                        )}
                        {booking.status === 'pending' && (
                          <div className="text-xs font-medium text-amber-800 md:text-right">
                            Jóváhagyás után fizethető
                            {booking.deposit_amount > 0 && (
                              <div className="mt-1 text-[11px] text-amber-700">
                                Előleg: {formatPrice(booking.deposit_amount)} Ft vagy Teljes összeg
                              </div>
                            )}
                          </div>
                        )}
                        {booking.status === 'expired' && (
                          <div className="max-w-56 text-xs leading-relaxed text-[#607267] md:text-right">
                            Nem került jóváhagyásra a túra indulásáig
                          </div>
                        )}
                        {booking.status === 'confirmed' && booking.payment_status !== 'paid' && (() => {
                          const hasDeposit = booking.deposit_amount != null && Number(booking.deposit_amount) > 0;
                          const depositPaid = !!booking.deposit_paid;
                          const totalPrice = Number(booking.total_price || booking.price || 0);
                          const depositAmount = Number(booking.deposit_amount || 0);
                          const remainderAmount = Math.max(0, totalPrice - depositAmount);

                          if (hasDeposit && !depositPaid) {
                            return (
                              <div className="flex flex-wrap gap-2 md:flex-col md:items-end">
                                <button
                                  onClick={() => handlePay(booking.id, 'deposit')}
                                  className="rounded-lg bg-[#ac7138] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#8d592a]"
                                >
                                  Előleg: {formatPrice(depositAmount)} Ft
                                </button>
                                <button
                                  onClick={() => handlePay(booking.id, 'full')}
                                  className="rounded-lg bg-[#275940] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#173d2a]"
                                >
                                  Teljes: {formatPrice(totalPrice)} Ft
                                </button>
                              </div>
                            );
                          }
                          if (hasDeposit && depositPaid) {
                            return (
                              <div className="flex flex-col gap-1 md:items-end">
                                <div className="text-[11px] font-semibold text-[#477258]">Előleg fizetve ✓</div>
                                <button
                                  onClick={() => handlePay(booking.id, 'remainder')}
                                  className="rounded-lg bg-[#275940] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#173d2a]"
                                >
                                  Maradék: {formatPrice(remainderAmount)} Ft
                                </button>
                              </div>
                            );
                          }
                          return (
                            <button
                              onClick={() => handlePay(booking.id)}
                              className="rounded-lg bg-[#275940] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#173d2a]"
                            >
                              Fizetés
                            </button>
                          );
                        })()}
                        {booking.payment_status === 'paid' && (
                          <div className={`text-xs font-semibold ${
                            booking.status === 'cancelled'
                              ? 'rounded-full bg-rose-50 px-3 py-1.5 text-rose-700'
                              : 'text-[#275940]'
                          }`}>
                            Fizetve
                          </div>
                        )}
                        <Link
                          to={`/tours/${booking.tour_id}`}
                          className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d9dfd5] text-[#275940] transition-colors hover:bg-[#275940] hover:text-white md:ml-0"
                          title="Túra megnyitása"
                          aria-label={`${booking.title} megnyitása`}
                        >
                          <ChevronRight size={20} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#cbdcc8] bg-[#f7f9f4] px-6 py-20 text-center">
                  <Mountain size={40} strokeWidth={1.5} className="mx-auto mb-4 text-[#78967e]" />
                  <h3 className="font-serif text-2xl">Még nincsenek túráid</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-[#607267]">Nézz körül a következő indulások között, és találd meg a hozzád illő utat.</p>
                  <Link to="/tours" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#275940] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#173d2a]">Túrák felfedezése <ChevronRight size={16} /></Link>
                </div>
              )}
          </section>
        </div>
      </main>

      {isEditOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-[#10271d]/70 backdrop-blur-sm" onClick={() => setIsEditOpen(false)}></div>
          <div role="dialog" aria-modal="true" aria-labelledby="profile-settings-title" className="relative max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto rounded-xl border border-[#d9dfd5] bg-[#fffefa] p-6 shadow-2xl sm:p-8">
            <div className="mb-7 flex items-center justify-between border-b border-[#e3e8df] pb-5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#477258]">Fiókadatok</span>
                <h3 id="profile-settings-title" className="mt-1 font-serif text-3xl text-[#173327]">Profil szerkesztése</h3>
              </div>
              <button
                onClick={() => setIsEditOpen(false)}
                className="rounded-full p-2 text-[#607267] transition-colors hover:bg-[#edf2e9]"
                title="Bezárás"
                aria-label="Bezárás"
              >
                <XCircle size={21} />
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label htmlFor="profile-email" className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#607267]">Email-cím</label>
                <input
                  id="profile-email"
                  type="email"
                  className="mt-2 w-full rounded-lg border border-[#d9dfd5] bg-white p-3 text-sm text-[#173327] outline-none transition-colors focus:border-[#477258] focus:ring-2 focus:ring-[#cbdcc8]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="profile-current-password" className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#607267]">Jelenlegi jelszó</label>
                <input
                  id="profile-current-password"
                  type="password"
                  className="mt-2 w-full rounded-lg border border-[#d9dfd5] bg-white p-3 text-sm text-[#173327] outline-none transition-colors focus:border-[#477258] focus:ring-2 focus:ring-[#cbdcc8]"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="profile-new-password" className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#607267]">Új jelszó</label>
                <input
                  id="profile-new-password"
                  type="password"
                  className="mt-2 w-full rounded-lg border border-[#d9dfd5] bg-white p-3 text-sm text-[#173327] outline-none transition-colors focus:border-[#477258] focus:ring-2 focus:ring-[#cbdcc8]"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="rounded-lg border border-[#d9dfd5] bg-[#f7f9f4] p-4">
                <label htmlFor="profile-avatar" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#607267]">
                  <Camera size={14} /> Avatar feltöltése
                </label>
                <input
                  id="profile-avatar"
                  type="file"
                  accept="image/*"
                  className="mt-3 w-full text-sm text-[#607267] file:mr-3 file:rounded-md file:border-0 file:bg-[#e8eee4] file:px-3 file:py-2 file:font-semibold file:text-[#275940]"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                />
              </div>
              <button
                onClick={handleProfileSave}
                disabled={saving}
                className="w-full rounded-lg bg-[#275940] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#173d2a] disabled:cursor-wait disabled:opacity-60"
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
