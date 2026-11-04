import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { 
  Package, Minus, X,
  CheckCircle, Users, DollarSign, 
  ChevronDown, ChevronUp, Plus, Edit3, Trash2, Calendar, MessageSquareText, XCircle, LayoutGrid, ListChecks, UserCog, Mail, Activity, AlertTriangle, Clock, ArrowRight, UserMinus,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-toastify';
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { hu } from "date-fns/locale";
import { formatPrice, formatPriceInput, parsePriceInput } from '../../utils/formatPrice';
import { formatHungarianDate, parseTourDate } from '../../utils/formatDate';

registerLocale('hu', hu);
import "../../App.css";

ChartJS.register(ArcElement, Tooltip, Legend);

const ADMIN_CHART_COLORS = [
  '#23583e', '#769577', '#c89553', '#8bafaa', '#8a6b56',
  '#acc0a4', '#d7a17d', '#607a88', '#af9f76', '#557f68'
];

const adminEyebrow = 'block text-[11px] font-extrabold uppercase tracking-[0.17em] leading-relaxed text-[#658269]';
const adminPanel = 'overflow-hidden rounded-2xl border border-[#d9dfd5] bg-[#fffefa] shadow-[0_6px_24px_rgba(29,49,32,0.04)]';

const getBookingRevenue = (booking) => {
  const storedTotal = Number(booking?.total_price);
  if (booking?.total_price !== null && booking?.total_price !== undefined && Number.isFinite(storedTotal)) {
    return storedTotal;
  }

  const basePrice = Number(booking?.price || 0);
  const extraPrice = Number(booking?.extra_price || 0);
  return (Number.isFinite(basePrice) ? basePrice : 0) + (Number.isFinite(extraPrice) ? extraPrice : 0);
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs = useMemo(() => ['overview', 'tours', 'bookings', 'waitlists', 'cancellations', 'activity', 'errors', 'users', 'email', 'equipment'], []);
  const tabParam = searchParams.get('tab');

  const [bookings, setBookings] = useState([]);
  const [deletingBookingIds, setDeletingBookingIds] = useState([]);
  const [deletingUserIds, setDeletingUserIds] = useState([]);
  const [expandedTour, setExpandedTour] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTourId, setEditingTourId] = useState(null);
  const [cancelRequests, setCancelRequests] = useState([]);
  const [activeTab, setActiveTab] = useState(() => (tabParam && validTabs.includes(tabParam) ? tabParam : 'overview'));

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && validTabs.includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams, validTabs]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams(tabId === 'overview' ? {} : { tab: tabId });
  };
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [tours, setTours] = useState([]);
  const [toursLoading, setToursLoading] = useState(true);
  const [equipment, setEquipment] = useState([]);
  const [equipmentLoading, setEquipmentLoading] = useState(true);
  const [waitlistSearch, setWaitlistSearch] = useState('');
  const [selectedWaitlistTourId, setSelectedWaitlistTourId] = useState(null);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState([]);
  const [lockedEquipmentIds, setLockedEquipmentIds] = useState([]);
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [bookingPaymentFilter, setBookingPaymentFilter] = useState('all');
  const [cancelSearch, setCancelSearch] = useState('');
  const [cancelStatusFilter, setCancelStatusFilter] = useState('all');
  const [newEquipment, setNewEquipment] = useState({
    name: '',
    description: '',
    total_quantity: '',
    is_passenger_transport: false,
    seats_per_unit: ''
  });
  const [equipmentAvailability, setEquipmentAvailability] = useState({});
  const [equipmentConflicts, setEquipmentConflicts] = useState({});
  const [initialTourEquipmentIds, setInitialTourEquipmentIds] = useState([]);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailRecipients, setEmailRecipients] = useState([]);
  const [emailTargetMode, setEmailTargetMode] = useState('selected');
  const [emailTourId, setEmailTourId] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSection, setEmailSection] = useState('send');
  const [emailInbox, setEmailInbox] = useState([]);
  const [emailSent, setEmailSent] = useState([]);
  const [emailManageLoading, setEmailManageLoading] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailModalData, setEmailModalData] = useState(null);
  const [activityLog, setActivityLog] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activitySearch, setActivitySearch] = useState('');
  const [activityTypeFilter, setActivityTypeFilter] = useState('all');
  const [errorLogs, setErrorLogs] = useState([]);
  const [errorLoading, setErrorLoading] = useState(false);
  const [errorSearch, setErrorSearch] = useState('');
  const [errorLevelFilter, setErrorLevelFilter] = useState('');
  const [isDepositEnabled, setIsDepositEnabled] = useState(false);
  const activityLabels = useMemo(() => ({
    user_registered: 'Regisztráció',
    booking_created: 'Túrára jelentkezés',
    booking_paid: 'Túra befizetés',
    booking_cancelled: 'Lejelentkezés',
    booking_cancel_requested: 'Lejelentkezési kérelem',
    booking_cancel_approved: 'Lejelentkezés jóváhagyva',
    booking_cancel_rejected: 'Lejelentkezés elutasítva',
    booking_admin_removed: 'Jelentkezés törölve (admin)',
    user_deleted: 'Fiók törlés'
  }), []);
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
    category: 'Hegyi túrák',
    subcategory: 'Hazai - Külföldi túrák',
    image_url: '', 
    start_date: '', 
    end_date: '',
    max_participants: '',
    equipment_prices: {},
    equipment_quantities: {},
    equipment_full_rental: {},
    deposit_amount: '',
    deposit_deadline: null
  };
  const [newTour, setNewTour] = useState(initialTourState);

  const fetchBookings = useCallback(async (isSilent = false) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings/all`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) {
        setBookings(Array.isArray(data) ? data : []);
      } else if (!isSilent) {
        toast.error(data.message || 'Hiba a lista frissítésekor!');
      }
    } catch (err) {
      if (!isSilent) {
        toast.error('Hiba a lista frissítésekor!');
      }
    }
  }, []);

  const fetchCancelRequests = useCallback(async (isSilent = false) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings/cancel-requests`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCancelRequests(Array.isArray(data) ? data : []);
      } else if (!isSilent) {
        toast.error(data.message || 'Hiba a lejelentkezési kérelmek betöltésekor!');
      }
    } catch (err) {
      if (!isSilent) {
        toast.error('Hiba a lejelentkezési kérelmek betöltésekor!');
      }
    }
  }, []);

  const fetchTours = useCallback(async (isSilent = false) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/tours`);
      const data = await res.json();
      if (res.ok) {
        setTours(Array.isArray(data) ? data : []);
      } else if (!isSilent) {
        toast.error('Hiba a túrák betöltésekor!');
      }
      setToursLoading(false);
    } catch (err) {
      if (!isSilent) {
        toast.error('Hiba a túrák betöltésekor!');
      }
      setToursLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async (isSilent = false) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/users`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(Array.isArray(data) ? data : []);
      } else if (!isSilent) {
        toast.error(data.message || 'Hiba a felhasználók betöltésekor!');
      }
      setUsersLoading(false);
    } catch (err) {
      if (!isSilent) {
        toast.error('Hiba a felhasználók betöltésekor!');
      }
      setUsersLoading(false);
    }
  }, []);

  const fetchEquipment = useCallback(async (isSilent = false) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/equipment`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) {
        setEquipment(Array.isArray(data) ? data : []);
      } else if (!isSilent) {
        toast.error(data.message || 'Hiba az eszközök betöltésekor!');
      }
      setEquipmentLoading(false);
    } catch (err) {
      if (!isSilent) {
        toast.error('Hiba az eszközök betöltésekor!');
      }
      setEquipmentLoading(false);
    }
  }, []);

  const fetchEmailManage = useCallback(async (isSilent = false) => {
    setEmailManageLoading(true);
    try {
      const [sentRes, inboxRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/admin/email/sent`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL}/admin/email/inbox`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const sentData = await sentRes.json();
      const inboxData = await inboxRes.json();

      if (sentRes.ok) {
        setEmailSent(Array.isArray(sentData) ? sentData : []);
      } else if (!isSilent) {
        toast.error(sentData.message || 'Nem sikerült betölteni az elküldött emaileket.');
      }

      if (inboxRes.ok) {
        setEmailInbox(Array.isArray(inboxData) ? inboxData : []);
      } else if (!isSilent) {
        toast.error(inboxData.message || 'Nem sikerült betölteni a bejövő emaileket.');
      }
    } catch (err) {
      if (!isSilent) {
        toast.error('Email kezelés betöltése sikertelen.');
      }
    } finally {
      setEmailManageLoading(false);
    }
  }, []);

  const fetchActivityLog = useCallback(async (isSilent = false) => {
    setActivityLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/activity`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) {
        setActivityLog(Array.isArray(data) ? data : []);
      } else if (!isSilent) {
        toast.error(data.message || 'Nem sikerült betölteni a tevékenységnaplót.');
      }
    } catch (err) {
      if (!isSilent) {
        toast.error('Nem sikerült betölteni a tevékenységnaplót.');
      }
    } finally {
      setActivityLoading(false);
    }
  }, []);

  const fetchErrorLogs = useCallback(async (isSilent = false) => {
    setErrorLoading(true);
    try {
      const levelQuery = errorLevelFilter ? `?level=${encodeURIComponent(errorLevelFilter)}` : '';
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/errors${levelQuery}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) {
        setErrorLogs(Array.isArray(data) ? data : []);
      } else if (!isSilent) {
        toast.error(data.message || 'Nem sikerült betölteni a hibákat.');
      }
    } catch (err) {
      if (!isSilent) {
        toast.error('Nem sikerült betölteni a hibákat.');
      }
    } finally {
      setErrorLoading(false);
    }
  }, [errorLevelFilter]);

  const openEmailModal = (payload) => {
    setEmailModalData(payload);
    setEmailModalOpen(true);
  };

  const closeEmailModal = () => {
    setEmailModalOpen(false);
    setEmailModalData(null);
  };

  // Az aktuálisan megnyitott menüponthoz tartozó adatok automatikus célzott frissítése
  const refreshActiveTabData = useCallback((isSilent = false) => {
    switch (activeTab) {
      case 'overview':
        fetchBookings(isSilent);
        fetchCancelRequests(isSilent);
        fetchUsers(isSilent);
        fetchTours(isSilent);
        break;
      case 'tours':
        fetchTours(isSilent);
        fetchBookings(isSilent);
        fetchEquipment(isSilent);
        break;
      case 'bookings':
        fetchBookings(isSilent);
        fetchTours(isSilent);
        break;
      case 'cancellations':
        fetchCancelRequests(isSilent);
        fetchBookings(isSilent);
        break;
      case 'users':
        fetchUsers(isSilent);
        break;
      case 'activity':
        fetchActivityLog(isSilent);
        break;
      case 'errors':
        fetchErrorLogs(isSilent);
        break;
      case 'email':
        fetchUsers(isSilent);
        fetchTours(isSilent);
        if (emailSection === 'manage') {
          fetchEmailManage(isSilent);
        }
        break;
      case 'equipment':
        fetchEquipment(isSilent);
        break;
      default:
        break;
    }
  }, [
    activeTab,
    emailSection,
    fetchBookings,
    fetchCancelRequests,
    fetchUsers,
    fetchTours,
    fetchEquipment,
    fetchActivityLog,
    fetchErrorLogs,
    fetchEmailManage
  ]);

  // Kezdeti adatok betöltése
  useEffect(() => {
    fetchBookings(true);
    fetchCancelRequests(true);
    fetchUsers(true);
    fetchTours(true);
    fetchEquipment(true);
  }, [fetchBookings, fetchCancelRequests, fetchUsers, fetchTours, fetchEquipment]);

  // Automatikus frissítés menüpont vagy alszakasz váltásakor
  useEffect(() => {
    refreshActiveTabData(true);
  }, [refreshActiveTabData]);



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

  const isTourExpired = useCallback((tour) => {
    if (!tour?.end_date) return false;
    const endDate = new Date(tour.end_date);
    if (Number.isNaN(endDate.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    return endDate < today;
  }, []);

  const sortedToursByCategory = useMemo(() => {
    return Object.entries(toursByCategory).reduce((acc, [category, items]) => {
      acc[category] = [...items].sort((a, b) => {
        const aExpired = isTourExpired(a);
        const bExpired = isTourExpired(b);

        if (aExpired !== bExpired) {
          return Number(aExpired) - Number(bExpired);
        }

        const aDate = new Date(a.start_date || a.end_date || 0).getTime();
        const bDate = new Date(b.start_date || b.end_date || 0).getTime();
        return aDate - bDate;
      });
      return acc;
    }, {});
  }, [toursByCategory, isTourExpired]);

  const emailEligibleTours = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tours.filter((tour) => {
      if (!tour.end_date) return true;
      const endDate = new Date(tour.end_date);
      if (Number.isNaN(endDate.getTime())) return false;
      endDate.setHours(0, 0, 0, 0);
      return endDate >= today;
    });
  }, [tours]);

  const tourParticipants = useMemo(() => {
    if (!emailTourId) return [];
    const tourId = Number(emailTourId);
    if (!tourId) return [];
    if (!emailEligibleTours.some((tour) => Number(tour.id) === tourId)) return [];
    const raw = groupedBookings[tourId]?.participants || [];
    const confirmed = raw.filter((participant) => participant.status === 'confirmed');
    const seen = new Set();
    return confirmed.filter((participant) => {
      const key = participant.user_id || participant.email || participant.id;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [emailTourId, emailEligibleTours, groupedBookings]);

  const allRecipients = useMemo(() => {
    return users.map((user) => user.email).filter(Boolean);
  }, [users]);

  const tourRecipients = useMemo(() => {
    return tourParticipants.map((participant) => participant.email).filter(Boolean);
  }, [tourParticipants]);

  const effectiveRecipients = useMemo(() => {
    if (emailTargetMode === 'all') return allRecipients;
    if (emailTargetMode === 'tour') return tourRecipients;
    return emailRecipients;
  }, [emailTargetMode, allRecipients, tourRecipients, emailRecipients]);

  const categoryRevenue = useMemo(() => {
    const tourCategoryMap = tours.reduce((acc, tour) => {
      acc[tour.id] = tour.category || 'Egyéb';
      return acc;
    }, {});

    return bookings.reduce((acc, booking) => {
      const category = tourCategoryMap[booking.tour_id] || 'Egyéb';
      acc[category] = (acc[category] || 0) + getBookingRevenue(booking);
      return acc;
    }, {});
  }, [bookings, tours]);

  const revenuePieData = useMemo(() => {
    const labels = Object.keys(categoryRevenue);
    return {
      labels,
      datasets: [
        {
          data: labels.map((label) => categoryRevenue[label]),
          backgroundColor: labels.map((_, index) => ADMIN_CHART_COLORS[index % ADMIN_CHART_COLORS.length]),
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
          backgroundColor: labels.map((_, index) => ADMIN_CHART_COLORS[index % ADMIN_CHART_COLORS.length]),
          borderWidth: 0
        }
      ]
    };
  }, [toursByCategory]);

  const getBookingStatusLabel = (booking) => {
    if (booking?.payment_status === 'paid') return 'Fizetve';
    if (booking?.deposit_paid) return 'Előleg fizetve';
    if (booking?.status === 'confirmed') return 'Jelentkezve';
    if (booking?.status === 'pending') return 'Jóváhagyásra vár';
    if (booking?.status === 'waitlist') return 'Várólistán';
    if (booking?.status === 'expired') return 'Lejárt';
    if (booking?.status === 'cancelled') return 'Lemondva';
    return booking?.status || '';
  };

  const normalizeValue = (value) => String(value || '').toLowerCase();


  const filteredBookings = useMemo(() => {
    const term = normalizeValue(bookingSearch.trim());
    return bookings.filter((booking) => {
      if (bookingStatusFilter !== 'all' && booking.status !== bookingStatusFilter) {
        return false;
      }
      if (bookingPaymentFilter === 'paid' && booking.payment_status !== 'paid') {
        return false;
      }
      if (bookingPaymentFilter === 'deposit' && (!booking.deposit_paid || booking.payment_status === 'paid')) {
        return false;
      }
      if (bookingPaymentFilter === 'unpaid' && (booking.payment_status === 'paid' || booking.deposit_paid)) {
        return false;
      }
      if (!term) return true;
      const haystack = [
        booking.title,
        booking.location,
        booking.user_name,
        booking.email
      ].map(normalizeValue).join(' ');
      return haystack.includes(term);
    });
  }, [bookings, bookingSearch, bookingStatusFilter, bookingPaymentFilter]);

  const filteredCancelRequests = useMemo(() => {
    const term = normalizeValue(cancelSearch.trim());
    return cancelRequests.filter((req) => {
      if (cancelStatusFilter !== 'all' && req.status !== cancelStatusFilter) {
        return false;
      }
      if (!term) return true;
      const haystack = [
        req.tour_title,
        req.location,
        req.user_name,
        req.email,
        req.reason
      ].map(normalizeValue).join(' ');
      return haystack.includes(term);
    });
  }, [cancelRequests, cancelSearch, cancelStatusFilter]);

  const filteredErrorLogs = useMemo(() => {
    const term = normalizeValue(errorSearch.trim());
    return errorLogs.filter((log) => {
      if (!term) return true;
      const haystack = [
        log.message,
        log.path,
        log.method,
        log.user_name,
        log.user_email
      ].map(normalizeValue).join(' ');
      return haystack.includes(term);
    });
  }, [errorLogs, errorSearch]);

  const filteredActivityLog = useMemo(() => {
    const term = normalizeValue(activitySearch.trim());
    return activityLog.filter((item) => {
      if (activityTypeFilter !== 'all' && item.type !== activityTypeFilter) {
        return false;
      }
      if (!term) return true;
      const haystack = [
        item.message,
        item.user_name,
        item.user_email,
        item.tour_title,
        activityLabels[item.type] || item.type
      ].map(normalizeValue).join(' ');
      return haystack.includes(term);
    });
  }, [activityLog, activitySearch, activityTypeFilter, activityLabels]);

  const getActivityTypeMeta = useCallback((type) => {
    switch (type) {
      case 'booking_paid':
        return {
          label: 'Túra befizetés',
          badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
          dotClass: 'bg-emerald-500'
        };
      case 'booking_created':
        return {
          label: 'Túrára jelentkezés',
          badgeClass: 'bg-[#edf2e9] text-[#275940] border-[#cbd8c7]',
          dotClass: 'bg-[#275940]'
        };
      case 'user_registered':
        return {
          label: 'Regisztráció',
          badgeClass: 'bg-blue-50 text-blue-800 border-blue-200/80',
          dotClass: 'bg-blue-500'
        };
      case 'booking_cancel_requested':
        return {
          label: 'Lejelentkezési kérelem',
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
          dotClass: 'bg-amber-500'
        };
      case 'booking_cancel_approved':
        return {
          label: 'Lejelentkezés jóváhagyva',
          badgeClass: 'bg-teal-50 text-teal-800 border-teal-200/80',
          dotClass: 'bg-teal-500'
        };
      case 'booking_cancelled':
      case 'booking_cancel_rejected':
      case 'booking_admin_removed':
      case 'user_deleted':
        return {
          label: activityLabels[type] || 'Törlés / Lemondás',
          badgeClass: 'bg-rose-50 text-rose-800 border-rose-200/80',
          dotClass: 'bg-rose-500'
        };
      default:
        return {
          label: activityLabels[type] || type,
          badgeClass: 'bg-[#f3f6ef] text-[#526b59] border-[#cbd8c7]',
          dotClass: 'bg-[#526b59]'
        };
    }
  }, [activityLabels]);

  const updateStatus = async (id, newStatus) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings/${id}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` 
      },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (res.ok) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
      toast.success(data.message || (newStatus === 'confirmed' ? "✔️ Jelentkezés jóváhagyva, értesítő email elküldve!" : "✔️ Státusz frissítve!"));
      fetchBookings(true);
    } else {
      toast.error(data.message || "Hiba a státusz frissítésekor!");
      fetchBookings(true);
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

  const handlePromoteWaitlistUser = async (bookingId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings/waitlist/${bookingId}/promote`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "🎉 Felhasználó sikeresen átmozgatva a résztvevők közé!");
        fetchBookings(true);
        fetchTours(true);
      } else {
        toast.error(data.message || "Hiba az átmozgatáskor.");
      }
    } catch (err) {
      toast.error("Hiba az átmozgatáskor.");
    }
  };

  const handleAdminRemoveBooking = async (bookingId) => {
    if (deletingBookingIds.includes(bookingId)) return;
    if (!window.confirm("Biztosan eltávolítod a túráról?")) return;
    setDeletingBookingIds(prev => [...prev, bookingId]);
    try {
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
    } catch {
      toast.error('A törlés nem sikerült. Próbáld újra.');
    } finally {
      setDeletingBookingIds(prev => prev.filter(id => id !== bookingId));
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

  const handleAdminDeleteUser = async (id) => {
    if (deletingUserIds.includes(id)) return;
    if (!window.confirm('Biztosan törlöd ezt a felhasználót? Ez nem visszavonható.')) return;
    setDeletingUserIds(prev => [...prev, id]);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Felhasználó törölve.');
        setUsers((prev) => prev.filter((u) => u.id !== id));
      } else {
        toast.error(data.message || 'Hiba történt.');
      }
    } catch (err) {
      toast.error('Hiba történt.');
    } finally {
      setDeletingUserIds(prev => prev.filter(userId => userId !== id));
    }
  };

  const handleEquipmentCreate = async () => {
    if (!newEquipment.name.trim()) {
      toast.error('Add meg az eszköz nevét.');
      return;
    }
    if (newEquipment.is_passenger_transport && Number(newEquipment.seats_per_unit) < 1) {
      toast.error('Add meg, hány ülőhely van egy járműben.');
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/equipment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: newEquipment.name.trim(),
          description: newEquipment.description,
          total_quantity: Number(newEquipment.total_quantity || 0),
          is_passenger_transport: newEquipment.is_passenger_transport,
          seats_per_unit: newEquipment.is_passenger_transport ? Number(newEquipment.seats_per_unit) : null
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Eszköz létrehozva.');
        setNewEquipment({
          name: '',
          description: '',
          total_quantity: '',
          is_passenger_transport: false,
          seats_per_unit: ''
        });
        fetchEquipment();
      } else {
        toast.error(data.message || 'Hiba történt.');
      }
    } catch (err) {
      toast.error('Hiba történt.');
    }
  };

  const handleEquipmentUpdate = async (item) => {
    if (Number(item.is_passenger_transport) && Number(item.seats_per_unit) < 1) {
      toast.error('Add meg, hány ülőhely van egy járműben.');
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/equipment/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: item.name,
          description: item.description,
          total_quantity: Number(item.total_quantity || 0),
          is_passenger_transport: Boolean(Number(item.is_passenger_transport)),
          seats_per_unit: Number(item.is_passenger_transport) ? Number(item.seats_per_unit) : null
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Eszköz frissítve.');
        fetchEquipment();
      } else {
        toast.error(data.message || 'Hiba történt.');
      }
    } catch (err) {
      toast.error('Hiba történt.');
    }
  };

  const handleEquipmentDelete = async (id) => {
    if (!window.confirm('Biztosan törlöd az eszközt?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/equipment/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Eszköz törölve.');
        fetchEquipment();
      } else {
        toast.error(data.message || 'Hiba történt.');
      }
    } catch (err) {
      toast.error('Hiba történt.');
    }
  };

  const openUserProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const loadTourEquipmentPrices = async (tourId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/tours/${tourId}/equipment`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        const priceMap = data.reduce((acc, item) => {
          acc[item.id] = Number(item.price || 0);
          return acc;
        }, {});
        const quantityMap = data.reduce((acc, item) => {
          acc[item.id] = Number(item.assigned_quantity || 1);
          return acc;
        }, {});
        const fullRentalMap = data.reduce((acc, item) => {
          acc[item.id] = Boolean(item.is_full_rental);
          return acc;
        }, {});
        setNewTour((prev) => ({ ...prev, equipment_prices: priceMap, equipment_quantities: quantityMap, equipment_full_rental: fullRentalMap }));
        const equipmentIds = data.map((item) => Number(item.id));
        setSelectedEquipmentIds(equipmentIds);
        setInitialTourEquipmentIds(equipmentIds);
        setLockedEquipmentIds(
          data
            .filter((item) => Number(item.booked_quantity || 0) > 0)
            .map((item) => Number(item.id))
        );
        return equipmentIds;
      }
    } catch (err) {
      setNewTour((prev) => ({ ...prev, equipment_prices: {}, equipment_full_rental: {} }));
      setSelectedEquipmentIds([]);
      setLockedEquipmentIds([]);
      setInitialTourEquipmentIds([]);
    }
    return [];
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

    const depositAmount = parsePriceInput(newTour.deposit_amount);
    const tourPrice = parsePriceInput(newTour.price);

    if (isDepositEnabled && (!Number.isFinite(depositAmount) || depositAmount < 1)) {
      toast.error('Az előleg összege nem lehet 0.');
      return;
    }

    if (isDepositEnabled && depositAmount > tourPrice) {
      toast.error('Az előleg összege nem lehet nagyobb a túra díjánál.');
      return;
    }

    if (
      isDepositEnabled &&
      newTour.deposit_deadline instanceof Date &&
      newTour.start_date instanceof Date
    ) {
      const depositDeadline = new Date(newTour.deposit_deadline);
      const startDate = new Date(newTour.start_date);
      depositDeadline.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);

      if (depositDeadline >= startDate) {
        toast.error('Az előleg határidejének meg kell előznie a túra kezdetét.');
        return;
      }
    }
    
    const payload = {
      ...newTour,
      price: tourPrice,
      start_date: formatDate(newTour.start_date),
      end_date: formatDate(newTour.end_date),
      duration: calculateDuration(newTour.start_date, newTour.end_date),
      max_participants: parseInt(newTour.max_participants),
      deposit_amount: isDepositEnabled ? depositAmount : null,
      deposit_deadline: newTour.deposit_deadline instanceof Date ? formatDate(newTour.deposit_deadline) : null,
      equipment_prices: equipment
        .filter((item) =>
          selectedEquipmentIds.includes(Number(item.id)) &&
          (
            lockedEquipmentIds.includes(Number(item.id)) ||
            initialTourEquipmentIds.includes(Number(item.id)) ||
            Number(equipmentAvailability[item.id] ?? item.total_quantity ?? 0) > 0
          )
        )
        .map((item) => ({
          equipment_id: Number(item.id),
          price: parsePriceInput(newTour.equipment_prices?.[item.id]),
          quantity: Math.max(1, Number(newTour.equipment_quantities?.[item.id] || 1)),
          is_full_rental: Boolean(newTour.equipment_full_rental?.[item.id]) ? 1 : 0
        }))
    };
    delete payload.equipment_quantities;
    delete payload.equipment_full_rental;

    if (newTour.start_date instanceof Date) {
      const startDate = new Date(newTour.start_date);
      startDate.setHours(0, 0, 0, 0);
      if (!editingTourId && startDate < today) {
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
    const data = await res.json();

    if (res.ok) {
      toast.success(editingTourId ? "Túra frissítve!" : "Új túra létrehozva!");
      setIsModalOpen(false);
      setEditingTourId(null);
      setNewTour(initialTourState);
      setIsDepositEnabled(false);
      setSelectedEquipmentIds([]);
      setLockedEquipmentIds([]);
      setInitialTourEquipmentIds([]);
      setEquipmentAvailability({});
      setEquipmentConflicts({});
      fetchBookings();
      fetchTours();
    } else {
      toast.error(data.message || data.error || "Hiba történt a mentés során!");
    }
  };

  const fetchEquipmentAvailability = async (
    startDate,
    endDate,
    excludeTourId = editingTourId,
    preservedEquipmentIds = initialTourEquipmentIds
  ) => {
    if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
      setEquipmentAvailability({});
      setEquipmentConflicts({});
      return;
    }
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    try {
      const params = new URLSearchParams({
        start_date: formatDate(startDate),
        end_date: formatDate(endDate)
      });
      if (excludeTourId) params.set('exclude_tour_id', excludeTourId);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/tours/equipment-availability/range?${params}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        const map = data.reduce((acc, item) => {
          acc[item.id] = Number(item.available_quantity || 0);
          return acc;
        }, {});
        const conflicts = data.reduce((acc, item) => {
          if (item.is_assigned_elsewhere) {
            acc[item.id] = item.conflicting_tours || 'másik túra';
          }
          return acc;
        }, {});
        setEquipmentAvailability(map);
        setEquipmentConflicts(conflicts);
        setSelectedEquipmentIds((current) => current.filter((equipmentId) =>
          lockedEquipmentIds.includes(Number(equipmentId)) ||
          preservedEquipmentIds.includes(Number(equipmentId)) ||
          Number(map[equipmentId] ?? 0) > 0
        ));
      } else {
        setEquipmentAvailability({});
        setEquipmentConflicts({});
      }
    } catch (err) {
      setEquipmentAvailability({});
      setEquipmentConflicts({});
    }
  };

  const openTourEditor = (tour) => {
    setEditingTourId(tour.id);
    const hasDeposit = tour.deposit_amount != null && tour.deposit_amount !== '' && Number(tour.deposit_amount) > 0;
    setIsDepositEnabled(hasDeposit);
    setSelectedEquipmentIds([]);
    setLockedEquipmentIds([]);
    setInitialTourEquipmentIds([]);
    setEquipmentAvailability({});
    setEquipmentConflicts({});
    setNewTour({
      title: tour.title || '',
      location: tour.location || '',
      description: tour.description || '',
      price: tour.price || '',
      duration: tour.duration || '',
      difficulty: tour.difficulty || 'Könnyű',
      category: tour.category || 'Hegyi túrák',
      subcategory: tour.subcategory || 'Hazai - Külföldi túrák',
      image_url: tour.image_url || '',
      max_participants: tour.max_participants || 12,
      equipment_prices: {},
      equipment_quantities: {},
      equipment_full_rental: {},
      start_date: parseTourDate(tour.start_date),
      end_date: parseTourDate(tour.end_date),
      deposit_amount: tour.deposit_amount != null ? String(tour.deposit_amount) : '',
      deposit_deadline: parseTourDate(tour.deposit_deadline),
    });
    const startDate = parseTourDate(tour.start_date);
    const endDate = parseTourDate(tour.end_date);
    loadTourEquipmentPrices(tour.id).then((equipmentIds) => {
      fetchEquipmentAvailability(startDate, endDate, tour.id, equipmentIds);
    });
    handleTabChange('tours');
    setIsModalOpen(true);
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
    return bookings.reduce((sum, booking) => sum + getBookingRevenue(booking), 0);
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

  const totalWaitlistCount = useMemo(() => {
    return bookings.filter(
      (b) => String(b?.status || '').toLowerCase() === 'waitlist'
    ).length;
  }, [bookings]);

  const tabs = [
    { id: 'overview', label: 'Áttekintés', icon: LayoutGrid },
    { id: 'tours', label: 'Túrák', icon: Calendar },
    { id: 'bookings', label: 'Jelentkezések', icon: ListChecks },
    { id: 'waitlists', label: 'Várólisták', icon: Clock },
    { id: 'cancellations', label: 'Lejelentkezések', icon: MessageSquareText },
    { id: 'activity', label: 'Tevékenységnapló', icon: Activity },
    { id: 'errors', label: 'Hibák', icon: AlertTriangle },
    { id: 'users', label: 'Felhasználók', icon: UserCog },
    { id: 'email', label: 'Email küldés', icon: Mail },
    { id: 'equipment', label: 'Eszközök', icon: Users }
  ];

  const toggleEmailRecipient = (email) => {
    setEmailRecipients((prev) => {
      if (prev.includes(email)) {
        return prev.filter((item) => item !== email);
      }
      return [...prev, email];
    });
  };

  const handleSendAdminEmail = async () => {
    const recipients = effectiveRecipients;

    if (!recipients.length) {
      toast.error('Nincs kiválasztott címzett.');
      return;
    }
    if (!emailSubject.trim()) {
      toast.error('Add meg az email tárgyát.');
      return;
    }
    if (!emailMessage.trim()) {
      toast.error('Add meg az üzenetet.');
      return;
    }

    setEmailSending(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          recipients,
          subject: emailSubject.trim(),
          message: emailMessage.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Email elküldve.');
        setEmailSubject('');
        setEmailMessage('');
        setEmailRecipients([]);
        setEmailTargetMode('selected');
        setEmailTourId('');
      } else {
        toast.error(data.message || 'Email küldés sikertelen.');
      }
    } catch (err) {
      toast.error('Email küldés sikertelen.');
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-[#173327]">
      <div className="mx-auto max-w-[1500px] px-4 py-6 md:px-8 md:py-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[245px_minmax(0,1fr)] lg:gap-10">
          <aside className="self-start overflow-hidden rounded-[1.25rem] border border-[#214934] bg-[#173327] text-[#f9faf4] shadow-[0_16px_36px_rgba(25,47,34,0.1)] lg:sticky lg:top-6">
            <div className="border-b border-white/15 px-5 pt-7 pb-6">
              <div className={`${adminEyebrow} text-[#a9c4a7]`}>Túrázz Velünk / Admin</div>
              <div className="mt-2 font-serif text-[1.8rem] leading-tight tracking-tight">Vezérlőpult<span className="text-[#c9a66b]">.</span></div>
              <p className="mt-3 text-xs leading-relaxed text-[#b7c9b9] max-lg:hidden">Túrák, közösség és foglalások egy helyen.</p>
            </div>
            <nav className="grid gap-1 p-3 max-lg:flex max-lg:overflow-x-auto" aria-label="Adminisztráció">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex min-h-11 w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-colors max-lg:w-auto max-lg:shrink-0 max-lg:whitespace-nowrap ${isActive ? 'border-[#cae0c1]/20 bg-[#eef3e9] text-[#173327]' : 'border-transparent text-[#c8d9c9] hover:bg-white/10 hover:text-white'}`}
                  >
                    <Icon size={17} strokeWidth={1.8} />
                    <span>{tab.label}</span>
                    {tab.id === 'bookings' && pendingBookingCount > 0 && <span className="ml-auto rounded-full bg-[#bd8a5a] px-1.5 py-0.5 text-[10px] font-extrabold text-white">{pendingBookingCount}</span>}
                    {tab.id === 'waitlists' && totalWaitlistCount > 0 && <span className="ml-auto rounded-full bg-[#bd8a5a] px-1.5 py-0.5 text-[10px] font-extrabold text-white">{totalWaitlistCount}</span>}
                    {tab.id === 'cancellations' && pendingCancelCount > 0 && <span className="ml-auto rounded-full bg-[#bd8a5a] px-1.5 py-0.5 text-[10px] font-extrabold text-white">{pendingCancelCount}</span>}
                  </button>
                );
              })}
            </nav>
            <div className="mx-3 mb-3 flex items-start gap-3 border-t border-white/15 px-2 pt-4 pb-1 max-lg:hidden">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#c5a56f] shadow-[0_0_0_4px_rgba(197,165,111,0.17)]" />
              <div>
                <span className={`${adminEyebrow} text-[#a5baa8]`}>Mai figyelő</span>
                <strong className="mt-1 block text-xs font-semibold text-white">{pendingBookingCount} nyitott kérelem</strong>
              </div>
            </div>
          </aside>

          <main className="min-w-0 space-y-8">
            <header className="flex flex-col items-start justify-between gap-6 border-b border-[#d9dfd5] pt-2 pb-6 md:flex-row md:items-end">
              <div>
                <p className={adminEyebrow}>Adminisztráció / {tabs.find((tab) => tab.id === activeTab)?.label}</p>
                <h1 className="mt-2 font-serif text-[clamp(2.6rem,5vw,4.35rem)] font-normal leading-tight tracking-[-0.05em]">{tabs.find((tab) => tab.id === activeTab)?.label}</h1>
                <p className="mt-3 text-sm text-[#66766b]">
                  {activeTab === 'overview'
                    ? 'A túrák és a közösség pillanatképe.'
                    : 'A részletek és műveletek ezen a felületen kezelhetők.'}
                </p>
              </div>
              {activeTab === 'tours' && (
                <button 
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#275940] px-5 py-3 text-xs font-bold text-white transition-colors hover:bg-[#173d2a]"
                  onClick={() => {
                    setEditingTourId(null);
                    setSelectedEquipmentIds([]);
                    setLockedEquipmentIds([]);
                    setInitialTourEquipmentIds([]);
                    setEquipmentAvailability({});
                    setEquipmentConflicts({});
                    const equipmentMap = equipment.reduce((acc, item) => {
                      acc[item.id] = 0;
                      return acc;
                    }, {});
                    setNewTour({ ...initialTourState, equipment_prices: equipmentMap, equipment_full_rental: {} });
                    setIsDepositEnabled(false);
                    setIsModalOpen(true);
                  }}
                >
                  <Plus size={18} /> Új túra létrehozása
                </button>
              )}
            </header>

            {activeTab === 'overview' && (
              <div className="grid gap-7">
                <div className="flex items-end justify-between gap-4 max-sm:flex-col max-sm:items-start">
                  <div>
                    <span className={adminEyebrow}>Áttekintés</span>
                  </div>
                  <span className="whitespace-nowrap text-xs text-[#66766b]">{new Date().toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: 'Túrák', value: totalTours, icon: Calendar, detail: 'Létrehozott túrák' },
                    { label: 'Jelentkezések', value: totalBookings, icon: ListChecks, detail: 'Összes jelentkezés' },
                    { label: 'Felhasználók', value: totalUsers, icon: Users, detail: 'Regisztrált tagok' },
                    { label: 'Bevétel', value: `${formatPrice(totalRevenue)} Ft`, icon: DollarSign, detail: 'Túrák és eszközök' }
                  ].map(({ label, value, icon, detail }) => (
                    <article key={label} className="flex min-h-40 flex-col rounded-2xl border border-[#d9dfd5] bg-[#fffefa] p-5 shadow-[0_6px_24px_rgba(29,49,32,0.04)]">
                      <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-widest text-[#5e7262]"><span>{label}</span>{React.createElement(icon, { size: 19, strokeWidth: 1.8 })}</div>
                      <strong className="mt-auto font-serif text-[clamp(1.75rem,2.5vw,2.2rem)] font-normal leading-tight tracking-tight text-[#173327]">{value}</strong>
                      <span className="mt-2 text-xs text-[#7b897d]">{detail}</span>
                    </article>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <div className="min-w-0 rounded-2xl border border-[#d9dfd5] bg-[#fffefa] p-6 shadow-[0_6px_24px_rgba(29,49,32,0.04)] max-sm:p-4">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className={adminEyebrow}>Összes bevétel</div>
                        <h3 className="mt-1 font-serif text-[1.65rem] font-normal tracking-tight">Bevétel kategóriánként</h3>
                      </div>
                      <div className="whitespace-nowrap text-xs font-extrabold text-[#38634a]">{formatPrice(totalRevenue)} Ft</div>
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
                            plugins: {
                              legend: { position: 'bottom' },
                              tooltip: {
                                callbacks: {
                                  label: (context) => `${context.label}: ${formatPrice(context.raw)} Ft`
                                }
                              }
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 rounded-2xl border border-[#d9dfd5] bg-[#fffefa] p-6 shadow-[0_6px_24px_rgba(29,49,32,0.04)] max-sm:p-4">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className={adminEyebrow}>Túrák megoszlása</div>
                        <h3 className="mt-1 font-serif text-[1.65rem] font-normal tracking-tight">Túrák kategóriánként</h3>
                      </div>
                      <div className="whitespace-nowrap text-xs font-extrabold text-[#38634a]">{totalTours} db</div>
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
              <div className="grid gap-5">
                {toursLoading ? (
                  <div className="bg-white rounded-[2rem] border border-slate-100 p-10 text-center text-slate-400 font-bold">Betöltés...</div>
                ) : Object.keys(sortedToursByCategory).length === 0 ? (
                  <div className="bg-white rounded-[2rem] border border-slate-100 p-10 text-center text-slate-400 font-bold">Nincs túra.</div>
                ) : (
                  Object.entries(sortedToursByCategory).map(([category, items]) => {
                    const isCategoryExpanded = expandedCategories[category] ?? false;

                    return (
                      <div key={category} className="space-y-4 rounded-2xl border border-[#d9dfd5] bg-[#fffefa] p-3 shadow-[0_6px_24px_rgba(29,49,32,0.04)]">
                        <button
                          type="button"
                          onClick={() => setExpandedCategories((prev) => ({ ...prev, [category]: !prev[category] }))}
                          className="w-full flex items-center justify-between gap-4 rounded-lg px-4 py-3 text-left transition-colors hover:bg-[#f3f5ef]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="font-serif text-xl text-[#173327]">{category}</div>
                            <span className="rounded-full bg-[#edf2e9] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#477258]">
                              {items.length} db
                            </span>
                          </div>
                          {isCategoryExpanded ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
                        </button>

                        {isCategoryExpanded && (
                          <div className="grid gap-6 px-2 pb-2">
                            {items.map((tour) => {
                              const participants = groupedBookings[tour.id]?.participants || [];
                              const pendingCount = participants.filter(p => p.status === 'pending').length;
                              const confirmedCount = participants.filter(p => p.status === 'confirmed').length;
                              const saturation = tour.max_participants > 0
                                ? Math.round((participants.length / tour.max_participants) * 100)
                                : 0;
                              const expired = isTourExpired(tour);

                              return (
                                <div
                                  key={tour.id}
                                  className={`cursor-pointer overflow-hidden rounded-xl border transition-all hover:border-[#98ad98] hover:shadow-[0_8px_24px_rgba(29,49,32,0.09)] ${expired ? 'border-[#e6d7d0] bg-[#fffaf7]' : 'border-[#dbe2d8] bg-white'}`}
                                  onClick={() => navigate(`/tours/${tour.id}`)}
                                >
                                  <div className="flex flex-col items-start justify-between gap-6 p-5 md:flex-row md:items-center md:p-7">
                                    <div className="flex items-center gap-6">
                                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${expired ? 'bg-[#f6e8e4] text-[#9d5b4c]' : 'bg-[#e7efe6] text-[#326348]'}`}>
                                        <Calendar size={23} strokeWidth={1.8} />
                                      </div>
                                      <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <h2 className={`font-serif text-2xl ${expired ? 'text-[#875d51]' : 'text-[#173327]'}`}>{tour.title}</h2>
                                          {expired && (
                                            <span className="inline-flex items-center rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                                              Lejárt
                                            </span>
                                          )}
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-[#68766c]">
                                          <span className="flex items-center gap-1"><Users size={14} /> {participants.length} Fő</span>
                                          <span>Max: {tour.max_participants || 0} fő</span>
                                          <span>Függőben: {pendingCount} fő</span>
                                          <span className="flex items-center gap-1"><DollarSign size={14} /> {formatPrice(tour.price)} Ft</span>
                                          {tour.subcategory && <span>{tour.subcategory}</span>}
                                          {tour.start_date && tour.end_date && (
                                            <span>{formatHungarianDate(tour.start_date)} - {formatHungarianDate(tour.end_date)}</span>
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
                                          className={`h-full transition-all duration-1000 ${expired ? 'bg-red-500' : 'bg-emerald-500'}`} 
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
                                          openTourEditor(tour);
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
                                                        Jóváhagyás
                                                      </button>
                                                    ) : null}
                                                    {p.status === 'confirmed' ? (
                                                      <button 
                                                        onClick={(e) => { e.stopPropagation(); updateStatus(p.id, 'cancelled'); }}
                                                        className="bg-amber-500 text-white text-[10px] font-black px-4 py-2 rounded-xl hover:bg-amber-600 transition"
                                                      >
                                                        Törlés
                                                      </button>
                                                    ) : null}
                                                    <button disabled={deletingBookingIds.includes(p.id)} aria-busy={deletingBookingIds.includes(p.id)} 
                                                      onClick={(e) => { e.stopPropagation(); handleAdminRemoveBooking(p.id); }}
                                                      className="disabled:opacity-60 disabled:cursor-wait bg-red-50 text-red-600 text-[10px] font-black px-4 py-2 rounded-xl hover:bg-red-500 hover:text-white transition"
                                                    >{deletingBookingIds.includes(p.id) ? 'Törlés…' : <> Eltávolítás </>}</button>
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
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'bookings' && (
              <div className={adminPanel}>
                <div className="p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4 border-b border-[#d9dfd5] bg-[#e8eee4]">
                  <div>
                    <h2 className="text-2xl font-semibold text-[#173327]">Összes jelentkezés</h2>
                    <p className="mt-2 text-sm text-[#526b59]">Jelentkezők, jóváhagyások és fizetési állapotok egy helyen.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={fetchBookings}
                      className="px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-widest bg-[#275940] text-white  hover:bg-[#173d2a] transition"
                    >
                      Frissítés
                    </button>
                    <div className="text-xs font-semibold uppercase tracking-widest text-[#275940]">
                      {filteredBookings.length} / {bookings.length} db
                    </div>
                  </div>
                </div>
                <div className="p-4 sm:p-6 bg-[#f3f6ef] border-b border-[#d9dfd5]">
                  <div className="grid grid-cols-1 md:grid-cols-[1.3fr_0.6fr_0.6fr] gap-3">
                    <input
                      type="text"
                      placeholder="Keresés túra, felhasználó vagy email alapján..."
                      className="w-full px-4 py-3 rounded-lg bg-[#fffefa] border border-[#cbd8c7] text-sm font-semibold focus:ring-2 focus:ring-[#cbdcc8] focus:border-[#477258] outline-none"
                      value={bookingSearch}
                      onChange={(e) => setBookingSearch(e.target.value)}
                    />
                    <select
                      className="w-full px-4 py-3 rounded-lg bg-[#fffefa] border border-[#cbd8c7] text-sm font-semibold focus:ring-2 focus:ring-[#cbdcc8] focus:border-[#477258] outline-none"
                      value={bookingStatusFilter}
                      onChange={(e) => setBookingStatusFilter(e.target.value)}
                    >
                      <option value="all">Összes státusz</option>
                      <option value="pending">Függőben</option>
                      <option value="confirmed">Elfogadva</option>
                      <option value="expired">Lejárt</option>
                      <option value="cancelled">Lemondva</option>
                    </select>
                    <select
                      className="w-full px-4 py-3 rounded-lg bg-[#fffefa] border border-[#cbd8c7] text-sm font-semibold focus:ring-2 focus:ring-[#cbdcc8] focus:border-[#477258] outline-none"
                      value={bookingPaymentFilter}
                      onChange={(e) => setBookingPaymentFilter(e.target.value)}
                    >
                      <option value="all">Összes fizetés</option>
                      <option value="paid">Fizetve</option>
                      <option value="deposit">Előleg fizetve</option>
                      <option value="unpaid">Nem fizetett</option>
                    </select>
                  </div>
                </div>
                <div className="px-4 pb-6 sm:px-6 overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left">
                    <thead>
                      <tr className="text-[10px] font-semibold uppercase text-[#718174] tracking-widest">
                        <th className="py-4 pr-5">Túra</th>
                        <th className="py-4 pr-5">Felhasználó</th>
                        <th className="py-4 pr-5">Státusz</th>
                        <th className="py-4 text-right">Művelet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d9dfd5]">
                      {filteredBookings.length === 0 && (
                        <tr><td colSpan={4} className="px-4 py-14 text-center text-sm text-[#607267]">Nincs a szűrésnek megfelelő jelentkezés.</td></tr>
                      )}
                      {filteredBookings.map((b) => (
                        <tr key={b.id} className="text-sm transition-colors hover:bg-[#edf2e9]/60">
                          <td className="py-4 pr-5">
                            <div className="font-semibold text-[#173327]">{b.title}</div>
                            <div className="text-xs text-[#718174]">{b.location}</div>
                          </td>
                          <td className="py-4 pr-5">
                            <div className="font-bold text-[#173327]">{b.user_name}</div>
                            <div className="text-xs text-[#718174]">{b.email}</div>
                          </td>
                          <td className="py-4 pr-5">
                            <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${b.status === 'confirmed' ? 'border-[#cbdcc8] bg-[#edf2e9] text-[#275940]' : b.status === 'pending' ? 'border-amber-200 bg-amber-50 text-amber-800' : b.status === 'cancelled' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-[#d9dfd5] bg-[#f5f5f0] text-[#607267]'}`}>{getBookingStatusLabel(b)}</span>
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {b.status === 'pending' && (
                                <button
                                  onClick={() => updateStatus(b.id, 'confirmed')}
                                  className="bg-[#275940] text-white text-[10px] font-semibold px-4 py-2 rounded-xl hover:bg-[#173d2a] transition"
                                >
                                  ELFOGADÁS
                                </button>
                              )}
                              <button disabled={deletingBookingIds.includes(b.id)} aria-busy={deletingBookingIds.includes(b.id)}
                                onClick={() => handleAdminRemoveBooking(b.id)}
                                className="disabled:opacity-60 disabled:cursor-wait bg-red-500/10 text-red-500 text-[10px] font-semibold px-4 py-2 rounded-xl hover:bg-red-500 hover:text-white transition"
                              >{deletingBookingIds.includes(b.id) ? 'Törlés…' : <> TÖRLÉS </>}</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'waitlists' && (
              <div className="space-y-6">
                <div className={`${adminPanel} flex flex-col justify-between gap-4 p-6 md:flex-row md:items-center`}>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                      <Clock className="text-amber-500" size={24} /> Várólisták kezelése
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Betelt túrák várólistáján szereplő felhasználók kezelése és manuális átmozgatása a résztvevők közé.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Keresés túra, név vagy email alapján..."
                      value={waitlistSearch}
                      onChange={(e) => setWaitlistSearch(e.target.value)}
                      className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs focus:ring-2 focus:ring-amber-500 outline-none w-64 text-gray-800"
                    />
                  </div>
                </div>

                {(() => {
                  const toursWithWaitlist = tours.map(tour => {
                    const tourBookings = bookings.filter(b => b.tour_id === tour.id);
                    const waitlisted = tourBookings.filter(b => b.status === 'waitlist');
                    const confirmedOrPending = tourBookings.filter(b => ['confirmed', 'pending'].includes(b.status));
                    return {
                      ...tour,
                      waitlisted,
                      confirmedOrPending
                    };
                  }).filter(t => {
                    if (waitlistSearch.trim()) {
                      const term = waitlistSearch.toLowerCase();
                      const matchTitle = (t.title || '').toLowerCase().includes(term);
                      const matchUser = t.waitlisted.some(w => (w.user_name || '').toLowerCase().includes(term) || (w.user_email || '').toLowerCase().includes(term));
                      return matchTitle || matchUser;
                    }
                    return t.waitlisted.length > 0;
                  });

                  if (toursWithWaitlist.length === 0) {
                    return (
                      <div className="bg-white p-12 rounded-3xl text-center border border-gray-100 shadow-sm">
                        <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-100">
                          <Clock size={32} />
                        </div>
                        <h3 className="text-lg font-black text-gray-900">Jelenleg nincs várólistás jelentkező</h3>
                        <p className="text-xs text-gray-500 max-w-md mx-auto mt-2">
                          Amikor egy túra betelik és új felhasználók jelentkeznek rá, automatikusan ide kerülnek a várólistára.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      {toursWithWaitlist.map(t => (
                        <div key={t.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                          <div className="p-6 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-3">
                                <h3 className="text-lg font-black tracking-tight">{t.title}</h3>
                                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-black">
                                  ⏳ Várólista: {t.waitlisted.length} fő
                                </span>
                              </div>
                              <div className="text-xs text-slate-400 mt-1 flex items-center gap-4">
                                <span>Időpont: {formatHungarianDate(t.start_date)} - {formatHungarianDate(t.end_date)}</span>
                                <span>Kapacitás: <strong className="text-emerald-400">{t.confirmedOrPending.length} / {t.max_participants || '∞'} fő</strong></span>
                              </div>
                            </div>
                            <Link
                              to={`/tours/${t.id}`}
                              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 self-start md:self-auto"
                            >
                              Túra megtekintése <ArrowRight size={14} />
                            </Link>
                          </div>

                          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Waitlisted Users */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                                  <Clock size={14} /> Várólistások (Sorrendben)
                                </h4>
                                <span className="text-[10px] font-bold text-gray-400">Jelentkezési idő szerint</span>
                              </div>
                              <div className="space-y-2.5">
                                {t.waitlisted.map((w, index) => (
                                  <div key={w.id} className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                                        #{index + 1}
                                      </div>
                                      <div>
                                        <div className="font-bold text-gray-900 text-sm">{w.user_name}</div>
                                        <div className="text-xs text-gray-500">{w.user_email}</div>
                                        <div className="text-[10px] text-amber-700/80 mt-0.5">
                                          Jelentkezett: {w.booked_at ? new Date(w.booked_at).toLocaleString('hu-HU') : '-'}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <button
                                        onClick={() => handlePromoteWaitlistUser(w.id)}
                                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
                                        title="Áthelyezés a résztvevők közé és értesítő email küldése"
                                      >
                                        <CheckCircle size={14} /> Áthelyezés résztvevőnek
                                      </button>
                                      <button disabled={deletingBookingIds.includes(w.id)} aria-busy={deletingBookingIds.includes(w.id)}
                                        onClick={() => handleAdminRemoveBooking(w.id)}
                                        className="disabled:opacity-60 disabled:cursor-wait p-2 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-xl border border-red-100 transition"
                                        title="Eltávolítás a várólistáról"
                                      >{deletingBookingIds.includes(w.id) ? 'Törlés…' : <> <Trash2 size={14} /> </>}</button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Current Active Participants */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                                  <Users size={14} /> Jelenlegi résztvevők ({t.confirmedOrPending.length} fő)
                                </h4>
                                <span className="text-[10px] font-bold text-gray-400">Helycsinálás törléssel lehetséges</span>
                              </div>
                              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                                {t.confirmedOrPending.length === 0 ? (
                                  <div className="p-4 bg-gray-50 rounded-2xl text-center text-xs text-gray-400">
                                    Nincs aktív résztvevő
                                  </div>
                                ) : (
                                  t.confirmedOrPending.map(p => (
                                    <div key={p.id} className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between gap-3">
                                      <div>
                                        <div className="font-bold text-gray-900 text-xs flex items-center gap-2">
                                          {p.user_name}
                                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                                            p.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                          }`}>
                                            {p.status === 'confirmed' ? 'Elfogadva' : 'Jóváhagyásra vár'}
                                          </span>
                                          {p.payment_status === 'paid' && (
                                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-emerald-600 text-white">
                                              Fizetve
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[11px] text-gray-500">{p.user_email}</div>
                                      </div>
                                      <button disabled={deletingBookingIds.includes(p.id)} aria-busy={deletingBookingIds.includes(p.id)}
                                        onClick={() => handleAdminRemoveBooking(p.id)}
                                        className="disabled:opacity-60 disabled:cursor-wait px-3 py-1.5 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-[11px] font-bold border border-red-100 transition flex items-center gap-1 shrink-0"
                                        title="Résztvevő törlése a túráról a hely felszabadításához"
                                      >{deletingBookingIds.includes(p.id) ? 'Törlés…' : <> <UserMinus size={13} /> Törlés a túráról </>}</button>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === 'cancellations' && (
              <div className={adminPanel}>
                <div className="p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4 border-b border-[#d9dfd5] bg-[#e8eee4]">
                  <div>
                    <h2 className="font-serif text-3xl font-normal text-[#173327]">Lejelentkezési kérelmek</h2>
                    <p className="mt-2 text-sm text-[#526b59]">Tekintsd át az indokokat, és kezeld a résztvevők lejelentkezési kérelmeit.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={fetchCancelRequests}
                      className="px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-widest bg-[#275940] text-white  hover:bg-[#173d2a] transition"
                    >
                      Frissítés
                    </button>
                    <div className="px-4 py-2 rounded-full bg-[#edf2e9] text-[#275940] text-xs font-semibold uppercase tracking-widest">
                      {pendingCancelCount} függőben
                    </div>
                  </div>
                </div>
                <div className="p-4 sm:p-6 bg-[#f3f6ef] border-b border-[#d9dfd5]">
                  <div className="grid grid-cols-1 md:grid-cols-[1.3fr_0.6fr] gap-3">
                    <input
                      type="text"
                      placeholder="Keresés túra, felhasználó vagy email alapján..."
                      className="w-full px-4 py-3 rounded-lg bg-[#fffefa] border border-[#cbd8c7] text-sm font-semibold focus:ring-2 focus:ring-[#cbdcc8] focus:border-[#477258] outline-none"
                      value={cancelSearch}
                      aria-label="Lejelentkezési kérelmek keresése"
                      onChange={(e) => setCancelSearch(e.target.value)}
                    />
                    <select
                      className="w-full px-4 py-3 rounded-lg bg-[#fffefa] border border-[#cbd8c7] text-sm font-semibold focus:ring-2 focus:ring-[#cbdcc8] focus:border-[#477258] outline-none"
                      value={cancelStatusFilter}
                      aria-label="Kérelem állapota"
                      onChange={(e) => setCancelStatusFilter(e.target.value)}
                    >
                      <option value="all">Összes státusz</option>
                      <option value="pending">Függőben</option>
                      <option value="approved">Jóváhagyva</option>
                      <option value="rejected">Elutasítva</option>
                    </select>
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  {filteredCancelRequests.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#cbd8c7] bg-[#f3f6ef] px-6 py-12 text-center text-sm text-[#607267]">Nincs a szűrésnek megfelelő lejelentkezési kérelem.</div>
                  ) : (
                    <div className="grid gap-4">
                      {filteredCancelRequests.map((req) => (
                        <div key={req.id} className="bg-[#fffefa] rounded-xl p-6 border border-[#cbd8c7]">
                          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                            <div>
                              <div className="text-[10px] font-semibold uppercase tracking-widest text-[#275940]">{req.tour_title}</div>
                              <div className="text-xs text-[#718174] font-bold">{req.location}</div>
                              <div className="text-xl font-semibold text-[#173327] mt-1">{req.user_name}</div>
                              <div className="text-xs text-[#718174] font-bold">{req.email}</div>
                            </div>
                            <div className="rounded-lg border border-[#d9dfd5] bg-[#f3f6ef] p-4">
                              <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#718174]">Lejelentkezés indoka</div>
                              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[#526b59]">{req.reason || 'Nincs megadott indok.'}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 border-t border-[#d9dfd5] pt-4 xl:col-span-2">
                              <Link
                                to={`/tours/${req.tour_id}`}
                                className="px-4 py-2 rounded-xl bg-[#e8eee4] text-[#275940] text-xs font-semibold uppercase tracking-widest hover:bg-[#d9e4d4] transition"
                              >
                                Túra megnyitása
                              </Link>
                              {req.status === 'pending' ? (
                                <>
                                  <button
                                    onClick={() => updateCancelRequestStatus(req.id, 'approved')}
                                    className="px-4 py-2 rounded-xl bg-[#275940] text-white text-xs font-semibold uppercase tracking-widest hover:bg-[#173d2a]"
                                  >
                                    Jóváhagyás
                                  </button>
                                  <button
                                    onClick={() => updateCancelRequestStatus(req.id, 'rejected')}
                                    className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 text-xs font-semibold uppercase tracking-widest hover:bg-red-500 hover:text-white"
                                  >
                                    Elutasítás
                                  </button>
                                </>
                              ) : req.status === 'approved' ? (
                                <div className="flex flex-wrap items-center gap-2 text-[#275940] text-xs font-semibold uppercase tracking-widest">
                                  <CheckCircle size={16} /> Jóváhagyva
                                </div>
                              ) : (
                                <div className="flex flex-wrap items-center gap-2 text-red-500 text-xs font-semibold uppercase tracking-widest">
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
              <div className={adminPanel}>
                <div className="p-8 md:p-10 flex items-center justify-between bg-gradient-to-r from-white to-slate-50">
                  <div>
                    <h2 className="text-2xl font-black text-emerald-950">Felhasználók</h2>
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Jogosultságok és túrák</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={fetchUsers}
                      className="px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition"
                    >
                      Frissítés
                    </button>
                    <div className="text-xs font-black uppercase tracking-widest text-emerald-600">{users.length} db</div>
                  </div>
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
                                  <button disabled={deletingUserIds.includes(user.id)} aria-busy={deletingUserIds.includes(user.id)}
                                    onClick={() => handleAdminDeleteUser(user.id)}
                                    className="disabled:opacity-60 disabled:cursor-wait px-4 py-2 rounded-xl bg-red-500/10 text-red-500 text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition self-start md:self-auto"
                                  >{deletingUserIds.includes(user.id) ? 'Törlés…' : <> Felhasználó törlése </>}</button>
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
                                          <button disabled={deletingBookingIds.includes(booking.id)} aria-busy={deletingBookingIds.includes(booking.id)}
                                            onClick={() => handleAdminRemoveBooking(booking.id)}
                                            className="disabled:opacity-60 disabled:cursor-wait px-4 py-2 rounded-xl bg-red-500/10 text-red-500 text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white"
                                          >{deletingBookingIds.includes(booking.id) ? 'Törlés…' : <> Törlés a túráról </>}</button>
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

            {activeTab === 'activity' && (
              <div className={adminPanel}>
                <div className="p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4 border-b border-[#d9dfd5] bg-[#e8eee4]">
                  <div>
                    <span className={adminEyebrow}>Eseménynapló</span>
                    <h2 className="text-2xl font-semibold text-[#173327] mt-1">Tevékenységnapló</h2>
                    <p className="mt-2 text-sm text-[#526b59]">
                      Regisztrációk, jelentkezések, fizetések és lejelentkezések időrendben.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fetchActivityLog(false)}
                      className="px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-widest bg-[#275940] text-white hover:bg-[#173d2a] transition flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      <RefreshCw size={14} className={activityLoading ? 'animate-spin' : ''} />
                      Frissítés
                    </button>
                    <div className="text-xs font-semibold uppercase tracking-widest text-[#275940] bg-[#edf2e9] px-3.5 py-2 rounded-full border border-[#cbd8c7]">
                      {filteredActivityLog.length} / {activityLog.length} esemény
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6 bg-[#f3f6ef] border-b border-[#d9dfd5]">
                  <div className="grid grid-cols-1 md:grid-cols-[1.3fr_0.7fr] gap-3">
                    <input
                      type="text"
                      placeholder="Keresés esemény, felhasználó vagy túra alapján..."
                      className="w-full px-4 py-3 rounded-lg bg-[#fffefa] border border-[#cbd8c7] text-sm font-semibold focus:ring-2 focus:ring-[#cbdcc8] focus:border-[#477258] outline-none text-[#173327] placeholder:text-[#88998b]"
                      value={activitySearch}
                      onChange={(e) => setActivitySearch(e.target.value)}
                    />
                    <select
                      className="w-full px-4 py-3 rounded-lg bg-[#fffefa] border border-[#cbd8c7] text-sm font-semibold focus:ring-2 focus:ring-[#cbdcc8] focus:border-[#477258] outline-none text-[#173327]"
                      value={activityTypeFilter}
                      onChange={(e) => setActivityTypeFilter(e.target.value)}
                    >
                      <option value="all">Összes eseménytípus</option>
                      {Object.entries(activityLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  {activityLoading ? (
                    <div className="rounded-xl border border-dashed border-[#cbd8c7] bg-[#f3f6ef] px-6 py-12 text-center text-sm font-semibold text-[#607267]">
                      Betöltés folyamatban...
                    </div>
                  ) : filteredActivityLog.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#cbd8c7] bg-[#f3f6ef] px-6 py-12 text-center text-sm font-semibold text-[#607267]">
                      Nincs a szűrésnek megfelelő naplózott esemény.
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {filteredActivityLog.map((item) => {
                        const typeMeta = getActivityTypeMeta(item.type);
                        return (
                          <div
                            key={item.id}
                            className="bg-[#fffefa] rounded-xl p-5 sm:p-6 border border-[#cbd8c7] shadow-sm hover:border-[#b4c7b0] transition"
                          >
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                              <div className="space-y-2 min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2.5">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${typeMeta.badgeClass}`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${typeMeta.dotClass}`} />
                                    {typeMeta.label}
                                  </span>
                                  <span className="text-xs text-[#718174]">
                                    {item.created_at
                                      ? new Date(item.created_at).toLocaleString('hu-HU', {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })
                                      : ''}
                                  </span>
                                </div>

                                <div className="text-base sm:text-lg font-semibold text-[#173327] leading-snug break-words">
                                  {item.message}
                                </div>

                                {(item.user_name || item.tour_title) && (
                                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                                    {item.user_name && (
                                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f3f6ef] border border-[#d9dfd5] text-[#173327]">
                                        <span className="text-[#718174] font-medium">Felhasználó:</span>
                                        {item.user_id ? (
                                          <Link
                                            to={`/profile/${item.user_id}`}
                                            className="font-bold text-[#275940] hover:text-[#173d2a] hover:underline"
                                          >
                                            {item.user_name}
                                          </Link>
                                        ) : (
                                          <strong className="font-bold">{item.user_name}</strong>
                                        )}
                                        {item.user_email && (
                                          <span className="text-[#718174] text-[11px] hidden sm:inline">
                                            ({item.user_email})
                                          </span>
                                        )}
                                      </div>
                                    )}

                                    {item.tour_title && (
                                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f3f6ef] border border-[#d9dfd5] text-[#173327]">
                                        <span className="text-[#718174] font-medium">Túra:</span>
                                        {item.tour_id ? (
                                          <Link
                                            to={`/tours/${item.tour_id}`}
                                            className="font-bold text-[#275940] hover:text-[#173d2a] hover:underline"
                                          >
                                            {item.tour_title}
                                          </Link>
                                        ) : (
                                          <strong className="font-bold">{item.tour_title}</strong>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0 self-start md:self-center pt-2 md:pt-0">
                                {item.tour_id && (
                                  <Link
                                    to={`/tours/${item.tour_id}`}
                                    className="px-3.5 py-2 rounded-lg bg-[#e8eee4] text-[#275940] text-xs font-semibold uppercase tracking-wider hover:bg-[#d9e4d4] transition flex items-center gap-1.5"
                                  >
                                    Túra megtekintése
                                    <ArrowRight size={13} />
                                  </Link>
                                )}
                                {item.user_id && !item.tour_id && (
                                  <Link
                                    to={`/profile/${item.user_id}`}
                                    className="px-3.5 py-2 rounded-lg bg-[#e8eee4] text-[#275940] text-xs font-semibold uppercase tracking-wider hover:bg-[#d9e4d4] transition flex items-center gap-1.5"
                                  >
                                    Profil megtekintése
                                    <ArrowRight size={13} />
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'errors' && (
              <div className={adminPanel}>
                <div className="p-8 md:p-10 flex items-center justify-between bg-gradient-to-r from-white to-slate-50">
                  <div>
                    <h2 className="text-2xl font-black text-emerald-950">Hibanapló</h2>
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Szerver hibák és rendellenességek</div>
                  </div>
                  <button
                    type="button"
                    onClick={fetchErrorLogs}
                    className="px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition"
                  >
                    Frissítés
                  </button>
                </div>
                <div className="px-8 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.6fr] gap-3">
                    <input
                      type="text"
                      placeholder="Keresés üzenet, endpoint vagy felhasználó alapján..."
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={errorSearch}
                      onChange={(e) => setErrorSearch(e.target.value)}
                    />
                    <select
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={errorLevelFilter}
                      onChange={(e) => setErrorLevelFilter(e.target.value)}
                    >
                      <option value="">Összes szint</option>
                      <option value="error">Error</option>
                      <option value="warn">Warn</option>
                      <option value="info">Info</option>
                    </select>
                  </div>
                </div>
                <div className="px-8 pb-8">
                  {errorLoading ? (
                    <div className="text-center py-10 text-slate-400 font-bold">Betöltés...</div>
                  ) : filteredErrorLogs.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 font-bold">Nincs naplózott hiba.</div>
                  ) : (
                    <div className="grid gap-4">
                      {filteredErrorLogs.map((log) => (
                        <div key={log.id} className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                                {log.level || 'error'} · {log.status_code || ''}
                              </div>
                              <div className="text-lg font-black text-slate-900 mt-1">{log.message}</div>
                              <div className="text-xs text-slate-400 mt-2">
                                {log.method ? `${log.method} ` : ''}{log.path || ''}
                              </div>
                              {(log.user_name || log.user_email) && (
                                <div className="text-xs text-slate-500 mt-2">
                                  Felhasználó: {log.user_name || 'Ismeretlen'} {log.user_email ? `(${log.user_email})` : ''}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 font-bold">
                              {log.created_at ? new Date(log.created_at).toLocaleString('hu-HU') : ''}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'email' && (
              <div className={adminPanel}>
                <div className="p-8 md:p-10 flex items-center justify-between bg-gradient-to-r from-white to-slate-50">
                  <div>
                    <h2 className="text-2xl font-black text-emerald-950">Email küldés</h2>
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Üzenet küldése és kezelése</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setEmailSection('send')}
                      className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition ${emailSection === 'send' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-white text-slate-600 hover:bg-emerald-50'}`}
                    >
                      Email küldés
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmailSection('manage')}
                      className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition ${emailSection === 'manage' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-white text-slate-600 hover:bg-emerald-50'}`}
                    >
                      Email kezelése
                    </button>
                  </div>
                </div>

                <div className="px-8 pb-8">
                  {emailSection === 'send' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
                      <div className="space-y-4">
                        <div className="text-xs font-black uppercase tracking-widest text-emerald-600">
                          Címzettek: {effectiveRecipients.length}
                        </div>
                        <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tárgy</label>
                          <input
                            type="text"
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            placeholder="Pl. Fontos információ a közelgő túráról"
                            className="w-full mt-2 p-3 bg-white border border-slate-100 rounded-2xl"
                          />
                        </div>
                        <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Üzenet</label>
                          <textarea
                            rows={8}
                            value={emailMessage}
                            onChange={(e) => setEmailMessage(e.target.value)}
                            placeholder="Írd ide az üzenetet..."
                            className="w-full mt-2 p-3 bg-white border border-slate-100 rounded-2xl resize-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleSendAdminEmail}
                          disabled={emailSending}
                          className="w-full py-4 rounded-[2rem] font-black text-sm bg-emerald-600 text-white shadow-xl hover:bg-emerald-700 transition-all disabled:opacity-60"
                        >
                          {emailSending ? 'Küldés folyamatban...' : 'Email küldése'}
                        </button>
                      </div>

                      <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Címzettek</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                              {emailTargetMode === 'tour' ? 'Túra résztvevői' : emailTargetMode === 'all' ? 'Összes felhasználó' : 'Kijelölt'}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { id: 'selected', label: 'Kijelölt felhasználók' },
                              { id: 'all', label: 'Összes felhasználó' },
                              { id: 'tour', label: 'Túra résztvevői' }
                            ].map((mode) => (
                              <button
                                key={mode.id}
                                type="button"
                                onClick={() => setEmailTargetMode(mode.id)}
                                className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition ${emailTargetMode === mode.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-white text-slate-600 hover:bg-emerald-50'}`}
                              >
                                {mode.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {emailTargetMode === 'tour' && (
                          <div className="mt-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Túra kiválasztása</label>
                            <select
                              value={emailTourId}
                              onChange={(e) => setEmailTourId(e.target.value)}
                              className="w-full mt-2 p-3 bg-white border border-slate-100 rounded-2xl"
                            >
                              <option value="">Válassz túrát...</option>
                              {emailEligibleTours.map((tour) => (
                                <option key={tour.id} value={tour.id}>
                                  {tour.title}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {usersLoading ? (
                          <div className="text-center py-10 text-slate-400 font-bold">Betöltés...</div>
                        ) : emailTargetMode === 'all' ? (
                          <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-600">
                            Az email az összes felhasználónak ki lesz küldve.
                          </div>
                        ) : emailTargetMode === 'tour' ? (
                          <div className="mt-4">
                            {!emailTourId ? (
                              <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-500">
                                Válassz ki egy túrát a résztvevők listájához.
                              </div>
                            ) : tourParticipants.length === 0 ? (
                              <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-500">
                                Nincs elfogadott résztvevő a kiválasztott túrán.
                              </div>
                            ) : (
                              <div className="grid gap-3 max-h-[420px] overflow-y-auto pr-2">
                                {tourParticipants.map((participant) => (
                                  <div key={participant.user_id} className="flex items-center gap-3 p-3 rounded-2xl border bg-white border-slate-100">
                                    <div>
                                      <div className="text-sm font-black text-slate-900">{participant.user_name}</div>
                                      <div className="text-xs text-slate-400 font-bold">{participant.email}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : users.length === 0 ? (
                          <div className="text-center py-10 text-slate-400 font-bold">Nincs felhasználó.</div>
                        ) : (
                          <div className="mt-4 grid gap-3 max-h-[420px] overflow-y-auto pr-2">
                            {users.map((user) => (
                              <label
                                key={user.id}
                                className="flex items-center gap-3 p-3 rounded-2xl border bg-white border-slate-100 hover:border-emerald-200 transition"
                              >
                                <input
                                  type="checkbox"
                                  checked={emailRecipients.includes(user.email)}
                                  onChange={() => toggleEmailRecipient(user.email)}
                                  className="accent-emerald-600"
                                />
                                <div>
                                  <div className="text-sm font-black text-slate-900">{user.name}</div>
                                  <div className="text-xs text-slate-400 font-bold">{user.email}</div>
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-black uppercase tracking-widest text-slate-400">Email kezelése</div>
                        <button
                          type="button"
                          onClick={fetchEmailManage}
                          className="px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition"
                        >
                          Frissítés
                        </button>
                      </div>

                      {emailManageLoading ? (
                        <div className="text-center py-10 text-slate-400 font-bold">Betöltés...</div>
                      ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                          <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
                            <div className="text-sm font-black text-emerald-900">Elküldött emailek</div>
                            {emailSent.length === 0 ? (
                              <div className="text-sm text-slate-500 mt-4">Nincs elküldött email.</div>
                            ) : (
                              <div className="mt-4 space-y-3 max-h-[420px] overflow-y-auto pr-2">
                                {emailSent.map((item) => (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => openEmailModal({
                                      type: 'sent',
                                      subject: item.subject,
                                      message: item.message,
                                      date: item.created_at,
                                      recipients: item.recipients
                                    })}
                                    className="w-full text-left bg-white rounded-2xl p-4 border border-slate-100 hover:border-emerald-200 transition"
                                  >
                                    <div className="text-sm font-black text-slate-900">{item.subject}</div>
                                    <div className="text-xs text-slate-400 mt-1">{new Date(item.created_at).toLocaleString('hu-HU')}</div>
                                    <div className="text-xs text-slate-500 mt-2">Címzettek: {item.recipients.length}</div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
                            <div className="text-sm font-black text-emerald-900">Bejövő emailek</div>
                            {emailInbox.length === 0 ? (
                              <div className="text-sm text-slate-500 mt-4">Nincs bejövő email regisztrált címtől.</div>
                            ) : (
                              <div className="mt-4 space-y-3 max-h-[420px] overflow-y-auto pr-2">
                                {emailInbox.map((item) => (
                                  <button
                                    key={item.uid}
                                    type="button"
                                    onClick={() => openEmailModal({
                                      type: 'inbox',
                                      subject: item.subject || '(Nincs tárgy)',
                                      message: item.text || '',
                                      date: item.date,
                                      from: item.from
                                    })}
                                    className="w-full text-left bg-white rounded-2xl p-4 border border-slate-100 hover:border-emerald-200 transition"
                                  >
                                    <div className="text-sm font-black text-slate-900">{item.subject || '(Nincs tárgy)'}</div>
                                    <div className="text-xs text-slate-400 mt-1">
                                      {item.from?.name ? `${item.from.name} <${item.from.email}>` : item.from?.email}
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">{item.date ? new Date(item.date).toLocaleString('hu-HU') : ''}</div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {emailModalOpen && emailModalData && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4" onClick={closeEmailModal}>
                <div
                  className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest text-emerald-600">
                        {emailModalData.type === 'sent' ? 'Elküldött email' : 'Bejövő email'}
                      </div>
                      <div className="text-xl font-black text-slate-900 mt-2">{emailModalData.subject}</div>
                      {emailModalData.date && (
                        <div className="text-xs text-slate-400 mt-1">{new Date(emailModalData.date).toLocaleString('hu-HU')}</div>
                      )}
                      {emailModalData.type === 'inbox' && emailModalData.from && (
                        <div className="text-xs text-slate-500 mt-1">
                          {emailModalData.from?.name ? `${emailModalData.from.name} <${emailModalData.from.email}>` : emailModalData.from?.email}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={closeEmailModal}
                      className="px-3 py-2 rounded-2xl text-xs font-black uppercase tracking-widest bg-slate-100 text-slate-600 hover:bg-slate-200"
                    >
                      Bezárás
                    </button>
                  </div>
                  <div className="p-6">
                    {emailModalData.type === 'sent' && emailModalData.recipients && (
                      <div className="text-xs text-slate-500 mb-4">
                        Címzettek: {emailModalData.recipients.length}
                      </div>
                    )}
                    <div className="text-sm text-slate-700 whitespace-pre-line">
                      {emailModalData.message || 'Nincs megjelenitheto tartalom.'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'equipment' && (
              <div className={adminPanel}>
                <div className="p-6 sm:p-8 flex items-center justify-between border-b border-[#d9dfd5] bg-[#e8eee4]">
                  <div>
                    <h2 className="text-2xl font-semibold text-emerald-950">Eszközök</h2>
                    <p className="mt-2 text-sm text-[#526b59]">Felszerelések, járművek és a rendelkezésre álló készlet kezelése.</p>
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-[#275940]">{equipment.length} db</div>
                </div>

                <div className="p-4 sm:p-8 space-y-6">
                  <div className="bg-[#edf2e9] rounded-xl p-6 border border-[#cbd8c7]">
                    <h3 className="mb-1 font-serif text-2xl text-[#173327]">Új eszköz</h3>
                    <p className="mb-5 text-sm text-[#526b59]">Add meg az eszköz adatait. Járműnél az ülőhelyek számát is beállíthatod.</p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <input
                        type="text"
                        placeholder="Eszköz neve"
                        value={newEquipment.name}
                        onChange={(e) => setNewEquipment((prev) => ({ ...prev, name: e.target.value }))}
                        className="w-full p-3 text-sm text-[#173327] outline-none focus:border-[#477258] focus:ring-2 focus:ring-[#cbdcc8] bg-[#fffefa] border border-[#cbd8c7] rounded-lg"
                      />
                      <input
                        type="number"
                        placeholder="Darabszám"
                        value={newEquipment.total_quantity}
                        onChange={(e) => setNewEquipment((prev) => ({ ...prev, total_quantity: e.target.value }))}
                        className="w-full p-3 text-sm text-[#173327] outline-none focus:border-[#477258] focus:ring-2 focus:ring-[#cbdcc8] bg-[#fffefa] border border-[#cbd8c7] rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="Leírás (opcionális)"
                        value={newEquipment.description}
                        onChange={(e) => setNewEquipment((prev) => ({ ...prev, description: e.target.value }))}
                        className="w-full p-3 text-sm text-[#173327] outline-none focus:border-[#477258] focus:ring-2 focus:ring-[#cbdcc8] bg-[#fffefa] border border-[#cbd8c7] rounded-lg md:col-span-2"
                      />
                      <label className="md:col-span-2 flex items-center gap-3 p-3 bg-[#fffefa] border border-[#cbd8c7] rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newEquipment.is_passenger_transport}
                          onChange={(e) => setNewEquipment((prev) => ({
                            ...prev,
                            is_passenger_transport: e.target.checked,
                            seats_per_unit: e.target.checked ? prev.seats_per_unit : ''
                          }))}
                          className="h-5 w-5 accent-[#275940]"
                        />
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#526b59]">Utasszállítás?</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        disabled={!newEquipment.is_passenger_transport}
                        placeholder="Férőhely / jármű"
                        value={newEquipment.seats_per_unit}
                        onChange={(e) => setNewEquipment((prev) => ({ ...prev, seats_per_unit: e.target.value }))}
                        className="w-full p-3 text-sm text-[#173327] outline-none focus:border-[#477258] focus:ring-2 focus:ring-[#cbdcc8] bg-[#fffefa] border border-[#cbd8c7] rounded-lg md:col-span-2 disabled:opacity-40"
                      />
                    </div>
                    <button
                      onClick={handleEquipmentCreate}
                      className="mt-4 px-6 py-3 rounded-lg bg-[#275940] text-white text-xs font-semibold uppercase tracking-widest hover:bg-[#173d2a]"
                    >
                      Eszköz létrehozása
                    </button>
                  </div>

                  {equipmentLoading ? (
                    <div className="text-center py-10 text-[#718174] font-bold">Betöltés...</div>
                  ) : equipment.length === 0 ? (
                    <div className="text-center py-10 text-[#718174] font-bold">Nincs eszköz.</div>
                  ) : (
                    <div className="grid gap-4">
                      {equipment.map((item) => (
                        <div key={item.id} className="bg-[#fffefa] rounded-xl p-6 border border-[#cbd8c7] transition-colors hover:border-[#8da68b]">
                          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#d9dfd5] pb-4">
                            <h3 className="font-serif text-xl text-[#173327]">{item.name || 'Névtelen eszköz'}</h3>
                            <span className="rounded-full bg-[#edf2e9] px-3 py-1 text-xs font-semibold text-[#275940]">{Number(item.is_passenger_transport) ? 'Utasszállító jármű' : 'Felszerelés'}</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) =>
                                setEquipment((prev) => prev.map((row) => row.id === item.id ? { ...row, name: e.target.value } : row))
                              }
                              className="w-full p-3 text-sm text-[#173327] outline-none focus:border-[#477258] focus:ring-2 focus:ring-[#cbdcc8] bg-[#edf2e9] border border-[#cbd8c7] rounded-lg"
                            />
                            <input
                              type="number"
                              value={item.total_quantity}
                              onChange={(e) =>
                                setEquipment((prev) => prev.map((row) => row.id === item.id ? { ...row, total_quantity: e.target.value } : row))
                              }
                              className="w-full p-3 text-sm text-[#173327] outline-none focus:border-[#477258] focus:ring-2 focus:ring-[#cbdcc8] bg-[#edf2e9] border border-[#cbd8c7] rounded-lg"
                            />
                            <input
                              type="text"
                              value={item.description || ''}
                              onChange={(e) =>
                                setEquipment((prev) => prev.map((row) => row.id === item.id ? { ...row, description: e.target.value } : row))
                              }
                              className="w-full p-3 text-sm text-[#173327] outline-none focus:border-[#477258] focus:ring-2 focus:ring-[#cbdcc8] bg-[#edf2e9] border border-[#cbd8c7] rounded-lg md:col-span-2"
                            />
                            <label className="md:col-span-2 flex items-center gap-3 p-3 bg-[#edf2e9] border border-[#cbd8c7] rounded-lg cursor-pointer">
                              <input
                                type="checkbox"
                                checked={Boolean(Number(item.is_passenger_transport))}
                                onChange={(e) =>
                                  setEquipment((prev) => prev.map((row) => row.id === item.id ? {
                                    ...row,
                                    is_passenger_transport: e.target.checked,
                                    seats_per_unit: e.target.checked ? (row.seats_per_unit || '') : ''
                                  } : row))
                                }
                                className="h-5 w-5 accent-[#275940]"
                              />
                              <span className="text-xs font-semibold uppercase tracking-wider text-[#526b59]">Utasszállítás?</span>
                            </label>
                            <input
                              type="number"
                              min="1"
                              disabled={!Number(item.is_passenger_transport)}
                              placeholder="Férőhely / jármű"
                              value={item.seats_per_unit || ''}
                              onChange={(e) =>
                                setEquipment((prev) => prev.map((row) => row.id === item.id ? { ...row, seats_per_unit: e.target.value } : row))
                              }
                              className="w-full p-3 text-sm text-[#173327] outline-none focus:border-[#477258] focus:ring-2 focus:ring-[#cbdcc8] bg-[#edf2e9] border border-[#cbd8c7] rounded-lg md:col-span-2 disabled:opacity-40"
                            />
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              onClick={() => handleEquipmentUpdate(item)}
                              className="px-4 py-2 rounded-xl bg-[#275940] text-white text-xs font-semibold uppercase tracking-widest hover:bg-[#173d2a]"
                            >
                              Mentés
                            </button>
                            <button
                              onClick={() => handleEquipmentDelete(item.id)}
                              className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 text-xs font-semibold uppercase tracking-widest hover:bg-red-500 hover:text-white"
                            >
                              Törlés
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-[#0f1f17]/70 backdrop-blur-sm"></div>
          <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-[#dce5d8] p-6 sm:p-8 overflow-y-auto max-h-[90vh] z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* FEJLÉC */}
            <div className="border-b border-[#d8dfd4] pb-4 mb-6 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#648067]">Adminisztráció</p>
                <h2 className="mt-1 font-serif text-2xl sm:text-3xl text-[#173327]">
                  {editingTourId ? 'Túra szerkesztése' : 'Új túra meghirdetése'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingTourId(null);
                  setIsDepositEnabled(false);
                  setNewTour(initialTourState);
                }}
                className="p-2 rounded-xl text-[#718174] hover:bg-[#ecefe6] hover:text-[#173327] transition border border-transparent hover:border-[#cad6c9]"
                aria-label="Ablak bezárása"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitTour} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="form-label-premium">Túra megnevezése</label>
                <input
                  type="text"
                  required
                  value={newTour.title}
                  className="form-input-premium"
                  onChange={e => setNewTour({...newTour, title: e.target.value})}
                />
              </div>

              <div>
                <label className="form-label-premium">Helyszín</label>
                <input
                  type="text"
                  required
                  value={newTour.location}
                  className="form-input-premium"
                  onChange={e => setNewTour({...newTour, location: e.target.value})}
                />
              </div>

              <div>
                <label className="form-label-premium">Kategória</label>
                <select
                  value={newTour.category}
                  className="form-input-premium"
                  onChange={e => setNewTour({...newTour, category: e.target.value})}
                >
                  <option>Hegyi túrák</option>
                  <option>Vízitúrák</option>
                  <option>Jóga</option>
                  <option>Motoros</option>
                </select>
              </div>

              <div>
                <label className="form-label-premium">Alkategória</label>
                <input
                  type="text"
                  value={newTour.subcategory}
                  className="form-input-premium"
                  onChange={e => setNewTour({...newTour, subcategory: e.target.value})}
                />
              </div>

              <div>
                <label className="form-label-premium">Nehézség</label>
                <select
                  value={newTour.difficulty}
                  className="form-input-premium"
                  onChange={e => setNewTour({...newTour, difficulty: e.target.value})}
                >
                  <option value="Könnyű">Könnyű</option>
                  <option value="Közepes">Közepes</option>
                  <option value="Nehéz">Nehéz</option>
                </select>
              </div>

              <div className="md:col-span-1">
                <label className="form-label-premium">Időtartam (Intervallum)</label>
                <div className="relative">
                  <DatePicker
                    selectsRange={true}
                    startDate={newTour.start_date instanceof Date ? newTour.start_date : null}
                    endDate={newTour.end_date instanceof Date ? newTour.end_date : null}
                    minDate={new Date()}
                    onChange={(update) => {
                      const [start, end] = update;
                      setNewTour((current) => {
                        const deadlineIsInvalid =
                          current.deposit_deadline instanceof Date &&
                          start instanceof Date &&
                          current.deposit_deadline >= start;

                        return {
                          ...current,
                          start_date: start,
                          end_date: end,
                          deposit_deadline: deadlineIsInvalid ? null : current.deposit_deadline
                        };
                      });
                      if (start && end) {
                        fetchEquipmentAvailability(start, end);
                      } else {
                        setEquipmentAvailability({});
                        setEquipmentConflicts({});
                      }
                    }}
                    className="form-input-premium font-medium"
                    wrapperClassName="w-full"
                    dateFormat="yyyy. MM. dd."
                    locale="hu"
                    calendarStartDay={1}
                    placeholderText="Válaszd ki az intervallumot..."
                    isClearable={true}
                  />
                  <Calendar className="absolute right-3.5 top-3.5 text-[#648067] pointer-events-none" size={18} />
                </div>
              </div>

              <div>
                <label className="form-label-premium">Ár (Ft)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={formatPriceInput(newTour.price)}
                  className="form-input-premium"
                  onChange={e => setNewTour({...newTour, price: formatPriceInput(e.target.value)})}
                />
              </div>

              <div className="md:col-span-2 rounded-2xl border border-[#dce5d8] bg-[#f7f9f5] p-4">
                <label className="flex items-center gap-3 text-sm font-bold text-[#173327] cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#275940]"
                    checked={isDepositEnabled}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsDepositEnabled(checked);
                      if (!checked) {
                        setNewTour(prev => ({
                          ...prev,
                          deposit_amount: '',
                          deposit_deadline: null
                        }));
                      }
                    }}
                  />
                  Előleg szükséges (opcionális)
                </label>
                {isDepositEnabled && (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="form-label-premium">Előleg összege (Ft)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        className="form-input-premium"
                        value={formatPriceInput(newTour.deposit_amount)}
                        onChange={e => setNewTour(prev => ({ ...prev, deposit_amount: formatPriceInput(e.target.value) }))}
                        placeholder="Pl. 15 000"
                      />
                    </div>
                    <div>
                      <label className="form-label-premium">Előleg határideje</label>
                      <div className="relative">
                        <DatePicker
                          selected={newTour.deposit_deadline}
                          onChange={date => setNewTour(prev => ({ ...prev, deposit_deadline: date }))}
                          locale="hu"
                          dateFormat="yyyy. MM. dd."
                          placeholderText="Dátum kiválasztása"
                          minDate={new Date()}
                          maxDate={(() => {
                            if (!(newTour.start_date instanceof Date)) return null;
                            const previousDay = new Date(newTour.start_date);
                            previousDay.setDate(previousDay.getDate() - 1);
                            return previousDay;
                          })()}
                          className="form-input-premium"
                          wrapperClassName="w-full"
                        />
                        <Calendar className="absolute right-3.5 top-3.5 text-[#648067] pointer-events-none" size={18} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 rounded-2xl border border-[#dce5d8] bg-[#f7f9f5] p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#dce5d8] pb-3 mb-4">
                  <div>
                    <h3 className="font-serif text-xl text-[#173327]">Felszerelések & Bérleti díjak</h3>
                    <p className="mt-1 text-xs text-[#65756a]">Válaszd ki a túrához tartozó eszközöket és add meg a díjukat.</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border transition-all ${
                    selectedEquipmentIds.length > 0 
                      ? 'bg-[#edf3ec] text-[#275940] border-[#b9cfbb]' 
                      : 'bg-white text-[#718174] border-[#dce5d8]'
                  }`}>
                    {selectedEquipmentIds.length} felszerelés csatolva
                  </span>
                </div>

                {(!newTour.start_date || !newTour.end_date) && (
                  <div className="mb-4 p-3 bg-[#fdf8f0] border border-[#f0debe] rounded-xl flex items-center gap-2.5 text-xs text-[#876027] font-medium">
                    <AlertTriangle size={15} className="text-[#c89553] shrink-0" />
                    <span>Az átfedő túrák pontos szabad készletének számításához előbb válassz időtartamot a fenti naptárban!</span>
                  </div>
                )}

                <div className="grid gap-3">
                  {equipmentLoading ? (
                    <div className="p-4 text-center text-xs text-[#718174] font-medium bg-white rounded-xl border border-[#dce5d8]">
                      Felszerelések betöltése...
                    </div>
                  ) : equipment.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#718174] font-medium bg-white rounded-xl border border-[#dce5d8]">
                      Nincs regisztrált felszerelés. Hozz létre újat az Eszközök fülön.
                    </div>
                  ) : (
                    equipment.map((item) => {
                      const equipmentId = Number(item.id);
                      const isSelected = selectedEquipmentIds.includes(equipmentId);
                      const isLocked = lockedEquipmentIds.includes(equipmentId);
                      const wasInitiallyAssigned = initialTourEquipmentIds.includes(equipmentId);
                      const availableFromStock = Number(equipmentAvailability[item.id] ?? item.total_quantity ?? 0);
                      const isUnavailable = availableFromStock <= 0 && !wasInitiallyAssigned;
                      const currentQty = Number(newTour.equipment_quantities?.[item.id] || 1);
                      const maxAssignQty = Math.max(0, availableFromStock);
                      const isPassengerTransport = Boolean(Number(item.is_passenger_transport));
                      const seatsPerUnit = isPassengerTransport ? Math.max(1, Number(item.seats_per_unit || 1)) : 1;

                      if (isPassengerTransport) {
                        return (
                          <div
                            key={item.id}
                            className={`flex flex-col gap-3.5 p-4 rounded-xl border transition-all duration-200 ${
                              isSelected
                                ? 'bg-white border-[#8eaf92] shadow-sm ring-2 ring-[#477258]/15'
                                : isUnavailable
                                  ? 'bg-[#f7f9f5]/60 border-[#e4eae1] opacity-60'
                                  : 'bg-white hover:bg-[#fcfffa] border-[#dce5d8] hover:border-[#b4c7b0] shadow-2xs'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <label className="relative flex items-center justify-center pt-0.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    disabled={isLocked || isUnavailable}
                                    aria-label={`${item.name} csatolása a túrához`}
                                    className="h-4 w-4 accent-[#275940] disabled:cursor-not-allowed cursor-pointer"
                                    onChange={(e) => {
                                      if (e.target.checked && isUnavailable) return;
                                      setSelectedEquipmentIds((prev) => e.target.checked
                                        ? [...new Set([...prev, equipmentId])]
                                        : prev.filter((id) => id !== equipmentId));
                                      if (e.target.checked && !newTour.equipment_quantities?.[item.id]) {
                                        setNewTour(prev => ({
                                          ...prev,
                                          equipment_quantities: {
                                            ...(prev.equipment_quantities || {}),
                                            [item.id]: 1
                                          }
                                        }));
                                      }
                                    }}
                                  />
                                </label>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`font-bold text-sm tracking-tight ${isSelected ? 'text-[#173327]' : 'text-[#344a3c]'}`}>
                                      {item.name}
                                    </span>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0 ${
                                      newTour.equipment_full_rental?.[item.id]
                                        ? 'text-[#8a5b29] bg-[#faefe0] border-[#ebd0ad]'
                                        : 'text-[#275940] bg-[#eef5ee] border-[#c5dcce]'
                                    }`}>
                                      {newTour.equipment_full_rental?.[item.id] ? 'Teljes jármű bérlés' : `${seatsPerUnit} férőhely / jármű`}
                                    </span>
                                    {isLocked && (
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a5b29] bg-[#faefe0] px-2 py-0.5 rounded-md border border-[#ebd0ad] shrink-0">
                                        Foglalás alatt
                                      </span>
                                    )}
                                    {isUnavailable && !isSelected && (
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#9c523f] bg-[#fcece9] px-2 py-0.5 rounded-md border border-[#f5c7be] shrink-0">
                                        Elfogyott
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className="text-[11px] font-medium text-[#65756a]">
                                      Készlet: <strong className="text-[#173327] font-semibold">{item.total_quantity} db</strong>
                                    </span>
                                    <span className="text-[#cad6c9]">•</span>
                                    <span className="text-[11px] font-medium">
                                      Szabad készletből: <strong className={availableFromStock > 0 ? 'text-[#275940] font-bold' : 'text-[#9c523f] font-bold'}>{availableFromStock} db</strong>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {!isSelected && !isUnavailable && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedEquipmentIds(prev => [...new Set([...prev, equipmentId])]);
                                    if (!newTour.equipment_quantities?.[item.id]) {
                                      setNewTour(prev => ({
                                        ...prev,
                                        equipment_quantities: {
                                          ...(prev.equipment_quantities || {}),
                                          [item.id]: 1
                                        }
                                      }));
                                    }
                                  }}
                                  className="text-xs font-bold text-[#477258] hover:text-[#173327] bg-[#edf3ec] hover:bg-[#dfeadd] px-3.5 py-1.5 rounded-xl border border-[#b9cfbb] transition cursor-pointer shrink-0"
                                >
                                  + Hozzárendelés
                                </button>
                              )}
                            </div>

                            {isSelected && (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 pt-3.5 border-t border-[#e4eae1] mt-1">
                                <div className="flex flex-col min-w-0">
                                  <span className="form-label-premium">Darabszám</span>
                                  <div className="flex items-center h-10 w-full bg-[#f7f9f5] border border-[#dce5d8] rounded-xl overflow-hidden hover:border-[#b4c7b0] focus-within:border-[#477258] focus-within:ring-2 focus-within:ring-[#477258]/15 focus-within:bg-white transition">
                                    <button
                                      type="button"
                                      disabled={currentQty <= (isLocked ? currentQty : 1) || Boolean(newTour.equipment_full_rental?.[item.id])}
                                      onClick={() => {
                                        const next = Math.max(isLocked ? currentQty : 1, currentQty - 1);
                                        setNewTour((prev) => ({
                                          ...prev,
                                          equipment_quantities: {
                                            ...(prev.equipment_quantities || {}),
                                            [item.id]: next
                                          }
                                        }));
                                      }}
                                      className="w-9 h-full shrink-0 flex items-center justify-center text-[#648067] hover:text-[#173327] hover:bg-[#edf2e9] active:bg-[#dfeadd] disabled:opacity-25 rounded-l-xl transition cursor-pointer"
                                      title="Darabszám csökkentése"
                                    >
                                      <Minus size={13} strokeWidth={2.5} />
                                    </button>
                                    <div className="flex-1 flex items-center justify-center px-1">
                                      <input
                                        type="number"
                                        min={isLocked ? currentQty : 1}
                                        max={maxAssignQty}
                                        disabled={maxAssignQty < (isLocked ? currentQty : 1)}
                                        className="w-12 text-center font-bold text-sm bg-transparent outline-none text-[#173327] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        value={newTour.equipment_quantities?.[item.id] ?? 1}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value) || 1;
                                          const minQ = isLocked ? currentQty : 1;
                                          if (maxAssignQty < minQ) return;
                                          const clamped = Math.min(Math.max(minQ, val), maxAssignQty);
                                          setNewTour((prev) => ({
                                            ...prev,
                                            equipment_quantities: {
                                              ...(prev.equipment_quantities || {}),
                                              [item.id]: clamped
                                            }
                                          }));
                                        }}
                                      />
                                      <span className="text-xs font-semibold text-[#718174] pr-1 select-none">db</span>
                                    </div>
                                    <button
                                      type="button"
                                      disabled={currentQty >= maxAssignQty || Boolean(newTour.equipment_full_rental?.[item.id])}
                                      onClick={() => {
                                        const next = Math.min(maxAssignQty, currentQty + 1);
                                        setNewTour((prev) => ({
                                          ...prev,
                                          equipment_quantities: {
                                            ...(prev.equipment_quantities || {}),
                                            [item.id]: next
                                          }
                                        }));
                                      }}
                                      className="w-9 h-full shrink-0 flex items-center justify-center text-[#648067] hover:text-[#173327] hover:bg-[#edf2e9] active:bg-[#dfeadd] disabled:opacity-25 rounded-r-xl transition cursor-pointer"
                                      title="Darabszám növelése"
                                    >
                                      <Plus size={13} strokeWidth={2.5} />
                                    </button>
                                  </div>
                                  <span className={`mt-0.5 text-center text-[9px] font-semibold ${currentQty > maxAssignQty ? 'text-[#9c523f]' : 'text-[#718174]'}`}>
                                    {currentQty > maxAssignQty ? `Készlethiány · max: ${maxAssignQty} db` : `max: ${maxAssignQty} db`}
                                  </span>
                                  <span className="text-[9px] font-bold mt-0.5 text-center text-[#275940]">
                                    {newTour.equipment_full_rental?.[item.id]
                                      ? `${currentQty} jármű (teljes bérlés)`
                                      : `${currentQty * seatsPerUnit} ülőhely`}
                                  </span>
                                </div>

                                <div className="flex flex-col min-w-0">
                                  <span className="form-label-premium">Bérlési mód</span>
                                  <div className="flex items-center gap-1 h-10 w-full bg-[#f7f9f5] border border-[#dce5d8] rounded-xl overflow-hidden p-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setNewTour((prev) => ({
                                          ...prev,
                                          equipment_full_rental: { ...(prev.equipment_full_rental || {}), [item.id]: false }
                                        }));
                                      }}
                                      className={`flex-1 h-full text-[10px] font-bold uppercase tracking-wider transition rounded-lg ${!newTour.equipment_full_rental?.[item.id] ? 'bg-[#275940] text-white shadow-xs' : 'text-[#648067] hover:bg-[#edf2e9]'}`}
                                      title="Ülőhelyek egyenként bérelhetők"
                                    >
                                      Ülőhelyes
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isLocked}
                                      onClick={() => {
                                        setNewTour((prev) => ({
                                          ...prev,
                                          equipment_full_rental: { ...(prev.equipment_full_rental || {}), [item.id]: true },
                                          equipment_quantities: { ...(prev.equipment_quantities || {}), [item.id]: 1 }
                                        }));
                                      }}
                                      className={`flex-1 h-full text-[10px] font-bold uppercase tracking-wider transition rounded-lg ${newTour.equipment_full_rental?.[item.id] ? 'bg-[#b88035] text-white shadow-xs' : 'text-[#648067] hover:bg-[#edf2e9] disabled:opacity-40'}`}
                                      title="Az egész jármű egyszerre foglalható le"
                                    >
                                      Teljes jármű
                                    </button>
                                  </div>
                                  <span className="text-[9px] text-[#718174] font-medium mt-0.5 text-center">
                                    {newTour.equipment_full_rental?.[item.id] ? '1 fő = egész jármű' : '1 fő = 1 ülőhely'}
                                  </span>
                                </div>

                                <div className="flex flex-col min-w-0">
                                  <span className="form-label-premium">
                                    {newTour.equipment_full_rental?.[item.id] ? 'Díj / egész jármű (Ft)' : 'Díj / ülőhely (Ft)'}
                                  </span>
                                  <div className="relative h-10 w-full">
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      disabled={isLocked}
                                      placeholder="0"
                                      aria-label={`${item.name} ára Forintban`}
                                      className="w-full h-full pl-3 pr-8 font-bold text-sm bg-[#f7f9f5] border border-[#dce5d8] rounded-xl hover:border-[#b4c7b0] focus:border-[#477258] focus:ring-2 focus:ring-[#477258]/15 focus:bg-white outline-none text-[#173327] transition"
                                      value={formatPriceInput(newTour.equipment_prices?.[item.id] ?? 0)}
                                      onChange={(e) =>
                                        setNewTour((prev) => ({
                                          ...prev,
                                          equipment_prices: {
                                            ...(prev.equipment_prices || {}),
                                            [item.id]: formatPriceInput(e.target.value)
                                          }
                                        }))
                                      }
                                    />
                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#718174] pointer-events-none select-none">
                                      Ft
                                    </span>
                                  </div>
                                  <span className="text-[9px] text-[#718174] font-medium mt-0.5 text-center">
                                    {Number(parsePriceInput(newTour.equipment_prices?.[item.id] || 0)) === 0 ? 'Ingyenes' : 'Díj / fő'}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div
                          key={item.id}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-200 ${
                            isSelected
                              ? 'bg-white border-[#8eaf92] shadow-sm ring-2 ring-[#477258]/15'
                              : isUnavailable
                                ? 'bg-[#f7f9f5]/60 border-[#e4eae1] opacity-60'
                                : 'bg-white hover:bg-[#fcfffa] border-[#dce5d8] hover:border-[#b4c7b0] shadow-2xs'
                          }`}
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <label className="relative flex items-center justify-center pt-0.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={isLocked || isUnavailable}
                                aria-label={`${item.name} csatolása a túrához`}
                                className="h-4 w-4 accent-[#275940] disabled:cursor-not-allowed cursor-pointer"
                                onChange={(e) => {
                                  if (e.target.checked && isUnavailable) return;
                                  setSelectedEquipmentIds((prev) => e.target.checked
                                    ? [...new Set([...prev, equipmentId])]
                                    : prev.filter((id) => id !== equipmentId));
                                  if (e.target.checked && !newTour.equipment_quantities?.[item.id]) {
                                    setNewTour(prev => ({
                                      ...prev,
                                      equipment_quantities: {
                                        ...(prev.equipment_quantities || {}),
                                        [item.id]: 1
                                      }
                                    }));
                                  }
                                }}
                              />
                            </label>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-bold text-sm tracking-tight ${isSelected ? 'text-[#173327]' : 'text-[#344a3c]'}`}>
                                  {item.name}
                                </span>
                                {isLocked && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a5b29] bg-[#faefe0] px-2 py-0.5 rounded-md border border-[#ebd0ad] shrink-0">
                                    Foglalás alatt
                                  </span>
                                )}
                                {isUnavailable && !isSelected && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9c523f] bg-[#fcece9] px-2 py-0.5 rounded-md border border-[#f5c7be] shrink-0">
                                    Elfogyott
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="text-[11px] font-medium text-[#65756a]">
                                  Készlet: <strong className="text-[#173327] font-semibold">{item.total_quantity} db</strong>
                                </span>
                                <span className="text-[#cad6c9]">•</span>
                                <span className="text-[11px] font-medium">
                                  Szabad készletből: <strong className={availableFromStock > 0 ? 'text-[#275940] font-bold' : 'text-[#9c523f] font-bold'}>{availableFromStock} db</strong>
                                </span>
                              </div>
                            </div>
                          </div>

                          {isSelected ? (
                            <div className="flex items-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#e4eae1] shrink-0">
                              <div className="flex flex-col">
                                <span className="form-label-premium">Darabszám</span>
                                <div className="flex items-center h-10 bg-[#f7f9f5] border border-[#dce5d8] rounded-xl overflow-hidden hover:border-[#b4c7b0] focus-within:border-[#477258] focus-within:ring-2 focus-within:ring-[#477258]/15 focus-within:bg-white transition">
                                  <button
                                    type="button"
                                    disabled={currentQty <= (isLocked ? currentQty : 1)}
                                    onClick={() => {
                                      const next = Math.max(isLocked ? currentQty : 1, currentQty - 1);
                                      setNewTour((prev) => ({
                                        ...prev,
                                        equipment_quantities: {
                                          ...(prev.equipment_quantities || {}),
                                          [item.id]: next
                                        }
                                      }));
                                    }}
                                    className="w-8 h-full flex items-center justify-center text-[#648067] hover:text-[#173327] hover:bg-[#edf2e9] active:bg-[#dfeadd] disabled:opacity-25 rounded-l-xl transition cursor-pointer"
                                    title="Darabszám csökkentése"
                                  >
                                    <Minus size={13} strokeWidth={2.5} />
                                  </button>
                                  <div className="flex items-center justify-center px-1">
                                    <input
                                      type="number"
                                      min={isLocked ? currentQty : 1}
                                      max={maxAssignQty}
                                      disabled={maxAssignQty < (isLocked ? currentQty : 1)}
                                      className="w-10 text-center font-bold text-sm bg-transparent outline-none text-[#173327] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      value={newTour.equipment_quantities?.[item.id] ?? 1}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value) || 1;
                                        const minQ = isLocked ? currentQty : 1;
                                        if (maxAssignQty < minQ) return;
                                        const clamped = Math.min(Math.max(minQ, val), maxAssignQty);
                                        setNewTour((prev) => ({
                                          ...prev,
                                          equipment_quantities: {
                                            ...(prev.equipment_quantities || {}),
                                            [item.id]: clamped
                                          }
                                        }));
                                      }}
                                    />
                                    <span className="text-xs font-semibold text-[#718174] pr-1 select-none">db</span>
                                  </div>
                                  <button
                                    type="button"
                                    disabled={currentQty >= maxAssignQty}
                                    onClick={() => {
                                      const next = Math.min(maxAssignQty, currentQty + 1);
                                      setNewTour((prev) => ({
                                        ...prev,
                                        equipment_quantities: {
                                          ...(prev.equipment_quantities || {}),
                                          [item.id]: next
                                        }
                                      }));
                                    }}
                                    className="w-8 h-full flex items-center justify-center text-[#648067] hover:text-[#173327] hover:bg-[#edf2e9] active:bg-[#dfeadd] disabled:opacity-25 rounded-r-xl transition cursor-pointer"
                                    title="Darabszám növelése"
                                  >
                                    <Plus size={13} strokeWidth={2.5} />
                                  </button>
                                </div>
                                <span className={`mt-0.5 text-center text-[9px] font-semibold ${currentQty > maxAssignQty ? 'text-[#9c523f]' : 'text-[#718174]'}`}>
                                  {currentQty > maxAssignQty ? `Készlethiány · max: ${maxAssignQty} db` : `max: ${maxAssignQty} db`}
                                </span>
                              </div>

                              <div className="flex flex-col">
                                <span className="form-label-premium">Bérleti díj / db (Ft)</span>
                                <div className="relative h-10">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    disabled={isLocked}
                                    placeholder="0"
                                    aria-label={`${item.name} ára Forintban`}
                                    className="w-32 md:w-36 h-full pl-3 pr-8 font-bold text-sm bg-[#f7f9f5] border border-[#dce5d8] rounded-xl hover:border-[#b4c7b0] focus:border-[#477258] focus:ring-2 focus:ring-[#477258]/15 focus:bg-white outline-none text-[#173327] transition"
                                    value={formatPriceInput(newTour.equipment_prices?.[item.id] ?? 0)}
                                    onChange={(e) =>
                                      setNewTour((prev) => ({
                                        ...prev,
                                        equipment_prices: {
                                          ...(prev.equipment_prices || {}),
                                          [item.id]: formatPriceInput(e.target.value)
                                        }
                                      }))
                                    }
                                  />
                                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#718174] pointer-events-none select-none">
                                    Ft
                                  </span>
                                </div>
                                <span className="text-[9px] text-[#718174] font-medium mt-0.5">
                                  {Number(parsePriceInput(newTour.equipment_prices?.[item.id] || 0)) === 0 ? 'Ingyenes' : 'Díj / db'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="hidden sm:flex items-center shrink-0">
                              {!isUnavailable && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedEquipmentIds(prev => [...new Set([...prev, equipmentId])]);
                                    if (!newTour.equipment_quantities?.[item.id]) {
                                      setNewTour(prev => ({
                                        ...prev,
                                        equipment_quantities: {
                                          ...(prev.equipment_quantities || {}),
                                          [item.id]: 1
                                        }
                                      }));
                                    }
                                  }}
                                  className="text-xs font-bold text-[#477258] hover:text-[#173327] bg-[#edf3ec] hover:bg-[#dfeadd] px-3.5 py-1.5 rounded-xl border border-[#b9cfbb] transition cursor-pointer"
                                >
                                  + Hozzárendelés
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div>
                <label className="form-label-premium">Maximális létszám</label>
                <input
                  type="number"
                  required
                  value={newTour.max_participants}
                  className="form-input-premium"
                  onChange={e => setNewTour({...newTour, max_participants: e.target.value})}
                />
              </div>

              <div className="md:col-span-2">
                <label className="form-label-premium">Kép URL</label>
                <input
                  type="text"
                  required
                  value={newTour.image_url}
                  className="form-input-premium"
                  onChange={e => setNewTour({...newTour, image_url: e.target.value})}
                />
              </div>

              <div className="md:col-span-2">
                <label className="form-label-premium">Leírás</label>
                <textarea
                  rows="4"
                  required
                  value={newTour.description}
                  className="form-input-premium"
                  onChange={e => setNewTour({...newTour, description: e.target.value})}
                ></textarea>
              </div>

              <button
                type="submit"
                className="md:col-span-2 w-full py-3.5 rounded-2xl font-bold text-xs bg-[#275940] hover:bg-[#1d4330] text-white shadow-sm transition-all uppercase tracking-wider cursor-pointer"
              >
                {editingTourId ? 'Módosítások mentése' : 'Túra közzététele'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
