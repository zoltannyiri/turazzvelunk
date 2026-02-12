import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { 
  Clock, MapPin, Calendar, Users, ArrowLeft, 
  Zap, Info, ShieldCheck, CheckCircle2, UserMinus, Sparkles, MessageCircle, ThumbsUp, X
} from 'lucide-react';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';

const TourDetailsScreen = () => {
  const { id } = useParams();
  const location = useLocation();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBooked, setIsBooked] = useState(false);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const [cancelRequestStatus, setCancelRequestStatus] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('details');

  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [commentDrafts, setCommentDrafts] = useState({});
  const [likeLoadingId, setLikeLoadingId] = useState(null);
  const socketRef = useRef(null);
  const [postUpdates, setPostUpdates] = useState({});
  const [commentLikeLoadingId, setCommentLikeLoadingId] = useState(null);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [activeReplyTo, setActiveReplyTo] = useState(null);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [modalPostId, setModalPostId] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [topCommentsByPost, setTopCommentsByPost] = useState({});
  const [modalPost, setModalPost] = useState(null);
  const [modalComments, setModalComments] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMenuOpen, setChatMenuOpen] = useState(false);
  const [participantsModalOpen, setParticipantsModalOpen] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [adminBookings, setAdminBookings] = useState([]);
  const [adminBookingsLoading, setAdminBookingsLoading] = useState(false);

  const fromCalendar = location.state?.from === 'calendar';

  const formatHungarianDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const months = ["Január", "Február", "Március", "Április", "Május", "Június", "Július", "Augusztus", "Szeptember", "Október", "November", "December"];
    return `${date.getFullYear()}. ${months[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}.`;
  };

  const fetchTourData = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/tours/${id}`);
      const data = await res.json();
      setTour(data);

      if (user) {
        await refreshBookingStatus();
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTourData();
  }, [id, user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get('payment');
    if (paymentStatus === 'success') {
      toast.success('Sikeres fizetés!');
      fetchTourData();
      navigate(`/tours/${id}`, { replace: true });
    }
    if (paymentStatus === 'cancel') {
      toast.info('Fizetés megszakítva.');
      navigate(`/tours/${id}`, { replace: true });
    }
  }, [location.search, id, navigate]);

  const refreshBookingStatus = async () => {
    if (!user) return;
    const checkRes = await fetch(`${import.meta.env.VITE_API_URL}/bookings/status/${id}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const checkData = await checkRes.json();
    setIsBooked(!!checkData.isBooked);
    setBookingStatus(checkData.status || null);
    setBookingId(checkData.bookingId || null);
    setCancelRequestStatus(checkData.cancel_request_status || null);
    return checkData;
  };

  useEffect(() => {
    const fetchAdminBookings = async () => {
      if (!user || user.role !== 'admin') return;
      setAdminBookingsLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings/admin/tours/${id}`,
          {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          }
        );
        const data = await res.json();
        setAdminBookings(Array.isArray(data) ? data : []);
      } catch (err) {
        setAdminBookings([]);
      } finally {
        setAdminBookingsLoading(false);
      }
    };

    fetchAdminBookings();
  }, [id, user]);

  const fetchPosts = async ({ silent = false } = {}) => {
    if (!silent) {
      setPostsLoading(true);
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/tours/${id}/posts`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || data.error || 'Hiba a bejegyzések betöltésekor.');
        setPosts([]);
        return;
      }

      setPosts(Array.isArray(data) ? data : []);
      await fetchTopCommentsForPosts(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      toast.error('Hiba a bejegyzések betöltésekor.');
    } finally {
      if (!silent) {
        setPostsLoading(false);
      }
    }
  };

  const fetchTopCommentsForPosts = async (postList) => {
    if (!postList.length) {
      setTopCommentsByPost({});
      return;
    }

    try {
      const results = await Promise.all(
        postList.map(async (post) => {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/tour-posts/${post.id}/comments/top?limit=2`);
          const data = await res.json();
          return [post.id, Array.isArray(data) ? data : []];
        })
      );

      const map = results.reduce((acc, [postId, comments]) => {
        acc[postId] = comments;
        return acc;
      }, {});
      setTopCommentsByPost(map);
    } catch (err) {
      setTopCommentsByPost({});
    }
  };

  useEffect(() => {
    if (activeTab === 'posts') {
      fetchPosts();
    }
  }, [activeTab, id]);

  const isChatAllowed = user?.role === 'admin' || bookingStatus === 'confirmed';
  const isTourFull = tour?.max_participants
    ? Number(tour.booked_count || 0) >= Number(tour.max_participants)
    : false;
  const avatarBase = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');

  useEffect(() => {
    if (activeTab === 'chat' && isChatAllowed) {
      fetchChatMessages();
    }
    if (activeTab === 'chat' && user) {
      refreshBookingStatus().then((data) => {
        if (!data?.isBooked || data?.status !== 'confirmed') {
          setActiveTab('details');
        }
      });
    }
  }, [activeTab, id, isChatAllowed, user]);

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || '';
    const socketBase = apiBase.replace(/\/api\/?$/, '');

    if (!socketRef.current) {
      socketRef.current = io(socketBase || '/', {
        transports: ['websocket']
      });
    }

    const socket = socketRef.current;
    if (id) {
      socket.emit('join-tour', id);
    }

    const handleNewComment = (payload) => {
      if (payload?.tourId && String(payload.tourId) !== String(id)) return;
      if (!payload?.postId) return;
      setPostUpdates(prev => ({ ...prev, [payload.postId]: true }));
    };

    const handleChatMessage = (payload) => {
      if (!payload?.tour_id || String(payload.tour_id) !== String(id)) return;
      setChatMessages(prev => [...prev, payload]);
    };

    const handleMembershipUpdate = (payload) => {
      if (!payload?.tourId || String(payload.tourId) !== String(id)) return;
      if (!user || String(payload.userId) !== String(user.id)) return;
      if (payload.status === 'removed') {
        setBookingStatus(null);
        setIsBooked(false);
        setChatMessages([]);
        setActiveTab('details');
        toast.info('Kikerültél a túra csevegéséből.');
      }
      if (payload.status === 'confirmed') {
        setBookingStatus('confirmed');
        setIsBooked(true);
      }
    };

    socket.on('tour-post-comment', handleNewComment);
    socket.on('tour-chat-message', handleChatMessage);
    socket.on('tour-chat-membership', handleMembershipUpdate);

    return () => {
      socket.off('tour-post-comment', handleNewComment);
      socket.off('tour-chat-message', handleChatMessage);
      socket.off('tour-chat-membership', handleMembershipUpdate);
      if (id) {
        socket.emit('leave-tour', id);
      }
    };
  }, [id, user]);

  const fetchChatMessages = async () => {
    setChatLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/tours/${id}/chat-messages`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          setBookingStatus(null);
          setIsBooked(false);
          setActiveTab('details');
        }
        setChatMessages([]);
        return;
      }
      setChatMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      setChatMessages([]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const status = await refreshBookingStatus();
    if (!status?.isBooked || status?.status !== 'confirmed') {
      toast.info('A csevegés csak elfogadott jelentkezés után érhető el.');
      setActiveTab('details');
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/tours/${id}/chat-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ message: chatInput.trim() })
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.message || data.error || 'Hiba történt.');
        return;
      }
      setChatInput('');
    } catch (err) {
      toast.error('Hiba történt.');
    }
  };

  const fetchParticipants = async () => {
    setParticipantsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings/tour/${id}/participants`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setParticipants([]);
        return;
      }
      setParticipants(Array.isArray(data) ? data : []);
    } catch (err) {
      setParticipants([]);
    } finally {
      setParticipantsLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      toast.info("A jelentkezéshez előbb be kell jelentkezned!");
      navigate('/login');
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ tour_id: id }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("🎉 Jelentkezés elküldve, admin jóváhagyásra vár!");
        setIsBooked(true);
        setBookingStatus('pending');
        fetchTourData();
        return;
      }
      toast.error(data.message || data.error || 'Hiba történt.');
    } catch (err) { toast.error("Hiba történt."); }
  };

  const handleCancelBooking = async () => {
    if (!window.confirm("Biztosan le szeretnél jelentkezni?")) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings/cancel/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        toast.warn("Lejelentkezve a túráról.");
        setIsBooked(false);
        fetchTourData();
      }
    } catch (err) { toast.error("Hiba a lejelentkezéskor."); }
  };

  const handleCancelRequest = async () => {
    if (!bookingId) return;
    if (!cancelReason.trim()) {
      toast.error('Kérlek írd meg a lejelentkezés okát.');
      return;
    }
    setCancelSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings/${bookingId}/cancel-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason: cancelReason })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Kérelem elküldve.');
        setCancelReason('');
        setCancelRequestStatus('pending');
      } else {
        toast.error(data.message || data.error || 'Hiba történt.');
      }
    } catch (err) {
      toast.error('Hiba történt a kérelem küldésekor.');
    } finally {
      setCancelSubmitting(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.content.trim()) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/tours/${id}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: newPost.title.trim() || null,
          content: newPost.content.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Bejegyzés közzétéve.');
        setNewPost({ title: '', content: '' });
        fetchPosts({ silent: true });
      } else {
        toast.error(data.message || data.error || 'Hiba történt.');
      }
    } catch (err) {
      toast.error('Hiba történt a mentéskor.');
    }
  };

  const handleCreateComment = async (postId, parentCommentId = null) => {
    const content = (parentCommentId ? replyDrafts[parentCommentId] : commentDrafts[postId] || '').trim();
    if (!content) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/tour-posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content, parent_comment_id: parentCommentId })
      });
      const data = await res.json();
      if (res.ok) {
        if (parentCommentId) {
          setReplyDrafts(prev => ({ ...prev, [parentCommentId]: '' }));
          setActiveReplyTo(null);
        } else {
          setCommentDrafts(prev => ({ ...prev, [postId]: '' }));
        }
        await fetchPosts({ silent: true });
        if (isCommentsModalOpen && modalPostId === postId) {
          await fetchModalComments(postId);
        }
      } else {
        toast.error(data.message || data.error || 'Hiba történt.');
      }
    } catch (err) {
      toast.error('Hiba történt a komment mentésekor.');
    }
  };

  const handleToggleCommentLike = async (commentId) => {
    if (!user) {
      toast.info('A like-hoz be kell jelentkezned.');
      navigate('/login');
      return;
    }
    setCommentLikeLoadingId(commentId);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/tour-posts/comments/${commentId}/likes`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) {
        setModalComments(prev => prev.map(c => (
          c.id === commentId ? { ...c, like_count: data.like_count, liked: data.liked } : c
        )));
        setTopCommentsByPost(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach((postId) => {
            updated[postId] = (updated[postId] || []).map(c => (
              c.id === commentId ? { ...c, like_count: data.like_count, liked: data.liked } : c
            ));
          });
          return updated;
        });
      } else {
        toast.error(data.message || data.error || 'Hiba történt.');
      }
    } catch (err) {
      toast.error('Hiba történt a komment like műveletnél.');
    } finally {
      setCommentLikeLoadingId(null);
    }
  };

  const fetchModalComments = async (postId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/tour-posts/${postId}/comments`);
      const data = await res.json();
      setModalComments(Array.isArray(data) ? data : []);
    } catch (err) {
      setModalComments([]);
    }
  };

  const openCommentsModal = async (postId) => {
    const post = posts.find(p => p.id === postId);
    setModalPostId(postId);
    setModalPost(post || null);
    setIsCommentsModalOpen(true);
    setModalLoading(true);
    await fetchModalComments(postId);
    setPostUpdates(prev => ({ ...prev, [postId]: false }));
    setModalLoading(false);
  };

  const closeCommentsModal = () => {
    setIsCommentsModalOpen(false);
    setModalPostId(null);
    setActiveReplyTo(null);
  };

  const getReplies = (comments = [], parentId) => {
    return comments.filter(c => String(c.parent_comment_id) === String(parentId));
  };

  const handleToggleLike = async (postId) => {
    if (!user) {
      toast.info('A like-hoz be kell jelentkezned.');
      navigate('/login');
      return;
    }
    setLikeLoadingId(postId);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/tour-posts/${postId}/likes`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) {
        setPosts(prev => prev.map(p => (
          p.id === postId
            ? { ...p, like_count: data.like_count, liked: data.liked }
            : p
        )));
      } else {
        toast.error(data.message || data.error || 'Hiba történt.');
      }
    } catch (err) {
      toast.error('Hiba történt a like műveletnél.');
    } finally {
      setLikeLoadingId(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-emerald-600"></div>
    </div>
  );

  if (!tour) return <div className="p-20 text-center font-black text-slate-400">Túra nem található.</div>;

  return (
    <div className="bg-[#fcfdfe] min-h-screen pb-12 font-sans">
      {/* --- HERO SECTION - Kompaktabb magasság --- */}
      <div className="relative h-[40vh] md:h-[45vh] w-full overflow-hidden shadow-lg">
        <img src={tour.image_url} className="w-full h-full object-cover" alt={tour.title} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20"></div>
        
        {/* Navigáció */}
        <div className="absolute top-6 left-6 z-20">
          <Link 
            to={fromCalendar ? "/calendar" : "/tours"} 
            className="inline-flex items-center gap-2 text-white bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl hover:bg-emerald-600 transition-all text-xs font-bold uppercase tracking-wider"
          >
            <ArrowLeft size={16} /> 
            {fromCalendar ? "Vissza a naptárhoz" : "Vissza a túrákhoz"}
          </Link>
        </div>

        {/* Cím */}
        <div className="absolute bottom-8 left-0 w-full px-6 md:px-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest text-[10px] mb-2">
              <MapPin size={14} /> {tour.location}
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tighter uppercase italic">
              {tour.title}
            </h1>
          </div>
        </div>
      </div>

      {/* --- TARTALOM - Szűkebb konténer --- */}
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        
        {/* Bal oldal - 8 oszlop */}
        <div className="lg:col-span-8 space-y-8">

          {/* Tabok */}
          <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm inline-flex gap-2">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition ${
                activeTab === 'details' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Alapadatok
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition ${
                activeTab === 'posts' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Bejegyzések
            </button>
            {user && bookingStatus === 'confirmed' && (
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition ${
                  activeTab === 'chat' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                Csevegés
              </button>
            )}
          </div>

          {activeTab === 'details' && (
            <>
              {/* Info Grid - Kisebb kártyák */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: <Clock size={18}/>, label: 'Idő', val: `${tour.duration} nap` },
                  { icon: <Zap size={18}/>, label: 'Szint', val: tour.difficulty },
                  { icon: <Users size={18}/>, label: 'Helyek', val: `${tour.booked_count || 0}/${tour.max_participants}` },
                  { icon: <Sparkles size={18}/>, label: 'Nehézség', val: tour.difficulty_level ? `${tour.difficulty_level}/10` : '-' },
                  { icon: <MapPin size={18}/>, label: 'Kategória', val: tour.category || '-' },
                  { icon: <Info size={18}/>, label: 'Alkategória', val: tour.subcategory || '-' }
                ].map((item, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                    <div className="text-emerald-500 mb-1">{item.icon}</div>
                    <div className="text-[9px] text-slate-400 uppercase font-black tracking-tighter">{item.label}</div>
                    <div className="font-bold text-slate-800 text-sm">{item.val}</div>
                  </div>
                ))}
              </div>

              {/* Leírás */}
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-emerald-600">
                  <Info size={20} />
                  <h2 className="text-lg font-black uppercase tracking-tight italic text-slate-900">A túra részletei</h2>
                </div>
                <p className="text-slate-600 leading-relaxed text-base font-medium">
                  {tour.description}
                </p>
              </div>

              {user?.role === 'admin' && (
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 text-emerald-600">
                    <ShieldCheck size={20} />
                    <h2 className="text-lg font-black uppercase tracking-tight italic text-slate-900">Admin betekintés</h2>
                  </div>
                  {adminBookingsLoading ? (
                    <div className="text-slate-400 font-bold">Betöltés...</div>
                  ) : adminBookings.length === 0 ? (
                    <div className="text-slate-400 font-bold">Nincs jelentkező.</div>
                  ) : (
                    <div className="grid gap-3">
                      {adminBookings.map((booking) => (
                        <div key={booking.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-50 rounded-2xl p-4">
                          <div>
                            <div className="font-black text-emerald-950 text-sm">{booking.user_name}</div>
                            <div className="text-xs text-slate-400">{booking.email}</div>
                          </div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{booking.status}</div>
                          <div className="text-xs text-slate-400 font-bold">
                            {booking.booked_at ? new Date(booking.booked_at).toLocaleDateString() : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'posts' && (
            <div className="space-y-6">
              {user?.role === 'admin' && (
                <form onSubmit={handleCreatePost} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Admin bejegyzés</div>
                  <input
                    type="text"
                    placeholder="Cím (opcionális)"
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition font-semibold"
                    value={newPost.title}
                    onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                  />
                  <textarea
                    rows="4"
                    placeholder="Bejegyzés tartalma..."
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition font-medium"
                    value={newPost.content}
                    onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                    required
                  />
                  <button className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition">
                    Közzététel
                  </button>
                </form>
              )}

              {postsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                  <p className="text-slate-500 font-semibold">Még nincs bejegyzés ennél a túránál.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <div key={post.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                            {post.author_name}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400">
                            {new Date(post.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-widest">
                          {tour?.location || 'Túra'}
                        </div>
                      </div>
                      {post.title && (
                        <h3 className="text-xl font-black text-slate-900 mb-2">{post.title}</h3>
                      )}
                      <p className="text-slate-700 leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>

                      {postUpdates[post.id] && (
                        <div className="mb-4">
                          <button
                            onClick={() => {
                              setPostsLoading(true);
                              fetchPosts().finally(() => {
                                setPostUpdates(prev => ({ ...prev, [post.id]: false }));
                              });
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-widest hover:bg-emerald-100 transition"
                          >
                            Új komment érkezett – frissítés
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-4 mb-4">
                        <button
                          onClick={() => handleToggleLike(post.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition ${
                            post.liked ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'
                          }`}
                          disabled={likeLoadingId === post.id}
                        >
                          <ThumbsUp size={14} /> {post.like_count || 0}
                        </button>
                        <button
                          onClick={() => openCommentsModal(post.id)}
                          className="flex items-center gap-2 text-xs text-slate-500 font-black uppercase tracking-widest px-3 py-2 rounded-full bg-slate-50 hover:bg-slate-100 transition"
                        >
                          <MessageCircle size={14} /> Kommentek ({post.comment_count || post.comments?.length || 0})
                        </button>
                      </div>

                      <div className="space-y-3">
                        {(topCommentsByPost[post.id] || []).map((comment) => (
                          <div key={comment.id} className="bg-slate-50 rounded-2xl p-4">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-2">
                              <span className="text-emerald-700 uppercase tracking-widest">{comment.author_name}</span>
                              <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-slate-700 text-sm mb-3">{comment.content}</p>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleToggleCommentLike(comment.id)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition ${
                                  comment.liked ? 'bg-emerald-50 text-emerald-700' : 'bg-white text-slate-500'
                                }`}
                                disabled={commentLikeLoadingId === comment.id}
                              >
                                <ThumbsUp size={12} /> {comment.like_count || 0}
                              </button>
                              <button
                                onClick={() => openCommentsModal(post.id)}
                                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600"
                              >
                                Válaszok megtekintése
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="space-y-6">
              {!user && (
                <div className="bg-white rounded-3xl border border-slate-100 p-6 text-slate-500 font-semibold">
                  A csevegéshez jelentkezz be.
                </div>
              )}

              {user && !isChatAllowed && (
                <div className="bg-white rounded-3xl border border-slate-100 p-6 text-slate-500 font-semibold">
                  A csevegés csak elfogadott jelentkezés után érhető el.
                </div>
              )}

              {user && isChatAllowed && (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[520px]">
                  <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between relative">
                    <div className="font-black text-emerald-950">Élő chat</div>
                    <button
                      onClick={() => setChatMenuOpen((prev) => !prev)}
                      className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-black text-lg hover:bg-emerald-50 hover:text-emerald-700 transition"
                      title="Résztvevők"
                    >
                      ...
                    </button>
                    {chatMenuOpen && (
                      <div className="absolute right-6 top-14 bg-white border border-slate-100 rounded-2xl shadow-xl p-2 w-44 z-20">
                        <button
                          onClick={() => {
                            setChatMenuOpen(false);
                            setParticipantsModalOpen(true);
                            fetchParticipants();
                          }}
                          className="w-full text-left px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-emerald-50"
                        >
                          Résztvevők
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {chatLoading ? (
                      <div className="text-slate-400 font-semibold">Betöltés...</div>
                    ) : chatMessages.length === 0 ? (
                      <div className="text-slate-400 font-semibold">Még nincs üzenet.</div>
                    ) : (
                      chatMessages.map((msg) => {
                        const isMine = user && msg.user_id === user.id;
                        const initials = msg.user_name
                          ? msg.user_name.split(' ').map((p) => p[0]).slice(0, 2).join('')
                          : '?';

                        return (
                          <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex items-end gap-3 max-w-[80%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center overflow-hidden">
                                {isMine && user?.avatar_url ? (
                                  <img
                                    src={`${avatarBase}${user.avatar_url}`}
                                    alt={user?.name || 'avatar'}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  initials
                                )}
                              </div>
                              <div className={`rounded-3xl px-4 py-3 shadow-sm ${isMine ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-700'}`}>
                                <div className={`text-[10px] font-black uppercase tracking-widest ${isMine ? 'text-emerald-100' : 'text-emerald-600'}`}>
                                  {isMine ? 'Te' : msg.user_name}
                                </div>
                                <div className="font-medium whitespace-pre-wrap">{msg.message}</div>
                                <div className={`text-[10px] mt-2 ${isMine ? 'text-emerald-100/80' : 'text-slate-400'}`}>
                                  {msg.created_at ? new Date(msg.created_at).toLocaleString() : ''}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <form onSubmit={handleSendChatMessage} className="border-t border-slate-100 p-4 flex gap-3">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Írj üzenetet..."
                      className="flex-1 bg-slate-50 rounded-2xl px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-black uppercase tracking-widest text-xs hover:bg-emerald-700"
                    >
                      Küldés
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Jobb oldal / Sidebar - 4 oszlop */}
        <div className="lg:col-span-4">
          <div className="sticky top-6 space-y-4">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
              {/* Dekoratív fény */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
              
              <div className="relative z-10">
                <div className="mb-6">
                  <div className="text-emerald-400 font-bold uppercase tracking-widest text-[9px] mb-1">Részvételi díj</div>
                  <div className="text-4xl font-black italic tracking-tighter">
                    {tour.price?.toLocaleString()} <span className="text-lg not-italic text-emerald-500">Ft</span>
                  </div>
                </div>

                <div className="space-y-3 mb-8 text-xs">
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-slate-400 font-bold uppercase">Indulás</span>
                      <span className="font-bold">{formatHungarianDate(tour.start_date)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-slate-400 font-bold uppercase">Zárás</span>
                      <span className="font-bold">{formatHungarianDate(tour.end_date)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-400 font-bold uppercase">Jelentkezők</span>
                      <span className="font-bold text-emerald-400">{tour.booked_count || 0} / {tour.max_participants} fő</span>
                    </div>
                </div>

                {isBooked ? (
                  bookingStatus === 'confirmed' ? (
                    <div className="space-y-4">
                      <div className="w-full py-4 rounded-2xl font-black text-sm bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center justify-center gap-2 uppercase tracking-widest">
                        <CheckCircle2 size={18} /> Jelentkezés elfogadva
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Lejelentkezés kérése</div>
                        {cancelRequestStatus === 'pending' ? (
                          <div className="w-full py-3 rounded-xl text-center text-xs font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            Kérelem elküldve
                          </div>
                        ) : (
                          <>
                            <textarea
                              rows="3"
                              placeholder="Írd meg röviden, miért szeretnél lejelentkezni..."
                              className="w-full p-3 rounded-xl bg-slate-900/30 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                              value={cancelReason}
                              onChange={(e) => setCancelReason(e.target.value)}
                            />
                            <button
                              onClick={handleCancelRequest}
                              disabled={cancelSubmitting}
                              className="mt-3 w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white transition disabled:opacity-60"
                            >
                              Lejelentkezés kérése
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={handleCancelBooking}
                      className="w-full py-4 rounded-2xl font-black text-sm bg-red-500/10 text-red-500 border border-red-500/30 flex items-center justify-center gap-2 uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                    >
                      <UserMinus size={18} /> Lejelentkezés
                    </button>
                  )
                ) : (
                  <button 
                    onClick={handleBooking}
                    disabled={isTourFull || !user}
                    className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 uppercase tracking-widest ${
                      isTourFull
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : user 
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-lg shadow-emerald-500/20' 
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {isTourFull ? 'A túra betelt' : user ? 'Jelentkezem most' : 'Bejelentkezés szükséges'}
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-[9px] uppercase tracking-widest bg-white py-3 rounded-2xl border border-slate-100 shadow-sm">
                <ShieldCheck size={14} className="text-emerald-500" /> 100% Biztonságos foglalás
            </div>
          </div>
        </div>
      </div>

      {participantsModalOpen && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setParticipantsModalOpen(false)}
          ></div>
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Résztvevők</div>
                <div className="text-2xl font-black text-emerald-950">{tour?.title || 'Túra'}</div>
              </div>
              <button
                onClick={() => setParticipantsModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            {participantsLoading ? (
              <div className="text-slate-400 font-semibold">Betöltés...</div>
            ) : participants.length === 0 ? (
              <div className="text-slate-400 font-semibold">Nincs résztvevő.</div>
            ) : (
              <div className="grid gap-3">
                {participants.map((p) => {
                  const initials = p.user_name
                    ? p.user_name.split(' ').map((part) => part[0]).slice(0, 2).join('')
                    : '?';
                  return (
                    <div key={p.user_id} className="flex items-center justify-between gap-3 bg-slate-50 rounded-2xl p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center overflow-hidden">
                          {p.avatar_url ? (
                            <img
                              src={`${avatarBase}${p.avatar_url}`}
                              alt={p.user_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            initials
                          )}
                        </div>
                        <div className="font-semibold text-slate-700">{p.user_name}</div>
                      </div>
                      <button
                        onClick={() => navigate(`/profile/${p.user_id}`)}
                        className="px-3 py-2 rounded-xl bg-white text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition"
                      >
                        Profil megtekintése
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {isCommentsModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeCommentsModal}></div>
          <div className="relative bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl p-8 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-slate-900">Bejegyzés és kommentek</h3>
              <button onClick={closeCommentsModal} className="p-2 rounded-xl hover:bg-slate-100 transition">
                <X size={18} />
              </button>
            </div>

            {modalLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
              </div>
            ) : (() => {
              const post = modalPost || posts.find(p => p.id === modalPostId);
              if (!post) {
                return <p className="text-slate-500">Nem található bejegyzés.</p>;
              }
              const topLevelComments = (modalComments || []).filter(c => !c.parent_comment_id);

              return (
                <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-2xl">
                    <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">
                      {post.author_name}
                    </div>
                    {post.title && <h4 className="text-xl font-black text-slate-900 mb-2">{post.title}</h4>}
                    <p className="text-slate-700 whitespace-pre-wrap">{post.content}</p>
                  </div>

                  <div className="space-y-4">
                    {topLevelComments.map((comment) => (
                      <div key={comment.id} className="bg-white border border-slate-100 rounded-2xl p-4">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-2">
                          <span className="text-emerald-700 uppercase tracking-widest">{comment.author_name}</span>
                          <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-700 text-sm mb-3">{comment.content}</p>
                        <div className="flex items-center gap-3 mb-3">
                          <button
                            onClick={() => handleToggleCommentLike(comment.id)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition ${
                              comment.liked ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'
                            }`}
                            disabled={commentLikeLoadingId === comment.id}
                          >
                            <ThumbsUp size={12} /> {comment.like_count || 0}
                          </button>
                          <button
                            onClick={() => setActiveReplyTo(activeReplyTo === comment.id ? null : comment.id)}
                            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600"
                          >
                            Válasz
                          </button>
                        </div>

                        {activeReplyTo === comment.id && user && (
                          <div className="flex items-center gap-3 mb-3">
                            <input
                              type="text"
                              placeholder="Írj választ..."
                              className="flex-1 p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition text-sm"
                              value={replyDrafts[comment.id] || ''}
                              onChange={(e) => setReplyDrafts(prev => ({ ...prev, [comment.id]: e.target.value }))}
                            />
                            <button
                              onClick={() => handleCreateComment(post.id, comment.id)}
                              className="px-4 py-3 rounded-2xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition"
                            >
                              Küldés
                            </button>
                          </div>
                        )}

                        {getReplies(modalComments || [], comment.id).map((reply) => (
                          <div key={reply.id} className="ml-6 mt-3 bg-slate-50 rounded-2xl p-3">
                            <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 mb-2">
                              <span className="text-emerald-700 uppercase tracking-widest">{reply.author_name}</span>
                              <span>{new Date(reply.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-slate-700 text-sm mb-2">{reply.content}</p>
                            <button
                              onClick={() => handleToggleCommentLike(reply.id)}
                              className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition ${
                                reply.liked ? 'bg-emerald-50 text-emerald-700' : 'bg-white text-slate-500'
                              }`}
                              disabled={commentLikeLoadingId === reply.id}
                            >
                              <ThumbsUp size={10} /> {reply.like_count || 0}
                            </button>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {user && (
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="Írj hozzászólást..."
                        className="flex-1 p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition text-sm"
                        value={commentDrafts[post.id] || ''}
                        onChange={(e) => setCommentDrafts(prev => ({ ...prev, [post.id]: e.target.value }))}
                      />
                      <button
                        onClick={() => handleCreateComment(post.id)}
                        className="px-4 py-3 rounded-2xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition"
                      >
                        Küldés
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default TourDetailsScreen;