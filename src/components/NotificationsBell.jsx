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
        className="relative p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
        aria-label="Értesítések"
        title="Értesítések"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl shadow-slate-900/15 z-[160]">
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
            <div>
              <div className="font-black text-slate-900">Értesítések</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
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
                    className={`w-full flex gap-3 px-5 py-4 text-left border-b border-slate-50 transition hover:bg-emerald-50/60 ${
                      notification.is_read ? 'bg-white' : 'bg-emerald-50/40'
                    }`}
                  >
                    <span className={`mt-0.5 w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${
                      notification.is_read ? 'bg-slate-100 text-slate-400' : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-3">
                        <span className="text-sm font-black text-slate-900 leading-tight">{notification.title}</span>
                        {!notification.is_read && <span className="mt-1.5 w-2 h-2 shrink-0 rounded-full bg-emerald-500" />}
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
