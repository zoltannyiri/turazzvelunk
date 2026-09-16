import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import huLocale from '@fullcalendar/core/locales/hu';
import moment from 'moment'; 
import 'moment/locale/hu';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { hu } from 'date-fns/locale';
import { X, ChevronLeft, ChevronRight, MapPin, Clock, Calendar as CalIcon } from 'lucide-react';
import { AuthContext } from "../../context/AuthContext";
import { toast } from 'react-toastify';
import './CalendarScreen.css';
import { formatPrice, formatPriceInput, parsePriceInput } from '../../utils/formatPrice';

const CalendarScreen = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const calendarRef = useRef(null);
    const [tours, setTours] = useState([]);
    const [currentMonth, setCurrentMonth] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTourId, setEditingTourId] = useState(null);
    const [equipment, setEquipment] = useState([]);
    const [equipmentLoading, setEquipmentLoading] = useState(false);
    const [equipmentAvailability, setEquipmentAvailability] = useState({});
    const [selectedEquipmentIds, setSelectedEquipmentIds] = useState([]);
    const [isDepositEnabled, setIsDepositEnabled] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const availabilityRequestRef = useRef(0);

    const initialTourState = {
        title: '', location: '', description: '', price: '', duration: '', 
        difficulty: 'Könnyű',
        category: 'Hegyi-túrák', subcategory: 'Hazai - Külföldi túrák',
        image_url: '', start_date: '', end_date: '', max_participants: '',
        equipment_prices: {}, equipment_quantities: {},
        deposit_amount: '', deposit_deadline: null
    };
    const [newTour, setNewTour] = useState(initialTourState);
    const [hoveredEvent, setHoveredEvent] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const formatDate = (date) => {
        if (!(date instanceof Date)) return date;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const fetchEquipment = async () => {
        setEquipmentLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/equipment`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Az eszközök nem tölthetők be.');
            setEquipment(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error(error.message || 'Az eszközök nem tölthetők be.');
        } finally {
            setEquipmentLoading(false);
        }
    };

    const fetchEquipmentAvailability = async (startDate, endDate) => {
        const requestId = ++availabilityRequestRef.current;
        if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
            setEquipmentAvailability({});
            return;
        }
        try {
            const params = new URLSearchParams({
                start_date: formatDate(startDate),
                end_date: formatDate(endDate)
            });
            const response = await fetch(`${import.meta.env.VITE_API_URL}/tours/equipment-availability/range?${params}`);
            const data = await response.json();
            if (!response.ok || !Array.isArray(data)) throw new Error();
            if (requestId !== availabilityRequestRef.current) return;
            const available = Object.fromEntries(data.map((item) => [item.id, Number(item.available_quantity || 0)]));
            setEquipmentAvailability(available);
            setSelectedEquipmentIds((current) => current.filter((id) => Number(available[id] || 0) > 0));
        } catch {
            if (requestId !== availabilityRequestRef.current) return;
            setEquipmentAvailability({});
            toast.error('Az eszközök szabad készlete nem ellenőrizhető.');
        }
    };

    const fetchTours = useCallback(async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/tours`);
            const data = await res.json();
            const today = moment().startOf('day');
            const activeTours = Array.isArray(data)
                ? data.filter((tour) => !tour.end_date || moment(tour.end_date).isSameOrAfter(today, 'day'))
                : [];
            setTours(activeTours.map(t => ({
                id: t.id,
                title: t.title,
                start: t.start_date,
                end: moment(t.end_date).add(1, 'days').format('YYYY-MM-DD'), 
                extendedProps: { ...t }
            })));
        } catch { toast.error("Hiba a túrák betöltésekor!"); }
    }, []);

    useEffect(() => { 
        fetchTours(); 
        setTimeout(() => {
            if (calendarRef.current) setCurrentMonth(calendarRef.current.getApi().view.title);
        }, 150);
    }, [fetchTours]);

    const handleSubmitTour = async (e) => {
        e.preventDefault();
        if (isSaving) return;
        const start = newTour.start_date;
        const end = newTour.end_date;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (!(start instanceof Date) || !(end instanceof Date) || end < start || start < today) {
            toast.error('Válassz érvényes, nem múltbeli túraidőpontot.');
            return;
        }
        const calculatedDuration = moment(end).startOf('day').diff(moment(start).startOf('day'), 'days') + 1;
        const tourPrice = parsePriceInput(newTour.price);
        const depositAmount = parsePriceInput(newTour.deposit_amount);
        if (isDepositEnabled && (!Number.isFinite(depositAmount) || depositAmount < 1)) {
            toast.error('Az előleg összege nem lehet 0.');
            return;
        }
        if (isDepositEnabled && depositAmount > tourPrice) {
            toast.error('Az előleg összege nem lehet nagyobb a túra díjánál.');
            return;
        }
        if (isDepositEnabled && (!(newTour.deposit_deadline instanceof Date) || newTour.deposit_deadline >= start)) {
            toast.error('Az előleg határidejének meg kell előznie a túra kezdetét.');
            return;
        }
        for (const id of selectedEquipmentIds) {
            const quantity = Number(newTour.equipment_quantities?.[id] || 1);
            const available = Number(equipmentAvailability[id] || 0);
            if (!Number.isInteger(quantity) || quantity < 1 || quantity > available) {
                toast.error('Ellenőrizd a kiválasztott eszközök szabad darabszámát.');
                return;
            }
        }
        const payload = {
            ...newTour,
            price: tourPrice,
            duration: calculatedDuration,
            start_date: formatDate(start),
            end_date: formatDate(end),
            max_participants: Number(newTour.max_participants),
            deposit_amount: isDepositEnabled ? depositAmount : null,
            deposit_deadline: isDepositEnabled ? formatDate(newTour.deposit_deadline) : null,
            equipment_prices: selectedEquipmentIds.map((id) => ({
                equipment_id: id,
                price: parsePriceInput(newTour.equipment_prices?.[id] || 0),
                quantity: Number(newTour.equipment_quantities?.[id] || 1)
            }))
        };
        delete payload.equipment_quantities;
        const method = editingTourId ? 'PUT' : 'POST';
        const url = editingTourId ? `${import.meta.env.VITE_API_URL}/tours/${editingTourId}` : `${import.meta.env.VITE_API_URL}/tours`;
        setIsSaving(true);
        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.message || data.error || 'A túra mentése sikertelen.');
                return;
            }
            toast.success('Túra sikeresen mentve!');
            setIsModalOpen(false);
            setEditingTourId(null);
            setNewTour(initialTourState);
            setSelectedEquipmentIds([]);
            setIsDepositEnabled(false);
            fetchTours();
        } catch {
            toast.error('A túra mentése sikertelen.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSelect = (info) => {
        if (user?.role !== 'admin') return;
        setEditingTourId(null);
        setNewTour({
            ...initialTourState,
            start_date: new Date(info.startStr),
            end_date: moment(info.endStr).subtract(1, 'days').toDate()
        });
        setSelectedEquipmentIds([]);
        setEquipmentAvailability({});
        setIsDepositEnabled(false);
        fetchEquipment();
        fetchEquipmentAvailability(new Date(info.startStr), moment(info.endStr).subtract(1, 'days').toDate());
        setIsModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-[#f8faf7] pb-24 font-sans text-[#173327]" onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}>
            
            {/* --- NAPTÁR FEJLÉC HÁTTÉRKÉPPEL ÉS TERMÉSZETES ZÖLD TÓNUSSAL --- */}
            <div className="relative pt-20 pb-28 px-6 overflow-hidden min-h-[360px] flex items-center">
                
                {/* HÁTTÉRKÉP RÉTEG */}
                <img 
                    src="https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&q=80&w=2070" 
                    className="absolute inset-0 w-full h-full object-cover scale-105 filter brightness-95"
                    alt="Természet naptár háttér"
                />
                
                {/* SÖTÉTÍTŐ TERMÉSZETES ZÖLD OVERLAY */}
                <div className="absolute inset-0 bg-[#0f1f17]/75 backdrop-blur-[1px]"></div>

                {/* LÁGY MÉLYZÖLD FÉNYEFFEKT */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#477258]/15 rounded-full blur-[140px] -mr-32 -mt-32 pointer-events-none z-10"></div>
                
                <div className="max-w-[1500px] mx-auto relative z-20 w-full text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[#dce5d8] text-xs font-semibold uppercase tracking-[0.2em] mb-4">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        Túrázz Velünk • Idővonal
                    </div>
                    
                    <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-white font-normal tracking-tight mb-4 drop-shadow-md">
                        Eseménynaptár
                    </h1>
                    <p className="text-[#dce5d8] text-sm sm:text-base md:text-lg max-w-2xl font-light leading-relaxed drop-shadow-sm">
                        Kövesd nyomon induló túráink időpontjait havi bontásban, és tervezd meg előre a kirándulásaidat.
                    </p>
                </div>
            </div>

            {/* --- LEBEGŐ HÓNAPVÁLASZTÓ ÉS JELMAGYARÁZAT SÁV --- */}
            <div className="max-w-[1500px] mx-auto px-4 sm:px-6 -mt-10 relative z-30 mb-8">
                <div className="bg-white rounded-3xl shadow-xl shadow-[#173327]/5 border border-[#d8dfd4] p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    
                    {/* HÓNAP NAVIGÁCIÓ */}
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-start">
                        <button
                            type="button"
                            onClick={() => {
                                calendarRef.current.getApi().prev();
                                setCurrentMonth(calendarRef.current.getApi().view.title);
                            }}
                            className="p-2.5 rounded-2xl bg-[#f7f9f5] border border-[#dce5d8] text-[#275940] hover:bg-[#ecefe6] hover:border-[#cad6c9] transition"
                            aria-label="Előző hónap"
                        >
                            <ChevronLeft size={20} strokeWidth={2} />
                        </button>
                        
                        <span className="font-serif text-xl sm:text-2xl text-[#173327] min-w-[200px] text-center capitalize font-normal">
                            {currentMonth}
                        </span>
                        
                        <button
                            type="button"
                            onClick={() => {
                                calendarRef.current.getApi().next();
                                setCurrentMonth(calendarRef.current.getApi().view.title);
                            }}
                            className="p-2.5 rounded-2xl bg-[#f7f9f5] border border-[#dce5d8] text-[#275940] hover:bg-[#ecefe6] hover:border-[#cad6c9] transition"
                            aria-label="Következő hónap"
                        >
                            <ChevronRight size={20} strokeWidth={2} />
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                calendarRef.current.getApi().today();
                                setCurrentMonth(calendarRef.current.getApi().view.title);
                            }}
                            className="px-3.5 py-2.5 rounded-2xl bg-[#f7f9f5] border border-[#dce5d8] text-[#34493b] hover:bg-[#ecefe6] hover:text-[#173327] text-xs font-bold uppercase tracking-wider transition ml-1"
                        >
                            Ma
                        </button>
                    </div>

                    {/* JELMAGYARÁZAT ÉS ADMIN INFORMÁCIÓ */}
                    <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-wider text-[#718174] flex-wrap justify-center">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#275940]"></span>
                            <span>Könnyű</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#b07a2a]"></span>
                            <span>Közepes</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#963735]"></span>
                            <span>Nehéz</span>
                        </div>
                        {user?.role === 'admin' && (
                            <span className="text-[11px] text-[#477258] bg-[#f2f5ef] border border-[#dce5d8] px-3 py-1 rounded-full font-medium normal-case tracking-normal">
                                Jelölj ki egy időszakot új túrához
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* --- NAPTÁR FŐ KONTÉNER --- */}
            <div className="max-w-[1500px] mx-auto px-4 sm:px-6 relative z-20">
                <div className="calendar-main-container">
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        locales={[huLocale]}
                        locale="hu"
                        firstDay={1}
                        selectable={user?.role === 'admin'}
                        select={handleSelect}
                        events={tours}
                        eventContent={(info) => {
                            const colors = { 
                                'Könnyű': '#275940', 
                                'Közepes': '#b07a2a', 
                                'Nehéz': '#963735' 
                            };
                            return (
                                <div className="event-bar-wrapper" style={{ backgroundColor: colors[info.event.extendedProps.difficulty] || '#3f5d4d' }}>
                                    <span className="event-title-text truncate">{info.event.title}</span>
                                </div>
                            );
                        }}
                        eventMouseEnter={(info) => setHoveredEvent(info.event.extendedProps)}
                        eventMouseLeave={() => setHoveredEvent(null)}
                        eventClick={(info) => navigate(`/tours/${info.event.id}`, { state: { from: 'calendar' } })}
                        height={760}
                        headerToolbar={false}
                    />
                </div>
            </div>

            {/* --- LEBEGŐ TÚRA INFORMÁCIÓS KÁRTYA HOVER ESETÉN --- */}
            {hoveredEvent && (
                <div 
                    className="tour-tooltip-card" 
                    style={{ 
                        left: mousePos.x + 20, 
                        top: mousePos.y > window.innerHeight - 340 ? mousePos.y - 340 : mousePos.y + 20 
                    }}
                >
                    <img src={hoveredEvent.image_url} className="tooltip-image" alt="" />
                    <div className="tooltip-content">
                        <div className="flex justify-between items-center mb-2.5">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] px-2.5 py-0.5 rounded-full bg-[#ecf0e8] text-[#275940]">
                                {hoveredEvent.difficulty}
                            </span>
                            <span className="tooltip-price-tag">
                                {formatPrice(hoveredEvent.price)} Ft
                            </span>
                        </div>
                        <h3 className="font-serif text-base text-[#173327] font-normal leading-snug line-clamp-2 mb-2">
                            {hoveredEvent.title}
                        </h3>
                        {hoveredEvent.location && (
                            <div className="flex items-center gap-1.5 text-xs text-[#718174]">
                                <MapPin size={13} className="text-[#477258]" />
                                <span className="truncate">{hoveredEvent.location}</span>
                            </div>
                        )}
                        <div className="text-[10px] text-[#879489] uppercase tracking-wider pt-2 mt-2 border-t border-[#ecefe6]">
                            Kattints a részletekért
                        </div>
                    </div>
                </div>
            )}

            {/* --- ADMIN MODÁL ÚJ TÚRA MEGHIRDETÉSÉHEZ / SZERKESZTÉSHEZ --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-[#0f1f17]/70 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-[#dce5d8] p-6 sm:p-8 overflow-y-auto max-h-[90vh] z-10 animate-in fade-in zoom-in-95 duration-200">
                        
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
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 rounded-xl text-[#718174] hover:bg-[#ecefe6] hover:text-[#173327] transition border border-transparent hover:border-[#cad6c9]"
                                aria-label="Bezárás"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* ŰRLAP */}
                        <form onSubmit={handleSubmitTour} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="md:col-span-2">
                                <label className="form-label-premium">Túra megnevezése</label>
                                <input type="text" required value={newTour.title} className="form-input-premium" onChange={e => setNewTour({...newTour, title: e.target.value})} />
                            </div>
                            <div>
                                <label className="form-label-premium">Helyszín</label>
                                <input type="text" required value={newTour.location} className="form-input-premium" onChange={e => setNewTour({...newTour, location: e.target.value})} />
                            </div>
                            <div>
                                <label className="form-label-premium">Kategória</label>
                                <select value={newTour.category} className="form-input-premium" onChange={e => setNewTour({...newTour, category: e.target.value})}>
                                    <option>Hegyi-túrák</option>
                                    <option>Vízi-túrák</option>
                                    <option>Jóga</option>
                                    <option>Motoros-túrák</option>
                                </select>
                            </div>
                            <div>
                                <label className="form-label-premium">Alkategória</label>
                                <input type="text" value={newTour.subcategory} className="form-input-premium" onChange={e => setNewTour({...newTour, subcategory: e.target.value})} />
                            </div>
                            <div>
                                <label className="form-label-premium">Nehézség</label>
                                <select value={newTour.difficulty} className="form-input-premium" onChange={e => setNewTour({...newTour, difficulty: e.target.value})}>
                                    <option>Könnyű</option><option>Közepes</option><option>Nehéz</option>
                                </select>
                            </div>
                            <div className="md:col-span-1">
                                <label className="form-label-premium">Időtartam (Intervallum)</label>
                                <div className="relative">
                                    <DatePicker
                                        selectsRange
                                        startDate={newTour.start_date instanceof Date ? newTour.start_date : null}
                                        endDate={newTour.end_date instanceof Date ? newTour.end_date : null}
                                        minDate={new Date()}
                                        onChange={([start, end]) => {
                                            setNewTour((current) => ({
                                                ...current,
                                                start_date: start,
                                                end_date: end,
                                                deposit_deadline: current.deposit_deadline instanceof Date && start instanceof Date && current.deposit_deadline >= start
                                                    ? null
                                                    : current.deposit_deadline
                                            }));
                                            fetchEquipmentAvailability(start, end);
                                        }}
                                        className="form-input-premium font-medium"
                                        wrapperClassName="w-full"
                                        dateFormat="yyyy. MM. dd."
                                        locale={hu}
                                        calendarStartDay={1}
                                        placeholderText="Válaszd ki az intervallumot..."
                                        isClearable
                                    />
                                    <CalIcon className="absolute right-3.5 top-3.5 text-[#648067]" size={18} />
                                </div>
                            </div>
                            <div>
                                <label className="form-label-premium">Ár (Ft)</label>
                                <input type="text" inputMode="numeric" required value={formatPriceInput(newTour.price)} className="form-input-premium" onChange={e => setNewTour({...newTour, price: formatPriceInput(e.target.value)})} />
                            </div>
                            <div className="md:col-span-2 rounded-2xl border border-[#dce5d8] bg-[#f7f9f5] p-4">
                                <label className="flex items-center gap-3 text-sm font-bold text-[#173327]">
                                    <input
                                        type="checkbox"
                                        checked={isDepositEnabled}
                                        onChange={(e) => {
                                            setIsDepositEnabled(e.target.checked);
                                            if (!e.target.checked) {
                                                setNewTour((current) => ({ ...current, deposit_amount: '', deposit_deadline: null }));
                                            }
                                        }}
                                        className="h-4 w-4 accent-[#275940]"
                                    />
                                    Előleg szükséges
                                </label>
                                {isDepositEnabled && (
                                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="form-label-premium">Előleg összege (Ft)</label>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                required
                                                value={formatPriceInput(newTour.deposit_amount)}
                                                onChange={(e) => setNewTour((current) => ({ ...current, deposit_amount: formatPriceInput(e.target.value) }))}
                                                className="form-input-premium"
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label-premium">Előleg határideje</label>
                                            <DatePicker
                                                selected={newTour.deposit_deadline}
                                                onChange={(date) => setNewTour((current) => ({ ...current, deposit_deadline: date }))}
                                                minDate={new Date()}
                                                maxDate={newTour.start_date instanceof Date ? new Date(newTour.start_date.getFullYear(), newTour.start_date.getMonth(), newTour.start_date.getDate() - 1) : null}
                                                dateFormat="yyyy. MM. dd."
                                                locale={hu}
                                                calendarStartDay={1}
                                                placeholderText="Válassz dátumot"
                                                wrapperClassName="w-full"
                                                className="form-input-premium"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="md:col-span-2 rounded-2xl border border-[#dce5d8] bg-[#f7f9f5] p-4 sm:p-5">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#dce5d8] pb-3">
                                    <div>
                                        <h3 className="font-serif text-xl text-[#173327]">Csatolt eszközök</h3>
                                        <p className="mt-1 text-xs text-[#65756a]">Válaszd ki a túrához tartozó eszközöket és add meg a díjukat.</p>
                                    </div>
                                    <span className="text-xs font-bold text-[#477258]">{selectedEquipmentIds.length} kiválasztva</span>
                                </div>
                                {(!newTour.start_date || !newTour.end_date) && (
                                    <p className="mt-4 text-xs text-[#876027]">A szabad készlethez előbb válassz túraidőpontot.</p>
                                )}
                                <div className="mt-4 space-y-2">
                                    {equipmentLoading ? (
                                        <p className="text-sm text-[#65756a]">Eszközök betöltése...</p>
                                    ) : equipment.length === 0 ? (
                                        <p className="text-sm text-[#65756a]">Nincs elérhető eszköz.</p>
                                    ) : equipment.map((item) => {
                                        const id = Number(item.id);
                                        const selected = selectedEquipmentIds.includes(id);
                                        const available = Number(equipmentAvailability[id] || 0);
                                        const quantity = Number(newTour.equipment_quantities?.[id] || 1);
                                        const passengerTransport = Boolean(Number(item.is_passenger_transport));
                                        const seatsPerUnit = Math.max(1, Number(item.seats_per_unit || 1));
                                        return (
                                            <div key={id} className={`rounded-xl border bg-white p-3 sm:p-4 ${selected ? 'border-[#8eaf92]' : 'border-[#dce5d8]'}`}>
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selected}
                                                        disabled={available < 1}
                                                        aria-label={`${item.name} csatolása`}
                                                        onChange={(e) => {
                                                            setSelectedEquipmentIds((current) => e.target.checked
                                                                ? [...new Set([...current, id])]
                                                                : current.filter((selectedId) => selectedId !== id));
                                                            if (e.target.checked) {
                                                                setNewTour((current) => ({
                                                                    ...current,
                                                                    equipment_quantities: { ...current.equipment_quantities, [id]: current.equipment_quantities?.[id] || 1 }
                                                                }));
                                                            }
                                                        }}
                                                        className="h-4 w-4 accent-[#275940] disabled:opacity-40"
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="font-bold text-sm text-[#173327]">{item.name}</div>
                                                        <div className="text-xs text-[#65756a]">
                                                            Szabad: {available} db
                                                            {passengerTransport && ` · ${seatsPerUnit} ülőhely / jármű`}
                                                        </div>
                                                    </div>
                                                    {available < 1 && <span className="text-xs font-bold text-[#9c523f]">Nem elérhető</span>}
                                                </div>
                                                {selected && (
                                                    <div className="mt-3 grid gap-3 border-t border-[#e4eae1] pt-3 sm:grid-cols-[120px_minmax(0,1fr)]">
                                                        <div>
                                                            <label className="form-label-premium">Darabszám</label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max={available}
                                                                value={quantity}
                                                                onChange={(e) => setNewTour((current) => ({
                                                                    ...current,
                                                                    equipment_quantities: {
                                                                        ...current.equipment_quantities,
                                                                        [id]: Math.min(available, Math.max(1, Number(e.target.value) || 1))
                                                                    }
                                                                }))}
                                                                className="form-input-premium"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="form-label-premium">{passengerTransport ? 'Díj / ülőhely (Ft)' : 'Bérleti díj / db (Ft)'}</label>
                                                            <input
                                                                type="text"
                                                                inputMode="numeric"
                                                                value={formatPriceInput(newTour.equipment_prices?.[id] ?? 0)}
                                                                onChange={(e) => setNewTour((current) => ({
                                                                    ...current,
                                                                    equipment_prices: { ...current.equipment_prices, [id]: formatPriceInput(e.target.value) }
                                                                }))}
                                                                className="form-input-premium"
                                                                aria-label={`${item.name} ára Forintban`}
                                                            />
                                                        </div>
                                                        {passengerTransport && <p className="text-xs text-[#477258] sm:col-span-2">{quantity * seatsPerUnit} ülőhely ezen a túrán</p>}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
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
                                <input type="text" required value={newTour.image_url}
                                    className="form-input-premium" onChange={e => setNewTour({...newTour, image_url: e.target.value})} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="form-label-premium">Leírás</label>
                                <textarea rows="3" required value={newTour.description}
                                    className="form-input-premium" onChange={e => setNewTour({...newTour, description: e.target.value})}></textarea>
                            </div>
                            <button type="submit" disabled={isSaving}
                                className="md:col-span-2 w-full py-3.5 rounded-2xl font-bold text-xs bg-[#275940] hover:bg-[#1d4330] text-white shadow-sm transition-all uppercase tracking-wider cursor-pointer disabled:cursor-wait disabled:opacity-60">
                                {isSaving ? 'Mentés folyamatban...' : editingTourId ? 'Módosítások mentése' : 'Túra közzététele'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarScreen;
