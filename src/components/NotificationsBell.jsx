import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, CalendarDays, CheckCheck, Mail, MessageSquare, User, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const NotificationsBell = () => {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const socketRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async ({ silent = false } = {}) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/notifications?limit=40`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
        setUnreadCount(Number(data.unread_count || 0));
      }
    } catch {
      // A következő automatikus frissítés újrapróbálja.
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const token = localStorage.getItem('token');
    if (!token) return undefined;

    const apiBase = import.meta.env.VITE_API_URL || '';
    const socketBase = apiBase.replace(/\/api\/?$/, '');
    const socket = io(socketBase || '/', { transports: ['websocket'] });
    socketRef.current = socket;
    let hasConnected = false;

    const handleConnect = () => {
      socket.emit('join-notifications', token);
      if (hasConnected) {
        fetchNotifications({ silent: true });
      }
      hasConnected = true;
    };
    const handleNotification = () => fetchNotifications({ silent: true });

    socket.on('connect', handleConnect);
    socket.on('notification-created', handleNotification);
    return () => {
      socket.off('connect', handleConnect);
      socket.off('notification-created', handleNotification);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [fetchNotifications]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleOutsideClick = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const markAsRead = async (notification) => {
    if (!notification.is_read) {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/notifications/${notification.id}/read`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          setNotifications((current) => current.map((item) =>
            item.id === notification.id ? { ...item, is_read: 1 } : item
          ));
          setUnreadCount((count) => Math.max(0, count - 1));
        }
      } catch {
        // A navigáció ettől még működjön.
      }
    }
    setIsOpen(false);
    if (notification.link) navigate(notification.link);
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setNotifications((current) => current.map((item) => ({ ...item, is_read: 1 })));
        setUnreadCount(0);
      }
    } catch {
      // A felhasználó később újrapróbálhatja.
    }
  };

  const formatDate = (value) => {
    if (!value) return '';
    return new Intl.DateTimeFormat('hu-HU', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen((open) => !open);
        }}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-[#5f7165] transition-colors hover:border-[#d2ddd0] hover:bg-[#eef3e9] hover:text-[#275940] focus-visible:border-[#d2ddd0] focus-visible:bg-[#eef3e9]"
        aria-label="Értesítések"
        title="Értesítések"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-[#fffefa] bg-[#ad5c49] px-1 text-[8px] font-extrabold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-12 right-0 z-[160] w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-[#d9dfd5] bg-[#fffefa] shadow-[0_24px_65px_rgba(17,41,25,0.18)] max-[620px]:fixed max-[620px]:top-[4.45rem] max-[620px]:right-3 max-[620px]:left-3 max-[620px]:w-auto">
          <div className="flex items-center justify-between gap-3 border-b border-[#d9dfd5] px-5 py-4">
            <div>
              <div className="font-serif text-xl text-[#173327]">Értesítések</div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#718076]">
                {unreadCount > 0 ? `${unreadCount} olvasatlan` : 'Minden elolvasva'}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 transition"
                  title="Összes olvasottra jelölése"
                >
                  <CheckCheck size={17} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition"
                aria-label="Bezárás"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          <div className="max-h-[28rem] overflow-y-auto">
            {loading ? (
              <div className="py-12 text-center text-sm font-bold text-slate-400">Betöltés...</div>
            ) : notifications.length === 0 ? (
              <div className="py-12 px-6 text-center">
                <Bell size={28} className="mx-auto mb-3 text-slate-300" />
                <div className="font-black text-slate-600">Még nincs értesítésed.</div>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = notification.type === 'tour_post'
                  ? MessageSquare
                  : notification.type === 'tour'
                    ? CalendarDays
                    : notification.type === 'account'
                      ? User
                      : Mail;
                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => markAsRead(notification)}
                    className={`flex w-full gap-3 border-b border-[#e8ece5] px-5 py-4 text-left transition-colors hover:bg-[#f3f6ef] ${notification.is_read ? 'bg-[#fffefa]' : 'bg-[#edf3e9] hover:bg-[#e7efe2]'}`}
                  >
                    <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${notification.is_read ? 'border-[#dde4da] bg-white text-[#79877d]' : 'border-[#c7d8c2] bg-[#dce9d7] text-[#275940]'}`}>
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-3">
                        <span className="text-sm font-bold leading-tight text-[#20382a]">{notification.title}</span>
                        {!notification.is_read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b88953]" />}
                      </span>
                      {notification.message && (
                        <span className="mt-1 block text-xs text-slate-500 leading-relaxed line-clamp-2">
                          {notification.message}
                        </span>
                      )}
                      <span className="mt-2 block text-[9px] font-black uppercase tracking-widest text-slate-400">
                        {formatDate(notification.created_at)}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsBell;
